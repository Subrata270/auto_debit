"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAppStore } from '@/store/app-store';
import { Subscription } from '@/lib/types';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { useState } from 'react';

const formSchema = z.object({
  renewalDuration: z.coerce.number().min(1, 'Duration must be at least 1 month.'),
  updatedCost: z.coerce.number().min(0, 'Cost cannot be negative.'),
  remarks: z.string().optional(),
});

interface RenewRequestDialogProps {
    subscription: Subscription;
    trigger: React.ReactNode;
}

export default function RenewRequestDialog({ subscription, trigger }: RenewRequestDialogProps) {
  const { renewSubscription } = useAppStore();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      renewalDuration: subscription.duration,
      updatedCost: subscription.cost,
      remarks: '',
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    renewSubscription(subscription.id, values.renewalDuration, values.updatedCost, values.remarks || '');
    toast({
        title: "Renewal Request Submitted!",
        description: `Your renewal request for ${subscription.toolName} is pending approval.`,
    })
    form.reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Renew Existing Subscription</DialogTitle>
          <DialogDescription>
            Renewing subscription for <strong>{subscription.toolName}</strong>.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="renewalDuration"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Renewal Duration</FormLabel>
                        <FormControl>
                            <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="updatedCost"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Updated Cost ($)</FormLabel>
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
              name="remarks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Remarks (optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Any additional comments..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit">Submit Renewal</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
