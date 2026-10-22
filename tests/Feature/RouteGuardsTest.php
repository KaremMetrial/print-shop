<?php

use App\Models\User;
use Illuminate\Routing\Route as LaravelRoute;
use Illuminate\Support\Facades\Route;

/** مسارات عامة مقصودة (كل ما عداها يجب أن يكون خلف auth). */
const PUBLIC_ROUTES = ['home', 'login', 'password.request', 'password.email', 'password.reset', 'password.store', 'verification.verify', 'link.show', 'link.item', 'link.approve', 'link.file', 'link.chat', 'link.proof', 'link.invoice', 'link.invoice.pdf', 'portal.login', 'portal.login.store', 'portal.recover', 'portal.recover.store'];

function appRoutes(): array
{
    return collect(Route::getRoutes()->getRoutes())->filter(fn (LaravelRoute $r) => ! str_starts_with($r->uri(), '_') && ! str_starts_with($r->uri(), 'storage') && ! str_starts_with($r->uri(), 'up') && ! str_starts_with($r->uri(), 'sanctum')
        && ! str_starts_with($r->uri(), 'broadcasting') && ! str_starts_with($r->uri(), 'dev/'))->all();
}

it('puts every non-public route behind authentication (TC route-permission matrix)', function () {
    $unguarded = [];
    foreach (appRoutes() as $r) {
        $name = $r->getName() ?? $r->uri();
        $isPublic = in_array($r->getName(), PUBLIC_ROUTES, true) || str_starts_with((string) $r->getName(), 'password.') || str_starts_with((string) $r->getName(), 'verification.');
        $guarded = collect($r->gatherMiddleware())->contains(fn ($m) => is_string($m) && (str_starts_with($m, 'auth') || str_starts_with($m, 'guest') || $m === 'portal'));
        if (! $isPublic && ! $guarded) {
            $unguarded[] = $r->methods()[0].' '.$r->uri().' ('.$name.')';
        }
    }
    expect($unguarded)->toBe([]);
});

it('redirects guests away from every parameterless GET route behind auth', function () {
    foreach (appRoutes() as $r) {
        if (! in_array('GET', $r->methods(), true) || str_contains($r->uri(), '{') || in_array($r->getName(), PUBLIC_ROUTES, true)) {
            continue;
        }
        if (collect($r->gatherMiddleware())->contains(fn ($m) => is_string($m) && str_starts_with($m, 'auth'))) {
            $this->get('/'.$r->uri())->assertRedirect('/login');
        }
    }
});

it('denies a role-less authenticated user on permission-guarded pages', function () {
    $nobody = User::factory()->create();
    $this->actingAs($nobody)->get('/employees')->assertForbidden();
});

it('enforces the role access matrix on employees pages', function () {
    $matrix = ['superAdmin' => 200, 'admin' => 200, 'dataEntry' => 403, 'designer' => 403, 'accountant' => 403];
    foreach ($matrix as $role => $status) {
        $this->actingAs(User::factory()->{$role}()->create())->get('/employees')->assertStatus($status);
    }
});
