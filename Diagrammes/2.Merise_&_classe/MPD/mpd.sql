-- ============================================================
-- SAI - Système Agricole Intelligent
-- MPD (Modèle Physique de Données)
-- Script SQL PostgreSQL complet
-- ============================================================
-- Généré depuis le MLD et le diagramme de classes validés
-- Couvre les 14 cas d'utilisation (UC1 à UC14)
-- UC12-14 : Gérer capteurs/actionneurs/parcelles (CRUD)
--
-- Commandes d'initialisation (à exécuter en tant que superuser) :
--   CREATE DATABASE sai_db;
--   CREATE USER sai_user WITH PASSWORD 'sai_password';
--   GRANT ALL PRIVILEGES ON DATABASE sai_db TO sai_user;
--   \c sai_db;
-- ============================================================


-- ============================================================
-- FONCTION POUR updated_at AUTOMATIQUE
-- S'exécute avant chaque UPDATE sur les tables concernées
-- ============================================================
CREATE OR REPLACE FUNCTION mettre_a_jour_horodatage()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- 1. TABLE : utilisateurs
-- Table racine (pas de FK)
-- ============================================================
CREATE TABLE utilisateurs (
    id              SERIAL          PRIMARY KEY,
    nom             VARCHAR(100)    NOT NULL,
    email           VARCHAR(150)    UNIQUE NOT NULL,
    password_hash   VARCHAR(255)    NOT NULL,
    role            VARCHAR(20)     NOT NULL DEFAULT 'agriculteur',
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP       NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_utilisateurs_role CHECK (role IN ('agriculteur', 'admin'))
);

CREATE TRIGGER trg_utilisateurs_updated_at
    BEFORE UPDATE ON utilisateurs
    FOR EACH ROW
    EXECUTE FUNCTION mettre_a_jour_horodatage();


-- ============================================================
-- 2. TABLE : parcelles
-- FK → utilisateurs(id)
-- ============================================================
CREATE TABLE parcelles (
    id              SERIAL          PRIMARY KEY,
    nom             VARCHAR(100)    NOT NULL,
    localisation    VARCHAR(255),
    id_utilisateur  INTEGER         NOT NULL,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP       NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_parcelles_utilisateur
        FOREIGN KEY (id_utilisateur) REFERENCES utilisateurs(id)
);

CREATE TRIGGER trg_parcelles_updated_at
    BEFORE UPDATE ON parcelles
    FOR EACH ROW
    EXECUTE FUNCTION mettre_a_jour_horodatage();


-- ============================================================
-- 3. TABLE : capteurs
-- FK → parcelles(id) — Composition ◆
-- ============================================================
CREATE TABLE capteurs (
    id              SERIAL          PRIMARY KEY,
    nom             VARCHAR(30)     NOT NULL,
    reference       VARCHAR(50),
    gpio            INTEGER         NOT NULL,
    protocole       VARCHAR(10)     NOT NULL DEFAULT 'digital',
    etat            VARCHAR(15)     NOT NULL DEFAULT 'actif',
    id_parcelle     INTEGER         NOT NULL,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP       NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_capteurs_parcelle
        FOREIGN KEY (id_parcelle) REFERENCES parcelles(id) ON DELETE CASCADE,
    CONSTRAINT chk_capteurs_protocole CHECK (protocole IN ('digital', 'analog', 'i2c')),
    CONSTRAINT chk_capteurs_etat CHECK (etat IN ('actif', 'inactif', 'defaillant'))
);

CREATE TRIGGER trg_capteurs_updated_at
    BEFORE UPDATE ON capteurs
    FOR EACH ROW
    EXECUTE FUNCTION mettre_a_jour_horodatage();


-- ============================================================
-- 4. TABLE : actionneurs
-- FK → parcelles(id) — Composition ◆
-- ============================================================
CREATE TABLE actionneurs (
    id              SERIAL          PRIMARY KEY,
    nom             VARCHAR(20)     NOT NULL,
    reference       VARCHAR(50),
    gpio            INTEGER         NOT NULL,
    etat            VARCHAR(10)     NOT NULL DEFAULT 'inactif',
    id_parcelle     INTEGER         NOT NULL,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP       NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_actionneurs_parcelle
        FOREIGN KEY (id_parcelle) REFERENCES parcelles(id) ON DELETE CASCADE,
    CONSTRAINT chk_actionneurs_etat CHECK (etat IN ('actif', 'inactif'))
);

CREATE TRIGGER trg_actionneurs_updated_at
    BEFORE UPDATE ON actionneurs
    FOR EACH ROW
    EXECUTE FUNCTION mettre_a_jour_horodatage();


