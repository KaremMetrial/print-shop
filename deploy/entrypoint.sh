#!/bin/bash
# تهيئة الإنتاج عند كل إقلاع: فحص الإعداد الحرج، ثم تخزين الإعدادات/المسارات/العروض، ثم تشغيل المنظومة.
set -e
cd /var/www/html
for v in APP_KEY APP_URL DB_HOST DB_DATABASE DB_USERNAME DB_PASSWORD; do
  [ -n "${!v}" ] || { echo "FATAL: المتغير $v غير مضبوط" >&2; exit 1; }
done
[ "${APP_ENV}" = "production" ] || { echo "FATAL: APP_ENV يجب أن يكون production" >&2; exit 1; }
[ "${APP_DEBUG}" = "false" ] || { echo "FATAL: APP_DEBUG يجب أن يكون false" >&2; exit 1; }
chown -R www-data:www-data storage bootstrap/cache
php artisan package:discover --ansi >/dev/null 2>&1 || true
php artisan storage:link >/dev/null 2>&1 || true
if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then php artisan migrate --force; fi
php artisan db:seed --class=RbacSeeder --force >/dev/null
php artisan config:cache && php artisan route:cache && php artisan view:cache && php artisan event:cache
exec "$@"
