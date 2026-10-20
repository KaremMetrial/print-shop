<?php

use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\User;

beforeEach(fn () => $this->a = User::factory()->superAdmin()->create());

it('creates, renames and toggles categories with unique names', function () {
    $this->actingAs($this->a)->post('/categories', ['name' => 'مطبوعات تجارية'])->assertRedirect();
    $c = ProductCategory::where('name', 'مطبوعات تجارية')->firstOrFail();
    $this->post('/categories', ['name' => 'مطبوعات تجارية'])->assertSessionHasErrors('name');
    $this->patch("/categories/{$c->id}", ['name' => 'مطبوعات'])->assertRedirect();
    expect($c->refresh()->name)->toBe('مطبوعات');
    $this->post("/categories/{$c->id}/toggle")->assertRedirect();
    expect($c->refresh()->is_active)->toBeFalse();
});

it('blocks deactivating a category with active products and requires products.manage', function () {
    $p = Product::factory()->create(['is_active' => true]);
    $this->actingAs($this->a)->postJson("/categories/{$p->category_id}/toggle")->assertStatus(422);
    $this->actingAs(User::factory()->designer()->create())->post('/categories', ['name' => 'x'])->assertForbidden();
});