-- ============================================================
-- 5. TABLE : mesures (GROS VOLUME)
-- FK → capteurs(id) — Composition ◆
-- Pas de created_at/updated_at (le timestamp suffit)
-- ~43 000 lignes/jour → index critiques
-- ============================================================
CREATE TABLE mesures (
    id              SERIAL          PRIMARY KEY,
    valeur          DECIMAL(10,2)   NOT NULL,
    unite           VARCHAR(10)     NOT NULL,
    source          VARCHAR(20)     NOT NULL DEFAULT 'esp32',
    timestamp       TIMESTAMP       NOT NULL DEFAULT NOW(),
    id_capteur      INTEGER         NOT NULL,

    CONSTRAINT fk_mesures_capteur
        FOREIGN KEY (id_capteur) REFERENCES capteurs(id) ON DELETE CASCADE,
    CONSTRAINT chk_mesures_source CHECK (source IN ('esp32', 'manuel', 'simulation'))
);


-- ============================================================
-- 6. TABLE : commandes
-- FK → utilisateurs(id) NULLABLE, actionneurs(id)
-- ============================================================
CREATE TABLE commandes (
    id                  SERIAL          PRIMARY KEY,
    type_action         VARCHAR(20)     NOT NULL DEFAULT 'on',
    valeur_parametre    VARCHAR(50),
    source              VARCHAR(20)     NOT NULL,
    timestamp           TIMESTAMP       NOT NULL DEFAULT NOW(),
    statut              VARCHAR(15)     NOT NULL DEFAULT 'envoyee',
    id_utilisateur      INTEGER,        -- NULL si source = 'auto'
    id_actionneur       INTEGER         NOT NULL,

    CONSTRAINT fk_commandes_utilisateur
        FOREIGN KEY (id_utilisateur) REFERENCES utilisateurs(id),
    CONSTRAINT fk_commandes_actionneur
        FOREIGN KEY (id_actionneur) REFERENCES actionneurs(id),
    CONSTRAINT chk_commandes_type_action CHECK (type_action IN ('on', 'off', 'programmer')),
    CONSTRAINT chk_commandes_source CHECK (source IN ('web', 'cli', 'auto')),
    CONSTRAINT chk_commandes_statut CHECK (statut IN ('envoyee', 'recue', 'executee', 'echouee'))
);


-- ============================================================
-- 7. TABLE : actions
-- FK → commandes(id) — UNIQUE = relation 1:1
-- Composition ◆ avec commandes
-- ============================================================
CREATE TABLE actions (
    id              SERIAL          PRIMARY KEY,
    date_debut      TIMESTAMP       NOT NULL DEFAULT NOW(),
    date_fin        TIMESTAMP,
    duree           INTEGER,
    resultat        TEXT,
    details         TEXT,
    statut          VARCHAR(15)     NOT NULL DEFAULT 'en_cours',
    id_commande     INTEGER         NOT NULL UNIQUE,  -- 1 commande = 1 action
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP       NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_actions_commande
        FOREIGN KEY (id_commande) REFERENCES commandes(id) ON DELETE CASCADE,
    CONSTRAINT chk_actions_statut CHECK (statut IN ('en_cours', 'termine', 'echouee'))
);

CREATE TRIGGER trg_actions_updated_at
    BEFORE UPDATE ON actions
    FOR EACH ROW
    EXECUTE FUNCTION mettre_a_jour_horodatage();


-- ============================================================
-- 8. TABLE : alertes
-- FK → parcelles(id), mesures(id) NULLABLE, actions(id) NULLABLE
-- CHECK : au moins une source (mesure OU action)
-- ============================================================
CREATE TABLE alertes (
    id              SERIAL          PRIMARY KEY,
    type            VARCHAR(30)     NOT NULL,
    valeur          DECIMAL(10,2),
    seuil           DECIMAL(10,2),
    severite        VARCHAR(10)     NOT NULL DEFAULT 'haute',
    message         TEXT            NOT NULL,
    etat            VARCHAR(15)     NOT NULL DEFAULT 'active',
    date_debut      TIMESTAMP       NOT NULL DEFAULT NOW(),
    date_fin        TIMESTAMP,
    id_parcelle     INTEGER         NOT NULL,
    id_mesure       INTEGER,
    id_action       INTEGER,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP       NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_alertes_parcelle
        FOREIGN KEY (id_parcelle) REFERENCES parcelles(id),
    CONSTRAINT fk_alertes_mesure
        FOREIGN KEY (id_mesure) REFERENCES mesures(id),
    CONSTRAINT fk_alertes_action
        FOREIGN KEY (id_action) REFERENCES actions(id),
    CONSTRAINT chk_alertes_severite CHECK (severite IN ('basse', 'haute', 'critique')),
    CONSTRAINT chk_alertes_etat CHECK (etat IN ('active', 'reconnue', 'resolue')),
    CONSTRAINT chk_alertes_source CHECK (id_mesure IS NOT NULL OR id_action IS NOT NULL)
);

CREATE TRIGGER trg_alertes_updated_at
    BEFORE UPDATE ON alertes
    FOR EACH ROW
    EXECUTE FUNCTION mettre_a_jour_horodatage();


