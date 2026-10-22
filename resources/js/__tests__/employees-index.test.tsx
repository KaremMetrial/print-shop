import EmployeesIndex from '@/pages/employees/index';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ChangeEvent, ReactNode } from 'react';

const { get } = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock('@inertiajs/react', () => ({
    Head: () => null,
    Link: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a>,
    router: { get },
}));

vi.mock('@/layouts/app-layout', () => ({ default: ({ children }: { children: ReactNode }) => <div>{children}</div> }));
vi.mock('@/components/confirm-dialog', () => ({ ConfirmDialog: () => null }));
vi.mock('@/components/pen/form', () => ({
    Pen44: ({ href, children, onClick }: { href?: string; children: ReactNode; onClick?: () => void }) =>
        href ? <a href={href}>{children}</a> : <button onClick={onClick}>{children}</button>,
    PenInput: ({ label, value, onChange }: { label: string; value: string; onChange: (event: ChangeEvent<HTMLInputElement>) => void }) => (
        <label>
            {label}
            <input value={value} onChange={onChange} />
        </label>
    ),
    PenSelect: ({ label, value }: { label: string; value: string }) => <label>{label}<select value={value} onChange={() => {}} /></label>,
    penNote: '',
}));

const employee = {
    id: 7,
    name: 'منى إبراهيم',
    email: 'mona@example.test',
    phone: '01012345678',
    role: 'DESIGNER',
    role_label: 'مصمم',
    status: 'ACTIVE' as const,
    created_at: '2026-10-21T09:00:00+03:00',
    last_login_at: null,
    availability: 'متاح',
    can_edit: true,
};

const props = (selected: null | (typeof employee & { extra_permissions: number; specialties: string[]; can_permissions: boolean })) => ({
    employees: { data: [employee], current_page: 1, last_page: 1 },
    filters: { q: '' },
    roles: [],
    can: { create: true },
    selected,
});

describe('employee details', () => {
    beforeEach(() => get.mockReset());
    afterEach(cleanup);

    it('requests the selected employee when the details action is clicked', () => {
        render(<EmployeesIndex {...props(null)} />);

        fireEvent.click(screen.getByRole('button', { name: 'عرض التفاصيل' }));

        expect(get).toHaveBeenCalledWith(
            '/employees',
            { q: '', selected: employee.id },
            { preserveState: true, preserveScroll: true, only: ['selected'], replace: true },
        );
    });

    it('shows the selected profile in a dialog and clears the selection when closed', () => {
        render(<EmployeesIndex {...props({ ...employee, extra_permissions: 2, specialties: ['بطاقات'], can_permissions: true })} />);

        expect(screen.getByRole('dialog')).toBeTruthy();
        expect(within(screen.getByRole('dialog')).getByText('mona@example.test')).toBeTruthy();
        expect(within(screen.getByRole('dialog')).getByText('التخصصات')).toBeTruthy();
        expect(within(screen.getByRole('dialog')).getByText('بطاقات')).toBeTruthy();
        expect(within(screen.getByRole('dialog')).getByRole('button', { name: 'إعادة تعيين كلمة المرور' })).toBeTruthy();

        fireEvent.click(screen.getByRole('button', { name: 'إغلاق' }));

        expect(get).toHaveBeenCalledWith('/employees', { q: '', selected: undefined }, { preserveState: true, preserveScroll: true, replace: true });
    });
});
