#!/bin/sh
set -e

# Espera a que MySQL esté disponible
until mysqladmin ping -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USERNAME" -p"$DB_PASSWORD" --skip-ssl --silent; do
  echo "Esperando a MySQL..."; sleep 2
done

cd /var/www/html

# Asegurar que www-data (uid 33) pueda escribir en storage aunque el volumen
# montado pertenezca a otro uid (p.ej. 1000).
chown -R www-data:www-data storage bootstrap/cache
chmod -R 775 storage

if [ ! -f .env ]; then
  cp .env.example .env
  sed -i "s/DB_HOST=.*/DB_HOST=${DB_HOST}/" .env
  sed -i "s/DB_PORT=.*/DB_PORT=${DB_PORT}/" .env
  sed -i "s/DB_DATABASE=.*/DB_DATABASE=${DB_DATABASE}/" .env
  sed -i "s/DB_USERNAME=.*/DB_USERNAME=${DB_USERNAME}/" .env
  sed -i "s/DB_PASSWORD=.*/DB_PASSWORD=${DB_PASSWORD}/" .env
fi

# Generar claves solo si no existen, para no invalidar tokens JWT en cada reinicio.
if ! grep -q '^APP_KEY=base64:' .env 2>/dev/null || [ -z "$(grep '^APP_KEY=' .env | cut -d= -f2)" ]; then
  php artisan key:generate --force
fi
if [ -z "$(grep '^JWT_SECRET=' .env | cut -d= -f2)" ]; then
  php artisan jwt:secret --force
fi
php artisan config:clear
php artisan migrate --force --seed

exec php-fpm