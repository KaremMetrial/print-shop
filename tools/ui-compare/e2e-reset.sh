#!/usr/bin/env bash
# يعيد بناء قاعدة بيانات الاختبار الشامل pbms_e2e (منفصلة تمامًا عن قاعدة التطوير) ببيانات الـpen
docker compose run --rm -e DB_DATABASE=pbms_e2e app sh -c "php artisan migrate:fresh --force --seed >/dev/null 2>&1 && php artisan db:seed --class=PenFixturesSeeder >/dev/null 2>&1 && echo reset-ok"
