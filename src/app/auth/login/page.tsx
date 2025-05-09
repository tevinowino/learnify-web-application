import AuthForm from '@/components/auth/AuthForm';

export const metadata = {
  title: 'Login',
};

export default function LoginPage() {
  return <AuthForm mode="login" />;
}
