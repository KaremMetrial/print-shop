<?php

/**
 * سياسة الملفات (القرار D2 لم يُحسم: القيم مبدئية، ستنتقل لإعدادات النظام S-073).
 * الحجم بالكيلوبايت. الأنواع تُفحص من محتوى الملف الفعلي وليس من الامتداد.
 */
$image = ['image/png', 'image/jpeg', 'image/webp'];
$pdf = ['application/pdf'];
$audio = ['audio/webm', 'audio/ogg', 'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/x-wav', 'video/webm'];

return [
    'disk' => env('FILES_DISK', 'local'), // خاص (storage/app/private) — لا public URLs

    'categories' => [
        'design_preview' => ['mimes' => [...$image, ...$pdf], 'max_kb' => 51200],
        'customer_reference' => ['mimes' => [...$image, ...$pdf], 'max_kb' => 51200],
        'chat_attachment' => ['mimes' => [...$image, ...$pdf, ...$audio], 'max_kb' => 25600],
        'payment_proof' => ['mimes' => [...$image, ...$pdf], 'max_kb' => 10240],
        'query_image' => ['mimes' => $image, 'max_kb' => 10240],
    ],
];
