// Components
import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import AuthLayout from '@/layouts/auth-layout';

export default function VerifyEmail({ status }: { status?: string }) {
  const { post, processing } = useForm({});

  const submit: FormEventHandler = (e) => {
    e.preventDefault();

    post(route('verification.send'));
  };

  return (
    <AuthLayout title="Verify email" description="Please verify your email address by clicking on the link we just emailed to you.">
      <Head title="Email verification" />

      {status === 'verification-link-sent' && (
        <div className="text-center font-medium mb-4 text-green-600 text-sm">
          A new verification link has been sent to the email address you provided during registration.
        </div>
      )}

      <form onSubmit={submit} className="text-center space-y-6">
        <Button disabled={processing} variant="secondary">
          {processing && <LoaderCircle className="animate-spin h-4 w-4" />}
          Resend verification email
        </Button>

        <TextLink href={route('logout')} method="post" className="block mx-auto text-sm">
          Log out
        </TextLink>
      </form>
    </AuthLayout>
  );
}
