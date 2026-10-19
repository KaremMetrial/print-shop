<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        return array_merge(parent::share($request), [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'generated_password' => fn () => $request->session()->get('generated_password'),
            ],
            'auth' => [
                'user' => $this->authUser($request),
            ],
        ]);
    }

    /** @return array<string, mixed>|null */
    private function authUser(Request $request): ?array
    {
        $u = $request->user();
        if (! $u) {
            return null;
        }
        $role = $u->roleEnum();

        // لا نمرر إلا ما تحتاجه الواجهة. الصلاحيات هنا للـUX فقط — الـBackend هو المرجع.
        return [
            'id' => $u->id,
            'name' => $u->name,
            'email' => $u->email,
            'role' => $role?->uiKey(),
            'role_label' => $role?->label(),
            'permissions' => $u->permissionCodes(),
        ];
    }
}
