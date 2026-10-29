import { SidebarInset } from '@/components/ui/sidebar';
import * as React from 'react';

interface AppContentProps extends React.ComponentProps<'main'> {
  variant?: 'header' | 'sidebar';
}

export function AppContent({ variant = 'header', children, ...props }: AppContentProps) {
  if (variant === 'sidebar') {
    return <SidebarInset {...props}>{children}</SidebarInset>;
  }

  return (
    <main className="display:flex flex-direction:column max-w-7xl flex-1 gap-4 h-full mx-auto rounded-xl w-full" {...props}>
      {children}
    </main>
  );
}
