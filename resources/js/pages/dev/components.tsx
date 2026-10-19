import { Field } from '@/components/field';
import { KpiCard } from '@/components/kpi-card';
import { DataTable } from '@/components/data-table';
import { ListPage } from '@/components/page/templates';
import { StatusBadge } from '@/components/status-badge';
import { EmptyState, LoadingSkeleton } from '@/components/states';
import { FileProgress, UploadDropzone } from '@/components/upload-dropzone';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';

const rows = [
    { id: 1, no: '0148', customer: 'آفاق للدعاية', total: '1,850' },
    { id: 2, no: '0147', customer: 'مقهى ورد', total: '640' },
];

export default function Gallery() {
    const [tab, setTab] = useState('d');
    const [on, setOn] = useState(true);
    return (
        <AppLayout breadcrumbs={[{ title: 'معرض المكونات', href: '/dev/components' }]}>
            <Head title="معرض المكونات" />
            <ListPage title="معرض المكونات" subtitle="للمقارنة مع pendev/untitled.pen" breadcrumbs={[{ title: 'لوحة التحكم', href: '/dashboard' }, { title: 'معرض المكونات', href: '/dev/components' }]} actions={<Button>حفظ الطلب</Button>}>
                <div className="grid gap-4 lg:grid-cols-2">
                    <div className="flex flex-wrap gap-3">
                        <Button>حفظ الطلب</Button>
                        <Button variant="secondary">إلغاء</Button>
                        <Button variant="destructive">حذف الطلب</Button>
                        <Button disabled>غير متاح</Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <StatusBadge tone="primary" dot="#6D28D9">قيد التصميم</StatusBadge>
                        <StatusBadge tone="danger" dot="#B91C1C">غير مدفوع</StatusBadge>
                        <StatusBadge tone="success">مدفوع</StatusBadge>
                        <StatusBadge tone="warning">متأخر</StatusBadge>
                    </div>
                    <Field label="اسم العميل" required error="هذا الحقل مطلوب."><Input placeholder="أدخل اسم العميل" /></Field>
                    <Field label="ملاحظات إضافية"><Textarea placeholder="اكتب ملاحظاتك هنا..." /></Field>
                    <Alert tone="success" title="تم حفظ الطلب">تم تحديث بيانات الطلب 0148 بنجاح.</Alert>
                    <Alert tone="warning" title="موعد التسليم قريب">3 طلبات مستحقة اليوم.</Alert>
                    <Alert tone="danger" title="تعذر حفظ التغييرات">تحقق من الاتصال ثم أعد المحاولة.</Alert>
                    <Alert tone="info" title="ملف تصميم جديد">أضاف أحمد نسخة جديدة للمراجعة.</Alert>
                    <UploadDropzone onFiles={() => {}} />
                    <FileProgress name="brochure-final-v3.pdf" percent={65} meta="8.4 MB" />
                    <Tabs items={[{ key: 'a', label: 'المرفقات' }, { key: 'p', label: 'المدفوعات' }, { key: 'd', label: 'تفاصيل الطلب' }]} value={tab} onChange={setTab} />
                    <Switch checked={on} onCheckedChange={setOn} label="نشط" />
                    <KpiCard label="إيرادات هذا الشهر" value="24,850" hint="↑ 12.8% عن الشهر الماضي" tone="success" />
                    <LoadingSkeleton />
                </div>
                <DataTable rows={rows} columns={[{ key: 'no', header: 'الطلب', cell: (r) => r.no }, { key: 'c', header: 'العميل', cell: (r) => r.customer }, { key: 't', header: 'القيمة', cell: (r) => r.total }]} />
                <EmptyState title="لا توجد أوردرات مطابقة للفلاتر." />
            </ListPage>
        </AppLayout>
    );
}
