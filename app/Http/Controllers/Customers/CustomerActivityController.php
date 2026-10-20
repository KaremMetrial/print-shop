<?php

namespace App\Http\Controllers\Customers;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Customer;
use App\Models\User;
use App\Support\Labels;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

/** S-032 — سجل نشاط العميل (للقراءة فقط). تفاصيل الأحداث المالية مقيّدة بصلاحية. */
class CustomerActivityController extends Controller
{
    private const LABELS = [
        'customer.created' => 'إضافة عميل',
        'customer.updated' => 'تحديث ملف العميل',
        'customer.tier_changed' => 'تغيير شريحة السعر',
        'customer.platform_access_enabled' => 'تفعيل دخول المنصة',
        'customer.platform_access_disabled' => 'إيقاف دخول المنصة',
        'customer.password_reset' => 'إعادة تعيين كلمة المرور',
    ];

    public function __invoke(Request $request, Customer $customer, CustomerController $profile): Response
    {
        Gate::authorize('view', $customer);

        $q = AuditLog::query()->where('entity_type', $customer->getMorphClass())->where('entity_id', $customer->id)->latest('id');
        if ($request->query('actor')) {
            $q->where('actor_id', $request->query('actor'));
        }
        if ($request->query('type')) {
            $q->where('action', $request->query('type'));
        }
        $days = (int) ($request->query('days') ?: 90);
        $q->where('created_at', '>=', now()->subDays($days));

        $actorIds = AuditLog::where('entity_type', $customer->getMorphClass())->where('entity_id', $customer->id)->whereNotNull('actor_id')->distinct()->pluck('actor_id');
        $names = User::whereIn('id', $actorIds)->pluck('name', 'id');
        $page = $q->paginate(5)->withQueryString()->through(fn (AuditLog $l) => [
            'id' => $l->id,
            'action' => self::LABELS[$l->action] ?? $l->action,
            'summary' => $this->summary($l, $customer),
            'ref' => $customer->code(),
            'old' => Labels::fields($l->old_values ?: null),
            'new' => Labels::fields($l->new_values ?: null),
            'reason' => $l->reason,
            'at' => $l->created_at->toIso8601String(),
            'actor' => $l->actor_id ? ($names[$l->actor_id] ?? '—') : 'النظام',
        ]);

        return Inertia::render('customers/activity', [
            'customer' => $profile->profile($customer, $request),
            'activity' => $page,
            'filters' => ['actor' => $request->query('actor'), 'type' => $request->query('type'), 'days' => (string) $days],
            'actors' => $names->map(fn ($n, $id) => ['value' => (string) $id, 'label' => $n])->values(),
            'types' => collect(self::LABELS)->map(fn ($l, $k) => ['value' => $k, 'label' => $l])->values(),
        ]);
    }

    private function summary(AuditLog $l, Customer $c): string
    {
        $new = $l->new_values ?? [];
        $old = $l->old_values ?? [];

        return match ($l->action) {
            'customer.created' => 'تم إنشاء ملف العميل',
            'customer.tier_changed' => 'تغيير شريحة السعر',
            'customer.updated' => 'تم تحديث '.implode(' و', array_map(fn ($k) => ['name' => 'الاسم', 'phone' => 'الهاتف', 'address' => 'العنوان', 'notes' => 'الملاحظات', 'notification_mode' => 'طريقة الإشعار'][$k] ?? $k, array_keys($new))),
            'customer.platform_access_enabled' => 'تفعيل الحساب للهاتف المسجل',
            'customer.platform_access_disabled' => 'إيقاف الدخول مع الحفاظ على سجل الحساب',
            'customer.password_reset' => 'إصدار كلمة مرور مؤقتة',
            default => '—',
        };
    }
}
