import { Suspense, lazy, useMemo } from 'react';

const modules = import.meta.glob('../../pen/gen/*.tsx');

/** معاينة المُولَّد مباشرة من الـpen (للتحقق من دقة المحوّل) — local فقط. */
export default function PenPreview({ screen }: { screen: string }) {
    const Cmp = useMemo(() => {
        const loader = modules[`../../pen/gen/${screen}.tsx`];
        return loader ? lazy(loader as () => Promise<{ default: React.ComponentType }>) : null;
    }, [screen]);
    return <Suspense fallback={null}>{Cmp ? <div dir="ltr"><Cmp /></div> : <div>غير موجود</div>}</Suspense>;
}
