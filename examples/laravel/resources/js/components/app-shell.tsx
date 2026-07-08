import { SidebarProvider } from '@/components/ui/sidebar';
import { SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

interface AppShellProps {
  children: React.ReactNode;
  variant?: 'header' | 'sidebar';
}

export function AppShell({ children, variant = 'header' }: AppShellProps) {
  const isOpen = usePage<SharedData>().props.sidebarOpen;

  if (variant === 'header') {
    return <div className="flex flex-col min-h-screen w-full">{children}</div>;
  }

  return <SidebarProvider defaultOpen={isOpen}>{children}</SidebarProvider>;
}
