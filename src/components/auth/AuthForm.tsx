"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { UserRole } from "@/types";

// ------------------
// Schemas
// ------------------

const loginSchema = z.object({
  email: z.string().email("Invalid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

const signupSchema = loginSchema.extend({
  displayName: z.string().min(2, "Display name must be at least 2 characters."),
  role: z.enum(["admin", "teacher", "student"], {
    required_error: "Please select a role.",
  }),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type SignupFormValues = z.infer<typeof signupSchema>;

type AuthFormProps = {
  mode: "login" | "signup";
};

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signUp, logIn, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const isSignup = mode === "signup";
  const formSchema = isSignup ? signupSchema : loginSchema;

  const form = useForm<SignupFormValues | LoginFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: isSignup
      ? {
          email: "",
          password: "",
          displayName: "",
          role: undefined,
        }
      : {
          email: "",
          password: "",
        },
  });

  const isLoading = authLoading || isSubmitting;

  function redirectToDashboard(role: UserRole, schoolId?: string) {
    if (role === "admin" && !schoolId) return "/admin/onboarding";
    if (role === "admin") return "/admin/dashboard";
    if (role === "teacher") return "/teacher/dashboard";
    if (role === "student") return "/student/dashboard";
    return "/";
  }

  async function onSubmit(values: SignupFormValues | LoginFormValues) {
    setIsSubmitting(true);

    try {
      let userProfile;

      if (isSignup) {
        const { email, password, displayName, role } = values as SignupFormValues;
        userProfile = await signUp(email, password, role, displayName);
      } else {
        const { email, password } = values as LoginFormValues;
        userProfile = await logIn(email, password);
      }

      if (userProfile) {
        toast({
          title: isSignup ? "Signup Successful!" : "Login Successful!",
          description: "Redirecting...",
        });

        const redirectTo = searchParams.get("redirectTo") || redirectToDashboard(userProfile.role, userProfile.schoolId);
        form.reset();
        router.push(redirectTo);
      } else {
        toast({
          title: "Authentication Failed",
          description: "Please check your credentials and try again.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Auth Error:", error);

      let errorMessage = "Something went wrong. Please try again.";
      if (typeof error === "object" && error?.code) {
        // Optional: friendly Firebase-style error messages
        const firebaseErrors: Record<string, string> = {
          "auth/email-already-in-use": "This email is already in use.",
          "auth/user-not-found": "No user found with that email.",
          "auth/wrong-password": "Incorrect password.",
          "auth/invalid-email": "Invalid email address.",
        };
        errorMessage = firebaseErrors[error.code] || errorMessage;
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader>
        <CardTitle>{isSignup ? "Create an Account" : "Welcome Back!"}</CardTitle>
        <CardDescription>
          {isSignup
            ? "Enter your details to join Learnify."
            : "Log in to access your dashboard."}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {isSignup && (
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="displayName">Display Name</FormLabel>
                    <FormControl>
                      <Input
                        id="displayName"
                        placeholder="John Doe"
                        aria-invalid={!!form.formState.errors.displayName}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="email">Email</FormLabel>
                  <FormControl>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      autoComplete="email"
                      aria-invalid={!!form.formState.errors.email}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="password">Password</FormLabel>
                  <FormControl>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      autoComplete="current-password"
                      aria-invalid={!!form.formState.errors.password}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isSignup && (
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="role">I am a...</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger id="role" aria-invalid={!!form.formState.errors.role}>
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="teacher">Teacher</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 button-shadow"
              disabled={isLoading}
              aria-busy={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSignup ? "Sign Up" : "Log In"}
            </Button>
          </form>
        </Form>
      </CardContent>

      <CardFooter className="flex flex-col space-y-2">
        <p className="text-sm text-muted-foreground">
          {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
          <Button variant="link" asChild className="p-0 text-primary">
            <Link href={isSignup ? "/auth/login" : "/auth/signup"}>
              {isSignup ? "Log In" : "Sign Up"}
            </Link>
          </Button>
        </p>
      </CardFooter>
    </Card>
  );
}
