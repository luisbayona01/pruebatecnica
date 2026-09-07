#!/bin/sh
set -e

# Espera a que MySQL esté disponible
until mysqladmin ping -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USERNAME" -p"$DB_PASSWORD" --skip-ssl --silent; do
  echo "Esperando a MySQL..."; sleep 2
done

cd /var/www/html

if [ ! -f .env ]; then
  cp .env.example .env
  sed -i "s/DB_HOST=.*/DB_HOST=${DB_HOST}/" .env
  sed -i "s/DB_PORT=.*/DB_PORT=${DB_PORT}/" .env
  sed -i "s/DB_DATABASE=.*/DB_DATABASE=${DB_DATABASE}/" .env
  sed -i "s/DB_USERNAME=.*/DB_USERNAME=${DB_USERNAME}/" .env
  sed -i "s/DB_PASSWORD=.*/DB_PASSWORD=${DB_PASSWORD}/" .env
fi

php artisan key:generate --force
php artisan jwt:secret --force
php artisan config:clear
php artisan migrate --force --seed

exec php-fpm