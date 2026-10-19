<?php

namespace App\Services\Files;

use App\Models\File;
use Illuminate\Contracts\Auth\Authenticatable;

/**
 * الصلاحية على الملف = صلاحية المستخدم على الكيان الأب (§4.4).
 * كل Module يسجّل قواعده: register('design_version', view: fn…, download: fn…).
 * بدون تسجيل → الرفض (default deny).
 */
class FileAccessRegistry
{
    /** @var array<string, array{view: callable, download: callable}> */
    private array $rules = [];

    public function register(string $parentType, callable $view, ?callable $download = null): void
    {
        $this->rules[$parentType] = ['view' => $view, 'download' => $download ?? $view];
    }

    public function canView(File $file, ?Authenticatable $actor): bool
    {
        return $this->check($file, $actor, 'view');
    }

    public function canDownload(File $file, ?Authenticatable $actor): bool
    {
        return $this->check($file, $actor, 'download');
    }

    private function check(File $file, ?Authenticatable $actor, string $kind): bool
    {
        $rule = $this->rules[$file->parent_type ?? ''] ?? null;

        return $rule !== null && (bool) ($rule[$kind])($file, $actor);
    }
}
