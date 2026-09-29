import AppLogoIcon from '@/components/app-logo-icon';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';

interface AuthLayoutProps {
  title?: string;
  description?: string;
}

export default function AuthSplitLayout({ children, title, description }: PropsWithChildren<AuthLayoutProps>) {
  const { name, quote } = usePage<SharedData>().props;

  return (
    <div className="display:grid flex-direction:column align-items:center justify-content:center h-dvh lg:grid-cols-2 lg:max-w-none lg:px-0 px-8 relative sm:px-0">
      <div className="display:none flex-direction:column bg-muted dark:border-r h-full lg:flex p-10 relative text-white">
        <div className="absolute bg-zinc-900 inset-0" />
        <Link href={route('home')} className="display:flex align-items:center font-weight-medium relative text-lg z-20">
          <AppLogoIcon className="fill-current mr-2 size-8 text-white" />
          {name}
        </Link>
        {quote && (
          <div className="mt-auto relative z-20">
            <blockquote className="space-y-2">
              <p className="text-lg">&ldquo;{quote.message}&rdquo;</p>
              <footer className="text-300 text-sm">{quote.author}</footer>
            </blockquote>
          </div>
        )}
      </div>
      <div className="lg:p-8 w-full">
        <div className="display:flex flex-direction:column justify-content:center mx-auto sm:w-[350px] space-y-6 w-full">
          <Link href={route('home')} className="display:flex align-items:center justify-content:center lg:hidden relative z-20">
            <AppLogoIcon className="fill-current h-10 sm:h-12 text-black" />
          </Link>
          <div className="display:flex flex-direction:column align-items:start text-align:left gap-2 sm:items-center sm:text-center">
            <h1 className="font-weight-medium text-xl">{title}</h1>
            <p className="text-wrap:balance text-muted-foreground text-sm">{description}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
