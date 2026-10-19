<!doctype html>
<html dir="rtl" lang="ar"><head><meta charset="utf-8"><style>
body{font-family:dejavusans;font-size:11pt;color:#0F172A;direction:rtl}
h1{font-size:18pt;color:#2563EB;margin:0}.muted{color:#64748B;font-size:9pt}
table{width:100%;border-collapse:collapse;margin-top:10px}th{background:#F1F5F9;color:#475569;text-align:right;padding:6px;border:1px solid #E2E8F0}
td{padding:6px;border:1px solid #E2E8F0;text-align:right}.k{color:#64748B;width:30%}
</style></head><body>
<h1>{{ $shop }}</h1>
<div class="muted">بطاقة تشغيل الطباعة • بطاقة داخلية — ليست فاتورة أو إيصال دفع</div>
<table>
<tr><td class="k">رقم الأوردر</td><td><b>{{ $order['number'] }}</b></td><td class="k">العميل</td><td>{{ $order['customer'] }}</td></tr>
<tr><td class="k">الحالة التشغيلية</td><td>{{ $order['status_label'] }}</td><td class="k">طريقة التسليم</td><td>{{ $order['delivery_label'] }}</td></tr>
<tr><td class="k">تاريخ الإنشاء</td><td>{{ $order['created_at'] ? \Illuminate\Support\Carbon::parse($order['created_at'])->format('Y-m-d H:i') : '—' }}</td><td class="k">بدء الطباعة</td><td>{{ $order['printing_started_at'] ? \Illuminate\Support\Carbon::parse($order['printing_started_at'])->format('Y-m-d') : '—' }}</td></tr>
<tr><td class="k">مدة الطباعة المتوقعة</td><td colspan="3">{{ $order['eta_days'] ? $order['eta_days'].' أيام' : '—' }}</td></tr>
<tr><td class="k">ملاحظات الأوردر</td><td colspan="3">{{ $order['notes'] ?: '—' }}</td></tr>
</table>
<table><tr><th>اسم البند</th><th>الكمية</th><th>المواصفات</th><th>النسخة المعتمدة</th><th>ملاحظات التشغيل</th></tr>
@foreach($items as $i)<tr><td><b>{{ $i['name'] }}</b></td><td>{{ $i['quantity'] }}</td><td>{{ $i['specs'] }}</td><td>{{ $i['version'] }}</td><td>{{ $i['notes'] }}</td></tr>@endforeach
</table></body></html>
