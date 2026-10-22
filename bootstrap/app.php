<?php

use App\Http\Middleware\EnsureStaffSession;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\Idempotent;
use App\Http\Middleware\PortalAuth;
use App\Http\Middleware\SecurityHeaders;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpKernel\Exception\HttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->web(append: [
            SecurityHeaders::class,
            EnsureStaffSession::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);
        $middleware->alias(['idempotent' => Idempotent::class, 'portal' => PortalAuth::class]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // 419: انتهت الجلسة/الرمز (مثلًا بعد تفريغ الكاش أو طول الخمول) → رجوع للصفحة بتوكن جديد مع رسالة عربية بدل صفحة خطأ.
        $exceptions->render(function (HttpException $e, Request $request) {
            if ($e->getStatusCode() !== 419) {
                return null;
            }
            if ($request->expectsJson() && ! $request->header('X-Inertia')) {
                return response()->json(['error' => ['code' => 'SESSION_EXPIRED', 'message' => 'انتهت صلاحية الجلسة. حدّث الصفحة وحاول مرة أخرى.']], 419);
            }

            return redirect()->back(fallback: '/')->withErrors(['business' => 'انتهت صلاحية الجلسة. حاول مرة أخرى.'])->withInput($request->except(['password', 'password_confirmation']));
        });

        // صفحات الأخطاء العربية الموحّدة لطلبات المتصفح (JSON يبقى كما هو). 500 يُخفي التفاصيل خارج وضع التطوير.
        $exceptions->respond(function ($response, Throwable $e, Request $request) {
            $status = $response->getStatusCode();
            if (! in_array($status, [403, 404, 429, 500, 503], true)) {
                return $response;
            }
            if ($request->header('X-Inertia')) {
                // تنقّل داخلي (Inertia) إلى صفحة خطأ: إعادة تحميل كاملة تعرض صفحة الخطأ العربية بدل نافذة HTML خام.
                return $request->isMethod('GET') ? Inertia::location($request->fullUrl()) : $response;
            }
            if ($request->expectsJson()) {
                return $response;
            }
            if ($status === 500 && config('app.debug')) {
                return $response;
            }
            $home = $request->is('portal*') ? '/portal' : ($request->is('l/*') ? '/' : '/dashboard');

            return Inertia::render('error', ['status' => $status, 'home' => $home])->toResponse($request)->setStatusCode($status);
        });
    })->create();
