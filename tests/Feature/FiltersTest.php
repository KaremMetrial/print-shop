<?php

use App\Enums\OrderStatus;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderRequest;
use App\Models\PricingTier;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\User;
use Illuminate\Testing\TestResponse;
use Inertia\Testing\AssertableInertia as Assert;

TestResponse::macro('inertiaProps', function (string $key) {
    $v = null;
    $this->assertInertia(function (Assert $p) use ($key, &$v) {
        $v = $p->toArray()['props'][$key];
    });

    return $v;
});

function totalOf(string $url, string $path): int
{
    $r = test()->get($url)->assertOk();
    $v = null;
    $r->assertInertia(function (Assert $p) use ($path, &$v) {
        $v = $p->toArray()['props'];
        foreach (explode('.', $path) as $k) {
            $v = $v[$k];
        }
        $v = is_array($v) && isset($v['total']) ? $v['total'] : $v;
    });

    return (int) $v;
}

it('filters customers by search, tier, access and balance', function () {
    $this->actingAs(User::factory()->admin()->create());
    $gold = PricingTier::create(['name' => 'ذهبية', 'mode' => 'PERCENTAGE', 'discount_percentage' => 10]);
    Customer::factory()->create(['name' => 'شركة النور', 'pricing_tier_id' => $gold->id, 'platform_access_enabled' => true]);
    Customer::factory()->create(['name' => 'مقهى ورد']);
    expect(totalOf('/customers', 'customers.total'))->toBe(2);
    expect(totalOf('/customers?q=النور', 'customers.total'))->toBe(1);
    expect(totalOf("/customers?tier={$gold->id}", 'customers.total'))->toBe(1);
    expect(totalOf('/customers?access=enabled', 'customers.total'))->toBe(1);
    expect(totalOf('/customers?access=disabled', 'customers.total'))->toBe(1);
    expect(totalOf('/customers?added=1', 'customers.total'))->toBe(2);
});

it('filters customers by outstanding balance', function () {
    $this->actingAs(User::factory()->admin()->create());
    $owes = Customer::factory()->create();
    Customer::factory()->create();
    Order::factory()->create(['customer_id' => $owes->id, 'grand_total' => 1000, 'subtotal' => 1000]);
    expect(totalOf('/customers?balance=due', 'customers.total'))->toBe(1);
    expect(totalOf('/customers?balance=clear', 'customers.total'))->toBe(1);
});

it('filters employees by search, role, status and availability', function () {
    $this->actingAs(User::factory()->admin()->create());
    User::factory()->designer()->create(['name' => 'منى المصممة']);
    User::factory()->dataEntry()->create(['name' => 'سارة', 'status' => 'INACTIVE']);
    $all = totalOf('/employees', 'employees.total');
    expect(totalOf('/employees?q=منى', 'employees.total'))->toBe(1);
    expect(totalOf('/employees?status=INACTIVE', 'employees.total'))->toBe(1);
    expect(totalOf('/employees?role=DESIGNER', 'employees.total'))->toBe(1);
    expect(totalOf('/employees?availability=ON_LEAVE', 'employees.total'))->toBeLessThan($all);
});

it('filters products by search, category, status', function () {
    $this->actingAs(User::factory()->admin()->create());
    $cat = ProductCategory::create(['name' => 'ورقية']);
    Product::factory()->create(['name' => 'فلاير', 'category_id' => $cat->id]);
    Product::factory()->create(['name' => 'بانر', 'is_active' => false]);
    expect(totalOf('/products?q=فلاير', 'products.total'))->toBe(1);
    expect(totalOf("/products?category={$cat->id}", 'products.total'))->toBe(1);
    expect(totalOf('/products?status=inactive', 'products.total'))->toBe(1);
    expect(totalOf('/products?status=active', 'products.total'))->toBe(1);
});

