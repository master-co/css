import AppLogoIcon from '@/components/app-logo-icon';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';

export default function AuthCardLayout({
  children,
  title,
  description,
}: PropsWithChildren<{
  name?: string;
  title?: string;
  description?: string;
}>) {
  return (
    <div className="flex flex-col items-center justify-center bg-muted gap-6 md:p-10 min-h-svh p-6">
      <div className="flex flex-col gap-6 max-w-md w-full">
        <Link href={route('home')} className="flex items-center self-center font-medium gap-2">
          <div className="flex items-center justify-center h-9 w-9">
            <AppLogoIcon className="dark:text-white fill-current size-9 text-black" />
          </div>
        </Link>

        <div className="flex flex-col gap-6">
          <Card className="rounded-xl">
            <CardHeader className="text-center pb-0 pt-8 px-10">
              <CardTitle className="text-xl">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="px-10 py-8">{children}</CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
