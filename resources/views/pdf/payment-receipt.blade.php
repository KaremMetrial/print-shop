<!doctype html>
<html dir="rtl" lang="ar"><head><meta charset="utf-8"><style>
body{font-family:dejavusans;font-size:11pt;color:#0F172A;direction:rtl}h1{font-size:18pt;margin:0}h2{font-size:13pt;margin:14px 0 4px}
.box{background:#EFF6FF;padding:10px;margin-top:10px}.big{font-size:20pt;font-weight:bold}.muted{color:#64748B;font-size:9pt}
table{width:100%;border-collapse:collapse}td,th{border:1px solid #E2E8F0;padding:6px;text-align:right}th{background:#F1F5F9}
</style></head><body>
<h1>{{ $shop }}</h1><div class="muted">إيصال دفع — {{ $payment['number'] }} @if($payment['status']!=='CONFIRMED') • (ملغاة — الإيصال التاريخي محفوظ) @endif</div>
<h2>بيانات العميل</h2><div>{{ $payment['customer']['name'] }}<br>{{ $payment['customer']['phone'] }}</div>
<div class="box"><div>المبلغ المستلم</div><div class="big">{{ number_format($payment['amount_minor']/100, 2) }} ج.م</div><div>طريقة الدفع: {{ $payment['method'] }} • {{ \Illuminate\Support\Carbon::parse($payment['at'])->format('Y-m-d H:i') }}</div></div>
<h2>توزيع الدفعة</h2>
<table><tr><th>الأوردر</th><th>المبلغ الموزع</th></tr>@foreach($allocations as $a)<tr><td>{{ $a['order'] }}</td><td>{{ number_format($a['amount_minor']/100, 2) }} ج.م</td></tr>@endforeach</table>
<p class="muted">عند تصحيح العملية لاحقًا يبقى الإيصال التاريخي محفوظًا وتظهر حالته. هذا إيصال مبلغ مستلم مؤكد، وليس فاتورة.</p>
</body></html>
