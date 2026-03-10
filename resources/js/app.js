import './bootstrap';

import React from 'react';
import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { InertiaProgress } from '@inertiajs/progress';

createInertiaApp({
    resolve: (name) =>
        resolvePageComponent(`./Pages/${name}.jsx`, import.meta.glob('./Pages/**/*.jsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);
        root.render(React.createElement(App, props));
    },
}).catch((err) => {
    console.error('Inertia app failed to start:', err);
    const el = document.getElementById('app');
    if (el) {
        el.innerHTML = '<div style="padding: 2rem; font-family: sans-serif; color: #1e3a8a;">Failed to load the app. Check the console for errors. Open this site at <strong>http://127.0.0.1:8000</strong> (not the Vite port).</div>';
    }
});

InertiaProgress.init({
    color: '#1e3a8a',
    showSpinner: false,
    delay: 200,
});
