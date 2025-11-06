"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAppStore } from '@/store/app-store';
import { departmentOptions, toolOptions } from '@/lib/types';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from '@/hooks/use-toast';
import CustomSelect from './custom-select';

const formSchema = z.object({
  toolName: z.string().min(1, 'Please select a tool.'),
  toolNameCustom: z.string().optional(),
  department: z.string().min(1, 'Please select a department.'),
  departmentCustom: z.string().optional(),
  duration: z.coerce.number().min(1, 'Duration must be at least 1 month.'),
  cost: z.coerce.number().min(0, 'Cost cannot be negative.'),
  purpose: z.string().min(10, 'Purpose must be at least 10 characters.'),
});

interface NewRequestDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function NewRequestDialog({ open, onOpenChange }: NewRequestDialogProps) {
  const { currentUser, addSubscriptionRequest } = useAppStore();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      toolName: '',
      toolNameCustom: '',
      department: currentUser?.department || '',
      departmentCustom: '',
      duration: 12,
      cost: 0,
      purpose: '',
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!currentUser) return;
    addSubscriptionRequest({
      toolName: values.toolNameCustom || values.toolName,
      duration: values.duration,
      cost: values.cost,
      purpose: values.purpose,
      department: values.departmentCustom || values.department,
      requestedBy: currentUser.id,
    });
    toast({
        title: "Request Submitted!",
        description: `Your request for ${values.toolNameCustom || values.toolName} is now pending approval.`,
    })
    form.reset({
      toolName: '',
      toolNameCustom: '',
      department: currentUser?.department || '',
      departmentCustom: '',
      duration: 12,
      cost: 0,
      purpose: '',
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Subscription Request</DialogTitle>
          <DialogDescription>
            Fill out the form below to request a new software subscription.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <CustomSelect
              form={form}
              name="toolName"
              label="Tool Name"
              placeholder="Select a tool"
              options={toolOptions}
            />
             <CustomSelect
              form={form}
              name="department"
              label="Department"
              placeholder="Select a department"
              options={departmentOptions}
            />
             <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Duration (months)</FormLabel>
                        <FormControl>
                            <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="cost"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Total Cost ($)</FormLabel>
                        <FormControl>
                            <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            <FormField
              control={form.control}
              name="purpose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purpose</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Explain why this subscription is needed..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button type="submit">Submit Request</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
