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

const baseSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

const signupSchema = baseSchema.extend({
  displayName: z.string().min(2, { message: "Display name must be at least 2 characters." }),
  role: z.enum(["admin", "teacher", "student"], {
    required_error: "Please select a role.",
  }),
});

type LoginFormValues = z.infer<typeof baseSchema>;
type SignupFormValues = z.infer<typeof signupSchema>;
type FormValues = LoginFormValues | SignupFormValues;

type AuthFormProps = {
  mode: "login" | "signup";
};

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signUp, logIn, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const formSchema = mode === "signup" ? signupSchema : baseSchema;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      ...(mode === "signup" && { displayName: "", role: undefined }),
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

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);

    try {
      let userProfile;

      if (mode === "signup") {
        const { email, password, displayName, role } = values as SignupFormValues;
        userProfile = await signUp(email, password, role, displayName);
      } else {
        const { email, password } = values as LoginFormValues;
        userProfile = await logIn(email, password);
      }

      if (userProfile) {
        toast({
          title: mode === "signup" ? "Signup Successful!" : "Login Successful!",
          description: "Redirecting...",
        });

        const redirectTo = searchParams.get("redirectTo") || redirectToDashboard(userProfile.role, userProfile.schoolId);
        router.push(redirectTo);
      } else {
        toast({
          title: "Authentication Failed",
          description: "Please check your credentials and try again.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader>
        <CardTitle>{mode === "signup" ? "Create an Account" : "Welcome Back!"}</CardTitle>
        <CardDescription>
          {mode === "signup"
            ? "Enter your details to join Learnify."
            : "Log in to access your dashboard."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {mode === "signup" && (
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="displayName">Display Name</FormLabel>
                    <FormControl>
                      <Input id="displayName" placeholder="John Doe" {...field} />
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
                    <Input id="email" type="email" placeholder="you@example.com" {...field} />
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
                    <Input id="password" type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {mode === "signup" && (
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="role">I am a...</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value as string | undefined}>
                      <FormControl>
                        <SelectTrigger id="role">
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
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "signup" ? "Sign Up" : "Log In"}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <p className="text-sm text-muted-foreground">
          {mode === "signup" ? "Already have an account?" : "Don't have an account?"}{" "}
          <Button variant="link" asChild className="p-0 text-primary">
            <Link href={mode === "signup" ? "/auth/login" : "/auth/signup"}>
              {mode === "signup" ? "Log In" : "Sign Up"}
            </Link>
          </Button>
        </p>
      </CardFooter>
    </Card>
  );
}
