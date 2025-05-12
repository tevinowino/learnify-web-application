
"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";

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
} from "@/components/ui/card";

import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { UserRole } from "@/types";
import Loader from "@/components/shared/Loader"; // Import new Loader

const addUserSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  displayName: z.string().min(2, { message: "Display name must be at least 2 characters." }),
  role: z.enum(["teacher", "student"], { 
    required_error: "Please select a role for the new user.",
  }),
});

type AddUserFormValues = z.infer<typeof addUserSchema>;

export default function AddUserPage() {
  const router = useRouter();
  const { currentUser, adminCreateUserInSchool, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AddUserFormValues>({
    resolver: zodResolver(addUserSchema),
    defaultValues: {
      email: "",
      password: "",
      displayName: "",
      role: undefined,
    },
  });

  const isLoading = authLoading || isSubmitting;

  async function onSubmit(values: AddUserFormValues) {
    if (!currentUser || !currentUser.schoolId || currentUser.role !== 'admin') {
      toast({ title: "Unauthorized", description: "You are not authorized to perform this action.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    try {
      const newUserProfile = await adminCreateUserInSchool(
        values.email,
        values.password, 
        values.displayName,
        values.role as UserRole, 
        currentUser.schoolId
      );

      if (newUserProfile) {
        toast({
          title: "User Account Created",
          description: `${values.displayName}'s account has been successfully created. They can now log in.`,
        });
        router.push("/admin/users"); 
      } else {
        toast({
          title: "Failed to Add User",
          description: "Could not create the user account. The email might already be in use or an error occurred.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error adding user:", error);
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  if (authLoading && !currentUser) {
    return <div className="flex h-full items-center justify-center"><Loader message="Loading..." size="large" /></div>;
  }

  if (!currentUser || currentUser.role !== 'admin' || !currentUser.schoolId) {
    return <div className="p-4">You must be an admin of a school to add users.</div>;
  }


  return (
    <div className="space-y-6">
       <h1 className="text-3xl font-bold">Add New User</h1>
        <Card className="w-full max-w-lg mx-auto card-shadow">
        <CardHeader>
            <CardTitle className="flex items-center"><UserPlus className="mr-2 h-5 w-5 text-primary"/>Create New User Account</CardTitle>
            <CardDescription>
            Fill in the details to add a new teacher or student to your school.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel htmlFor="displayName">Full Name</FormLabel>
                    <FormControl>
                        <Input id="displayName" placeholder="e.g., Jane Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />

                <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel htmlFor="email">Email Address</FormLabel>
                    <FormControl>
                        <Input id="email" type="email" placeholder="user@example.com" {...field} />
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
                    <FormLabel htmlFor="password">Initial Password</FormLabel>
                    <FormControl>
                        <Input id="password" type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-muted-foreground mt-1">The user should change this password upon first login.</p>
                    </FormItem>
                )}
                />
                
                <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel htmlFor="role">Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value as string | undefined}>
                        <FormControl>
                        <SelectTrigger id="role">
                            <SelectValue placeholder="Select user role" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        <SelectItem value="teacher">Teacher</SelectItem>
                        <SelectItem value="student">Student</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />

                <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 button-shadow"
                disabled={isLoading}
                >
                {isLoading && <Loader size="small" className="mr-2" />}
                Add User to School
                </Button>
            </form>
            </Form>
        </CardContent>
        </Card>
    </div>
  );
}
