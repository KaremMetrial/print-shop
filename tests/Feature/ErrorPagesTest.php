<?php

use App\Models\User;
use Illuminate\Support\Facades\Route;

it('renders an Arabic error page for browser 404/403 and keeps JSON for APIs', function () {
    $a = User::factory()->superAdmin()->create();
    $this->actingAs($a)->get('/orders/999999')->assertNotFound()->assertInertia(fn ($p) => $p->component('error')->where('status', 404)->where('home', '/dashboard'));
    $this->getJson('/orders/999999')->assertNotFound()->assertJsonMissingPath('component');
    $this->actingAs(User::factory()->designer()->create())->get('/audit')->assertForbidden()->assertInertia(fn ($p) => $p->component('error')->where('status', 403));
});

it('hides exception details on 500 when debug is off', function () {
    config(['app.debug' => false]);
    Route::middleware('web')->get('/_boom', fn () => throw new RuntimeException('secret internals'));
    $r = $this->get('/_boom')->assertStatus(500);
    expect($r->getContent())->not->toContain('secret internals')->and($r->getContent())->toContain('&quot;status&quot;:500');
});

it('reloads fully on in-app navigation errors so the Arabic error page shows', function () {
    $a = User::factory()->superAdmin()->create();
    $this->actingAs($a)->get('/orders/999999', ['X-Inertia' => 'true', 'X-Requested-With' => 'XMLHttpRequest'])->assertStatus(409)->assertHeader('X-Inertia-Location');
});
