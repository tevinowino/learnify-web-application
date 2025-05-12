
import AuthForm from '@/components/auth/AuthForm';
import Logo from '@/components/shared/Logo';
import { Card, CardContent } from '@/components/ui/card';

export const metadata = {
  title: 'Login',
};

export default function LoginPage() {
  return (
    <div className="w-full max-w-md">
       <div className="mb-8 text-center">
        <Logo />
      </div>
      <AuthForm mode="login" />
    </div>
  );
}
