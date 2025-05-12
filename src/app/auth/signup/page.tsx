
import AuthForm from '@/components/auth/AuthForm';
import Logo from '@/components/shared/Logo';
import { Card, CardContent } from '@/components/ui/card';

export const metadata = {
  title: 'Sign Up',
};

export default function SignupPage() {
  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <Logo />
      </div>
      <AuthForm mode="signup" />
    </div>
  );
}
