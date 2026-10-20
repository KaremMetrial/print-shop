import { PenInput } from '@/components/pen/form';
import { ListHead } from '@/components/pen/lists';
import AppLayout from '@/layouts/app-layout';
import { Head, useForm } from '@inertiajs/react';

interface Props {
    fields: { key: string; label: string; group: string; type: string; value: string }[];
    groups: string[];
    methods: Record<string, string>;
}
const G: Record<string, string> = { general: 'عام', orders: 'الأوردرات', payments: 'الدفع', files: 'الملفات' };

/** S-068..076 — إعدادات النظام (مجموعة لكل صلاحية). القيم تُتحقق وتُدقَّق على الخادم. */
export default function Settings({ fields, groups, methods }: Props) {
    const { data, setData, patch, processing, errors } = useForm<{ values: Record<string, string> }>({
        values: Object.fromEntries(fields.map((f) => [f.key, f.value])),
    });
    return (
        <AppLayout active="/settings/system">
            <Head title="الإعدادات" />
            <form
                noValidate
                onSubmit={(e) => {
                    e.preventDefault();
                    patch('/settings/system');
                }}
                className="flex w-full shrink-0 flex-col gap-[16px]"
            >
                <ListHead
                    crumbs={[{ label: 'الرئيسية', href: '/dashboard' }, 'الإعدادات']}
                    title="الإعدادات"
                    subtitle="إعدادات التشغيل حسب صلاحياتك."
                    actions={
                        <button
                            type="submit"
                            disabled={processing}
                            className="flex h-[46px] items-center rounded-[10px] bg-[var(--primary)] p-[0px_18px] text-[14px] font-[600] text-white disabled:opacity-60"
                        >
                            حفظ التغييرات
                        </button>
                    }
                />
                {Object.keys(errors).length > 0 && (
                    <div
                        role="alert"
                        className="w-full rounded-[10px] bg-[var(--danger-soft)] p-[12px_16px] text-right text-[13px] text-[var(--danger-text)]"
                    >
                        تعذر الحفظ: تحقق من القيم.
                    </div>
                )}
                {groups.map((g) => (
                    <div
                        key={g}
                        className="flex w-full flex-col gap-[14px] rounded-[12px] bg-[var(--surface)] p-[20px] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]"
                    >
                        <div className="w-full text-right text-[18px] font-[700]">{G[g]}</div>
                        {fields
                            .filter((f) => f.group === g)
                            .map((f) =>
                                f.type === 'methods' ? (
                                    <fieldset key={f.key} className="flex w-full flex-col gap-[10px]">
                                        <legend className="w-full text-right text-[13px] font-[600] text-[var(--text-secondary)]">{f.label}</legend>
                                        {Object.entries(methods).map(([code, label]) => {
                                            const on = data.values[f.key].split(',').includes(code);
                                            return (
                                                <label key={code} className="flex items-center justify-end gap-[10px] text-[14px] text-[var(--ink)]">
                                                    {label}
                                                    <input
                                                        type="checkbox"
                                                        checked={on}
                                                        onChange={() => {
                                                            const cur = data.values[f.key].split(',').filter(Boolean);
                                                            const next = on ? cur.filter((c) => c !== code) : [...cur, code];
                                                            setData('values', { ...data.values, [f.key]: next.join(',') });
                                                        }}
                                                        className="h-[20px] w-[20px]"
                                                    />
                                                </label>
                                            );
                                        })}
                                        <div className="w-full text-right text-[12px] text-[var(--muted-foreground)]">
                                            الطرق غير المفعّلة لا تظهر عند تسجيل دفعة جديدة، وتبقى ظاهرة في الدفعات القديمة.
                                        </div>
                                    </fieldset>
                                ) : (
                                    <PenInput
                                        key={f.key}
                                        label={f.label}
                                        value={data.values[f.key]}
                                        inputMode={f.type === 'int' ? 'numeric' : undefined}
                                        onChange={(e) => setData('values', { ...data.values, [f.key]: e.target.value })}
                                    />
                                ),
                            )}
                    </div>
                ))}
            </form>
        </AppLayout>
    );
}
