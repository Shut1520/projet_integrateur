sequenceDiagram
    participant "🧑‍🌾_Agriculteur" as Agr
    participant "🔐_Page_Login" as Login
    participant "⚙️_Backend" as API
    participant "🗄️_Base_de_Données" as BD

    Note over Agr,BD: Scénario : L'agriculteur se connecte au système

    %% === Étape 1 : L'utilisateur arrive sur la page ===
    Agr->>Login: Ouvre l'application
    Login->>Login: Afficher le formulaire de connexion
    Login-->>Agr: Page de login affichée

    %% === Étape 2 : Saisie des identifiants ===
    Agr->>Login: Saisir email + mot de passe
    Agr->>Login: Cliquer sur "Se connecter"

    %% === Étape 3 : Envoi de la requête ===
    Login->>API: POST /api/auth/login<br/>Content-Type: application/json<br/>{ "email": "...", "password": "..." }

    %% === Étape 4 : Validation côté backend ===
    API->>API: Valider les champs avec Pydantic<br/>(non vides, format email valide)

    alt Champs invalides (vides ou mauvais format)
        API-->>Login: HTTP 422 Unprocessable Entity<br/>{ "detail": [ { "msg": "email is required" } ] }
        Login->>Login: Afficher les erreurs de validation
        Login-->>Agr: ⚠️ "Veuillez remplir correctement<br/>tous les champs"

    else Champs valides
        %% === Étape 5 : Recherche en BD ===
        API->>BD: SELECT * FROM users<br/>WHERE email = '...'
        BD-->>API: Utilisateur trouvé (ou aucun résultat)

        alt Utilisateur non trouvé
            API-->>Login: HTTP 401 Unauthorized<br/>{ "detail": "Email ou mot de passe incorrect" }
            Login->>Login: Afficher le message d'erreur<br/>(message identique pour sécurité)
            Login-->>Agr: ⚠️ "Email ou mot de passe<br/>incorrect"

        else Utilisateur trouvé
            %% === Étape 6 : Vérification du mot de passe ===
            API->>API: Comparer le hash bcrypt<br/>password_hash = bcrypt.verify(password, hash)

            alt Mot de passe incorrect
                API-->>Login: HTTP 401 Unauthorized<br/>{ "detail": "Email ou mot de passe incorrect" }
                Login->>Login: Afficher le message d'erreur
                Login-->>Agr: ⚠️ "Email ou mot de passe<br/>incorrect"

            else Mot de passe correct ✅
                %% === Étape 7 : Génération du JWT ===
                API->>API: Vérifier le rôle utilisateur<br/>(agriculteur / admin / consultatif)
                API->>API: Générer le token JWT<br/>{ "sub": user.id,<br/>  "role": user.role,<br/>  "exp": now + 24h }

                %% === Étape 8 : Réponse ===
                API-->>Login: HTTP 200 OK<br/>{ "access_token": "eyJhbG...",<br/>  "token_type": "bearer",<br/>  "role": "agriculteur",<br/>  "expires_in": 86400 }

                %% === Étape 9 : Stockage et redirection ===
                Login->>Login: Stocker le token dans localStorage<br/>Stocker le rôle utilisateur
                Login->>Login: Rediriger vers /dashboard
                Login-->>Agr: ✅ Connecté !<br/>Redirection vers le tableau de bord
            end
        end
    end
