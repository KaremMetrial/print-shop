<?php

// راوتر خادم php -S لبيئة E2E: يخدم الملفات الثابتة (خطوط/أصول) ويمرر الباقي إلى Laravel.
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
if ($path !== '/' && is_file(__DIR__.'/../../public'.$path)) {
    return false;
}
require __DIR__.'/../../public/index.php';
