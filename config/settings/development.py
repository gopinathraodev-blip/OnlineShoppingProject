from .base import *

DEBUG = True

ALLOWED_HOSTS = []

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": "online_shopping_db",
        "USER": "postgres",
        "PASSWORD": 1234,
        "HOST": "127.0.0.1",
        "PORT": "5432",
    }
}