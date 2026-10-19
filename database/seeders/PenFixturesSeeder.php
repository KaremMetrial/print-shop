<?php

namespace Database\Seeders;

use App\Enums\Role as RoleEnum;
use App\Models\Customer;
use App\Models\CustomerCredential;
use App\Models\PricingTier;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * بيانات عينة مطابقة لما في pendev/untitled.pen — لمقارنة الواجهة بالبكسل في بيئة التطوير فقط.
 * php artisan db:seed --class=PenFixturesSeeder   (يتجاهل الإنتاج)
 */
class PenFixturesSeeder extends Seeder
{
    public function run(): void
    {
        if (app()->isProduction()) {
            return;
        }
        $tier = fn (string $n, string $p) => PricingTier::firstOrCreate(['name' => $n], ['mode' => 'PERCENTAGE', 'discount_percentage' => $p, 'is_active' => true]);
        $gold = $tier('الذهبية', '20');
        $silver = $tier('فضية', '5');
        $default = PricingTier::default();

        $staff = fn (string $name, string $email, RoleEnum $r) => User::updateOrCreate(['email' => $email], ['name' => $name, 'password' => Hash::make('Pbms@12345'), 'role_id' => Role::where('code', $r->value)->first()->id, 'status' => 'ACTIVE', 'email_verified_at' => now()]);
        $mona = $staff('منى إبراهيم', 'mona@pbms.test', RoleEnum::Designer);
        $ahmed = $staff('أحمد حسن', 'ahmed.hassan@pbms.test', RoleEnum::Admin);
        $sara = $staff('سارة عادل', 'sara@pbms.test', RoleEnum::DataEntry);

        $make = function (int $id, string $name, string $phone, PricingTier $t, bool $access, string $date, ?User $by = null, array $extra = []) {
            DB::table('customers')->updateOrInsert(['id' => $id], array_merge([
                'name' => $name, 'phone_normalized' => str_replace(' ', '', $phone), 'phone_display' => $phone, 'pricing_tier_id' => $t->id,
                'platform_access_enabled' => $access, 'notification_mode' => 'MANUAL', 'created_by' => $by?->id, 'created_at' => $date, 'updated_at' => $date,
            ], $extra));

            return Customer::find($id);
        };
        $noor = $make(104, 'شركة النور للدعاية', '010 2345 6789', $gold, true, '2024-06-12 09:00:00', $mona, ['address' => 'مدينة نصر، القاهرة — شارع مصطفى النحاس', 'notes' => 'عميل دائم؛ يُفضّل اعتماد عينة الألوان قبل الطباعة.']);
        CustomerCredential::updateOrCreate(['customer_id' => 104], ['password_hash' => Hash::make('Fixture-0000'), 'status' => 'ACTIVE', 'password_created_at' => '2025-05-03 14:30:00', 'last_reset_at' => '2025-05-03 14:30:00', 'last_login_at' => '2025-06-17 18:20:00']);
        $make(105, 'مؤسسة مدار التجارية', '011 8765 4321', $silver, true, '2025-05-28 09:00:00', $sara);
        $make(106, 'مقهى ورد', '012 3456 7890', $default, false, '2025-05-17 09:00:00', $sara);

        // سجل النشاط (S-032) — 42 حدثًا؛ أحدث 5 مطابقة للتصميم
        $hasAudit = DB::table('audit_logs')->where('entity_type', $noor->getMorphClass())->where('entity_id', 104)->exists(); // append-only: لا حذف، نبذر مرة واحدة
        $rows = $hasAudit ? [] : [
            ['customer.updated', ['address' => 'x', 'notification_mode' => 'y'], $ahmed, '2025-06-18 10:15:00'],
            ['customer.tier_changed', ['pricing_tier_id' => $gold->id], $ahmed, '2025-06-12 11:45:00'],
            ['customer.password_reset', [], $ahmed, '2025-05-03 14:30:00'],
            ['customer.platform_access_enabled', [], $sara, '2025-04-20 12:05:00'],
        ];
        foreach ($rows as [$action, $new, $by, $at]) {
            DB::table('audit_logs')->insert(['actor_type' => 'staff', 'actor_id' => $by->id, 'actor_role_snapshot' => $by->roleEnum()?->value, 'entity_type' => $noor->getMorphClass(), 'entity_id' => 104, 'action' => $action, 'new_values' => $new ? json_encode($new) : null, 'created_at' => $at]);
        }
        for ($i = 0; ! $hasAudit && $i < 38; $i++) {
            DB::table('audit_logs')->insert(['actor_type' => 'staff', 'actor_id' => $ahmed->id, 'actor_role_snapshot' => 'ADMIN', 'entity_type' => $noor->getMorphClass(), 'entity_id' => 104, 'action' => 'customer.updated', 'new_values' => json_encode(['notes' => 'x']), 'created_at' => now()->subDays(100 + $i)]);
        }

        $this->catalog($ahmed, $mona, $gold);
        $this->order152($ahmed);
        $this->requests($ahmed, $gold);
        $this->designerTask($mona);
    }

