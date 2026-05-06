import React, { useState, useEffect, useCallback } from "react";
import { Input } from "./ui/input";

export type CurrencyInputProps = Omit<React.ComponentProps<"input">, "onChange"> & { 
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void 
};

export function CurrencyInput({
  value,
  onChange,
  className,
  placeholder,
  ...props
}: CurrencyInputProps) {
  const format = useCallback((val: string | number | undefined | null) => {
    if (val === undefined || val === null || val === "") return "";
    
    // Remove all commas for processing
    const numericString = val.toString().replace(/,/g, "");
    const isNegative = numericString.startsWith("-");
    
    // Extract only digits and the first decimal point
    const cleanNumericString = numericString.replace(/[^\d.]/g, "");
    const parts = cleanNumericString.split(".");
    
    // We only care about the first two parts if there are multiple dots
    const integerPart = parts[0];
    const decimalPart = parts.length > 1 ? "." + parts.slice(1).join("").substring(0, 2) : "";
    
    // Add commas to the integer part
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    
    return (isNegative ? "-" : "") + formattedInteger + decimalPart;
  }, []);

  const [displayValue, setDisplayValue] = useState(() => format(value as any));

  useEffect(() => {
    const formatted = format(value as any);
    if (formatted !== displayValue) {
      setDisplayValue(formatted);
    }
  }, [value, format, displayValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputVal = e.target.value;
    
    // Determine if negative
    const isNegative = inputVal.startsWith("-");
    
    // Clean the value for the parent state (no commas)
    const cleanNumericString = inputVal.replace(/[^\d.]/g, "");
    const parts = cleanNumericString.split(".");
    const integerPart = parts[0];
    const decimalPart = parts.length > 1 ? "." + parts.slice(1).join("").substring(0, 2) : "";
    const rawValue = (isNegative ? "-" : "") + integerPart + decimalPart;

    // Immediately update local display state for smoothness
    const formatted = format(rawValue);
    setDisplayValue(formatted);

    // Call parent onChange with the unformatted value
    // Create a minimal fake event object that React components expect
    const newEvent = {
      ...e,
      target: {
        ...e.target,
        value: rawValue,
        name: e.target.name,
        id: e.target.id
      },
      currentTarget: {
        ...e.currentTarget,
        value: rawValue
      }
    };
    
    onChange(newEvent as React.ChangeEvent<HTMLInputElement>);
  };

  return (
    <Input
      type="text"
      value={displayValue}
      onChange={handleChange}
      className={className}
      placeholder={placeholder}
      {...props}
    />
  );
}
