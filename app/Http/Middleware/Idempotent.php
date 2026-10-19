<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

/**
 * Idempotency للعمليات الحرجة (إنشاء أوردر، قبول طلب، اعتماد، دفعة، استرداد، إتمام...).
 * - رأس `Idempotency-Key` إلزامي على الطرق غير الآمنة.
 * - نفس المفتاح + نفس الطلب → إعادة نفس الاستجابة (بدون إعادة التنفيذ).
 * - نفس المفتاح + طلب مختلف → 422 · قيد التنفيذ → 409.
 */
class Idempotent
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->isMethodSafe()) {
            return $next($request);
        }

        $key = $request->header('Idempotency-Key');
        if (! $key || strlen($key) > 100) {
            return $this->error('IDEMPOTENCY_KEY_REQUIRED', 'مفتاح منع التكرار مطلوب.', 400);
        }

        $scope = $this->scope($request);
        $hash = hash('sha256', $request->method().'|'.$request->path().'|'.$request->getContent().'|'.json_encode($request->except(['_token'])));

        try {
            $row = DB::table('idempotency_keys')->insertGetId([
                'scope' => $scope, 'key' => $key, 'method' => $request->method(), 'path' => substr($request->path(), 0, 255),
                'request_hash' => $hash, 'created_at' => now(), 'updated_at' => now(),
            ]);
        } catch (QueryException $e) {
            if (! str_contains($e->getMessage(), 'Duplicate') && ! str_contains($e->getMessage(), 'UNIQUE')) {
                throw $e;
            }

            return $this->replay($scope, $key, $hash);
        }

        try {
            $response = $next($request);
        } catch (\Throwable $e) {
            DB::table('idempotency_keys')->where('id', $row)->delete();
            throw $e;
        }

        if ($response->getStatusCode() >= 500) {
            DB::table('idempotency_keys')->where('id', $row)->delete(); // يسمح بإعادة المحاولة
        } else {
            DB::table('idempotency_keys')->where('id', $row)->update([
                'response_status' => $response->getStatusCode(),
                'response_location' => $response->headers->get('Location'),
                'response_content_type' => $response->headers->get('Content-Type'),
                'response_body' => $response->isRedirection() ? null : $response->getContent(),
                'completed_at' => now(), 'updated_at' => now(),
            ]);
        }

        return $response;
    }

    private function replay(string $scope, string $key, string $hash): Response
    {
        $r = DB::table('idempotency_keys')->where('scope', $scope)->where('key', $key)->first();
        if (! $r) {
            return $this->error('IDEMPOTENCY_IN_PROGRESS', 'العملية قيد التنفيذ، حاول بعد لحظات.', 409);
        }
        if ($r->request_hash !== $hash) {
            return $this->error('IDEMPOTENCY_KEY_REUSED', 'تم استخدام مفتاح منع التكرار مع طلب مختلف.', 422);
        }
        if (! $r->completed_at) {
            return $this->error('IDEMPOTENCY_IN_PROGRESS', 'العملية قيد التنفيذ، حاول بعد لحظات.', 409);
        }

        $resp = new Response($r->response_body ?? '', (int) $r->response_status);
        if ($r->response_location) {
            $resp->headers->set('Location', $r->response_location);
        }
        if ($r->response_content_type) {
            $resp->headers->set('Content-Type', $r->response_content_type);
        }
        $resp->headers->set('Idempotent-Replayed', 'true');

        return $resp;
    }

    private function scope(Request $request): string
    {
        foreach (['staff', 'customer'] as $guard) {
            if (config("auth.guards.$guard") && ($u = $request->user($guard))) {
                return substr($guard.':'.$u->getAuthIdentifier(), 0, 60);
            }
        }

        return 'ip:'.$request->ip();
    }

    private function error(string $code, string $message, int $status): JsonResponse
    {
        return response()->json(['success' => false, 'error' => ['code' => $code, 'message' => $message]], $status);
    }
}
