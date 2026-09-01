"""
Package des commandes du CLI SAI.

Chaque module correspond a un groupe de commandes :
- capteurs.py    → Lister les capteurs
- mesures.py     → Voir les mesures
- actionneurs.py → Lister les actionneurs
- commandes.py   → Envoyer des ordres aux actionneurs
- alertes.py     → Consulter, acquitter ou résoudre les alertes
- seuils.py      → Lister et configurer les seuils d'automatisation
- batch.py       → Actions en lot (arrosage / ventilation, CDC 6.2.x / 6.3)
- statut.py      → Tableau de bord récapitulatif du système

L'import dans __init__.py permet d'accéder aux modules via
`from commands import capteurs`, etc.
"""