import { useMemo } from 'react';

interface Customer {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
}

interface NewCustomerForm {
  name: string;
  phone: string;
  email?: string;
  address?: string;
}

export function useCustomerDuplicates(customers: Customer[], form: NewCustomerForm) {
  return useMemo(() => {
    if (!form.name && !form.phone && !form.address) return null;

    const cleanPhone = (p: string) => p.replace(/\D/g, '');
    const inputPhoneClean = cleanPhone(form.phone);
    const inputNameLower = form.name.toLowerCase().trim();
    const inputAddressLower = (form.address || '').toLowerCase().trim();

    for (const customer of customers) {
      // 1. Phone Match (High Priority)
      if (inputPhoneClean && customer.phone) {
        const custPhoneClean = cleanPhone(customer.phone);
        if (custPhoneClean === inputPhoneClean) {
          return { customer, reason: 'Phone number matches' };
        }
      }

      // 2. Name Match (Medium Priority - only if name is reasonably long)
      if (inputNameLower.length > 3 && customer.name.toLowerCase().includes(inputNameLower)) {
         // If it's an exact name match, suggest it
         if (customer.name.toLowerCase() === inputNameLower) {
            return { customer, reason: 'Exact name match' };
         }
      }

      // 3. Address Match (Low Priority - only if address is long)
      if (inputAddressLower.length > 8 && customer.address) {
        if (customer.address.toLowerCase().includes(inputAddressLower) || inputAddressLower.includes(customer.address.toLowerCase())) {
          return { customer, reason: 'Similar address' };
        }
      }
    }

    return null;
  }, [customers, form.name, form.phone, form.address]);
}