    /** المنتجات والشرائح (S-033…S-037) */
    private function catalog(User $ahmed, User $mona, PricingTier $gold): void
    {
        $now = now();
        $cat = fn (string $n) => DB::table('product_categories')->updateOrInsert(['name' => $n], ['sort_order' => 0, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now]) ?: DB::table('product_categories')->where('name', $n)->value('id');
        $cat('مطبوعات ورقية');
        $cat('مطبوعات دعائية');
        $catId = fn (string $n) => DB::table('product_categories')->where('name', $n)->value('id');
        foreach (['تصميم مطبوعات', 'تصميم إعلاني'] as $sp) {
            DB::table('designer_specialties')->updateOrInsert(['name' => $sp], ['is_active' => true, 'created_at' => $now, 'updated_at' => $now]);
        }
        $spId = fn (string $n) => DB::table('designer_specialties')->where('name', $n)->value('id');

        $products = [
            [1, 'كروت شخصية', 'مطبوعات ورقية', 'تصميم مطبوعات', 200, 100, true, '2025-06-19 09:15:00'],
            [2, 'فلاير', 'مطبوعات ورقية', 'تصميم مطبوعات', 150, 100, true, '2025-06-16 09:15:00'],
            [3, 'بروشور', 'مطبوعات ورقية', 'تصميم مطبوعات', 400, 50, true, '2025-06-12 09:15:00'],
            [4, 'بانر', 'مطبوعات دعائية', 'تصميم إعلاني', 8500, 1, true, '2025-06-10 09:15:00'],
            [5, 'استيكر', 'مطبوعات دعائية', 'تصميم مطبوعات', 75, 100, true, '2025-06-08 09:15:00'],
            [6, 'رول أب', 'مطبوعات دعائية', 'تصميم إعلاني', 42000, 1, false, '2025-06-02 09:15:00'],
            [7, 'بوستر', 'مطبوعات ورقية', 'تصميم مطبوعات', 1200, 10, true, '2025-05-28 09:15:00'],
        ];
        foreach ($products as [$id, $name, $c, $sp, $price, $moq, $active, $at]) {
            DB::table('products')->updateOrInsert(['id' => $id], ['category_id' => $catId($c), 'name' => $name, 'description' => $id === 1 ? 'بطاقات شخصية مطبوعة للاستخدامات المهنية.' : null, 'base_unit_price' => $price, 'minimum_quantity' => $moq, 'required_specialty_id' => $spId($sp), 'is_active' => $active, 'updated_by' => $ahmed->id, 'created_at' => $at, 'updated_at' => $at]);
        }
        $groups = [
            ['SIZE', 'المقاس', 'SINGLE', true, [['9 × 5 سم', 0], ['8.5 × 5.5 سم', 0]]],
            ['PAPER', 'نوع الورق', 'SINGLE', true, [['كوشيه 300 جم', 0], ['كوشيه 350 جم', 0]]],
            ['MATERIAL', 'الخامة', 'MULTIPLE', false, [['ورق كوشيه', 0], ['ورق فاخر', 0]]],
            ['COLOR', 'نظام الألوان', 'SINGLE', true, [['ألوان كاملة', 0]]],
            ['SIDES', 'عدد الأوجه', 'SINGLE', true, [['وجه واحد', 0], ['وجهان', 0]]],
            ['FINISHING', 'التشطيب', 'MULTIPLE', false, [['بدون', 0], ['مطفي', 50], ['لامع', 40]]],
        ];
        DB::table('product_option_groups')->where('product_id', 1)->delete();
        foreach ($groups as $i => [$code, $name, $type, $req, $vals]) {
            $gid = DB::table('product_option_groups')->insertGetId(['product_id' => 1, 'code' => $code, 'name' => $name, 'selection_type' => $type, 'is_required' => $req, 'sort_order' => $i + 1, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now]);
            foreach ($vals as $j => [$vn, $add]) {
                DB::table('product_option_values')->insert(['option_group_id' => $gid, 'name' => $vn, 'unit_price_addition' => $add, 'sort_order' => $j + 1, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now]);
            }
        }
        // upsert (لا حذف) كي تبقى معرّفات المجموعات ثابتة لمانيفست المقارنة
        $group = function (int $pid, string $code, string $name, string $type, bool $req, int $order, array $vals) use ($now) {
            DB::table('product_option_groups')->updateOrInsert(['product_id' => $pid, 'code' => $code], ['name' => $name, 'selection_type' => $type, 'is_required' => $req, 'sort_order' => $order, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now]);
            $gid = DB::table('product_option_groups')->where('product_id', $pid)->where('code', $code)->value('id');
            foreach ($vals as $j => [$vn, $add]) {
                DB::table('product_option_values')->updateOrInsert(['option_group_id' => $gid, 'name' => $vn], ['unit_price_addition' => $add, 'sort_order' => $j + 1, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now]);
            }
        };
        // مجموعة «التغليف» كما في S-035 (منتج 3)
        $group(3, 'FINISHING', 'التغليف', 'SINGLE', true, 1, [['بدون تغليف', 0], ['تغليف مطفي', 50], ['تغليف لامع', 40]]);
        // مواصفات المنتجين 2 و3 لمعالج الأوردر (S-011)
        foreach ([2, 3] as $pid) {
            $group($pid, 'SIZE', 'المقاس', 'SINGLE', true, 2, [['A4', 0]]);
            $group($pid, 'PAPER', 'نوع الورق', 'SINGLE', true, 3, [['كوشيه 300 جم', 0]]);
            $group($pid, 'SIDES', 'عدد الأوجه', 'SINGLE', true, 4, [['وجه واحد', 0], ['وجهان', 0]]);
        }

        $special = DB::table('pricing_tiers')->updateOrInsert(['name' => 'أسعار خاصة'], ['mode' => 'FIXED_BASE', 'is_active' => true, 'created_at' => $now, 'updated_at' => $now]);
        $tid = DB::table('pricing_tiers')->where('name', 'أسعار خاصة')->value('id');
        foreach ([[1, 180], [2, 140], [3, 380]] as [$pid, $minor]) {
            DB::table('tier_product_prices')->updateOrInsert(['tier_id' => $tid, 'product_id' => $pid], ['base_unit_price_override' => $minor, 'created_at' => $now, 'updated_at' => $now]);
        }
        $hasProductAudit = DB::table('audit_logs')->where('entity_type', 'App\\Models\\Product')->where('entity_id', 1)->exists();
        foreach ($hasProductAudit ? [] : [
            ['product.created', null, ['name' => 'كروت شخصية'], $ahmed, '2025-06-18 09:15:00'],
            ['product.price_changed', ['base_unit_price' => 180], ['base_unit_price' => 200], $ahmed, '2025-06-18 10:20:00'],
            ['product.option_group_updated', null, ['group' => 'التشطيب'], $mona, '2025-06-18 11:05:00'],
            ['product.status_changed', ['is_active' => false], ['is_active' => true], $ahmed, '2025-06-19 08:40:00'],
        ] as [$a, $old, $new, $by, $at]) {
            DB::table('audit_logs')->insert(['actor_type' => 'staff', 'actor_id' => $by->id, 'actor_role_snapshot' => 'ADMIN', 'entity_type' => 'App\\Models\\Product', 'entity_id' => 1, 'action' => $a, 'old_values' => $old ? json_encode($old) : null, 'new_values' => json_encode($new), 'created_at' => $at]);
        }
    }

