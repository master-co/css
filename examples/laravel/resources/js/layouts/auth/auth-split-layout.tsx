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
    <div className="grid flex-col items-center justify-center lg:px-0 sm:px-0 h-dvh px-8 relative">
      <div className="hidden flex-col dark:border-r flex@md bg-muted h-full p-10 relative text-white">
        <div className="absolute bg-zinc-900 inset-0" />
        <Link href={route('home')} className="flex items-center text-lg font-medium relative z-20">
          <AppLogoIcon className="fill-current mr-2 size-8 text-white" />
          {name}
        </Link>
        {quote && (
          <div className="mt-auto relative z-20">
            <blockquote className="space-y-2">
              <p className="text-lg">&ldquo;{quote.message}&rdquo;</p>
              <footer className="text-sm text-300">{quote.author}</footer>
            </blockquote>
          </div>
        )}
      </div>
      <div className="lg:p-8 w-full">
        <div className="flex flex-col justify-center sm:w-[350px] mx-auto space-y-6 w-full">
          <Link href={route('home')} className="flex items-center justify-center hidden@md relative z-20">
            <AppLogoIcon className="fill-current sm:h-12 h-10 text-black" />
          </Link>
          <div className="flex flex-col items-start text-left sm:text-center gap-2">
            <h1 className="text-xl font-medium">{title}</h1>
            <p className="text-sm (text-wrap:balance) text-muted-foreground">{description}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
