<?php

namespace App\Http\Controllers\Operations;

use App\Http\Controllers\Controller;
use App\Services\Finance\PaymentProofService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

/** S-052-01/02 — طابور إثباتات الدفع ومراجعتها (المراجعة في نافذة داخل نفس الصفحة). */
class PaymentProofController extends Controller
{
    private const METHODS = ['CASH' => 'نقدًا', 'BANK_TRANSFER' => 'تحويل بنكي', 'WALLET' => 'محفظة إلكترونية', 'CARD' => 'بطاقة'];

    public function index(Request $request): Response
    {
        Gate::authorize('payments.proofs.review');
        $status = in_array($request->query('status'), ['PENDING', 'APPROVED', 'REJECTED'], true) ? $request->query('status') : 'PENDING';
        $rows = DB::table('payment_proofs as p')->join('orders as o', 'o.id', '=', 'p.order_id')->join('customers as c', 'c.id', '=', 'p.customer_id')->join('files as f', 'f.id', '=', 'p.file_id')
            ->where('p.status', $status)
            ->when($request->query('q'), fn ($b, $t) => $b->where(fn ($w) => $w->where('c.name', 'like', "%{$t}%")->orWhere('o.order_number', 'like', "%{$t}%")))
            ->when(array_key_exists((string) $request->query('method'), self::METHODS), fn ($b) => $b->where('p.method', $request->query('method')))
            ->orderByDesc('p.id')->select('p.*', 'o.order_number', 'o.id as oid', 'c.name as customer', 'f.mime_type', 'f.original_filename')->paginate(15)->withQueryString()
            ->through(fn ($r) => [
                'id' => $r->id, 'number' => 'PRF-'.str_pad((string) $r->id, 4, '0', STR_PAD_LEFT), 'customer' => $r->customer, 'order' => $r->order_number, 'order_id' => $r->oid,
                'amount_minor' => (int) $r->claimed_amount, 'method' => self::METHODS[$r->method] ?? $r->method, 'at' => Carbon::parse($r->created_at)->toIso8601String(), 'status' => $r->status,
                'file_id' => $r->file_id, 'file_name' => $r->original_filename, 'is_image' => str_starts_with($r->mime_type, 'image/'), 'reference' => $r->reference, 'reject_reason' => $r->reject_reason,
            ]);
        $counts = DB::table('payment_proofs')->selectRaw('status, count(*) c')->groupBy('status')->pluck('c', 'status');

        return Inertia::render('operations/proofs', [
            'proofs' => $rows, 'status' => $status, 'filters' => $request->only(['q', 'method']), 'methods' => self::METHODS,
            'counts' => ['PENDING' => (int) ($counts['PENDING'] ?? 0), 'APPROVED' => (int) ($counts['APPROVED'] ?? 0), 'REJECTED' => (int) ($counts['REJECTED'] ?? 0)],
        ]);
    }

    public function approve(Request $request, int $id, PaymentProofService $svc): RedirectResponse
    {
        $d = $request->validate(['amount_minor' => ['nullable', 'integer', 'min:1']]);
        $svc->approve($request->user(), $id, isset($d['amount_minor']) ? (int) $d['amount_minor'] : null);

        return back()->with('success', 'تم اعتماد الإثبات وتسجيل الدفعة.');
    }

    public function reject(Request $request, int $id, PaymentProofService $svc): RedirectResponse
    {
        $d = $request->validate(['reason' => ['required', 'string', 'max:255']], ['reason.required' => 'سبب الرفض إلزامي.']);
        $svc->reject($request->user(), $id, $d['reason']);

        return back()->with('success', 'تم رفض الإثبات.');
    }
}
