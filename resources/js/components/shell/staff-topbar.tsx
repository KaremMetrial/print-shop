import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { usePermissions } from '@/hooks/use-permissions';
import { Icon } from '@/pen/icon';
import { type SharedData } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import { Menu, Search as SearchIcon } from 'lucide-react';
import { useState } from 'react';

const initials = (name: string) =>
    name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0])
        .join('');

/** Global topbar · V3 — h66، أبيض، حد سفلي، padding 0×24، gap 16 (pen: S-007). */
export function StaffTopbar({ onMenu }: { onMenu?: () => void }) {
    const { auth, unread } = usePage<SharedData & { unread?: number }>().props;
    const { can } = usePermissions();
    const [q, setQ] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (q.trim()) router.get('/search', { q: q.trim() });
    };

    return (
        <div
            dir="ltr"
            className="sticky top-0 z-30 flex w-full shrink-0 flex-col [border-width:0px_0px_1px_0px] border-solid [border-color:var(--border)] bg-[var(--surface)]"
        >
            <div className="flex h-[66px] w-full shrink-0 items-center gap-[12px] p-[0px_16px] lg:gap-[16px] lg:p-[0px_24px]">
                <div className="flex h-[66px] min-w-0 flex-1 items-center gap-[12px] lg:gap-[16px]">
                    <DropdownMenu>
                        <DropdownMenuTrigger
                            className="flex w-fit shrink-0 items-center gap-[8px] outline-hidden focus-visible:ring-2"
                            aria-label="قائمة الحساب"
                        >
                            <Icon name="chevron-down" className="hidden h-[20px] w-[20px] shrink-0 sm:block" color="var(--muted-foreground)" />
                            <div className="hidden text-left text-[14px] leading-[22px] font-[400] whitespace-nowrap text-[var(--ink)] sm:block">
                                {auth.user.name}
                            </div>
                            <div className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-[18px] bg-[#DBEAFE]">
                                <div className="text-left text-[13px] leading-[21px] font-[700] whitespace-nowrap text-[var(--primary)]">
                                    {initials(auth.user.name)}
                                </div>
                            </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-60 p-2">
                            <DropdownMenuItem asChild className="h-11 px-3">
                                <Link href={route('profile.edit')}>الملف الشخصي</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="h-11 px-3">
                                <Link href={route('logout')} method="post" as="button" className="w-full text-start">
                                    تسجيل الخروج
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Link href="/notifications" className="flex w-fit shrink-0 items-center gap-[6px]" aria-label="الإشعارات">
                        <div className="text-left text-[12px] leading-[19px] font-[400] whitespace-nowrap text-[var(--primary)]">{unread ?? 0}</div>
                        <Icon name="bell" className="h-[20px] w-[20px] shrink-0" color="var(--muted-foreground)" />
                    </Link>

                    {can('search.image.use') && (
                        <Link href="/search/image" aria-label="بحث بالصورة" className="flex w-fit shrink-0 items-center gap-[8px]">
                            <div className="hidden text-left text-[13px] leading-[21px] font-[400] whitespace-nowrap text-[var(--muted-foreground)] md:block">
                                بحث بالصورة
                            </div>
                            <Icon name="scan-search" className="h-[20px] w-[20px] shrink-0" color="var(--muted-foreground)" />
                        </Link>
                    )}

                    <button
                        type="button"
                        onClick={() => setShowSearch((v) => !v)}
                        aria-label="بحث"
                        aria-expanded={showSearch}
                        className="ml-auto flex shrink-0 items-center text-[var(--muted-foreground)] lg:hidden"
                    >
                        <SearchIcon className="size-5" />
                    </button>
                    <form
                        role="search"
                        onSubmit={submit}
                        className="hidden h-[46px] flex-1 items-center gap-[12px] rounded-[10px] bg-[var(--background)] p-[0px_14px] [outline:1px_solid_var(--control-border)] [outline-offset:-0.5px] focus-within:[outline:2px_solid_var(--primary)] lg:flex"
                    >
                        <input
                            dir="rtl"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="ابحث عن طلب، عميل أو منتج…"
                            aria-label="بحث"
                            className="min-w-0 flex-1 bg-transparent text-right text-[14px] leading-[22px] font-[400] text-[var(--ink)] outline-hidden placeholder:text-[var(--muted-foreground)]"
                        />
                        <Icon name="search" className="h-[20px] w-[20px] shrink-0" color="var(--muted-foreground)" />
                    </form>
                </div>
                <button type="button" onClick={onMenu} aria-label="فتح القائمة" className="shrink-0 text-[var(--muted-foreground)] lg:hidden">
                    <Menu className="size-6" />
                </button>
            </div>
            {showSearch && (
                <form
                    role="search"
                    onSubmit={submit}
                    className="flex h-[56px] w-full items-center gap-[10px] p-[0px_16px] [border-top:1px_solid_var(--border)] lg:hidden"
                >
                    <input
                        dir="rtl"
                        autoFocus
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="ابحث عن طلب، عميل أو منتج…"
                        aria-label="بحث"
                        className="h-[40px] min-w-0 flex-1 rounded-[10px] bg-[var(--background)] p-[0px_12px] text-right text-[14px] outline-1 outline-[var(--control-border)]"
                    />
                </form>
            )}
        </div>
    );
}
