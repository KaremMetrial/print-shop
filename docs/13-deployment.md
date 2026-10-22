# دليل النشر والتشغيل (الإنتاج)

## المتطلبات
- خادم Linux بـ Docker + Docker Compose، 2 vCPU / 4GB RAM كحد أدنى، قرص ≥ 20GB.
- نطاق (domain) وشهادة TLS: ضع وكيلًا عكسيًا (Caddy / Traefik / Cloudflare / nginx) أمام الحاوية يوجّه `443 → 80` (التطبيق) و`wss 443 → 8080` (الشات والإشعارات اللحظية عبر Reverb).

## أول نشر
```bash
cp .env.production.example .env.production      # املأ كل القيم (APP_KEY، كلمات سر قوية، النطاق)
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
docker compose -f docker-compose.prod.yml exec app php artisan pbms:install   # ينشئ أول مدير عام (بلا حسابات تجريبية)
```
- الإقلاع يرفض العمل إن كان `APP_ENV` ≠ production أو `APP_DEBUG` ≠ false أو نقصت متغيرات حرجة.
- كل إقلاع ينفّذ: `migrate --force` ثم مزامنة الأدوار/الصلاحيات ثم تخزين الإعدادات/المسارات/العروض.
- العمليات داخل الحاوية (supervisor): nginx + php-fpm + `queue:work` + `schedule:work` + `reverb:start`.
- فحص الصحة: `GET /up` (مضبوط في HEALTHCHECK).

## بعد التشغيل (من واجهة النظام)
1. الإعدادات ← اسم المطبعة والفرع والهاتف وطرق الدفع المفعّلة.
2. الموظفون ← إنشاء الحسابات والأدوار؛ العملاء والمنتجات والشرائح.
3. جرّب: أوردر تجريبي كامل (إنشاء ← تصميم ← اعتماد ← طباعة ← تسليم) ثم احذف/ألغِ بياناته.

## النسخ الاحتياطي والاسترجاع
- يوميًا (cron على الخادم): `scripts/backup.sh /backups` (dump قاعدة البيانات + ملفات `storage/app/private` + checksums). احتفظ بآخر 14 نسخة على الأقل ونسخة خارج الخادم.
- **اختبر الاسترجاع دوريًا** على بيئة منفصلة: `scripts/restore.sh <db.sql.gz> <files.tar.gz>` ثم `php artisan migrate --force`.
- سجل التدقيق (`audit_logs`) append-only بمُشغّل في MySQL؛ لا تُعد تعيينه عند الاسترجاع إلا من نسخة.

## الترقية والرجوع
```bash
git pull && docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```
- الترحيلات تُطبَّق تلقائيًا؛ خذ نسخة احتياطية قبل أي ترقية. الرجوع: أعد الصورة السابقة (`docker tag`) + استرجع النسخة إن تغيّر المخطط.

## الأمان (قائمة تحقق)
- [ ] `APP_DEBUG=false`، `APP_KEY` فريد، كلمات سر MySQL/Redis قوية، Redis غير معروض خارجيًا.
- [ ] TLS فعّال على 443 و`SESSION_SECURE_COOKIE=true`.
- [ ] جدار ناري: افتح 80/443 فقط (لا تعرض 3306/6379).
- [ ] غيّر كلمة مرور المدير العام ولا تستخدم حسابات `@pbms.test` (لا تُنشأ في الإنتاج).
- [ ] راجع الصلاحيات من شاشة الموظفين، وفعّل النسخ الاحتياطي اليومي.
- ترويسات الأمان (X-Frame-Options/nosniff/Referrer/HSTS/Permissions-Policy) مفعّلة من التطبيق؛ أضف CSP عند الوكيل إن أردت تشديدًا إضافيًا.

## المراقبة
- السجلات: `docker compose logs -f app` (stdout) + `storage/logs/laravel-*.log` (يومية، 30 يومًا).
- راقب: `/up`، حجم طابور Redis، آخر تشغيل للـscheduler، المساحة، وفشل `payment`/`outbox` في السجل.

## قرارات معلّقة من المالك (لا تعطّل التشغيل)
- D7: الفواتير الحالية «داخلية وليست ضريبية».
- D6: البحث بالصورة بالبصمة الإدراكية (يجد التصميم المطابق/القريب جدًا؛ ليس تعلّمًا دلاليًا).
- D2/D5/D3/D8: حدود الملفات/الاحتفاظ/واتساب/الاستضافة.
