#!/bin/sh
set -e

cd /var/www/html

# .env yoksa .env.example'dan oluştur
if [ ! -f .env ]; then
    echo "[entrypoint] .env bulunamadı, .env.example'dan oluşturuluyor..."
    cp .env.example .env
fi

# Composer bağımlılıkları eksikse yükle
if [ ! -f vendor/autoload.php ]; then
    echo "[entrypoint] Composer bağımlılıkları yükleniyor..."
    composer install --optimize-autoloader --no-interaction
fi

# APP_KEY boşsa oluştur
APP_KEY=$(grep "^APP_KEY=" .env | cut -d '=' -f2 | tr -d ' \r')
if [ -z "$APP_KEY" ]; then
    echo "[entrypoint] APP_KEY üretiliyor..."
    php artisan key:generate --force
fi

# Storage ve cache dizinlerini hazırla
mkdir -p storage/framework/sessions \
         storage/framework/views \
         storage/framework/cache \
         storage/framework/testing \
         storage/logs \
         bootstrap/cache
chmod -R 777 storage bootstrap/cache

# Migration'ları çalıştır
echo "[entrypoint] Migration'lar çalıştırılıyor..."
php artisan migrate --force

echo "[entrypoint] Kurulum tamamlandı. PHP-FPM başlatılıyor..."
exec "$@"
