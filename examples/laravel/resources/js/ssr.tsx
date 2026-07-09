import { createInertiaApp } from '@inertiajs/react';
import createServer from '@inertiajs/react/server';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { type ComponentType, type ReactNode } from 'react';
import ReactDOMServer from 'react-dom/server';
import { type RouteName, route } from 'ziggy-js';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';
type LayoutFunction = (page: ReactNode) => ReactNode;
type LayoutComponent = ComponentType<{ children: ReactNode }>;
type InertiaPage = ComponentType<any> & {
  layout?: LayoutComponent | LayoutComponent[] | LayoutFunction | ((props: any) => any);
};
const pages = import.meta.glob<InertiaPage>('./pages/**/*.tsx');

createServer((page) =>
  createInertiaApp({
    page,
    render: ReactDOMServer.renderToString,
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => resolvePageComponent<InertiaPage>(`./pages/${name}.tsx`, pages),
    setup: ({ App, props }) => {
      /* eslint-disable */
      // @ts-expect-error
      global.route<RouteName> = (name, params, absolute) =>
        route(name, params as any, absolute, {
          // @ts-expect-error
          ...page.props.ziggy,
          // @ts-expect-error
          location: new URL(page.props.ziggy.location),
        });
      /* eslint-enable */

      return <App {...props} />;
    },
  })
);
