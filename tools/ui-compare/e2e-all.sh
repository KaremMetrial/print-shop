#!/usr/bin/env bash
# تشغيل كل رحلات الأزرار على نسخة معزولة (pbms_e2e على المنفذ 8001) — لا يلمس قاعدة التطوير.
# 1) يشغّل خادمًا منفصلًا بـDB_DATABASE=pbms_e2e  2) يعيد بناء القاعدة قبل كل مجموعة  3) يلخّص النتيجة.
set -u
cd "$(dirname "$0")/../.."
docker rm -f e2e-app >/dev/null 2>&1
docker compose run --rm -d --name e2e-app -p 8001:8001 -e DB_DATABASE=pbms_e2e -e CACHE_STORE=array -e SESSION_DRIVER=file -e QUEUE_CONNECTION=sync -e BROADCAST_CONNECTION=null -e APP_URL=http://localhost:8001 -e PHP_CLI_SERVER_WORKERS=4 app php -S 0.0.0.0:8001 -t public tools/ui-compare/router.php >/dev/null 2>&1
sleep 6
fail=0
for s in orders finance admin flow wizard portal mobile more revision; do
  echo "=== $s"; ./tools/ui-compare/e2e-reset.sh >/dev/null
  node tools/ui-compare/e2e-$s.mjs 2>&1 | grep -E "^(✓|✗|النتيجة|أخطاء JS)" || fail=1
  [ "${PIPESTATUS[0]}" = "0" ] || fail=1
done
docker rm -f e2e-app >/dev/null 2>&1
exit $fail
