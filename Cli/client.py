"""
client.py — Client HTTP pour communiquer avec l'API REST.
"""

import json
import sys
from pathlib import Path

import requests


class APIClient:
    """
    Client HTTP qui parle a notre API FastAPI.
    """

    def __init__(self, config_path: str = None):
        if config_path is None:
            self.config_path = Path(__file__).parent / "config.json"
        else:
            self.config_path = Path(config_path)

        self.api_url = "http://localhost:8000"
        self.token = None
        self._charger_config()

    def _charger_config(self):
        try:
            with open(self.config_path, "r") as f:
                config = json.load(f)
                self.api_url = config.get("api_url", "http://localhost:8000")
                self.token = config.get("token", None)
        except (FileNotFoundError, json.JSONDecodeError):
            self.api_url = "http://localhost:8000"
            self.token = None

    def sauvegarder_token(self, token: str):
        self.token = token
        config = {"api_url": self.api_url, "token": token}
        with open(self.config_path, "w") as f:
            json.dump(config, f, indent=4)

    def effacer_token(self):
        self.token = None
        config = {"api_url": self.api_url, "token": None}
        with open(self.config_path, "w") as f:
            json.dump(config, f, indent=4)

    def est_connecte(self) -> bool:
        return self.token is not None

    def _headers(self) -> dict:
        headers = {"Content-Type": "application/json"}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        return headers

    def _erreur_connexion(self):
        print(f"[ERR] Impossible de se connecter a {self.api_url}")
        print("   Verifiez que le serveur FastAPI est lance.")
        sys.exit(1)

    def get(self, chemin: str, params: dict = None) -> dict | list:
        url = f"{self.api_url}{chemin}"
        try:
            r = requests.get(url, headers=self._headers(), params=params, timeout=10)
            return self._traiter_reponse(r)
        except (requests.ConnectionError, requests.Timeout):
            self._erreur_connexion()

    def post(self, chemin: str, data: dict = None) -> dict | list:
        url = f"{self.api_url}{chemin}"
        try:
            r = requests.post(url, headers=self._headers(), json=data, timeout=10)
            return self._traiter_reponse(r)
        except (requests.ConnectionError, requests.Timeout):
            self._erreur_connexion()

    def put(self, chemin: str, data: dict = None) -> dict | list:
        url = f"{self.api_url}{chemin}"
        try:
            r = requests.put(url, headers=self._headers(), json=data, timeout=10)
            return self._traiter_reponse(r)
        except (requests.ConnectionError, requests.Timeout):
            self._erreur_connexion()

    def delete(self, chemin: str) -> bool:
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
        try:
            return r.json().get("detail", defaut)
        except (json.JSONDecodeError, AttributeError):
            return defaut
