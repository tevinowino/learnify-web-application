import AuthForm from '@/components/auth/AuthForm';

export const metadata = {
  title: 'Sign Up',
};

export default function SignupPage() {
  return <AuthForm mode="signup" />;
}
