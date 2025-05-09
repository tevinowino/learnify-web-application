"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { UserRole } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import React from "react";

const baseSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

const signupSchema = baseSchema.extend({
  displayName: z.string().min(2, { message: "Display name must be at least 2 characters." }),
  role: z.enum(["admin", "teacher", "student"], { required_error: "Please select a role." }),
});

type AuthFormProps = {
  mode: "login" | "signup";
};

export default function AuthForm({ mode }: AuthFormProps) {
  const { signUp, logIn, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);


  const formSchema = mode === "signup" ? signupSchema : baseSchema;
  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      ...(mode === "signup" && { displayName: "", role: undefined }),
    },
  });

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    let userProfile;
    if (mode === "signup") {
      const signupValues = values as z.infer<typeof signupSchema>;
      userProfile = await signUp(signupValues.email, signupValues.password, signupValues.role as UserRole, signupValues.displayName);
    } else {
      userProfile = await logIn(values.email, values.password);
    }

    setIsSubmitting(false);
    if (userProfile) {
      toast({ title: mode === "signup" ? "Signup Successful!" : "Login Successful!", description: "Redirecting..." });
      if (userProfile.role === 'admin' && !userProfile.schoolId) {
        router.push('/admin/onboarding');
      } else if (userProfile.role === 'admin') {
        router.push('/admin/dashboard');
      } else if (userProfile.role === 'teacher') {
        router.push('/teacher/dashboard');
      } else if (userProfile.role === 'student') {
        router.push('/student/dashboard');
      } else {
        router.push('/'); // Fallback
      }
    } else {
      toast({ title: "Authentication Failed", description: "Please check your credentials and try again.", variant: "destructive" });
    }
  }

  const isLoading = authLoading || isSubmitting;

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader>
        <CardTitle>{mode === "signup" ? "Create an Account" : "Welcome Back!"}</CardTitle>
        <CardDescription>
          {mode === "signup" ? "Enter your details to join Learnify." : "Log in to access your dashboard."}
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
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
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
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="you@example.com" {...field} />
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
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
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
                    <FormLabel>I am a...</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value as string | undefined}>
                      <FormControl>
                        <SelectTrigger>
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
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 button-shadow" disabled={isLoading}>
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
