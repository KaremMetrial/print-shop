<?php

namespace App\Exceptions;

use App\Enums\ErrorCode;
use Illuminate\Http\Request;
use RuntimeException;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

/** خطأ قاعدة عمل: كود ثابت + رسالة عربية. يُحوَّل لـ JSON (API) أو redirect مع خطأ (Inertia). */
class BusinessException extends RuntimeException
{
    public function __construct(public readonly ErrorCode $errorCode, ?string $message = null, public readonly array $fieldErrors = [])
    {
        parent::__construct($message ?? $errorCode->message());
    }

    public function render(Request $request): SymfonyResponse
    {
        if ($request->expectsJson() && ! $request->header('X-Inertia')) {
            return response()->json([
                'success' => false,
                'error' => array_filter([
                    'code' => $this->errorCode->value,
                    'message' => $this->getMessage(),
                    'field_errors' => $this->fieldErrors ?: null,
                    'correlation_id' => $request->attributes->get('correlation_id'),
                ]),
            ], $this->errorCode->status());
        }

        return back()->withErrors(['business' => $this->getMessage()] + $this->fieldErrors)->with('error_code', $this->errorCode->value);
    }
}