-- ============================================================
-- 9. TABLE : seuils
-- FK → utilisateurs(id), parcelles(id)
-- ============================================================
CREATE TABLE seuils (
    id              SERIAL          PRIMARY KEY,
    type_mesure     VARCHAR(20)     NOT NULL,
    valeur_min      DECIMAL(10,2)   NOT NULL,
    valeur_max      DECIMAL(10,2)   NOT NULL,
    unite           VARCHAR(10)     NOT NULL,
    id_utilisateur  INTEGER         NOT NULL,
    id_parcelle     INTEGER         NOT NULL,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP       NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_seuils_utilisateur
        FOREIGN KEY (id_utilisateur) REFERENCES utilisateurs(id),
    CONSTRAINT fk_seuils_parcelle
        FOREIGN KEY (id_parcelle) REFERENCES parcelles(id) ON DELETE CASCADE
);

CREATE TRIGGER trg_seuils_updated_at
    BEFORE UPDATE ON seuils
    FOR EACH ROW
    EXECUTE FUNCTION mettre_a_jour_horodatage();


-- ============================================================
-- 10. TABLE : tokens
-- FK → utilisateurs(id) — Composition ◆
-- ============================================================
CREATE TABLE tokens (
    id              SERIAL          PRIMARY KEY,
    cle_api         VARCHAR(255)    UNIQUE NOT NULL,
    nom             VARCHAR(50)     NOT NULL,
    actif           BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    expires_at      TIMESTAMP,
    last_used_at    TIMESTAMP,
    id_utilisateur  INTEGER         NOT NULL,

    CONSTRAINT fk_tokens_utilisateur
        FOREIGN KEY (id_utilisateur) REFERENCES utilisateurs(id) ON DELETE CASCADE
);


-- ============================================================
-- INDEX
-- Optimisation des performances pour les requêtes fréquentes
-- ============================================================

-- ----- Index sur mesures (table la plus sollicitée) -----
CREATE INDEX idx_mesures_timestamp
    ON mesures(timestamp DESC);
CREATE INDEX idx_mesures_id_capteur
    ON mesures(id_capteur);
CREATE INDEX idx_mesures_capteur_timestamp
    ON mesures(id_capteur, timestamp DESC);

-- ----- Index sur commandes -----
CREATE INDEX idx_commandes_timestamp
    ON commandes(timestamp DESC);
CREATE INDEX idx_commandes_utilisateur
    ON commandes(id_utilisateur);
CREATE INDEX idx_commandes_actionneur
    ON commandes(id_actionneur);
CREATE INDEX idx_commandes_statut
    ON commandes(statut);

-- ----- Index sur alertes -----
CREATE INDEX idx_alertes_etat
    ON alertes(etat);
CREATE INDEX idx_alertes_parcelle
    ON alertes(id_parcelle);
CREATE INDEX idx_alertes_date
    ON alertes(date_debut DESC);

-- ----- Index sur seuils -----
CREATE INDEX idx_seuils_parcelle
    ON seuils(id_parcelle);

-- ----- Index sur tokens -----
CREATE INDEX idx_tokens_utilisateur
    ON tokens(id_utilisateur);
CREATE INDEX idx_tokens_cle_api
    ON tokens(cle_api);

-- ----- Index sur actions -----
CREATE INDEX idx_actions_commande
    ON actions(id_commande);
CREATE INDEX idx_actions_statut
    ON actions(statut);


-- ============================================================
-- NOTES IMPORTANTES
-- ============================================================
-- 1. Ordre de création respecté : les tables sans FK d'abord,
--    puis celles qui en dépendent.
--
-- 2. ON DELETE CASCADE est utilisé pour implémenter la COMPOSITION :
--    - Supprimer une parcelle → supprime ses capteurs, actionneurs, seuils
--    - Supprimer un capteur → supprime ses mesures
--    - Supprimer une commande → supprime son action
--    - Supprimer un utilisateur → supprime ses tokens
--
-- 3. PAS de CASCADE pour :
--    - utilisateurs → parcelles (agrégation : les parcelles sont réassignées)
--    - parcelles → alertes (les alertes restent dans l'historique)
--    - commandes sans CASCADE sur utilisateur (historique conservé)
--
-- 4. La contrainte UNIQUE sur actions.id_commande garantit
--    la relation 1:1 entre commande et action.
--
-- 5. La contrainte CHECK sur alertes garantit qu'une alerte
--    a toujours au moins une source (mesure OU action).
--
-- 6. Les triggers trg_*_updated_at mettent automatiquement à jour
--    la colonne updated_at à chaque modification de ligne.
--    Tables concernées : utilisateurs, parcelles, capteurs,
--    actionneurs, actions, alertes, seuils.
--    Tables NON concernées : mesures (pas de updated_at),
--    commandes et tokens (pas de colonne updated_at).
-- ============================================================
