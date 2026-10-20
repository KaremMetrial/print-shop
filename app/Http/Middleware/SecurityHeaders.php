<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** ترويسات أمان عامة. ملفات العملاء تضع CSP/sandbox خاصة بها (لا تُستبدل). */
class SecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $r = $next($request);
        $r->headers->set('X-Frame-Options', 'DENY', false);
        $r->headers->set('X-Content-Type-Options', 'nosniff', false);
        $r->headers->set('Referrer-Policy', 'same-origin', false);
        $r->headers->set('Permissions-Policy', 'camera=(self), geolocation=(), payment=()', false);
        if ($request->isSecure()) {
            $r->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains', false);
        }

        return $r;
    }
}