    /** أوردر ORD-0152 كما في S-012 (3 بنود، خصم 10%، توصيل 100 ج.م) */
    private function order152(User $ahmed): void
    {
        $now = now();
        DB::table('orders')->updateOrInsert(['id' => 152], [
            'order_number' => 'ORD-0152', 'customer_id' => 104, 'source' => 'STAFF_CREATED', 'status' => 'DESIGN_STAGE', 'delivery_method' => 'DELIVERY',
            'delivery_address' => '12 شارع الطيران، مدينة نصر، القاهرة', 'printing_eta_days' => 2, 'subtotal' => 292000, 'discount_type' => 'PERCENT', 'discount_value' => 10,
            'discount_amount' => 29200, 'delivery_fee' => 10000, 'grand_total' => 272800, 'notes' => 'تسليم العينة بعد اعتماد آخر بند.', 'created_by' => $ahmed->id,
            'created_at' => '2025-06-18 09:15:00', 'updated_at' => '2025-06-18 12:05:00',
        ]);
        foreach ([[1, 1000, 200, 'كروت شخصية', '9 × 5 سم', true], [2, 500, 120, 'فلاير', 'A4', true], [3, 100, 320, 'بروشور', 'A4', false]] as [$pid, $qty, $unit, $name, $spec, $approved]) {
            DB::table('order_items')->updateOrInsert(['order_id' => 152, 'product_id' => $pid], [
                'product_snapshot' => json_encode(['id' => $pid, 'name' => $name], JSON_UNESCAPED_UNICODE), 'options_snapshot' => json_encode([['value' => $spec]], JSON_UNESCAPED_UNICODE),
                'quantity' => $qty, 'base_unit_price' => $unit, 'options_unit_price' => 0, 'tier_adjustment' => 0, 'unit_price' => $unit, 'item_total' => $unit * $qty,
                'approved_at' => $approved ? '2025-06-18 10:45:00' : null, 'created_at' => '2025-06-18 09:15:00', 'updated_at' => '2025-06-18 11:30:00',
            ]);
        }
    }

