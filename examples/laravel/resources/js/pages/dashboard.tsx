import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
  },
];

export default function Dashboard() {
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Dashboard" />
      <div className="display:flex flex-direction:column flex-1 gap-4 h-full p-4 rounded-xl">
        <div className="display:grid md:grid-cols-3 auto-rows-min gap-4">
          <div className="dark:border-sidebar-border aspect-video border border-sidebar-border/70 overflow-hidden relative rounded-xl">
            <PlaceholderPattern className="dark:stroke-neutral-100/20 absolute inset-0 size-full stroke-neutral-900/20" />
          </div>
          <div className="dark:border-sidebar-border aspect-video border border-sidebar-border/70 overflow-hidden relative rounded-xl">
            <PlaceholderPattern className="dark:stroke-neutral-100/20 absolute inset-0 size-full stroke-neutral-900/20" />
          </div>
          <div className="dark:border-sidebar-border aspect-video border border-sidebar-border/70 overflow-hidden relative rounded-xl">
            <PlaceholderPattern className="dark:stroke-neutral-100/20 absolute inset-0 size-full stroke-neutral-900/20" />
          </div>
        </div>
        <div className="dark:border-sidebar-border md:min-h-min border border-sidebar-border/70 flex-1 min-h-[100vh] overflow-hidden relative rounded-xl">
          <PlaceholderPattern className="dark:stroke-neutral-100/20 absolute inset-0 size-full stroke-neutral-900/20" />
        </div>
      </div>
    </AppLayout>
  );
}
