import '../css/app.css';

import { createInertiaApp, router } from '@inertiajs/react';
import { configureEcho } from '@laravel/echo-react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { route as routeFn } from 'ziggy-js';
import { initializeTheme } from './hooks/use-appearance';

configureEcho({
    broadcaster: 'reverb',
});

declare global {
    const route: typeof routeFn;
}

let appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);
        // اسم المطبعة من الإعدادات (يتغير بعد الحفظ بدون إعادة بناء)
        appName = (props.initialPage.props as { name?: string }).name ?? appName;
        const syncTitle = (next?: string) => {
            if (next) appName = next;
            // Head لا يعيد كتابة العنوان إذا لم يتغير نصه، لذا نضبط لاحقة اسم المطبعة يدويًا بعد كل زيارة
            for (const ms of [0, 120]) {
                window.setTimeout(() => {
                    const i = document.title.lastIndexOf(' - ');
                    if (i > 0) document.title = `${document.title.slice(0, i)} - ${appName}`;
                }, ms);
            }
        };
        router.on('navigate', (e) => syncTitle((e.detail.page.props as { name?: string }).name));
        router.on('success', (e) => syncTitle((e.detail.page.props as { name?: string }).name));

        root.render(<App {...props} />);
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
