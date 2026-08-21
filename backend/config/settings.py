"""
Django settings for RouteLog ELD Trip Planner backend.
Stateless backend architecture with NO application database or persistent models.
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Build paths inside the project
BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables from .env
load_dotenv(BASE_DIR / '.env')

SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', 'routelog-secret-key-prod-default-2026').strip() or 'routelog-secret-key-prod-default-2026'

DEBUG = os.getenv('DEBUG', 'False').lower() in ('true', '1', 'yes')

ALLOWED_HOSTS = [
    host.strip() for host in os.getenv(
        'ALLOWED_HOSTS',
        'localhost,127.0.0.1,0.0.0.0,testserver,.vercel.app',
    ).split(',')
    if host.strip()
]

# Minimal stateless installed apps
INSTALLED_APPS = [
    'corsheaders',
    'rest_framework',
    'trips',
]

# Minimal stateless middleware
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
]

ROOT_URLCONF = 'config.urls'

WSGI_APPLICATION = 'config.wsgi.application'
ASGI_APPLICATION = 'config.asgi.application'

# Stateless Django REST Framework configuration
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
    'UNAUTHENTICATED_USER': None,
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ] + (['rest_framework.renderers.BrowsableAPIRenderer'] if DEBUG else []),
}

# CORS Configuration
CORS_ALLOW_CREDENTIALS = False
cors_origins_env = os.getenv(
    'CORS_ALLOWED_ORIGINS',
    'http://localhost:5173,http://127.0.0.1:5173',
)
CORS_ALLOWED_ORIGINS = [origin.strip() for origin in cors_origins_env.split(',') if origin.strip()]

# Allow all origins only during local development if needed
if DEBUG:
    CORS_ALLOW_ALL_ORIGINS = True

HERE_API_KEY = os.getenv('HERE_API_KEY', '').strip()
TOMTOM_API_KEY = os.getenv('TOMTOM_API_KEY', '').strip()
OPENROUTESERVICE_API_KEY = os.getenv('OPENROUTESERVICE_API_KEY', '').strip()
PRIMARY_GEOCODING_PROVIDER = os.getenv('PRIMARY_GEOCODING_PROVIDER', 'here').strip().lower()
PRIMARY_ROUTING_PROVIDER = os.getenv('PRIMARY_ROUTING_PROVIDER', 'here').strip().lower()
ENABLE_PROVIDER_FALLBACK = os.getenv('ENABLE_PROVIDER_FALLBACK', 'true').lower() in ('true', '1', 'yes')

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True
