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
    <div className="grid flex-col items-center justify-center h-dvh lg:grid-cols-2 lg:max-w-none lg:px-0 px-8 relative sm:px-0">
      <div className="hidden flex-col bg-muted dark:border-r h-full lg:flex p-10 relative text-white">
        <div className="absolute bg-zinc-900 inset-0" />
        <Link href={route('home')} className="flex items-center font-medium relative text-lg z-20">
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
        <div className="flex flex-col justify-center mx-auto sm:w-[350px] space-y-6 w-full">
          <Link href={route('home')} className="flex items-center justify-center lg:hidden relative z-20">
            <AppLogoIcon className="fill-current h-10 sm:h-12 text-black" />
          </Link>
          <div className="flex flex-col items-start text-left gap-2 sm:items-center sm:text-center">
            <h1 className="font-medium text-xl">{title}</h1>
            <p className="text-balance text-muted-foreground text-sm">{description}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
