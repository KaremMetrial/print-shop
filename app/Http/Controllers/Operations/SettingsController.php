<?php

namespace App\Http\Controllers\Operations;

use App\Enums\PaymentMethod;
use App\Http\Controllers\Controller;
use App\Services\Audit\AuditService;
use App\Services\Settings\Settings;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/** الإعدادات (S-068..076): مفاتيح معروفة فقط، لكل مجموعة صلاحيتها، والتعديل مُدقَّق. */
class SettingsController extends Controller
{
    private const PERM = ['general' => 'settings.general.manage', 'orders' => 'settings.orders.manage', 'payments' => 'settings.payments.manage', 'files' => 'settings.files.manage'];

    public function index(Request $request, Settings $s): Response
    {
        $u = $request->user();
        $groups = array_filter(self::PERM, fn ($p) => $u->hasPermission($p));
        abort_if(! $groups, 403);
        $fields = [];
        foreach (Settings::DEFAULTS as $k => $m) {
            if (isset($groups[$m['group']])) {
                $fields[] = ['key' => $k, 'label' => $m['label'], 'group' => $m['group'], 'type' => $m['type'], 'value' => $s->get($k)];
            }
        }

        return Inertia::render('operations/settings', ['fields' => $fields, 'groups' => array_keys($groups), 'methods' => PaymentMethod::labels()]);
    }

    public function update(Request $request, Settings $s, AuditService $audit): RedirectResponse
    {
        $u = $request->user();
        $in = $request->validate(['values' => ['required', 'array']])['values'];
        $old = [];
        $new = [];
        foreach ($in as $k => $v) {
            $meta = Settings::DEFAULTS[$k] ?? null;
            abort_if(! $meta || ! $u->hasPermission(self::PERM[$meta['group']]), 403);
            if ($meta['type'] === 'int') {
                abort_unless(is_numeric($v) && (int) $v >= 0, 422, 'قيمة رقمية غير صالحة.');
            }
            if ($meta['type'] === 'status_label') {
                abort_unless(($v === null || is_string($v)) && mb_strlen(trim((string) $v)) <= 40, 422, 'مسمى الحالة يجب ألا يتجاوز 40 حرفًا.');
                $v = trim((string) $v);
            }
            if ($meta['type'] === 'methods') {
                $codes = array_values(array_unique(array_filter(array_map('trim', explode(',', (string) $v)))));
                abort_if($codes === [] || array_diff($codes, array_keys(PaymentMethod::labels())) !== [], 422, 'اختر طريقة دفع واحدة على الأقل من الطرق المتاحة.');
                $v = implode(',', $codes);
            }
            if ($k === 'shop.name') {
                abort_if(trim((string) $v) === '', 422, 'اسم المطبعة مطلوب.');
            }
            $cur = $s->get($k);
            if ((string) $v !== $cur) {
                $old[$k] = $cur;
                $new[$k] = (string) $v;
                $s->set($k, (string) $v, $u->id);
            }
        }
        if ($new) {
            $audit->record('settings.updated', null, $old, $new);
        }

        return back()->with('success', 'تم حفظ الإعدادات.');
    }
}
