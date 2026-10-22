<?php

use App\Models\DesignerSpecialty;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use DateTimeInterface;

it('applies order, date period, and specialty filters to the design queue', function () {
    $manager = User::factory()->admin()->create();
    $specialty = DesignerSpecialty::create(['name' => 'تصميم مطبوعات']);
    $otherSpecialty = DesignerSpecialty::create(['name' => 'تصميم تغليف']);
    $order = Order::factory()->create(['order_number' => 'ORD-DESIGN-101']);

    $addItem = function (DesignerSpecialty $requiredSpecialty, string $name, DateTimeInterface $createdAt) use ($order): void {
        $product = Product::factory()->create(['required_specialty_id' => $requiredSpecialty->id]);
        $order->items()->create([
            'product_id' => $product->id,
            'product_snapshot' => ['id' => $product->id, 'name' => $name, 'required_specialty_id' => $requiredSpecialty->id],
            'options_snapshot' => [], 'quantity' => 1, 'base_unit_price' => 100, 'unit_price' => 100, 'item_total' => 100,
            'created_at' => $createdAt, 'updated_at' => $createdAt,
        ]);
    };

    $addItem($specialty, 'حديث ومطابق', now()->subDay());
    $addItem($otherSpecialty, 'تخصص مختلف', now()->subDay());
    $addItem($specialty, 'قديم', now()->subDays(40));

    $this->actingAs($manager)->get('/design?order=ORD-DESIGN-101&period=month&specialty='.$specialty->id)
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('design/index')
            ->where('filters.order', 'ORD-DESIGN-101')
            ->where('filters.period', 'month')
            ->where('filters.specialty', (string) $specialty->id)
            ->has('unassigned', 1)
            ->where('unassigned.0.product', 'حديث ومطابق')
            ->where('orders.0.value', 'ORD-DESIGN-101')
            ->has('specialties', 2));
});

it('filters the designer directory by specialty and employment status', function () {
    $manager = User::factory()->admin()->create();
    $specialty = DesignerSpecialty::create(['name' => 'تصميم دعائي']);
    $otherSpecialty = DesignerSpecialty::create(['name' => 'تصميم كتب']);
    $matching = User::factory()->designer()->create(['name' => 'مصمم مطابق']);
    $other = User::factory()->designer()->create(['name' => 'مصمم آخر']);
    $inactive = User::factory()->designer()->create(['name' => 'مصمم معطّل', 'status' => 'INACTIVE']);
    $matching->specialties()->attach($specialty->id);
    $other->specialties()->attach($otherSpecialty->id);
    $inactive->specialties()->attach($specialty->id);

    $this->actingAs($manager)->get('/design/designers?specialty='.$specialty->id.'&status=ACTIVE')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('design/designers')
            ->where('filters.specialty', (string) $specialty->id)
            ->where('filters.status', 'ACTIVE')
            ->has('designers', 1)
            ->where('designers.0.name', 'مصمم مطابق')
            ->has('specialties', 2));
});
