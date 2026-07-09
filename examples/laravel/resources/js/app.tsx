import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { type ComponentType, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { initializeTheme } from './hooks/use-appearance';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';
type LayoutFunction = (page: ReactNode) => ReactNode;
type LayoutComponent = ComponentType<{ children: ReactNode }>;
type InertiaPage = ComponentType<any> & {
  layout?: LayoutComponent | LayoutComponent[] | LayoutFunction | ((props: any) => any);
};
const pages = import.meta.glob<InertiaPage>('./pages/**/*.tsx');

createInertiaApp({
  title: (title) => `${title} - ${appName}`,
  resolve: (name) => resolvePageComponent<InertiaPage>(`./pages/${name}.tsx`, pages),
  setup({ el, App, props }) {
    const root = createRoot(el);

    root.render(<App {...props} />);
  },
  progress: {
    color: '#4B5563',
  },
});

// This will set light / dark mode on load...
initializeTheme();
