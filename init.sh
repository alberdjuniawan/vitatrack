#!/bin/bash
set -e
cd /var/www/html

until PGPASSWORD="$DB_PASSWORD" pg_isready -h "$DB_HOST" -U "$DB_USERNAME" -d "$DB_DATABASE" -q; do
    sleep 2
done

# Install Laravel AI SDK automatically if not present
if [ ! -d "vendor/laravel/ai" ]; then
    echo "Installing Laravel AI SDK..."
    composer require laravel/ai
    php artisan vendor:publish --provider="Laravel\Ai\AiServiceProvider"
fi

php artisan config:clear
php artisan cache:clear
php artisan migrate --force

if [ ! -L public/storage ]; then
    php artisan storage:link --force
fi

if [ "$APP_ENV" = "production" ]; then
    php artisan config:cache
    php artisan route:cache
    php artisan view:cache
fi

chown -R www-data:www-data storage bootstrap/cache

exec php-fpm
