import * as React from "react";
import { Check, ChevronsUpDown, Search, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Customer {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
}

interface CustomerSelectProps {
  customers: Customer[];
  value: string;
  onValueChange: (value: string) => void;
  onAddNew?: () => void;
  placeholder?: string;
  emptyText?: string;
  className?: string;
}

export function CustomerSelect({
  customers,
  value,
  onValueChange,
  onAddNew,
  placeholder = "Select customer...",
  emptyText = "No customer found.",
  className,
}: CustomerSelectProps) {
  const [open, setOpen] = React.useState(false);

  const selectedCustomer = customers.find((c) => c.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between rounded-xl h-11 bg-background/50 border-white/10 px-4", className)}
        >
          <span className="truncate">
            {selectedCustomer ? selectedCustomer.name : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-xl glass-panel border-white/10 shadow-2xl">
        <Command className="bg-transparent">
          <CommandInput placeholder="Search customers..." className="h-11" />
          <CommandList className="max-h-[300px]">
            <CommandEmpty className="p-4 flex flex-col items-center gap-2">
              <p className="text-sm text-muted-foreground">{emptyText}</p>
              {onAddNew && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-primary hover:text-primary hover:bg-primary/10 rounded-lg gap-2"
                  onClick={() => {
                    onAddNew();
                    setOpen(false);
                  }}
                >
                  <UserPlus className="h-4 w-4" /> Add New Customer
                </Button>
              )}
            </CommandEmpty>
            <CommandGroup>
              {onAddNew && (
                <CommandItem
                  onSelect={() => {
                    onAddNew();
                    setOpen(false);
                  }}
                  className="rounded-lg mb-1 cursor-pointer flex items-center gap-2 text-primary font-medium"
                >
                  <UserPlus className="h-4 w-4" /> Add New Customer
                </CommandItem>
              )}
              {customers.map((customer) => (
                <CommandItem
                  key={customer.id}
                  value={customer.name}
                  onSelect={() => {
                    onValueChange(customer.id);
                    setOpen(false);
                  }}
                  className="rounded-lg mb-1 cursor-pointer flex items-center justify-between"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{customer.name}</span>
                    {customer.phone && <span className="text-[10px] text-muted-foreground">{customer.phone}</span>}
                  </div>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      value === customer.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
