
"use client";

import React, { Suspense } from "react"; // Added Suspense
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Eye, EyeOff } from "lucide-react"; // Added Eye and EyeOff

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
import type { UserRole, UserStatus } from "@/types";
import Loader from '@/components/shared/Loader'; // Import new Loader

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

const signupSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  displayName: z.string().min(2, "Display name must be at least 2 characters."),
  role: z.enum(["admin", "teacher", "student", "parent"], {
    required_error: "Please select a role.",
  }),
  schoolIdToJoin: z.string().optional(),
  childStudentId: z.string().optional(),
}).superRefine((data, ctx) => {
  if ((data.role === 'teacher' || data.role === 'student') && !data.schoolIdToJoin?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "School ID is required for teachers and students.",
      path: ["schoolIdToJoin"],
    });
  }
  if (data.role === 'parent' && !data.childStudentId?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Child's Student ID is required for parents.",
      path: ["childStudentId"],
    });
  }
});

type LoginFormValues = z.infer<typeof loginSchema>;
type SignupFormValues = z.infer<typeof signupSchema>;

type AuthFormProps = {
  mode: "login" | "signup";
};

// Extracted the core form logic to a new component
function AuthFormContent({ mode }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams(); // This hook causes the issue if not in Suspense
  const { signUp, logIn, loading: authLoading, getSchoolDetails } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  const isSignup = mode === "signup";
  const formSchema = isSignup ? signupSchema : loginSchema;

  const form = useForm<SignupFormValues | LoginFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      ...(mode === "signup" && { displayName: "", role: undefined, schoolIdToJoin: "", childStudentId: "" }),
    },
  });

  const isLoading = authLoading || isSubmitting;

  function getRedirectPath(role: UserRole, schoolId?: string, status?: UserStatus, classIds?: string[]) {
    if (status === 'pending_verification') {
      return '/auth/pending-verification';
    }
    if (role === "admin" && !schoolId) return "/admin/onboarding";
    if (role === "admin") return "/admin/dashboard";
    if (role === "teacher") return "/teacher/dashboard";
    if (role === "student" && (!classIds || classIds.length === 0) && status === 'active') return "/student/onboarding";
    if (role === "student") return "/student/dashboard";
    if (role === "parent") return "/parent/dashboard";
    return "/";
  }

  async function onSubmit(values: SignupFormValues | LoginFormValues) {
    setIsSubmitting(true);

    try {
      let userProfile;

      if (mode === "signup") {
        const { email, password, displayName, role, schoolIdToJoin, childStudentId } = values as SignupFormValues;
        
        if (role === 'parent') {
          if (!childStudentId) {
            toast({ title: "Child's Student ID Missing", description: "Please enter your child's Student ID.", variant: "destructive" });
            setIsSubmitting(false);
            return;
          }
          userProfile = await signUp(email, password, role, displayName, undefined, undefined, childStudentId);
        } else if (role === 'teacher' || role === 'student') {
          if (!schoolIdToJoin) { 
            toast({ title: "School ID Missing", description: "School ID is required for teachers and students.", variant: "destructive" });
            setIsSubmitting(false);
            return;
          }
          const school = await getSchoolDetails(schoolIdToJoin);
          if (!school) {
            toast({ title: "Invalid School ID", description: "The provided School ID does not exist. Please check and try again.", variant: "destructive" });
            setIsSubmitting(false);
            return;
          }
          userProfile = await signUp(email, password, role, displayName, schoolIdToJoin, school.name);
        } else { 
            userProfile = await signUp(email, password, role, displayName);
        }

      } else {
        const { email, password } = values as LoginFormValues;
        userProfile = await logIn(email, password);
      }

      if (userProfile) {
        toast({
          title: mode === "signup" ? "Signup Successful!" : "Login Successful!",
          description: userProfile.status === 'pending_verification' ? "Your account is pending admin approval." : 
                       userProfile.role === 'parent' && userProfile.childStudentId ? "Successfully linked to child. Redirecting..." : "Redirecting...",
        });
        
        const redirectTo = searchParams.get("redirectTo") || getRedirectPath(userProfile.role, userProfile.schoolId, userProfile.status, userProfile.classIds);
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
        const firebaseErrors: Record<string, string> = {
          "auth/email-already-in-use": "This email is already in use.",
          "auth/user-not-found": "No user found with that email.",
          "auth/wrong-password": "Incorrect password.",
          "auth/invalid-email": "Invalid email address.",
        };
        errorMessage = firebaseErrors[error.code] || error.message || errorMessage;
      } else if (error.message) {
        errorMessage = error.message;
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
  
  const selectedRole = form.watch("role" as keyof (SignupFormValues | LoginFormValues)) as UserRole | undefined;

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
                  <div className="relative">
                    <FormControl>
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        autoComplete={isSignup ? "new-password" : "current-password"}
                        aria-invalid={!!form.formState.errors.password}
                        {...field}
                        className="pr-10" // Add padding for the icon button
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword((prev) => !prev)}
                      tabIndex={-1} // Keep it out of the normal tab flow
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {mode === "signup" && (
              <>
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
                          <SelectItem value="parent">Parent</SelectItem> 
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {(selectedRole === 'teacher' || selectedRole === 'student') && (
                   <FormField
                    control={form.control}
                    name="schoolIdToJoin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="schoolIdToJoin">School ID</FormLabel>
                        <FormControl>
                          <Input id="schoolIdToJoin" placeholder="Enter your School's ID" {...field} />
                        </FormControl>
                        <FormMessage />
                        <p className="text-xs text-muted-foreground">Ask your school administrator for this ID.</p>
                      </FormItem>
                    )}
                  />
                )}
                {selectedRole === 'parent' && (
                  <FormField
                    control={form.control}
                    name="childStudentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="childStudentId">Child's Student ID</FormLabel>
                        <FormControl>
                          <Input id="childStudentId" placeholder="Enter your Child's Student ID" {...field} />
                        </FormControl>
                        <FormMessage />
                        <p className="text-xs text-muted-foreground">This ID is provided by the school or found on the student's profile.</p>
                      </FormItem>
                    )}
                  />
                )}
              </>
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


export default function AuthForm(props: AuthFormProps) {
  // Wrap the component that uses useSearchParams with Suspense
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-64 pt-10"><Loader message="Loading form details..." /></div>}>
      <AuthFormContent {...props} />
    </Suspense>
  );
}
