import { AlertCircle, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Customer {
  id: string;
  name: string;
  phone?: string | null;
}

interface CustomerSuggestionProps {
  suggestion: { customer: Customer; reason: string } | null;
  onSelect: (customerId: string) => void;
}

export function CustomerSuggestion({ suggestion, onSelect }: CustomerSuggestionProps) {
  if (!suggestion) return null;

  return (
    <div className="mt-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 animate-in fade-in slide-in-from-top-1 duration-300">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-[10px] font-bold text-amber-600 uppercase tracking-tight">
            Potential Duplicate Found ({suggestion.reason})
          </p>
          <p className="text-xs font-medium mt-1">
            It looks like <span className="font-bold">{suggestion.customer.name}</span> {suggestion.customer.phone ? `(${suggestion.customer.phone})` : ""} is already in the system.
          </p>
          <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            onClick={() => onSelect(suggestion.customer.id)}
            className="mt-2 h-7 text-[10px] font-bold uppercase text-amber-500 hover:bg-amber-500/10 rounded-lg gap-2 px-3"
          >
            <UserCheck className="w-3 h-3" /> Use Existing Customer instead
          </Button>
        </div>
      </div>
    </div>
  );
}
