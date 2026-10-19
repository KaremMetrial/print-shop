#!/usr/bin/env bash
# استرجاع نسخة على بيئة جديدة/اختبارية فقط — يستبدل محتوى القاعدة. لا تشغّله على الإنتاج بدون تأكيد صريح.
set -euo pipefail
[ $# -eq 2 ] || { echo "usage: $0 <db.sql.gz> <files.tar.gz>"; exit 1; }
read -r -p "سيُستبدل محتوى قاعدة البيانات الحالية. اكتب RESTORE للمتابعة: " c; [ "$c" = "RESTORE" ] || exit 1
gunzip -c "$1" | docker compose exec -T mysql sh -c 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"'
docker compose exec -T app tar -C storage/app -xzf - < "$2"
echo "تم الاسترجاع. شغّل: docker compose run --rm app php artisan migrate --force"
