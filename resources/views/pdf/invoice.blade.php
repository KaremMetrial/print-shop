<!doctype html>
<html dir="rtl" lang="ar"><head><meta charset="utf-8"><style>
body{font-family:dejavusans;font-size:11pt;color:#0F172A;direction:rtl}h1{font-size:18pt;margin:0}h2{font-size:13pt;margin:12px 0 4px}
.muted{color:#64748B;font-size:9pt}.box{background:#F8FAFC;padding:10px;margin-top:8px}table{width:100%;border-collapse:collapse;margin-top:8px}
th{background:#F1F5F9;color:#475569;text-align:right;padding:6px;border:1px solid #E2E8F0}td{padding:6px;border:1px solid #E2E8F0;text-align:right}.tot td{border:none}.big{font-size:14pt;font-weight:bold}
</style></head><body>
@php($s = $i['snapshot'])@php($m = fn ($v) => number_format($v / 100, 2).' ج.م')
<h1>{{ $s['shop']['name'] }}</h1>
<div class="muted">{{ $s['shop']['branch'] }} @if($s['shop']['phone']) • {{ $s['shop']['phone'] }} @endif</div>
<h2>فاتورة أوردر {{ $s['order_number'] }}</h2>
<div class="muted">رقم الفاتورة {{ $i['number'] }} • {{ \Illuminate\Support\Carbon::parse($i['issued_at'])->format('Y-m-d H:i') }} • الحالة: {{ $i['status_label'] }} @if($i['status']==='VOIDED') — {{ $i['void_reason'] }} @endif • فاتورة داخلية وليست ضريبية</div>
<div class="box"><b>بيانات العميل</b><br>{{ $s['customer']['name'] }} • {{ $s['customer']['phone'] }}<br>{{ $s['customer']['address'] }}</div>
<table><tr><th>المنتج</th><th>الكمية</th><th>سعر الوحدة</th><th>الإجمالي</th></tr>
@foreach($s['items'] as $it)<tr><td>{{ $it['name'] }}@if($it['specs'])<br><span class="muted">{{ $it['specs'] }}</span>@endif</td><td>{{ $it['quantity'] }}</td><td>{{ $m($it['unit_minor']) }}</td><td>{{ $m($it['total_minor']) }}</td></tr>@endforeach</table>
<div class="box"><table class="tot">
<tr><td>إجمالي البنود</td><td>{{ $m($s['subtotal_minor']) }}</td></tr>
<tr><td>الخصم</td><td>{{ $m($s['discount_minor']) }}</td></tr>
<tr><td>رسوم التوصيل</td><td>{{ $m($s['delivery_fee_minor']) }}</td></tr>
<tr><td class="big">الإجمالي النهائي</td><td class="big">{{ $m($s['grand_total_minor']) }}</td></tr>
<tr><td>المدفوع المؤكد وقت الإصدار</td><td>{{ $m($s['paid_minor']) }}</td></tr>
<tr><td>المتبقي وقت الإصدار</td><td>{{ $m(max(0, $s['grand_total_minor'] - $s['paid_minor'])) }}</td></tr></table></div>
<p class="muted">هذه وثيقة فاتورة داخلية. لا تمثل إثبات دفع.</p>
</body></html>
