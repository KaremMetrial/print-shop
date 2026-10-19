import { Button } from '@/components/ui/button';
import { CloudUpload } from 'lucide-react';
import { useRef } from 'react';

/** Upload / Dropzone: خلفية primary-soft، stroke #93C5FD، radius 12، p24 */
export function UploadDropzone({ title = 'اسحب ملفات التصميم هنا', hint = 'PDF، AI، PNG • الحد الأقصى 50 MB', onFiles }: { title?: string; hint?: string; onFiles: (f: File[]) => void }) {
    const ref = useRef<HTMLInputElement>(null);
    return (
        <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
                e.preventDefault();
                onFiles(Array.from(e.dataTransfer.files));
            }}
            className="bg-primary-soft flex flex-col items-center gap-2 rounded-xl border border-[#93C5FD] p-6 text-center"
        >
            <CloudUpload className="text-primary size-8" aria-hidden />
            <span className="text-ink text-base font-semibold">{title}</span>
            <span className="text-muted-foreground text-xs">{hint}</span>
            <Button type="button" variant="outline" onClick={() => ref.current?.click()}>
                اختيار ملف
            </Button>
            <input ref={ref} type="file" multiple hidden onChange={(e) => onFiles(Array.from(e.target.files ?? []))} />
        </div>
    );
}

/** File / Upload progress: border، radius 10، p16، شريط 6px */
export function FileProgress({ name, percent, meta }: { name: string; percent: number; meta?: string }) {
    return (
        <div className="border-border flex flex-col gap-2 rounded-control border p-4">
            <span className="text-ink text-sm">{name}</span>
            <span className="text-muted-foreground text-xs">
                جارٍ الرفع… {percent}%{meta ? ` • ${meta}` : ''}
            </span>
            <div className="bg-border h-1.5 w-full rounded-full" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
                <div className="bg-primary h-1.5 rounded-full" style={{ width: `${percent}%` }} />
            </div>
        </div>
    );
}
