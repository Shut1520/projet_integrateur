erDiagram
    %% Relations
    UTILISATEUR ||--o{ COMMANDE : soumet
    UTILISATEUR ||--o{ TOKEN : possede
    UTILISATEUR ||--o{ SEUIL : configure
    UTILISATEUR }o--|| PARCELLE : gere
    PARCELLE ||--o{ CAPTEUR : contient
    PARCELLE ||--o{ ACTIONNEUR : contient
    PARCELLE ||--o{ SEUIL : definit
    PARCELLE ||--o{ ALERTE : concerne
    CAPTEUR ||--o{ MESURE : preleve
    MESURE |o--o{ ALERTE : declenche
    ACTION |o--o{ ALERTE : genere
    ACTIONNEUR ||--o{ COMMANDE : recoit
    COMMANDE ||--o| ACTION : provoque

    %% Tables
    UTILISATEUR {
        int id_utilisateur PK
        string nom
        string email
        string password_hash
        string role
        datetime date_creation
    }
    
    PARCELLE {
        int id_parcelle PK
        string nom
        string localisation
        datetime date_creation
    }
    
    CAPTEUR {
        int id_capteur PK
        string nom
        string reference
        int gpio
        string protocole
        string etat
    }
    
    MESURE {
        int id_mesure PK
        decimal valeur
        string unite
        string source
        datetime timestamp
    }
    
    ACTIONNEUR {
        int id_actionneur PK
        string nom
        string reference
        int gpio
        string etat
    }
    
    COMMANDE {
        int id_commande PK
        string type_action
        string valeur_parametre
        string source
        datetime timestamp
        string statut
    }
    
    ACTION {
        int id_action PK
        datetime date_debut
        datetime date_fin
        int duree
        string resultat
        string details
        string statut
    }
    
    ALERTE {
        int id_alerte PK
        string type
        decimal valeur
        decimal seuil
        string severite
        string message
        string etat
        datetime date_debut
        datetime date_fin
    }
    
    SEUIL {
        int id_seuil PK
        string type_mesure
        decimal valeur_min
        decimal valeur_max
        string unite
    }
    
    TOKEN {
        int id_token PK
        string cle_api
        string nom
        boolean actif
        datetime date_creation
        datetime date_expiration
        datetime dernier_usage
    }
