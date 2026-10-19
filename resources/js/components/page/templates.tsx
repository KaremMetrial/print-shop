import { type BreadcrumbItem } from '@/types';
import { PageHeader } from './page-header';

type Slot = React.ReactNode;
const Stack = ({ children }: { children: Slot }) => <div className="flex flex-col gap-4">{children}</div>;

/** Page template / قائمة: مسار ← عنوان+إجراء ← بحث ومرشحات ← جدول ← ترقيم */
export function ListPage({ breadcrumbs, title, subtitle, actions, filters, children, pagination }: { breadcrumbs?: BreadcrumbItem[]; title: string; subtitle?: string; actions?: Slot; filters?: Slot; children: Slot; pagination?: Slot }) {
    return (
        <Stack>
            <PageHeader breadcrumbs={breadcrumbs} title={title} subtitle={subtitle} actions={actions} />
            {filters && <div className="flex flex-wrap items-center gap-3">{filters}</div>}
            {children}
            {pagination}
        </Stack>
    );
}

/** Page template / تفاصيل: مسار ← هوية السجل وحالته ← الإجراءات ← المعلومات الأساسية ← السجلات المرتبطة */
export function DetailsPage({ breadcrumbs, title, badge, subtitle, actions, children, related }: { breadcrumbs?: BreadcrumbItem[]; title: string; badge?: Slot; subtitle?: string; actions?: Slot; children: Slot; related?: Slot }) {
    return (
        <Stack>
            <PageHeader breadcrumbs={breadcrumbs} title={title} badge={badge} subtitle={subtitle} actions={actions} />
            {children}
            {related}
        </Stack>
    );
}

/** Page template / نموذج: مسار ← عنوان ← حقول مجمعة ← رسائل التحقق ← حفظ/إلغاء */
export function FormPage({ breadcrumbs, title, subtitle, alerts, children, footer, onSubmit }: { breadcrumbs?: BreadcrumbItem[]; title: string; subtitle?: string; alerts?: Slot; children: Slot; footer: Slot; onSubmit: React.FormEventHandler }) {
    return (
        <form onSubmit={onSubmit} noValidate className="flex max-w-3xl flex-col gap-4">
            <PageHeader breadcrumbs={breadcrumbs} title={title} subtitle={subtitle} />
            {alerts}
            <div className="bg-surface border-border flex flex-col gap-5 rounded-xl border p-6">{children}</div>
            <div className="flex items-center justify-end gap-3">{footer}</div>
        </form>
    );
}

/** Page template / لوحة متابعة: عنوان ← الإجراءات المطلوبة ← المؤشرات ← جدول تشغيلي */
export function DashboardPage({ title, subtitle, actions, required, kpis, children }: { title: string; subtitle?: string; actions?: Slot; required?: Slot; kpis?: Slot; children?: Slot }) {
    return (
        <Stack>
            <PageHeader title={title} subtitle={subtitle} actions={actions} />
            {required}
            {kpis && <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">{kpis}</div>}
            {children}
        </Stack>
    );
}

/** Page template / عارض وثيقة: عنوان ← إجراءات المستند (طباعة/PDF) ← معاينة */
export function DocumentPage({ breadcrumbs, title, actions, children }: { breadcrumbs?: BreadcrumbItem[]; title: string; actions?: Slot; children: Slot }) {
    return (
        <Stack>
            <PageHeader breadcrumbs={breadcrumbs} title={title} actions={actions} />
            <div className="bg-surface border-border mx-auto w-full max-w-4xl rounded-xl border p-6 sm:p-10 print:border-0">{children}</div>
        </Stack>
    );
}
