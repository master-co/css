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
    <div className="display:flex flex-direction:column align-items:center justify-content:center bg-muted gap-6 md:p-10 min-h-svh p-6">
      <div className="display:flex flex-direction:column gap-6 max-w-md w-full">
        <Link href={route('home')} className="display:flex align-items:center align-self:center font-weight-medium gap-2">
          <div className="display:flex align-items:center justify-content:center h-9 w-9">
            <AppLogoIcon className="dark:text-white fill-current size-9 text-black" />
          </div>
        </Link>

        <div className="display:flex flex-direction:column gap-6">
          <Card className="rounded-xl">
            <CardHeader className="text-align:center pb-0 pt-8 px-10">
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
