import { echo, echoIsConfigured } from '@laravel/echo-react';
import { useEffect, useRef } from 'react';

/**
 * اشتراك في حدث على قناة خاصة (Reverb). يحتفظ بآخر callback دون إعادة الاشتراك، وينظّف عند الإزالة.
 * يفشل بصمت لو Reverb غير متاح (الواجهة تعتمد حينها على التحديث عند التنقل/الـpolling).
 */
export function useRealtime<T>(channel: string | null, event: string, onEvent: (payload: T) => void): void {
    const cb = useRef(onEvent);
    cb.current = onEvent;
    useEffect(() => {
        if (!channel || !echoIsConfigured()) return;
        const handler = (payload: T) => cb.current(payload);
        try {
            echo().private(channel).listen(event, handler);
        } catch {
            return;
        }
        return () => {
            try {
                echo().private(channel).stopListening(event, handler);
                echo().leave(channel);
            } catch {
                /* اتصال مغلق */
            }
        };
    }, [channel, event]);
}
