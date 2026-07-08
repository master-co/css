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
      <div className="flex flex-col flex-1 gap-4 h-full p-4 rounded-xl">
        <div className="grid auto-rows-min gap-4 md:grid-cols-3">
          <div className="aspect-video border border-sidebar-border/70 dark:border-sidebar-border overflow-hidden relative rounded-xl">
            <PlaceholderPattern className="absolute dark:stroke-neutral-100/20 inset-0 size-full stroke-neutral-900/20" />
          </div>
          <div className="aspect-video border border-sidebar-border/70 dark:border-sidebar-border overflow-hidden relative rounded-xl">
            <PlaceholderPattern className="absolute dark:stroke-neutral-100/20 inset-0 size-full stroke-neutral-900/20" />
          </div>
          <div className="aspect-video border border-sidebar-border/70 dark:border-sidebar-border overflow-hidden relative rounded-xl">
            <PlaceholderPattern className="absolute dark:stroke-neutral-100/20 inset-0 size-full stroke-neutral-900/20" />
          </div>
        </div>
        <div className="border border-sidebar-border/70 dark:border-sidebar-border flex-1 md:min-h-min min-h-[100vh] overflow-hidden relative rounded-xl">
          <PlaceholderPattern className="absolute dark:stroke-neutral-100/20 inset-0 size-full stroke-neutral-900/20" />
        </div>
      </div>
    </AppLayout>
  );
}
