<?php

namespace App\Services\Files;

use App\Enums\ErrorCode;
use App\Exceptions\BusinessException;
use App\Models\File;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class FileService
{
    /** @param array{0:string,1:int|null} $uploader [type, id] */
    public function store(UploadedFile $upload, string $category, array $uploader, ?string $parentType = null, ?int $parentId = null): File
    {
        $rule = config("files.categories.$category") ?? throw new BusinessException(ErrorCode::FILE_TYPE_NOT_ALLOWED);

        if (! $upload->isValid()) {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 'تعذر رفع الملف.');
        }
        if ($upload->getSize() > $rule['max_kb'] * 1024) {
            throw new BusinessException(ErrorCode::FILE_TOO_LARGE);
        }
        // النوع الحقيقي من محتوى الملف (finfo) وليس من الامتداد أو الـclient.
        $mime = (new \finfo(FILEINFO_MIME_TYPE))->file($upload->getRealPath());
        if (! in_array($mime, $rule['mimes'], true)) {
            throw new BusinessException(ErrorCode::FILE_TYPE_NOT_ALLOWED);
        }

        $disk = config('files.disk');
        $key = 'files/'.now()->format('Y/m').'/'.Str::uuid()->toString();
        Storage::disk($disk)->putFileAs(dirname($key), $upload, basename($key));

        return File::create([
            'storage_key' => $key,
            'disk' => $disk,
            'original_filename' => mb_substr(basename($upload->getClientOriginalName()), 0, 255),
            'mime_type' => $mime,
            'size_bytes' => $upload->getSize(),
            'category' => $category,
            'uploaded_by_type' => $uploader[0],
            'uploaded_by_id' => $uploader[1],
            'checksum' => hash_file('sha256', $upload->getRealPath()),
            'parent_type' => $parentType,
            'parent_id' => $parentId,
        ]);
    }
}
