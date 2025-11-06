"use client";

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { ArrowRight, Loader2, LogIn } from 'lucide-react';

import { Role, SubRole } from '@/lib/types';
import { useAppStore } from '@/store/app-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { mockUsers } from '@/lib/data';


interface LoginFormProps {
  role: Role;
  title: string;
  subRoleOptions?: SubRole[];
}

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
  subrole: z.string().optional(),
});

export default function LoginForm({ role, title, subRoleOptions }: LoginFormProps) {
  const [isPending, startTransition] = useTransition();
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();
  const { login } = useAppStore();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: mockUsers.find(u => u.role === role)?.email || '',
      password: 'password',
      subrole: subRoleOptions ? subRoleOptions[0] : undefined,
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    startTransition(() => {
      const user = login(values.email, values.password, role, values.subrole as SubRole);
      if (user) {
        setIsSuccess(true);
        toast({
          title: "Login Successful",
          description: `Welcome back, ${user.name}!`,
        });
        setTimeout(() => router.push(`/dashboard/${role}`), 1200);
      } else {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: "Invalid credentials or wrong portal. Please try again.",
        });
        form.setError("root", { message: "Invalid credentials" });
      }
    });
  };

  const cardVariants = {
    initial: { opacity: 0, y: 50, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: "easeOut" } },
    exit: { opacity: 0, scale: 1.1, transition: { duration: 0.3, ease: "easeIn" } },
  };

  return (
    <motion.div initial="initial" animate="animate" variants={cardVariants}>
      <Card className="w-full max-w-sm min-w-[380px] overflow-hidden">
        <div className="p-1 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20"></div>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription>Enter your credentials to access the portal</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="name@example.com" {...field} />
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
              {subRoleOptions && (
                <FormField
                  control={form.control}
                  name="subrole"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sub-Role</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your sub-role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {subRoleOptions.map((subRole) => (
                            <SelectItem key={subRole} value={subRole!}>
                              {subRole?.toUpperCase()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <Button type="submit" className="w-full group" disabled={isPending || isSuccess}>
                {isPending ? (
                  <Loader2 className="animate-spin" />
                ) : isSuccess ? (
                  "Redirecting..."
                ) : (
                  <>
                    Login <LogIn className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