    /** طلبات الأوردرات S-019..021 (عميل CUS-0220) — حالة لكل شاشة */
    private function requests(User $ahmed, PricingTier $gold): void
    {
        DB::table('customers')->updateOrInsert(['id' => 220], [
            'name' => 'شركة الأفق للإعلان', 'phone_normalized' => '01012345678', 'phone_display' => '010 1234 5678', 'pricing_tier_id' => $gold->id,
            'platform_access_enabled' => true, 'notification_mode' => 'MANUAL', 'created_by' => $ahmed->id, 'created_at' => '2026-06-12 09:00:00', 'updated_at' => '2026-06-12 09:00:00',
        ]);
        DB::table('orders')->updateOrInsert(['id' => 153], [
            'order_number' => 'ORD-0153', 'customer_id' => 220, 'source' => 'ACCEPTED_REQUEST', 'status' => 'DESIGN_STAGE', 'delivery_method' => 'PICKUP', 'subtotal' => 260000, 'grand_total' => 260000,
            'created_by' => $ahmed->id, 'created_at' => '2026-10-14 11:18:00', 'updated_at' => '2026-10-14 11:18:00',
        ]);
        foreach ([[186, 'PENDING', 1000, 300], [187, 'IN_REVIEW', 1000, 500], [188, 'ACCEPTED', 1000, 500], [189, 'REJECTED', 1000, 500]] as [$id, $st, $q1, $q2]) {
            DB::table('order_requests')->updateOrInsert(['id' => $id], [
                'request_number' => 'REQ-0'.$id, 'customer_id' => 220, 'status' => $st, 'delivery_method' => 'PICKUP', 'submitted_at' => '2026-10-14 10:20:00',
                'reviewer_id' => $st === 'PENDING' ? null : $ahmed->id, 'review_started_at' => $st === 'PENDING' ? null : '2026-10-14 11:00:00',
                'decided_at' => in_array($st, ['ACCEPTED', 'REJECTED'], true) ? '2026-10-14 11:18:00' : null, 'decided_by' => in_array($st, ['ACCEPTED', 'REJECTED'], true) ? $ahmed->id : null,
                'reject_reason' => $st === 'REJECTED' ? 'المواصفات المطلوبة غير متاحة' : null, 'order_id' => $st === 'ACCEPTED' ? 153 : null, 'created_at' => '2026-10-14 10:20:00', 'updated_at' => '2026-10-14 10:20:00',
            ]);
            foreach ([[1, $q1, $q1], [2, $q2, 300]] as [$pid, $qty, $orig]) {
                DB::table('order_request_items')->updateOrInsert(['order_request_id' => $id, 'product_id' => $pid], ['quantity' => $qty, 'original_quantity' => $orig, 'options' => '{}', 'created_at' => '2026-10-14 10:20:00', 'updated_at' => '2026-10-14 10:20:00']);
            }
        }
    }

