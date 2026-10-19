import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/** ترقيم الصفحات: أزرار ‹ › (Button / ‹ ›) */
export function Pagination({ page, pages, onPage }: { page: number; pages: number; onPage: (p: number) => void }) {
    if (pages <= 1) return null;
    return (
        <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground text-sm">
                صفحة {page} من {pages}
            </span>
            <div className="flex items-center gap-2">
                <Button variant="secondary" size="icon" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="السابقة">
                    <ChevronRight />
                </Button>
                <Button variant="secondary" size="icon" disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="التالية">
                    <ChevronLeft />
                </Button>
            </div>
        </div>
    );
}
