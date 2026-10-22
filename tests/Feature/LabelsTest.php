<?php

use App\Enums\PaymentMethod;
use App\Models\Customer;
use App\Models\User;
use App\Support\Auth\Permissions;
use App\Support\Labels;

it('has an Arabic label for every audit action recorded anywhere in the code', function () {
    $codes = [];
    foreach (new RecursiveIteratorIterator(new RecursiveDirectoryIterator(app_path())) as $f) {
        if ($f->getExtension() !== 'php') {
            continue;
        }
        // أي سطر فيه record( يُستخرج منه كل كود بصيغة module.action (يشمل الشرطي ؟: والمتغيرات الثابتة)
        foreach (file($f->getPathname()) as $line) {
            if (str_contains($line, 'record(') && preg_match_all("/'([a-z_]+\.[a-z_]+)'/", $line, $m)) {
                array_push($codes, ...$m[1]);
            }
        }
    }
    $missing = array_values(array_filter(array_unique($codes), fn ($c) => ! isset(Labels::ACTIONS[$c])));
    expect($missing)->toBe([]);
});

it('labels are Arabic (no Latin letters) for actions, entities, fields, values and payment methods', function () {
    foreach ([...Labels::ACTIONS, ...Labels::ENTITIES, ...array_filter(Labels::FIELDS, fn ($v, $k) => ! str_contains($v, 'MB'), ARRAY_FILTER_USE_BOTH), ...Labels::VALUES, ...PaymentMethod::labels()] as $label) {
        expect(preg_match('/[A-Za-z]/', $label))->toBe(0, "تسمية غير معرّبة: {$label}");
    }
});

it('translates field values: money, methods, statuses', function () {
    expect(Labels::translateValue('amount_minor', 12550))->toBe('125.50 ج.م')
        ->and(Labels::translateValue('payments.methods', 'CASH,WALLET'))->toBe('نقدًا، محفظة إلكترونية')
        ->and(Labels::translateValue('status', 'IN_PRINTING'))->toBe('قيد الطباعة')
        ->and(Labels::role('SUPER_ADMIN'))->toBe('المدير العام');
});

it('every permission and permission group has an Arabic label', function () {
    foreach (Permissions::CATALOG as $group => $perms) {
        foreach ($perms as $code => $label) {
            expect(preg_match('/[A-Za-z]/', $label))->toBe(0, "صلاحية غير معرّبة: {$code} = {$label}");
        }
    }
});

it('shares the shop name from settings and applies it everywhere after a change', function () {
    $a = User::factory()->superAdmin()->create();
    $this->actingAs($a)->patch('/settings/system', ['values' => ['shop.name' => 'مكتبة عنتر']])->assertRedirect();
    $this->get('/dashboard')->assertInertia(fn ($p) => $p->where('name', 'مكتبة عنتر'));
});

it('only enabled payment methods are accepted for new payments', function () {
    $a = User::factory()->superAdmin()->create();
    $this->actingAs($a)->patch('/settings/system', ['values' => ['payments.methods' => 'CASH']])->assertRedirect();
    expect(array_keys(PaymentMethod::enabled()))->toBe(['CASH']);
    $this->patch('/settings/system', ['values' => ['payments.methods' => '']], ['Accept' => 'application/json'])->assertStatus(422);
    $c = Customer::factory()->create();
    $this->postJson('/accounting/payments', ['customer_id' => $c->id, 'amount_minor' => 100, 'method' => 'CARD'], ['Idempotency-Key' => 'm1'])->assertStatus(422);
});
