
"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter, useParams } from "next/navigation";
import { UserCog, Save } from "lucide-react";

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
import type { UserProfileWithId, UserRole } from "@/types";
import Link from "next/link";
import Loader from "@/components/shared/Loader"; // Import new Loader

const editUserSchema = z.object({
  displayName: z.string().min(2, { message: "Display name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }).readonly(), 
  role: z.enum(["admin", "teacher", "student"], {
    required_error: "Please select a role.",
  }),
});

type EditUserFormValues = z.infer<typeof editUserSchema>;

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;

  const { currentUser, getUserProfile, updateUserRoleAndSchool, updateUserDisplayName, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userData, setUserData] = useState<UserProfileWithId | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  const form = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      displayName: "",
      email: "",
      role: undefined,
    },
  });

  useEffect(() => {
    if (userId) {
      const fetchUser = async () => {
        setIsLoadingUser(true);
        const profile = await getUserProfile(userId);
        if (profile) {
          setUserData(profile);
          form.reset({
            displayName: profile.displayName || "",
            email: profile.email || "",
            role: profile.role || undefined,
          });
        } else {
          toast({ title: "Error", description: "User not found.", variant: "destructive" });
          router.push("/admin/users");
        }
        setIsLoadingUser(false);
      };
      fetchUser();
    }
  }, [userId, getUserProfile, form, router, toast]);

  const pageIsLoading = authLoading || isLoadingUser; // Combined loading state for the page content

  async function onSubmit(values: EditUserFormValues) {
    if (!currentUser || currentUser.role !== 'admin' || !userData || !currentUser.schoolId) {
      toast({ title: "Unauthorized", description: "Action not allowed.", variant: "destructive" });
      return;
    }
    if (userData.schoolId !== currentUser.schoolId) {
      toast({ title: "Error", description: "Cannot edit users outside your school.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    let profileUpdated = false;
    let roleUpdated = false;

    if (values.displayName !== userData.displayName) {
      profileUpdated = await updateUserDisplayName(userId, values.displayName);
    } else {
      profileUpdated = true; 
    }

    if (values.role !== userData.role) {
      roleUpdated = await updateUserRoleAndSchool(userId, { role: values.role as UserRole });
    } else {
      roleUpdated = true; 
    }

    if (profileUpdated && roleUpdated) {
      toast({
        title: "User Updated",
        description: `${values.displayName}'s profile has been successfully updated.`,
      });
      router.push("/admin/users");
    } else {
      toast({
        title: "Update Failed",
        description: "Could not update user details. Please try again.",
        variant: "destructive",
      });
    }
    setIsSubmitting(false);
  }
  
  if (pageIsLoading) {
    return <div className="flex h-full items-center justify-center"><Loader message="Loading user data..." size="large" /></div>;
  }

  if (!userData) {
    return <div className="p-4 text-center">User data could not be loaded. <Link href="/admin/users" className="text-primary hover:underline">Go back to users list.</Link></div>;
  }
  
  const canEditRole = !(currentUser?.uid === userId && (userData.role === 'admin' || userData.uid === userData.school?.adminId));


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Edit User Profile</h1>
      <Card className="w-full max-w-lg mx-auto card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center"><UserCog className="mr-2 h-5 w-5 text-primary"/>Modify User Details</CardTitle>
          <CardDescription>
            Update the user's display name and role. Email cannot be changed here.
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
                    <FormLabel htmlFor="displayNameEdit">Full Name</FormLabel>
                    <FormControl>
                      <Input id="displayNameEdit" placeholder="e.g., Jane Doe" {...field} />
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
                    <FormLabel htmlFor="emailEdit">Email Address</FormLabel>
                    <FormControl>
                      <Input id="emailEdit" type="email" {...field} readOnly className="bg-muted/50"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="roleEdit">Role</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value as string | undefined} 
                      disabled={!canEditRole || isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger id="roleEdit" className={!canEditRole ? "bg-muted/50" : ""}>
                          <SelectValue placeholder="Select user role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="teacher">Teacher</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    {!canEditRole && <p className="text-xs text-muted-foreground mt-1">This user's role cannot be changed.</p>}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 button-shadow"
                disabled={isSubmitting || !form.formState.isDirty}
              >
                {isSubmitting && <Loader size="small" className="mr-2" />}
                <Save className="mr-2 h-4 w-4"/> Save Changes
              </Button>
            </form>
          </Form>
        </CardContent>
         <CardFooter>
            <Button variant="outline" asChild className="w-full">
                <Link href="/admin/users">Cancel</Link>
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
