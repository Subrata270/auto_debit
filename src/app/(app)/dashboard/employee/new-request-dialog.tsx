
"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAppStore } from '@/store/app-store';
import { departmentOptions } from '@/lib/types';
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
import { CalendarIcon, Upload } from 'lucide-react';
import { format, addMonths, differenceInCalendarMonths, isValid } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useEffect, useMemo } from 'react';
import { vendorToolMapping, pricingRules, USD_TO_INR_RATE } from '@/lib/pricing';

const formSchema = z.object({
  vendorName: z.string().min(1, 'Vendor name is required.'),
  toolName: z.string().min(1, 'Please select a tool.'),
  toolNameCustom: z.string().optional(),
  frequency: z.enum(['Monthly', 'Quarterly', 'Yearly', 'One-time']),
  amount: z.coerce.number().min(0, 'Amount must be a positive number.'),
  currency: z.enum(['USD', 'INR']),
  startDate: z.date({ required_error: "A start date is required."}),
  endDate: z.date({ required_error: "An end date is required."}),
  poc: z.string().min(1, 'Person of contact is required.'),
  purpose: z.string().min(20, 'Purpose must be at least 20 characters.'),
  department: z.string().min(1, 'Please select a department.'),
  departmentCustom: z.string().optional(),
});

interface NewRequestDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function NewRequestDialog({ open, onOpenChange }: NewRequestDialogProps) {
  const { currentUser, addSubscriptionRequest } = useAppStore();
  const { toast } = useToast();
  const [inrValue, setInrValue] = useState('0.00');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      vendorName: '',
      toolName: '',
      toolNameCustom: '',
      frequency: 'Monthly',
      amount: 0,
      currency: 'USD',
      poc: currentUser?.email || '',
      purpose: '',
      department: currentUser?.department || '',
      departmentCustom: '',
    },
  });

  const { watch, setValue, getValues, trigger } = form;

  const vendorName = watch('vendorName');
  const toolName = watch('toolName');
  const frequency = watch('frequency');
  const amount = watch('amount');
  const currency = watch('currency');
  const startDate = watch('startDate');

  const availableTools = useMemo(() => {
    return vendorToolMapping[vendorName] || [];
  }, [vendorName]);

  // Auto-populate amount based on vendor, tool, and frequency
  useEffect(() => {
    if (vendorName && toolName && frequency) {
      const toolPricing = pricingRules[toolName];
      if (toolPricing) {
        const multipliers = { Monthly: 1, Quarterly: 3, Yearly: 12, 'One-time': 1 };
        const newAmount = toolPricing * multipliers[frequency];
        setValue('amount', newAmount);
        trigger('amount');
      } else {
        setValue('amount', 0); // Default to 0 if no pricing rule exists (e.g., custom tool)
      }
    }
  }, [vendorName, toolName, frequency, setValue, trigger]);

  // Update INR value when amount or currency changes
  useEffect(() => {
    const cost = currency === 'USD' ? amount * USD_TO_INR_RATE : amount;
    setInrValue(cost.toFixed(2));
  }, [amount, currency]);

  // Update End Date when Start Date or Frequency changes
  useEffect(() => {
    if (isValid(startDate) && frequency) {
      const multipliers = { Monthly: 1, Quarterly: 3, Yearly: 12, 'One-time': 1 };
      const durationInMonths = multipliers[frequency];
      const newEndDate = addMonths(startDate, durationInMonths);
      setValue('endDate', newEndDate);
    }
  }, [startDate, frequency, setValue]);
  
  const calculatedDuration = useMemo(() => {
    if (isValid(getValues('startDate')) && isValid(getValues('endDate'))) {
      const months = differenceInCalendarMonths(getValues('endDate'), getValues('startDate'));
      if (months === 0) return "1 month (One-time)";
      if (months === 1) return "1 month";
      if (months === 3) return "3 months";
      if (months === 12) return "12 months";
      return `${months} months`;
    }
    return '';
  }, [watch('startDate'), watch('endDate')]);


  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!currentUser) return;
    
    const costInUSD = values.currency === 'INR' ? values.amount / USD_TO_INR_RATE : values.amount;
    const finalToolName = values.toolName === 'custom' ? values.toolNameCustom : values.toolName;
    const finalDepartment = getValues('department') === 'add-custom' ? getValues('departmentCustom') : getValues('department');

    addSubscriptionRequest({
      toolName: finalToolName!,
      duration: 1, // This can be derived from start/end date if needed
      cost: costInUSD,
      purpose: values.purpose,
      department: finalDepartment!,
      requestedBy: currentUser.id,
      vendorName: values.vendorName,
    });
    toast({
        title: "Request Submitted!",
        description: `Your request for ${finalToolName} is now pending approval.`,
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

                    <CustomSelect
                        form={form}
                        name="toolName"
                        label="Tool Name"
                        placeholder="Select a tool"
                        options={availableTools}
                    />

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
                    
                    <FormItem>
                        <FormLabel>Equivalent In</FormLabel>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                                {getValues('currency') === 'USD' ? '₹' : '$'}
                            </span>
                            <Input readOnly value={getValues('currency') === 'USD' ? inrValue : (amount / USD_TO_INR_RATE).toFixed(2)} className="pl-7 bg-muted" />
                        </div>
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
                 <div className="col-span-1 md:col-span-2">
                     <FormItem>
                        <FormLabel>Attachment (Optional)</FormLabel>
                        <FormControl>
                            <div className="relative flex items-center justify-center w-full">
                                <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/80">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                                        <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                        <p className="text-xs text-muted-foreground">PDF, PNG, JPG or GIF (MAX. 800x400px)</p>
                                    </div>
                                    <Input id="file-upload" type="file" className="hidden" />
                                </label>
                            </div> 
                        </FormControl>
                        <FormMessage />
                     </FormItem>
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

    