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
    <div className="display:flex flex-direction:column align-items:center justify-content:center bg-background gap-6 md:p-10 min-h-svh p-6">
      <div className="max-w-sm w-full">
        <div className="display:flex flex-direction:column gap-8">
          <div className="display:flex flex-direction:column align-items:center gap-4">
            <Link href={route('home')} className="display:flex flex-direction:column align-items:center font-weight-medium gap-2">
              <div className="display:flex align-items:center justify-content:center h-9 mb-1 rounded-md w-9">
                <AppLogoIcon className="dark:text-white fill-current size-9 text-[var(--foreground)]" />
              </div>
              <span className="sr-only">{title}</span>
            </Link>

            <div className="text-align:center space-y-2">
              <h1 className="font-weight-medium text-xl">{title}</h1>
              <p className="text-align:center text-muted-foreground text-sm">{description}</p>
            </div>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
