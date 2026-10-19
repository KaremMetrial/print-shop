import { StaffLayout } from '@/components/shell/staff-layout';
import { type ComponentProps } from 'react';

type Props = Pick<ComponentProps<typeof StaffLayout>, 'children' | 'shell' | 'active' | 'sidebarWidth' | 'nav'> & { breadcrumbs?: unknown };

export default function AppLayout({ children, shell, active, sidebarWidth, nav }: Props) {
    return (
        <StaffLayout shell={shell} active={active} sidebarWidth={sidebarWidth} nav={nav}>
            {children}
        </StaffLayout>
    );
}
