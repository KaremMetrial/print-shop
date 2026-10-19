#!/usr/bin/env bash
# نسخ احتياطي: قاعدة البيانات + ملفات التخزين الخاصة. التشغيل: scripts/backup.sh [مجلد_الوجهة]
# الاسترجاع (اختبره دوريًا على بيئة منفصلة): scripts/restore.sh <db.sql.gz> <files.tar.gz>
set -euo pipefail
DEST="${1:-backups}"; TS="$(date +%Y%m%d-%H%M%S)"; mkdir -p "$DEST"
docker compose exec -T mysql sh -c 'mysqldump --single-transaction --routines --triggers -uroot -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"' | gzip > "$DEST/db-$TS.sql.gz"
docker compose exec -T app tar -C storage/app -czf - private 2>/dev/null > "$DEST/files-$TS.tar.gz" || true
sha256sum "$DEST"/*-"$TS".* > "$DEST/SHA256SUMS-$TS"
echo "تم: $DEST/db-$TS.sql.gz و $DEST/files-$TS.tar.gz"
