import { Pen44, PenInput, PenSection, PenSelect, PenSwitch, penNote } from '@/components/pen/form';
import AppLayout from '@/layouts/app-layout';
import { formatDate } from '@/lib/money';
import { Head, router, useForm } from '@inertiajs/react';

interface Employee {
    id: number;
    name: string;
    email: string;
    role: string | null;
    status: 'ACTIVE' | 'INACTIVE';
    created_at: string | null;
    specialty_ids: string[];
    availability: string;
}
interface Opt {
    value: string;
    label: string;
}

const crumb = 'w-full text-right text-[13px] leading-[normal] font-[400] text-[var(--muted-foreground)]';
const h1 = 'w-full text-right text-[28px] leading-[normal] font-[700] text-[var(--ink)]';

/** S-066 — إضافة/تعديل موظف (pendev: OsQkz / y3bVrL). تسميات الحقلين الأولين من أسماء الطبقات لأن نص التصميم المنسوخ «اسم العميل» خطأ واضح (انظر docs/11-ui-deviations.md). */
export default function EmployeeForm({ employee, roles, specialties, availabilityOptions }: { employee: Employee | null; roles: Opt[]; specialties: Opt[]; availabilityOptions: Opt[] }) {
    const edit = !!employee;
    const { data, setData, post, patch, processing, errors } = useForm({
        name: employee?.name ?? '',
        email: employee?.email ?? '',
        role: employee?.role ?? '',
        password: '',
        specialty_ids: employee?.specialty_ids ?? ([] as string[]),
        availability: employee?.availability ?? 'AVAILABLE',
    });
    const isDesigner = data.role === 'DESIGNER';
    const title = edit ? 'تعديل بيانات الموظف' : 'إضافة موظف';
    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (edit) patch(`/employees/${employee.id}`);
        else post('/employees');
    };

    return (
        <AppLayout active="/employees">
            <Head title={title} />
            <form onSubmit={submit} noValidate className="contents">
                <div className={crumb}>الموظفون ‹ {title}</div>
                <h1 className={h1}>{title}</h1>

                <PenSection title="البيانات الأساسية">
                    <div className="flex w-full shrink-0 gap-[16px]">
                        <PenInput label="البريد الإلكتروني *" type="email" ltr placeholder="name@company.com" value={data.email} onChange={(e) => setData('email', e.target.value)} error={errors.email} wrapperClassName="flex-1" autoComplete="off" />
                        <PenInput label="الاسم الكامل *" placeholder="أدخل الاسم الكامل" value={data.name} onChange={(e) => setData('name', e.target.value)} error={errors.name} wrapperClassName="flex-1" />
                    </div>
                    {edit && <div className="w-full text-right text-[13px] leading-[normal] font-[400] text-[var(--muted-foreground)]">مرجع الموظف: EMP-{String(employee.id).padStart(4, '0')} · تاريخ الإنشاء: {employee.created_at ? formatDate(employee.created_at) : 'غير متاح'} · للقراءة فقط</div>}
                </PenSection>

                <PenSection title="الدور الوظيفي">
                    <PenSelect label="الدور الوظيفي *" placeholder="اختر الدور" options={roles} value={data.role} onValueChange={(v) => setData('role', v)} error={errors.role} />
                    <div className={penNote}>المدير يمكنه اختيار: مدخل بيانات، مصمم، محاسب. إنشاء مدير متاح للمدير العام فقط، ولا يتوفر المدير العام هنا.</div>
                </PenSection>

                <PenSection title="بيانات الدخول">
                    {edit ? (
                        <>
                            <div className="w-full text-right text-[14px] leading-[normal] font-[400] text-[var(--text-secondary)]">لا تُعرض كلمة المرور الحالية. إعادة التعيين إجراء منفصل ومصرح.</div>
                            <Pen44 px={16} onClick={() => router.post(`/employees/${employee.id}/reset-password`)}>
                                إعادة تعيين كلمة المرور
                            </Pen44>
                        </>
                    ) : (
                        <>
                            <PenInput label="كلمة المرور" type="password" ltr autoComplete="new-password" placeholder="••••••••" value={data.password} onChange={(e) => setData('password', e.target.value)} error={errors.password} />
                            <div className={penNote}>لا يوجد تسجيل ذاتي أو إرسال تلقائي. لا تُحفظ كلمة المرور في سجل التدقيق.</div>
                        </>
                    )}
                </PenSection>

                <PenSection title="إعدادات الحساب">
                    <div className="flex w-full shrink-0 items-center justify-end gap-[12px]">
                        <div className="flex-1 text-right text-[14px] leading-[normal] font-[400] text-[var(--ink)]">حالة الحساب · {edit ? (employee.status === 'ACTIVE' ? 'نشط' : 'معطّل') : 'وفق الإعداد الافتراضي المعتمد'}</div>
                        <PenSwitch checked={!edit || employee.status === 'ACTIVE'} onChange={() => {}} label={!edit || employee.status === 'ACTIVE' ? 'نشط' : 'معطّل'} disabled />
                    </div>
                    <div className={penNote}>يمكن للموظف تسجيل الدخول عندما يكون الحساب نشطًا.</div>
                </PenSection>

                {isDesigner && (
                    <PenSection title="إعدادات المصمم">
                        <PenSelect label="التخصصات *" multiple placeholder="اختر التخصصات" options={specialties} value={data.specialty_ids} onValueChange={(v) => setData('specialty_ids', v)} error={errors.specialty_ids} />
                        <PenSelect label="حالة التوفر" options={availabilityOptions} value={data.availability} onValueChange={(v) => setData('availability', v)} error={errors.availability} />
                        <div className={penNote}>حالة التوفر: متاح / في إجازة / غير متاح. الحساب النشط مستقل عن التوفر. يظهر هذا القسم فقط عند اختيار «مصمم».</div>
                    </PenSection>
                )}

                <div className="flex w-full shrink-0 justify-end gap-[14px]">
                    <Pen44 px={16} href={edit ? `/employees?selected=${employee.id}` : '/employees'}>
                        إلغاء
                    </Pen44>
                    <Pen44 px={16} variant="primary" type="submit" disabled={processing}>
                        {edit ? 'حفظ التعديلات' : 'إنشاء الموظف'}
                    </Pen44>
                </div>
            </form>
        </AppLayout>
    );
}