it('filters price tiers by search, status and mode', function () {
    $this->actingAs(User::factory()->admin()->create());
    PricingTier::create(['name' => 'فضية', 'mode' => 'FIXED_BASE', 'is_active' => false]);
    PricingTier::create(['name' => 'ذهبية', 'mode' => 'PERCENTAGE', 'discount_percentage' => 5]);
    $all = totalOf('/pricing', 'tiers.total');
    expect(totalOf('/pricing?q=فضية', 'tiers.total'))->toBe(1);
    expect(totalOf('/pricing?status=inactive', 'tiers.total'))->toBe(1);
    expect(totalOf('/pricing?mode=FIXED_BASE', 'tiers.total'))->toBe(1)->and($all)->toBeGreaterThanOrEqual(3);
});

it('filters orders by search, status and delivery', function () {
    $this->actingAs(User::factory()->admin()->create());
    $c = Customer::factory()->create(['name' => 'شركة الأفق']);
    Order::factory()->create(['customer_id' => $c->id, 'delivery_method' => 'DELIVERY']);
    Order::factory()->create(['status' => OrderStatus::IN_PRINTING]);
    expect(totalOf('/orders', 'orders.total'))->toBe(2);
    expect(totalOf('/orders?q=الأفق', 'orders.total'))->toBe(1);
    expect(totalOf('/orders?status=IN_PRINTING', 'orders.total'))->toBe(1);
    expect(totalOf('/orders?delivery=DELIVERY', 'orders.total'))->toBe(1);
});

it('filters order requests by tab, search and reviewer', function () {
    $u = User::factory()->admin()->create();
    $this->actingAs($u);
    $c = Customer::factory()->create(['name' => 'شركة الأفق']);
    OrderRequest::factory()->create(['customer_id' => $c->id]);
    OrderRequest::factory()->create(['status' => 'IN_REVIEW', 'reviewer_id' => $u->id]);
    expect(totalOf('/order-requests', 'requests.total'))->toBe(1);
    expect(totalOf('/order-requests?q=الأفق', 'requests.total'))->toBe(1);
    expect(totalOf('/order-requests?q=لا-شيء', 'requests.total'))->toBe(0);
    expect(totalOf('/order-requests?tab=IN_REVIEW', 'requests.total'))->toBe(1);
    expect(totalOf("/order-requests?tab=IN_REVIEW&reviewer={$u->id}", 'requests.total'))->toBe(1);
    expect(totalOf('/order-requests?tab=ACCEPTED', 'requests.total'))->toBe(0);
});

it('paginates every list at 15 per page, keeps filters in links, and handles out-of-range pages', function () {
    $this->actingAs(User::factory()->admin()->create());
    Customer::factory()->count(17)->create(['name' => 'عميل اختبار']);
    Product::factory()->count(17)->create();
    Order::factory()->count(17)->create();
    foreach (range(1, 16) as $i) {
        PricingTier::create(['name' => "شريحة {$i}", 'mode' => 'PERCENTAGE', 'discount_percentage' => 1]);
    }
    User::factory()->count(16)->dataEntry()->create();
    OrderRequest::factory()->count(17)->create();
    foreach (['/customers' => 'customers', '/products' => 'products', '/orders' => 'orders', '/order-requests' => 'requests', '/pricing' => 'tiers', '/employees' => 'employees'] as $url => $key) {
        $p1 = test()->get($url)->assertOk()->inertiaProps($key);
        expect($p1['total'])->toBeGreaterThanOrEqual(17)->and(count($p1['data']))->toBe(15)->and($p1['last_page'])->toBe((int) ceil($p1['total'] / 15));
        $p2 = test()->get("{$url}?page=2")->assertOk()->inertiaProps($key);
        expect(count($p2['data']))->toBe(min(15, $p1['total'] - 15))->and($p2['current_page'])->toBe(2);
        // لا تكرار بين الصفحتين
        expect(array_intersect(array_column($p1['data'], 'id'), array_column($p2['data'], 'id')))->toBe([]);
        // صفحة خارج النطاق ترجع قائمة فارغة بدون خطأ
        expect(count(test()->get("{$url}?page=99")->assertOk()->inertiaProps($key)['data']))->toBe(0);
    }
    $next = test()->get('/customers?q=اختبار')->inertiaProps('customers');
    expect($next['next_page_url'])->toContain('q=')->and($next['total'])->toBe(17)->and($next['last_page'])->toBe(2);
});
