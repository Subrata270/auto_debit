
"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAppStore } from '@/store/app-store';
import { departmentOptions, toolOptions, categoryOptions } from '@/lib/types';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useEffect } from 'react';

const formSchema = z.object({
  toolName: z.string().min(1, 'Please select a tool.'),
  toolNameCustom: z.string().optional(),
  vendorName: z.string().min(1, 'Vendor name is required.'),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0.'),
  currency: z.enum(['USD', 'INR']),
  frequency: z.enum(['Monthly', 'Quarterly', 'Yearly', 'One-time']),
  startDate: z.date({ required_error: "A start date is required."}),
  endDate: z.date({ required_error: "An end date is required."}),
  category: z.string().min(1, 'Please select a category.'),
  department: z.string().min(1, 'Please select a department.'),
  departmentCustom: z.string().optional(),
  poc: z.string().min(1, 'Person of contact is required.'),
  purpose: z.string().min(10, 'Purpose must be at least 10 characters.'),
});

interface NewRequestDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const USD_TO_INR_RATE = 83;

export default function NewRequestDialog({ open, onOpenChange }: NewRequestDialogProps) {
  const { currentUser, addSubscriptionRequest } = useAppStore();
  const { toast } = useToast();
  const [inrValue, setInrValue] = useState('0.00');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      toolName: '',
      toolNameCustom: '',
      vendorName: '',
      amount: 0,
      currency: 'USD',
      frequency: 'Monthly',
      category: '',
      department: currentUser?.department || '',
      departmentCustom: '',
      poc: currentUser?.email || '',
      purpose: '',
    },
  });

  const amount = form.watch('amount');
  const currency = form.watch('currency');

  useEffect(() => {
    let newInrValue = 0;
    if (currency === 'USD') {
        newInrValue = amount * USD_TO_INR_RATE;
    } else { // currency is INR
        newInrValue = amount;
    }
    setInrValue(newInrValue.toFixed(2));
  }, [amount, currency]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!currentUser) return;
    
    const costInUSD = values.currency === 'INR' ? values.amount / USD_TO_INR_RATE : values.amount;

    addSubscriptionRequest({
      toolName: values.toolNameCustom || values.toolName,
      duration: 1, // This can be calculated from start/end date if needed
      cost: costInUSD,
      purpose: values.purpose,
      department: values.departmentCustom || values.department,
      requestedBy: currentUser.id,
      // Pass other new values if needed in addSubscriptionRequest
    });
    toast({
        title: "Request Submitted!",
        description: `Your request for ${values.toolNameCustom || values.toolName} is now pending approval.`,
    })
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95%] sm:w-[90%] md:max-w-3xl rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl group">
            New Subscription Request
            <span className="block h-0.5 max-w-0 bg-primary transition-all duration-500 group-hover:max-w-full"></span>
          </DialogTitle>
          <DialogDescription>
            Fill out the form below to request a new software subscription.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                    
                    <CustomSelect
                        form={form}
                        name="toolName"
                        label="Tool Name"
                        placeholder="Select a tool"
                        options={toolOptions}
                    />

                    <FormField
                        control={form.control}
                        name="vendorName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Vendor Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., Adobe Inc." {...field} />
                                </FormControl>
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
                                                {form.getValues('currency') === 'USD' ? '$' : '₹'}
                                            </span>
                                            <Input type="number" {...field} className="pl-7" />
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
                    
                    <FormItem>
                        <FormLabel>Equivalent In</FormLabel>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                                {form.getValues('currency') === 'USD' ? '₹' : '$'}
                            </span>
                            <Input readOnly value={form.getValues('currency') === 'USD' ? inrValue : (amount / USD_TO_INR_RATE).toFixed(2)} className="pl-7 bg-muted" />
                        </div>
                    </FormItem>


                    <FormField
                        control={form.control}
                        name="frequency"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Frequency</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select frequency" />
                                        </SelectTrigger>
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
                    
                     <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Category</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a category" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {categoryOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    
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
                                        className={cn(
                                            "w-full pl-3 text-left font-normal",
                                            !field.value && "text-muted-foreground"
                                        )}
                                        >
                                        {field.value ? (
                                            format(field.value, "PPP")
                                        ) : (
                                            <span>Pick a date</span>
                                        )}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            disabled={(date) => date < new Date("1900-01-01") }
                                            initialFocus
                                        />
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
                                        className={cn(
                                            "w-full pl-3 text-left font-normal",
                                            !field.value && "text-muted-foreground"
                                        )}
                                        >
                                        {field.value ? (
                                            format(field.value, "PPP")
                                        ) : (
                                            <span>Pick a date</span>
                                        )}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            disabled={(date) => date < (form.getValues('startDate') || new Date("1900-01-01"))}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <CustomSelect
                        form={form}
                        name="department"
                        label="Department"
                        placeholder="Select a department"
                        options={departmentOptions}
                    />

                    <FormField
                        control={form.control}
                        name="poc"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>POC (Person of Contact)</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., poc@example.com" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                </div>
                
                <div className="col-span-1 md:col-span-2">
                    <FormField
                    control={form.control}
                    name="purpose"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Purpose & Justification</FormLabel>
                        <FormControl>
                            <Textarea rows={4} placeholder="Explain why this subscription is needed and how it supports your department's goals..." {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
                
                <DialogFooter className="pt-8">
                    <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button type="submit" className="bg-gradient-to-r from-primary to-accent text-white transition-transform duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/30">Submit Request</Button>
                </DialogFooter>
            </form>
            </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
