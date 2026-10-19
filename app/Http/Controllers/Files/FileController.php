<?php

namespace App\Http\Controllers\Files;

use App\Enums\ErrorCode;
use App\Exceptions\BusinessException;
use App\Http\Controllers\Controller;
use App\Models\File;
use App\Services\Files\FileAccessRegistry;
use App\Services\Files\FileService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class FileController extends Controller
{
    public function store(Request $request, FileService $files): JsonResponse
    {
        $data = $request->validate(['file' => ['required', 'file'], 'category' => ['required', 'string']]);
        $user = $request->user();
        $file = $files->store($request->file('file'), $data['category'], ['staff', $user->getAuthIdentifier()]);

        return response()->json(['success' => true, 'data' => $file], 201);
    }

    public function preview(File $file, Request $request, FileAccessRegistry $access): StreamedResponse
    {
        abort_unless($this->isOwnPending($file, $request) || $access->canView($file, $request->user()), 403, ErrorCode::FILE_ACCESS_DENIED->message());

        return $this->stream($file, 'inline');
    }

    public function download(File $file, Request $request, FileAccessRegistry $access): StreamedResponse
    {
        if (! $this->isOwnPending($file, $request) && ! $access->canDownload($file, $request->user())) {
            throw new BusinessException(ErrorCode::FILE_ACCESS_DENIED);
        }

        return $this->stream($file, 'attachment');
    }

    /** ملف رفعه المستخدم ولم يُربط بكيان بعد: يعاينه رافعه فقط. */
    private function isOwnPending(File $file, Request $request): bool
    {
        return $file->parent_type === null && $file->uploaded_by_type === 'staff' && (int) $file->uploaded_by_id === (int) $request->user()?->getAuthIdentifier();
    }

    private function stream(File $file, string $disposition): StreamedResponse
    {
        $disk = Storage::disk($file->disk);
        abort_unless($disk->exists($file->storage_key), 404);

        return $disk->response($file->storage_key, $file->original_filename, [
            'Content-Type' => $file->mime_type,
            'X-Content-Type-Options' => 'nosniff',
            'Cache-Control' => 'private, no-store',
            'Content-Security-Policy' => "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; sandbox",
        ], $disposition);
    }
}
