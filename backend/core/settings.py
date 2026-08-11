from pathlib import Path
import os

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.0/howto/deployment/checklist/
#
# ÜRETİME ALIRKEN: aşağıdaki DJANGO_* ortam değişkenlerini deploy ortamınızda (docker-compose,
# hosting paneli vb.) set edin. Hiçbiri set edilmezse davranış bugüne kadarki geliştirme
# ayarlarıyla birebir aynı kalır — yani bu değişiklik mevcut docker-compose kurulumunuzu bozmaz.

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'django-insecure-snkoh*u(j6e15d^8kb^1blp$)5^ouz%fq7r+32^xp4q_ysfg86')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.environ.get('DJANGO_DEBUG', 'True') == 'True'

_allowed_hosts_env = os.environ.get('DJANGO_ALLOWED_HOSTS')
ALLOWED_HOSTS = _allowed_hosts_env.split(',') if _allowed_hosts_env else ['*']


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'accounts',
    'school',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# Sadece DEBUG modundayken tüm origin'lere izin ver; DJANGO_DEBUG=False set edildiği anda
# (yani üretimde) otomatik olarak CORS_ALLOWED_ORIGINS listesine düşer.
CORS_ALLOW_ALL_ORIGINS = DEBUG
ROOT_URLCONF = 'core.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'core.wsgi.application'


# Database
# https://docs.djangoproject.com/en/5.0/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME', 'student_tracker_db'),
        'USER': os.environ.get('DB_USER', 'tracker_user'),
        'PASSWORD': os.environ.get('DB_PASSWORD', 'tracker_password'),
        'HOST': os.environ.get('DB_HOST', 'db'),
        'PORT': os.environ.get('DB_PORT', '5432'),
    }
}


# Password validation
# https://docs.djangoproject.com/en/5.0/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/5.0/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.0/howto/static-files/

STATIC_URL = 'static/'

# Default primary key field type
# https://docs.djangoproject.com/en/5.0/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
AUTH_USER_MODEL = 'accounts.User'

# REST Framework Ayarları
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    )
}

# JWT Ayarları
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=1),  # Token 1 gün geçerli olsun
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7), # Yenileme token'ı 7 gün
    'AUTH_HEADER_TYPES': ('Bearer',),
}

_cors_origins_env = os.environ.get('DJANGO_CORS_ALLOWED_ORIGINS')
CORS_ALLOWED_ORIGINS = _cors_origins_env.split(',') if _cors_origins_env else [
    "http://localhost:5173",
]

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# E-POSTA (şifre sıfırlama linki için)
# Geliştirmede varsayılan olarak 'console' backend kullanılır: gönderilen e-postanın
# içeriği (sıfırlama linki dahil) `docker compose logs web` çıktısında görünür, gerçek
# bir e-posta gönderilmez. Üretimde DJANGO_EMAIL_BACKEND ve SMTP ayarlarını env'den verin.
EMAIL_BACKEND = os.environ.get('DJANGO_EMAIL_BACKEND', 'django.core.mail.backends.console.EmailBackend')
EMAIL_HOST = os.environ.get('DJANGO_EMAIL_HOST', '')
EMAIL_PORT = int(os.environ.get('DJANGO_EMAIL_PORT', '587'))
EMAIL_HOST_USER = os.environ.get('DJANGO_EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.environ.get('DJANGO_EMAIL_HOST_PASSWORD', '')
EMAIL_USE_TLS = os.environ.get('DJANGO_EMAIL_USE_TLS', 'True') == 'True'
DEFAULT_FROM_EMAIL = os.environ.get('DJANGO_DEFAULT_FROM_EMAIL', 'EduTracker <no-reply@edutracker.local>')

# Şifre sıfırlama linkinin işaret edeceği frontend adresi (React Router route'u)
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:5173')