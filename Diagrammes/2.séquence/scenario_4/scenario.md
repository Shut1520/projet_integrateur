# Scénario 4 : Authentification (Login JWT)

## Description

L'agriculteur se connecte au système avec son identifiant et mot de passe pour accéder au tableau de bord et aux fonctionnalités.

## Acteurs / Lignes de vie

- 🧑‍🌾 **Agriculteur** : Utilisateur qui se connecte
- 🔐 **Page Login** : Interface d'authentification (React)
- ⚙️ **Backend (FastAPI)** : API REST qui valide les identifiants
- 🗄️ **Base de Données** : PostgreSQL (table users)

## Scénario pas à pas

```
=== Cas nominal : Connexion réussie ===

Étape 1  : L'agriculteur ouvre l'application web
Étape 2  : Le navigateur affiche la page de login
Étape 3  : L'agriculteur saisit son email et mot de passe
Étape 4  : Il clique sur "Se connecter"
Étape 5  : Le navigateur envoie POST /api/auth/login au backend
Étape 6  : Le backend vérifie que les champs sont non vides
Étape 7  : Le backend cherche l'utilisateur par email dans la BD
Étape 8  : La BD retourne l'utilisateur trouvé
Étape 9  : Le backend compare le mot de passe avec bcrypt
Étape 10 : Le backend génère un token JWT (avec rôle et expiration)
Étape 11 : Le backend renvoie le token au navigateur
Étape 12 : Le navigateur stocke le token dans localStorage
Étape 13 : Le navigateur redirige vers le dashboard

=== Cas d'erreur : Identifiants incorrects ===

Étape 5' : Le backend reçoit la requête
Étape 6' : Le backend vérifie les champs
Étape 7' : Le backend cherche l'utilisateur → introuvable OU mot de passe incorrect
Étape 8' : Le backend renvoie HTTP 401 avec message d'erreur
Étape 9' : Le navigateur affiche "Email ou mot de passe incorrect"

=== Cas d'erreur : Champs invalides ===

Étape 5" : Le navigateur envoie des champs vides
Étape 6" : Le backend rejette immédiatement (validation Pydantic)
Étape 7" : Le backend renvoie HTTP 422 avec la liste des erreurs
Étape 8" : Le navigateur affiche "Veuillez remplir tous les champs"
```

## Détail du token JWT

```json
{
  "sub": "user_id_123",
  "email": "agriculteur@example.com",
  "role": "agriculteur",
  "exp": 1717459200,
  "iat": 1717455600
}
```

## Stockage du mot de passe

Le mot de passe n'est **jamais stocké en clair**. Il est hashé avec **bcrypt** avant d'être sauvegardé en BD. La validation se fait en comparant le hash stocké avec le mot de passe fourni.
