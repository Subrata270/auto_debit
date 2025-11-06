
"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAppStore } from '@/store/app-store';
import { Subscription, departmentOptions } from '@/lib/types';
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
import { useState, useEffect, useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon, Upload } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { addMonths, differenceInCalendarMonths, format, isValid } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { pricingRules, USD_TO_INR_RATE } from '@/lib/pricing';

const formSchema = z.object({
  vendorName: z.string().min(1, 'Vendor name is required.'),
  toolName: z.string().min(1, 'Tool name is required.'),
  frequency: z.enum(['Monthly', 'Quarterly', 'Yearly', 'One-time']),
  amount: z.coerce.number().min(0, 'Amount must be a positive number.'),
  currency: z.enum(['USD', 'INR']),
  startDate: z.date({ required_error: "A start date is required."}),
  endDate: z.date({ required_error: "An end date is required."}),
  department: z.string().min(1, 'Please select a department.'),
  purpose: z.string().min(1, "A brief purpose is required."),
  justification: z.string().min(20, 'Justification must be at least 20 characters.'),
});

interface RenewRequestDialogProps {
    subscription: Subscription;
    trigger: React.ReactNode;
}

export default function RenewRequestDialog({ subscription, trigger }: RenewRequestDialogProps) {
  const { renewSubscription, currentUser } = useAppStore();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [inrValue, setInrValue] = useState('₹0.00');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      vendorName: subscription.vendorName || '',
      toolName: subscription.toolName,
      frequency: 'Yearly', // Default to yearly for renewals
      amount: subscription.cost,
      currency: 'USD',
      startDate: new Date(),
      endDate: addMonths(new Date(), 12), // Default renewal duration
      department: currentUser?.department || subscription.department,
      purpose: subscription.purpose,
      justification: '',
    },
  });

  const { watch, setValue, getValues, trigger, reset } = form;

  // Watch for changes in relevant fields
  const watchedAmount = watch('amount');
  const watchedCurrency = watch('currency');
  const watchedStartDate = watch('startDate');
  const watchedEndDate = watch('endDate');
  const watchedFrequency = watch('frequency');
  const watchedToolName = watch('toolName');

  // Recalculate Amount based on pricing rules when tool or frequency changes
  useEffect(() => {
      const toolPricing = pricingRules[watchedToolName as keyof typeof pricingRules];
      if (toolPricing) {
        const multipliers = { Monthly: 1, Quarterly: 3, Yearly: 12, 'One-time': 1 };
        const newAmount = toolPricing * multipliers[watchedFrequency];
        setValue('amount', newAmount);
        trigger('amount');
      }
  }, [watchedToolName, watchedFrequency, setValue, trigger]);

  // Recalculate INR value when amount or currency changes
  useEffect(() => {
    const amountInUSD = watchedCurrency === 'INR' ? watchedAmount / USD_TO_INR_RATE : watchedAmount;
    const amountInINR = amountInUSD * USD_TO_INR_RATE;

    const formattedINR = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amountInINR);
    setInrValue(formattedINR);
  }, [watchedAmount, watchedCurrency]);
  
  // Sync End Date when Start Date or Frequency changes
  useEffect(() => {
    if (isValid(watchedStartDate) && watchedFrequency) {
      const multipliers = { Monthly: 1, Quarterly: 3, Yearly: 12, 'One-time': 1 };
      const durationInMonths = multipliers[watchedFrequency];
      if (durationInMonths > 0) {
        const newEndDate = addMonths(watchedStartDate, durationInMonths);
        setValue('endDate', newEndDate);
      }
    }
  }, [watchedStartDate, watchedFrequency, setValue]);

  // Calculate duration for display
  const calculatedDuration = useMemo(() => {
    if (isValid(watchedStartDate) && isValid(watchedEndDate)) {
        let months = differenceInCalendarMonths(watchedEndDate, watchedStartDate);
        if (months <= 0) months = 1;

        if (months === 1) return "1 month";
        if (months === 3) return "3 months";
        if (months === 12) return "12 months";
        return `${months} months`;
    }
    return '';
  }, [watchedStartDate, watchedEndDate]);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      reset({
        vendorName: subscription.vendorName || '',
        toolName: subscription.toolName,
        frequency: 'Yearly',
        amount: subscription.cost,
        currency: 'USD',
        startDate: new Date(),
        endDate: addMonths(new Date(), 12),
        department: currentUser?.department || subscription.department,
        purpose: subscription.purpose,
        justification: '',
      });
    }
  }, [open, reset, subscription, currentUser]);


  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const durationInMonths = differenceInCalendarMonths(values.endDate, values.startDate) || 1;
    
    renewSubscription(subscription.id, durationInMonths, values.amount, values.justification);
    toast({
        title: "Renewal Request Submitted!",
        description: `Your renewal request for ${subscription.toolName} is pending approval.`,
    })
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="w-[95%] sm:w-[90%] md:max-w-3xl rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl group">
            Renew Subscription for {subscription.toolName}
            <span className="block h-0.5 max-w-0 bg-primary transition-all duration-500 group-hover:max-w-full"></span>
          </DialogTitle>
          <DialogDescription>
            Provide the renewal details below.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                    <FormField
                        control={form.control}
                        name="vendorName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Vendor Name</FormLabel>
                                <FormControl>
                                    <Input readOnly className="bg-muted" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="toolName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tool Name</FormLabel>
                                <FormControl>
                                     <Input readOnly className="bg-muted" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="frequency"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Frequency</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger><SelectValue placeholder="Select frequency" /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="Monthly">Monthly</SelectItem>
                                        <SelectItem value="Quarterly">Quarterly</SelectItem>
                                        <SelectItem value="Yearly">Yearly</SelectItem>
                                        <SelectItem value="One-time">One-time</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="flex items-end gap-2">
                        <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem className="flex-1">
                                    <FormLabel>Amount</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                                                {getValues('currency') === 'USD' ? '$' : '₹'}
                                            </span>
                                            <Input type="number" step="0.01" {...field} className="pl-7" />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="currency"
                            render={({ field }) => (
                                <FormItem>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                    <SelectTrigger className="w-[80px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="USD">USD</SelectItem>
                                        <SelectItem value="INR">INR</SelectItem>
                                    </SelectContent>
                                </Select>
                                </FormItem>
                            )}
                        />
                    </div>
                    
                    <FormItem className="md:col-span-2">
                        <FormLabel>Equivalent In INR</FormLabel>
                        <Input readOnly value={inrValue} className="pl-3 bg-muted font-semibold" />
                        <p className="text-xs text-muted-foreground pt-1">Rate: 1 USD = {USD_TO_INR_RATE} INR. Auto-calculated.</p>
                    </FormItem>

                    <div className='md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-6 items-end'>
                         <FormField
                            control={form.control}
                            name="startDate"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Start Date</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                            variant={"outline"}
                                            className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                                            >
                                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="endDate"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>End Date</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                            variant={"outline"}
                                            className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                                            >
                                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < (getValues('startDate') || new Date("1900-01-01"))} initialFocus />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormItem>
                            <FormLabel>Duration</FormLabel>
                            <Input readOnly value={calculatedDuration} className="bg-muted" />
                        </FormItem>
                    </div>

                    <FormField
                        control={form.control}
                        name="department"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Department</FormLabel>
                                 <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger><SelectValue placeholder="Select a department" /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {departmentOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    
                    <FormField
                        control={form.control}
                        name="purpose"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Purpose</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., For marketing campaign assets" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                
                <div className="col-span-1 md:col-span-2">
                    <FormField
                    control={form.control}
                    name="justification"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Justification — Explain why this renewal is needed and its benefit.</FormLabel>
                        <FormControl>
                            <Textarea rows={4} placeholder="e.g. This tool continues to be critical for our team's workflow..." {...field} />
                        </FormControl>
                         <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>

                <div className="col-span-1 md:col-span-2">
                     <FormItem>
                        <FormLabel>Attachment (Optional)</FormLabel>
                        <FormControl>
                            <div className="relative flex items-center justify-center w-full">
                                <label htmlFor="file-upload-renew" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/80">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                                        <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                        <p className="text-xs text-muted-foreground">PDF, PNG, JPG or GIF</p>
                                    </div>
                                    <Input id="file-upload-renew" type="file" className="hidden" />
                                </label>
                            </div> 
                        </FormControl>
                        <FormMessage />
                     </FormItem>
                </div>
                
                <DialogFooter className="pt-8">
                    <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button type="submit" className="bg-gradient-to-r from-primary to-accent text-white transition-transform duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/30">Submit Renewal</Button>
                </DialogFooter>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

    