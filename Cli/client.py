"""
client.py — Client HTTP pour communiquer avec l'API REST.

Fournit la classe APIClient qui encapsule les appels HTTP (GET, POST, PUT, DELETE)
vers le backend FastAPI. Gère la configuration (URL, token JWT, clé API), la
construction des en-têtes d'authentification (Authorization et/ou X-API-Key) et
le traitement centralisé des réponses (codes 200, 201, 204, 401, 404, 409, 422).
"""

import json
import sys
from pathlib import Path

import requests


class APIClient:
    """
    Client HTTP qui parle à l'API FastAPI.

    Responsabilités :
    - Lecture/écriture de la configuration (URL du serveur, token JWT, clé API)
      dans un fichier config.json local.
    - Construction automatique des en-têtes Authorization + X-API-Key.
    - Méthodes get/post/put/delete avec gestion d'erreur unifiée.
    """

    def __init__(self, config_path: str = None):
        """
        Initialise le client.

        Args:
            config_path: Chemin vers le fichier de configuration JSON.
                        Si None, utilise config.json dans le même dossier que ce module.
        """
        if config_path is None:
            self.config_path = Path(__file__).parent / "config.json"
        else:
            self.config_path = Path(config_path)

        self.api_url = "http://localhost:8000"
        self.token = None
        self.cle_api = None
        self._charger_config()

    def _charger_config(self):
        """
        Charge la configuration depuis le fichier JSON.

        Lit l'URL de l'API, le token JWT et la clé API sauvegardés.
        En cas de fichier absent ou corrompu, utilise les valeurs par défaut.
        """
        try:
            with open(self.config_path, "r") as f:
                config = json.load(f)
                self.api_url = config.get("api_url", "http://localhost:8000")
                self.token = config.get("token", None)
                self.cle_api = config.get("cle_api", None)
        except (FileNotFoundError, json.JSONDecodeError):
            self.api_url = "http://localhost:8000"
            self.token = None
            self.cle_api = None

    def _sauvegarder(self, token, cle_api):
        """
        Persiste token + clé API dans le fichier de configuration.

        Args:
            token: Token JWT (ou None pour l'effacer).
            cle_api: Clé API ESP32/CLI (ou None pour l'effacer).
        """
        self.token = token
        self.cle_api = cle_api
        config = {"api_url": self.api_url, "token": token, "cle_api": cle_api}
        with open(self.config_path, "w") as f:
            json.dump(config, f, indent=4)

    def sauvegarder_token(self, token: str):
        """
        Sauvegarde le token JWT en mémoire et dans le fichier de configuration.

        La clé API éventuellement présente est conservée.

        Args:
            token: Le token JWT à conserver pour les futures requêtes.
        """
        self._sauvegarder(token, self.cle_api)

    def effacer_token(self):
        """
        Efface le token JWT de la mémoire et du fichier de configuration.

        Appelé lors de la déconnexion (logout). La clé API est conservée.
        """
        self._sauvegarder(None, self.cle_api)

    def sauvegarder_cle_api(self, cle_api: str):
        """
        Sauvegarde la clé API en mémoire et dans le fichier de configuration.

        Le token JWT éventuellement présent est conservé.

        Args:
            cle_api: La clé API (format sk_sai_...) à utiliser pour l' ESP32.
        """
        self._sauvegarder(self.token, cle_api)

    def effacer_cle_api(self):
        """Efface la clé API de la mémoire et du fichier de configuration."""
        self._sauvegarder(self.token, None)

    def est_connecte(self) -> bool:
        return self.token is not None or self.cle_api is not None

    def _headers(self) -> dict:
        """
        Construit les en-têtes HTTP pour les requêtes.

        Inclut toujours Content-Type: application/json.
        Ajoute Authorization: Bearer <token> si un token est disponible et
        X-API-Key: <cle> si une clé API est configurée.
        """
        headers = {"Content-Type": "application/json"}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        if self.cle_api:
            headers["X-API-Key"] = self.cle_api
        return headers

    def _erreur_connexion(self):
        """
        Affiche un message d'erreur et termine le programme.

        Appelé quand le serveur est inaccessible (erreur de connexion ou timeout).
        """
        print(f"[ERR] Impossible de se connecter a {self.api_url}")
        print("   Verifiez que le serveur FastAPI est lance.")
        sys.exit(1)

    def get(self, chemin: str, params: dict = None) -> dict | list:
        """Envoie une requête GET."""
        url = f"{self.api_url}{chemin}"
        try:
            r = requests.get(url, headers=self._headers(), params=params, timeout=10)
            return self._traiter_reponse(r)
        except (requests.ConnectionError, requests.Timeout):
            self._erreur_connexion()

    def post(self, chemin: str, data: dict = None) -> dict | list:
        """Envoie une requête POST avec un body JSON."""
        url = f"{self.api_url}{chemin}"
        try:
            r = requests.post(url, headers=self._headers(), json=data, timeout=10)
            return self._traiter_reponse(r)
        except (requests.ConnectionError, requests.Timeout):
            self._erreur_connexion()

    def put(self, chemin: str, data: dict = None) -> dict | list:
        """Envoie une requête PUT avec un body JSON."""
        url = f"{self.api_url}{chemin}"
        try:
            r = requests.put(url, headers=self._headers(), json=data, timeout=10)
            return self._traiter_reponse(r)
        except (requests.ConnectionError, requests.Timeout):
            self._erreur_connexion()

    def delete(self, chemin: str) -> bool:
        """Envoie une requête DELETE. Retourne True en cas de succès."""
        url = f"{self.api_url}{chemin}"
        try:
            r = requests.delete(url, headers=self._headers(), timeout=10)
            if r.status_code == 204:
                return True
            self._traiter_reponse(r)
            return True
        except (requests.ConnectionError, requests.Timeout):
            self._erreur_connexion()

    def _traiter_reponse(self, r: requests.Response) -> dict | list:
        """
        Traite la réponse HTTP et gère les codes de statut.

        - 200/201 : succès, retourne le JSON.
        - 204 : succès sans contenu.
        - 401 : non autorisé, invite à se reconnecter.
        - 404 : ressource introuvable.
        - 409 : conflit (ex: doublon).
        - 422 : données invalides, affiche les détails de validation.
        """
        if r.status_code in (200, 201):
            return r.json() if r.text else {}
        elif r.status_code == 204:
            return {}
        elif r.status_code == 401:
            print("[ERR] 401 Non autorise. Veuillez vous reconnecter.")
            print("   Lancez : python cli.py login")
            sys.exit(1)
        elif r.status_code == 404:
            detail = self._extraire_detail(r, "Ressource introuvable")
            print(f"[ERR] 404 : {detail}")
            sys.exit(1)
        elif r.status_code == 409:
            detail = self._extraire_detail(r, "Conflit")
            print(f"[ERR] 409 : {detail}")
            sys.exit(1)
        elif r.status_code == 422:
            print("[ERR] 422 : Donnees invalides")
            try:
                detail = r.json().get("detail", [])
                if isinstance(detail, list):
                    for err in detail:
                        print(f"   - {err.get('msg', '')} : {err.get('loc', [])}")
            except (json.JSONDecodeError, AttributeError):
                pass
            sys.exit(1)
        else:
            detail = self._extraire_detail(r, f"Erreur {r.status_code}")
            print(f"[ERR] {detail}")
            sys.exit(1)

    def _extraire_detail(self, r, defaut: str) -> str:
        """
        Extrait le champ 'detail' du body JSON de réponse.

        Utilisé pour récupérer les messages d'erreur renvoyés par FastAPI.
        Retourne defaut si le parsing échoue.
        """
        try:
            return r.json().get("detail", defaut)
        except (json.JSONDecodeError, AttributeError):
            return defaut
