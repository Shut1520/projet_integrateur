"""
services/rate_limit.py — Configuration centralisee du rate limiting (slowapi).

Le limiter est defini ici (et non dans main.py) pour eviter une
importation circulaire : les routeurs (routes/*.py) importent le limiter
pour decorer leurs endpoints, et main.py le branche sur l'application.
"""

from slowapi import Limiter
from slowapi.util import get_remote_address

from config import RATE_LIMIT_DEFAULT

# Identifie le client par son adresse IP remote.
limiter = Limiter(key_func=get_remote_address, default_limits=[RATE_LIMIT_DEFAULT])