    /** مهمة منى إبراهيم (ORD-0161 / ITEM-161-01) لشاشات المصمم S-043..045 */
    private function designerTask(User $mona): void
    {
        DB::table('designer_availability')->updateOrInsert(['designer_id' => $mona->id], ['status' => 'AVAILABLE', 'updated_at' => now()]);
        DB::table('orders')->updateOrInsert(['id' => 161], [
            'order_number' => 'ORD-0161', 'customer_id' => 104, 'source' => 'STAFF_CREATED', 'status' => 'DESIGN_STAGE', 'delivery_method' => 'PICKUP', 'subtotal' => 15000, 'grand_total' => 15000,
            'created_at' => '2026-10-17 10:00:00', 'updated_at' => '2026-10-17 10:16:00',
        ]);
        DB::table('order_items')->updateOrInsert(['order_id' => 161, 'product_id' => 2], [
            'product_snapshot' => json_encode(['id' => 2, 'name' => 'فلاير'], JSON_UNESCAPED_UNICODE), 'options_snapshot' => json_encode([['group' => 'المقاس', 'value' => 'A5']], JSON_UNESCAPED_UNICODE), 'quantity' => 1000,
            'base_unit_price' => 15, 'unit_price' => 15, 'item_total' => 15000, 'designer_id' => $mona->id, 'design_state' => 'IN_DESIGN', 'created_at' => '2026-10-17 10:00:00', 'updated_at' => '2026-10-17 10:16:00',
        ]);
        $itemId = DB::table('order_items')->where('order_id', 161)->where('product_id', 2)->value('id');
        DB::table('design_versions')->updateOrInsert(['order_item_id' => $itemId, 'version_no' => 1], ['status' => 'DRAFT', 'created_by' => $mona->id, 'created_at' => '2026-10-17 10:20:00', 'updated_at' => '2026-10-17 10:20:00']);
    }
}
