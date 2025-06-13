
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import Logo from '@/components/shared/Logo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="mb-8 text-center">
        <Logo />
      </div>
      <Card className="w-full max-w-md text-center card-shadow">
        <CardHeader>
          <AlertTriangle className="mx-auto h-16 w-16 text-destructive mb-4" />
          <CardTitle className="text-3xl font-bold">404 - Page Not Found</CardTitle>
          <CardDescription className="text-lg text-muted-foreground mt-2">
            Oops! The page you&apos;re looking for doesn&apos;t seem to exist.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-6">
            It might have been moved, deleted, or maybe you just mistyped the URL.
          </p>
          <Button asChild className="button-shadow bg-primary hover:bg-primary/90">
            <Link href="/">Go Back to Homepage</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
