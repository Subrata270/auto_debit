"use client";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";

interface CustomSelectProps {
  form: UseFormReturn<any>;
  name: string;
  label: string;
  placeholder: string;
  options: string[];
}

export default function CustomSelect({
  form,
  name,
  label,
  placeholder,
  options,
}: CustomSelectProps) {
  const customInputName = `${name}Custom`;

  const selectedValue = form.watch(name);
  const customValue = form.watch(customInputName);
  const displayValue = customValue || selectedValue;
  const source = customValue ? 'custom' : (selectedValue ? 'dropdown' : '');

  return (
    <div>
        <FormField
        control={form.control}
        name={name}
        render={({ field }) => (
            <FormItem>
            <FormLabel>{label}</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                <SelectTrigger>
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                </FormControl>
                <SelectContent>
                {options.map(option => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
                </SelectContent>
            </Select>
            <FormMessage />
            </FormItem>
        )}
        />
        <FormField
            control={form.control}
            name={customInputName}
            render={({ field }) => (
                <FormItem className="mt-2">
                <FormLabel className="text-xs text-muted-foreground">Or enter custom {label.toLowerCase()}</FormLabel>
                <FormControl>
                    <Input placeholder={`Custom ${label.toLowerCase()}`} {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
        />
         {displayValue && (
          <p className="mt-2 text-xs text-muted-foreground">
            Using: {displayValue} ({source})
          </p>
        )}
    </div>
  );
}