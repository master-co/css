import AppLogoIcon from '@/components/app-logo-icon';
import { Link } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';

interface AuthLayoutProps {
  name?: string;
  title?: string;
  description?: string;
}

export default function AuthSimpleLayout({ children, title, description }: PropsWithChildren<AuthLayoutProps>) {
  return (
    <div className="flex flex-col items-center justify-center bg-background gap-6 md:p-10 min-h-svh p-6">
      <div className="max-w-sm w-full">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col items-center gap-4">
            <Link href={route('home')} className="flex flex-col items-center font-medium gap-2">
              <div className="flex items-center justify-center h-9 mb-1 rounded-md w-9">
                <AppLogoIcon className="dark:text-white fill-current size-9 text-[var(--foreground)]" />
              </div>
              <span className="sr-only">{title}</span>
            </Link>

            <div className="text-center space-y-2">
              <h1 className="font-medium text-xl">{title}</h1>
              <p className="text-center text-muted-foreground text-sm">{description}</p>
            </div>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
