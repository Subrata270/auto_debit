
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
import { useState } from "react";

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
  const [showCustom, setShowCustom] = useState(false);

  const handleValueChange = (value: string) => {
    if (value === 'add-custom') {
      setShowCustom(true);
      form.setValue(name, '');
    } else {
      setShowCustom(false);
      form.setValue(name, value);
      form.setValue(customInputName, ''); // Clear custom input if a real option is selected
    }
  };

  const selectedValue = form.watch(name);
  const customValue = form.watch(customInputName);

  return (
    <div>
        <FormField
        control={form.control}
        name={name}
        render={({ field }) => (
            <FormItem>
            <FormLabel>{label}</FormLabel>
            <Select onValueChange={handleValueChange} value={showCustom ? 'add-custom' : field.value}>
                <FormControl>
                <SelectTrigger>
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                </FormControl>
                <SelectContent>
                {options.map(option => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
                <SelectItem value="add-custom" className="text-primary font-semibold">
                    + Add Custom {label}
                </SelectItem>
                </SelectContent>
            </Select>
            <FormMessage />
            </FormItem>
        )}
        />
        {showCustom && (
            <FormField
                control={form.control}
                name={customInputName}
                render={({ field }) => (
                    <FormItem className="mt-2">
                    <FormControl>
                        <Input autoFocus placeholder={`Enter custom ${label.toLowerCase()}`} {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
        )}
    </div>
  );
}
