import { useState, useMemo } from "react";
import logoAsset from "@/assets/logo.png";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { CustomerSelect } from "@/components/CustomerSelect";
import { CurrencyInput } from "@/components/CurrencyInput";
import { useAuth } from "@/hooks/useAuth";
import { canEdit } from "@/lib/permissions";
import { toast } from "sonner";
import { 
  PlusCircle, Search, Printer, Trash2, FileText, FileSignature, Car, 
  BarChart3, Package, Settings, ExternalLink, X
} from "lucide-react";
import { getPrintHeaderHTML, getPrintWatermarkHTML } from "@/components/PrintHeader";
import { getPrintFooterHTML } from "@/components/PrintFooter";
import { numberToWords } from "@/lib/numberToWords";
import { logAction } from "@/lib/logger";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Download, Mail } from "lucide-react";

export default function PerformanceQuotes() {
  const { role } = useAuth();
  const hasEdit = canEdit(role, "performance-quotes");
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // New Quote Form State
  const [customerMode, setCustomerMode] = useState<"existing" | "manual">("existing");
  const [customerId, setCustomerId] = useState("");
  const [manualCustomer, setManualCustomer] = useState({ name: "", phone: "", email: "", address: "" });
  const [selectedVehicles, setSelectedVehicles] = useState<{
    id: string;
    make: string;
    model: string;
    year: string;
    vin: string;
    base_price: string;
    has_duty: boolean;
    duty_price: string;
    quantity: number;
  }[]>([]);
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Queries
  const { data: quotes = [], isLoading: loadingQuotes } = useQuery({
    queryKey: ["performance_quotes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("performance_quotes" as any)
        .select(`
          *,
          customers (*),
          performance_quote_items (*, vehicles (*))
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles" as any)
        .select("id, make, model, year, trim, color, vin, price")
        .eq("status", "Available")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("customers").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  // Mutations
  const createQuoteMutation = useMutation({
    mutationFn: async () => {
      let finalCustomerId = customerId;

      // Handle manual customer creation
      if (customerMode === "manual") {
        if (!manualCustomer.name.trim()) throw new Error("Customer name is required");
        const { data: cust, error: custErr } = await supabase
          .from("customers")
          .insert({
            name: manualCustomer.name.trim(),
            phone: manualCustomer.phone.trim() || null,
            email: manualCustomer.email.trim() || null,
            address: manualCustomer.address.trim() || null,
          })
          .select()
          .single();
        if (custErr) throw custErr;
        finalCustomerId = cust.id;
      } else {
        if (!finalCustomerId) throw new Error("Please select a customer");
      }

      if (selectedVehicles.length === 0) throw new Error("Please select at least one vehicle");

      // Calculate total
      const totalAmount = selectedVehicles.reduce((sum, v) => {
        const qty = v.quantity || 1;
        return sum + ((Number(v.base_price) || 0) * qty) + (v.has_duty ? ((Number(v.duty_price) || 0) * qty) : 0);
      }, 0);

      // Create Quote
      const response: any = await supabase
        .from("performance_quotes" as any)
        .insert({
          customer_id: finalCustomerId,
          total_amount: totalAmount,
          notes: notes.trim() || null,
        })
        .select()
        .single();
      const quote = response.data;
      const quoteErr = response.error;
      if (quoteErr) throw quoteErr;

      // Create Quote Items
      const items = selectedVehicles.map((v) => ({
        quote_id: quote.id,
        vehicle_id: v.id,
        base_price: Number(v.base_price) || 0,
        has_duty: v.has_duty,
        duty_price: Number(v.duty_price) || 0,
        quantity: Number(v.quantity) || 1,
      }));

      const { error: itemsErr } = await supabase.from("performance_quote_items" as any).insert(items);
      if (itemsErr) throw itemsErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performance_quotes"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      logAction("CREATE", "Performance Quote");
      toast.success("Performance quote created successfully");
      closeDialog();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create quote");
    },
    onSettled: () => setIsSubmitting(false),
  });

  const deleteQuoteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("performance_quotes" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["performance_quotes"] });
      logAction("DELETE", "Performance Quote", id);
      toast.success("Quote deleted successfully");
    },
    onError: () => toast.error("Failed to delete quote"),
  });

  const closeDialog = () => {
    setDialogOpen(false);
    setCustomerMode("existing");
    setCustomerId("");
    setManualCustomer({ name: "", phone: "", email: "", address: "" });
    setSelectedVehicles([]);
    setNotes("");
    setVehicleSearch("");
  };

  const handleAddVehicle = (v: any) => {
    if (selectedVehicles.some((sv) => sv.id === v.id)) return;
    setSelectedVehicles([...selectedVehicles, {
      id: v.id,
      make: v.make,
      model: v.model,
      year: v.year,
      vin: v.vin,
      base_price: v.price?.toString() || "0",
      has_duty: false,
      duty_price: "0",
      quantity: 1,
    }]);
    setVehicleSearch("");
  };

  const handleRemoveVehicle = (id: string) => {
    setSelectedVehicles(selectedVehicles.filter(v => v.id !== id));
  };

  const updateVehicleData = (id: string, field: string, value: any) => {
    setSelectedVehicles(selectedVehicles.map(v => 
      v.id === id ? { ...v, [field]: value } : v
    ));
  };

  const downloadQuotePDF = async (quote: any, isEmail = false) => {
    const filename = `quote-${quote.id.slice(0,8)}-${Date.now()}`;
    try {
      if (isEmail) toast.loading("Preparing quote link for email...", { id: "quote-dl" });
      else toast.loading("Preparing quote download...", { id: "quote-dl" });

      let logoBase64 = '';
      try {
        const response = await fetch(logoAsset);
        const blob = await response.blob();
        logoBase64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      } catch (e) { console.error("Logo load error:", e); }

      // Reuse the existing HTML generation logic but wrapped in a function or just copied here for now
      // (Ideally we should refactor getQuoteHTML but I'll implement it here for speed)
      const html = `<html><head><title>Performance Quote - ${quote.id.slice(0,8).toUpperCase()}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700;900&display=swap');
        body { font-family: 'Roboto', 'Arial', sans-serif; padding: 15px; max-width: 800px; margin: 0 auto; color: #1a1a1a; line-height: 1.3; }
        .date-section { text-align: right; font-weight: 800; font-size: 13px; margin-bottom: 15px; text-transform: uppercase; }
        .bill-to { margin-bottom: 20px; }
        .bill-to p { margin: 2px 0; font-size: 13px; }
        .main-container { position: relative; padding: 20px; }
        .content-wrapper { position: relative; z-index: 1; }
        .bill-title { text-align: center; text-decoration: underline; font-weight: 900; font-size: 20px; margin-bottom: 20px; color: #1e293b; text-transform: uppercase; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #475569; padding: 8px 10px; text-align: left; font-size: 13px; font-weight: 600; }
        th { text-transform: uppercase; }
        .total-row td { border-top: 3px solid #1e293b; font-weight: 900; font-size: 16px; }
        .amount-words { font-weight: 900; margin-bottom: 20px; font-size: 14px; text-transform: uppercase; }
        .notes-box { font-size: 12px; color: #475569; background: transparent; padding: 12px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e2e8f0; }
        .signature-area { display: flex; justify-content: space-between; margin-top: 30px; border-top: 2px solid #94a3b8; padding-top: 15px; }
        .sig-box { width: 45%; text-align: center; font-size: 12px; }
      </style></head><body>
      ${getPrintHeaderHTML()}
      <div class="date-section">DATE: ${new Date(quote.quote_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}<br/>QUOTE NO: PQ-${quote.id.slice(0,8).toUpperCase()}</div>
      <div class="bill-to">
        <p style="font-weight: 900;">PREPARED FOR:</p>
        <p><strong>${quote.customers?.name || "—"}</strong></p>
        ${quote.customers?.phone ? `<p>Tel: ${quote.customers.phone}</p>` : ''}
      </div>
      <div class="main-container">
        ${getPrintWatermarkHTML()}
        <div class="content-wrapper">
          <h2 class="bill-title">PERFORMANCE QUOTE</h2>
          <table>
            <thead>
              <tr><th style="width: 40px;">#</th><th>VEHICLE DESCRIPTION</th><th style="width: 60px;">QTY</th><th style="width: 120px;">UNIT PRICE</th><th style="width: 120px; text-align: right;">AMOUNT (₦)</th></tr>
            </thead>
            <tbody>
              ${quote.performance_quote_items?.map((item: any, i: number) => `
                <tr>
                  <td>${i+1}.</td>
                  <td>${(`${item.vehicles?.year || ''} ${item.vehicles?.make || ''} ${item.vehicles?.model || ''} ${item.vehicles?.trim || ''}`).trim().toUpperCase()}</td>
                  <td style="text-align: center;">${item.quantity}</td>
                  <td>₦${Number(item.base_price).toLocaleString()}</td>
                  <td style="text-align: right;">₦${(Number(item.base_price) * Number(item.quantity)).toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          ${quote.performance_quote_items?.some((item: any) => item.has_duty) ? `
          <h3 style="margin-top: 20px; font-weight: 800; text-transform: uppercase; font-size: 14px;">CUSTOM DUTY</h3>
          <table>
            <thead><tr><th style="width: 40px;">#</th><th>DESCRIPTION</th><th style="width: 60px;">QTY</th><th style="width: 120px;">UNIT PRICE</th><th style="width: 120px; text-align: right;">AMOUNT (₦)</th></tr></thead>
            <tbody>
              ${quote.performance_quote_items?.filter((item: any) => item.has_duty).map((item: any, i: number) => `
                <tr>
                  <td>${i+1}.</td>
                  <td>CUSTOM DUTY - ${(`${item.vehicles?.make || ''} ${item.vehicles?.model || ''}`).trim().toUpperCase()}</td>
                  <td style="text-align: center;">${item.quantity}</td>
                  <td>₦${Number(item.duty_price).toLocaleString()}</td>
                  <td style="text-align: right;">₦${(Number(item.duty_price) * Number(item.quantity)).toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>` : ''}

          <div style="display: flex; justify-content: flex-end; margin-top: 20px; border-top: 2px solid #1e293b; padding-top: 10px;">
            <div style="font-weight: 900; font-size: 16px; margin-right: 40px;">GRAND TOTAL</div>
            <div style="font-weight: 900; font-size: 16px; text-align: right; width: 140px;">₦${(Number(quote.total_amount) || 0).toLocaleString()}</div>
          </div>
          <div class="amount-words">AMOUNT IN WORDS: ${numberToWords(Number(quote.total_amount) || 0)}</div>
          ${quote.notes ? `<div class="notes-box"><strong>NOTES:</strong><br/>${quote.notes}</div>` : ''}
          <div class="signature-area"><div class="sig-box"><div style="height:40px"></div><p style="border-top: 1px solid #000;"><strong>CUSTOMER SIGNATURE</strong></p></div><div class="sig-box"><div style="height:40px"></div><p style="border-top: 1px solid #000;"><strong>FOR: BEE TEE AUTOMOBILE</strong></p></div></div>
        </div>
      </div>
      ${getPrintFooterHTML()}
      </body></html>`;

      const iframe = document.createElement('iframe');
      iframe.style.cssText = "position:fixed;left:-9999px;top:-9999px;width:800px;height:2000px;border:none;visibility:hidden;";
      document.body.appendChild(iframe);
      const iDoc = iframe.contentDocument!;
      iDoc.open(); iDoc.write(html); iDoc.close();

      await new Promise<void>(res => setTimeout(res, 1000)); // Wait for render

      const contentEl = iDoc.documentElement;
      const { toPng } = await import("html-to-image");
      const imgData = await toPng(contentEl, { pixelRatio: 2, backgroundColor: "#ffffff" });
      
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      
      document.body.removeChild(iframe);

      if (isEmail) {
        const pdfBlob = pdf.output('blob');
        const filePath = `quotes/${quote.id}/${filename}.pdf`;
        const { error: uploadError } = await supabase.storage.from('documents').upload(filePath, pdfBlob);
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(filePath);
        
        // Update DB
        await supabase.from("performance_quotes" as any).update({ quote_url: publicUrl }).eq("id", quote.id);

        if (quote.customers?.email) {
          const subject = `Performance Quote - Beetee Autos`;
          const body = `Hello ${quote.customers.name},\n\nPlease find your performance quote attached.\n\nDownload here: ${publicUrl}\n\nThank you!`;
          window.location.href = `mailto:${quote.customers.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
          toast.success("Quote generated and email ready!", { id: "quote-dl" });
        } else {
          toast.error("Customer email not found.", { id: "quote-dl" });
        }
      } else {
        pdf.save(`${filename}.pdf`);
        toast.success("Quote downloaded!", { id: "quote-dl" });
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate quote", { id: "quote-dl" });
    }
  };

  const handlePrint = (quote: any) => {
    toast.info("Preparing quote document...");
    const html = `<html><head><title>Performance Quote - ${quote.id.slice(0,8).toUpperCase()}</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700;900&display=swap');
      body { font-family: 'Roboto', 'Arial', sans-serif; padding: 15px; max-width: 800px; margin: 0 auto; color: #1a1a1a; line-height: 1.3; }
      .date-section { text-align: right; font-weight: 800; font-size: 13px; margin-bottom: 15px; text-transform: uppercase; }
      .bill-to { margin-bottom: 20px; }
      .bill-to p { margin: 2px 0; font-size: 13px; }
      .main-container {
        background-color: transparent;
        border-radius: 40px;
        padding: 20px;
        position: relative;
        border: none;
      }
      .content-wrapper { position: relative; z-index: 1; }
      .bill-title { text-align: center; text-decoration: underline; font-weight: 900; font-size: 20px; margin-bottom: 20px; color: #1e293b; text-transform: uppercase; }
      
      table { width: 100%; border-collapse: collapse; background: transparent; margin-bottom: 20px; }
      th, td { border: 1px solid #475569; padding: 8px 10px; text-align: left; font-size: 13px; font-weight: 600; }
      th { background: transparent; text-transform: uppercase; }
      td:first-child { width: 40px; text-align: center; }
      
      .total-row td { border-top: 3px solid #1e293b; font-weight: 900; font-size: 16px; }
      .amount-words { font-weight: 900; margin-bottom: 20px; font-size: 14px; text-transform: uppercase; }
      .bank-details { margin-top: 15px; font-size: 12px; }
      .bank-details h4 { margin: 0 0 5px 0; font-weight: 900; text-transform: uppercase; }
      .bank-details p { margin: 2px 0; font-weight: 500; }
      .notes-box { font-size: 12px; color: #475569; background: transparent; padding: 12px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e2e8f0; }
      .signature-area { display: flex; justify-content: space-between; margin-top: 30px; border-top: 2px solid #94a3b8; padding-top: 15px; }
      .sig-box { width: 45%; text-align: center; font-size: 12px; }
      .signature-img { max-height: 40px; display: block; margin: 0 auto 5px; }
    </style></head><body>
    ${getPrintHeaderHTML()}
    
    <div class="date-section">DATE: ${new Date(quote.quote_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}<br/>QUOTE NO: PQ-${quote.id.slice(0,8).toUpperCase()}</div>

    <div class="bill-to">
      <p style="font-weight: 900;">PREPARED FOR:</p>
      <p><strong>${quote.customers?.name || "—"}</strong></p>
      ${quote.customers?.phone ? `<p>Tel: ${quote.customers.phone}</p>` : ''}
    </div>

    <div class="main-container">
      ${getPrintWatermarkHTML()}
      <div class="content-wrapper">
        <h2 class="bill-title">PERFORMANCE QUOTE</h2>
        
        <table>
          <thead>
            <tr>
              <th style="width: 40px; text-align: center;">#</th>
              <th>VEHICLE DESCRIPTION</th>
              <th style="width: 60px; text-align: center;">QTY</th>
              <th style="width: 120px;">UNIT PRICE</th>
              <th style="width: 120px; text-align: right;">AMOUNT (₦)</th>
            </tr>
          </the          <tbody>
            ${(() => {
              let rowsHtml = '';
              let rowCounter = 1;

              quote.performance_quote_items?.forEach((item: any) => {
                const v = item.vehicles;
                const basePrice = Number(item.base_price) || 0;
                const qty = Number(item.quantity) || 1;
                const vehicleDesc = `${v?.year || ''} ${v?.make || ''} ${v?.model || ''} ${v?.trim || ''} ${v?.vin ? `(VIN: ${v.vin})` : ''}`.trim();

                rowsHtml += `
                <tr>
                  <td>${rowCounter++}.</td>
                  <td>${vehicleDesc.toUpperCase()}</td>
                  <td style="text-align: center;">${qty}</td>
                  <td>₦${basePrice.toLocaleString()}</td>
                  <td style="text-align: right;">₦${(basePrice * qty).toLocaleString()}</td>
                </tr>
                `;
              });

              return rowsHtml;
            })()}
          </tbody>
        </table>

        ${quote.performance_quote_items?.some((item: any) => item.has_duty) ? `
        <h3 style="margin-top: 30px; margin-bottom: 15px; font-weight: 800; text-transform: uppercase; font-size: 16px; color: #1e293b;">CUSTOM DUTY</h3>
        <table>
          <thead>
            <tr>
              <th style="width: 40px; text-align: center;">#</th>
              <th>DESCRIPTION</th>
              <th style="width: 60px; text-align: center;">QTY</th>
              <th style="width: 120px;">UNIT PRICE</th>
              <th style="width: 120px; text-align: right;">AMOUNT (₦)</th>
            </tr>
          </thead>
          <tbody>
            ${(() => {
              let rowsHtml = '';
              let dutyCounter = 1;
              quote.performance_quote_items?.forEach((item: any) => {
                if (item.has_duty) {
                  const v = item.vehicles;
                  const dutyPrice = Number(item.duty_price) || 0;
                  const qty = Number(item.quantity) || 1;
                  const vehicleDesc = `${v?.year || ''} ${v?.make || ''} ${v?.model || ''}`.trim();

                  rowsHtml += `
                  <tr>
                    <td style="text-align: center;">${dutyCounter++}.</td>
                    <td>CUSTOM DUTY - ${vehicleDesc.toUpperCase()}</td>
                    <td style="text-align: center;">${qty}</td>
                    <td>₦${dutyPrice.toLocaleString()}</td>
                    <td style="text-align: right;">₦${(dutyPrice * qty).toLocaleString()}</td>
                  </tr>
                  `;
                }
              });
              return rowsHtml;
            })()}
          </tbody>
        </table>
        ` : ''}

        <div style="display: flex; justify-content: flex-end; margin-top: 20px; border-top: 3px solid #1e293b; padding-top: 15px;">
          <div style="font-weight: 900; font-size: 18px; margin-right: 40px;">GRAND TOTAL</div>
          <div style="font-weight: 900; font-size: 18px; text-align: right; width: 144px;">₦${(Number(quote.total_amount) || 0).toLocaleString()}</div>
        </div>

        <div class="amount-words">
          AMOUNT IN WORDS: ${numberToWords(Number(quote.total_amount) || 0)}
        </div>

        ${quote.notes ? `
        <div class="notes-box">
          <strong>NOTES / TERMS:</strong><br/>
          ${quote.notes.replace(/\n/g, '<br/>')}
        </div>
        ` : ''}

        <div class="signature-area">
          <div class="sig-box">
            <div style="height:50px"></div>
            <p style="border-top: 1px solid #1a1a1a; padding-top: 5px;"><strong>CUSTOMER SIGNATURE</strong></p>
          </div>
          <div class="sig-box">
            <div style="height:50px"></div>
            <p style="border-top: 1px solid #1a1a1a; padding-top: 5px;"><strong>FOR: BEE TEE AUTOMOBILE</strong></p>
          </div>
        </div>
      </div>
    </div>

    ${getPrintFooterHTML()}
    </body></html>`;

    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      setTimeout(() => {
        win.focus();
        win.print();
      }, 500);
    } else {
      toast.error("Pop-up blocked");
    }
  };

  const filteredQuotes = quotes.filter((q: any) => {
    if (!search) return true;
    const term = search.toLowerCase();
    const custName = q.customers?.name?.toLowerCase() || "";
    const quoteId = q.id.toLowerCase();
    return custName.includes(term) || quoteId.includes(term);
  });

  const totalQuoteValue = quotes.reduce((sum: number, q: any) => sum + Number(q.total_amount), 0);

  return (
    <div className="space-y-8 animate-fade-up pb-10 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 opacity-80">
            <FileSignature className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-medium uppercase tracking-wider text-emerald-500">Sales & Proposals</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-foreground via-foreground to-foreground/70 tracking-tight">
            Performance Quotes
          </h1>
          <p className="text-base text-muted-foreground mt-2 max-w-xl">
            Create and manage multi-vehicle proforma quotes with dynamic duty pricing.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button asChild size="lg" onClick={() => setDialogOpen(true)} className="rounded-2xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all bg-emerald-500 hover:bg-emerald-600 cursor-pointer">
            <div><PlusCircle className="mr-2 h-5 w-5" /> New Quote</div>
          </Button>
        </div>
      </div>

      {/* Dashboard Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <Card className="bento-card border-none shadow-xl">
          <CardContent className="p-6">
             <div className="flex justify-between items-start mb-4">
               <div className="p-3 bg-emerald-500/10 rounded-2xl"><FileText className="h-6 w-6 text-emerald-500" /></div>
             </div>
             <h3 className="text-3xl font-bold">{quotes.length}</h3>
             <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider mt-1">Total Quotes Issued</p>
          </CardContent>
        </Card>
        <Card className="bento-card border-none shadow-xl">
          <CardContent className="p-6">
             <div className="flex justify-between items-start mb-4">
               <div className="p-3 bg-blue-500/10 rounded-2xl"><BarChart3 className="h-6 w-6 text-blue-500" /></div>
             </div>
             <h3 className="text-3xl font-bold">₦{totalQuoteValue.toLocaleString()}</h3>
             <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider mt-1">Total Quoted Value</p>
          </CardContent>
        </Card>
      </div>

      {/* List */}
      <div className="bento-card overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search quotes by customer or ID..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="pl-10 bg-background/50 border-white/10"
            />
          </div>
        </div>

        {loadingQuotes ? (
          <div className="p-8 text-center text-muted-foreground">Loading quotes...</div>
        ) : filteredQuotes.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
            <FileSignature className="h-12 w-12 opacity-20 mb-4" />
            <p>No performance quotes found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <Table className="w-full">
              <TableHeader className="bg-foreground/5 pointer-events-none">
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="font-semibold px-6 py-4">Quote ID</TableHead>
                  <TableHead className="font-semibold">Customer</TableHead>
                  <TableHead className="font-semibold">Date</TableHead>
                  <TableHead className="font-semibold">Vehicles</TableHead>
                  <TableHead className="font-semibold text-right">Total Amount</TableHead>
                  <TableHead className="text-right font-semibold px-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotes.map((q: any) => (
                  <TableRow key={q.id} className="border-border/10 hover:bg-white/5 transition-colors group">
                    <TableCell className="px-6 py-4 font-mono text-xs font-semibold text-emerald-500">
                      PQ-{q.id.slice(0, 8).toUpperCase()}
                    </TableCell>
                    <TableCell className="font-medium">{q.customers?.name || "Unknown"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(q.quote_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 bg-foreground/10 px-2 py-1 rounded-md w-fit text-xs font-semibold">
                        <Car className="h-3 w-3" /> {q.performance_quote_items?.length || 0}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold">₦{Number(q.total_amount).toLocaleString()}</TableCell>
                    <TableCell className="text-right px-6">
                      <div className="flex justify-end gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-emerald-500/20 hover:text-emerald-500">
                              <Printer className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="glass-panel border-white/10 rounded-xl p-1">
                            <DropdownMenuItem onClick={() => handlePrint(q)} className="rounded-lg cursor-pointer gap-2">
                              <Printer className="h-4 w-4 text-emerald-500" /> Print Quote
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => downloadQuotePDF(q, false)} className="rounded-lg cursor-pointer gap-2">
                              <Download className="h-4 w-4 text-amber-500" /> Save as PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => downloadQuotePDF(q, true)} className="rounded-lg cursor-pointer gap-2">
                              <Mail className="h-4 w-4 text-sky-500" /> Email to Customer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        {hasEdit && (
                          <Button variant="ghost" size="icon" onClick={() => deleteQuoteMutation.mutate(q.id)} className="h-8 w-8 rounded-lg hover:bg-destructive/20 hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* New Quote Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl glass-panel border-white/10 p-0 shadow-2xl">
          <div className="sticky top-0 z-10 glass-panel border-b border-white/10 p-6 flex justify-between items-center bg-background/80 backdrop-blur-xl">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <FileSignature className="h-6 w-6 text-emerald-500" /> Create Performance Quote
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={closeDialog} className="rounded-full"><X className="h-5 w-5" /></Button>
          </div>

          <div className="p-6 space-y-8">
            {/* Customer Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">Customer Details</h3>
                <div className="flex items-center gap-2 text-sm bg-foreground/5 p-1 rounded-lg">
                  <button onClick={() => setCustomerMode("existing")} className={`px-3 py-1.5 rounded-md transition-colors ${customerMode === 'existing' ? 'bg-background shadow font-semibold' : 'text-muted-foreground'}`}>Existing</button>
                  <button onClick={() => setCustomerMode("manual")} className={`px-3 py-1.5 rounded-md transition-colors ${customerMode === 'manual' ? 'bg-background shadow font-semibold' : 'text-muted-foreground'}`}>New / Manual</button>
                </div>
              </div>

              {customerMode === "existing" ? (
                <div className="w-full">
                  <CustomerSelect customers={customers} value={customerId} onValueChange={setCustomerId} />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-white/10 rounded-xl bg-black/20">
                  <div className="space-y-1">
                    <Label>Customer Name *</Label>
                    <Input value={manualCustomer.name} onChange={e => setManualCustomer({...manualCustomer, name: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <Label>Phone Number</Label>
                    <Input value={manualCustomer.phone} onChange={e => setManualCustomer({...manualCustomer, phone: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <Label>Email</Label>
                    <Input type="email" value={manualCustomer.email} onChange={e => setManualCustomer({...manualCustomer, email: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <Label>Address</Label>
                    <Input value={manualCustomer.address} onChange={e => setManualCustomer({...manualCustomer, address: e.target.value})} />
                  </div>
                </div>
              )}
            </div>

            {/* Vehicle Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold">Select Vehicles</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search inventory by make, model, VIN..." 
                  value={vehicleSearch} 
                  onChange={(e) => setVehicleSearch(e.target.value)} 
                  className="pl-10"
                />
              </div>

              {vehicleSearch && (
                <div className="border border-white/10 rounded-xl bg-black/40 overflow-hidden max-h-[200px] overflow-y-auto">
                  {vehicles.filter(v => 
                    (v.make.toLowerCase().includes(vehicleSearch.toLowerCase()) || 
                     v.model.toLowerCase().includes(vehicleSearch.toLowerCase()) || 
                     (v.vin && v.vin.toLowerCase().includes(vehicleSearch.toLowerCase()))) &&
                    !selectedVehicles.some(sv => sv.id === v.id)
                  ).map(v => (
                    <div key={v.id} className="p-3 border-b border-white/5 hover:bg-white/5 flex justify-between items-center cursor-pointer" onClick={() => handleAddVehicle(v)}>
                      <div>
                        <p className="font-semibold text-sm">{v.year} {v.make} {v.model}</p>
                        <p className="text-xs text-muted-foreground font-mono">{v.vin}</p>
                      </div>
                      <PlusCircle className="h-5 w-5 text-emerald-500" />
                    </div>
                  ))}
                </div>
              )}

              {/* Selected Vehicles List */}
              {selectedVehicles.length > 0 && (
                <div className="space-y-4 mt-6">
                  {selectedVehicles.map((sv, idx) => (
                    <div key={sv.id} className="p-4 border border-white/10 rounded-2xl bg-gradient-to-br from-white/5 to-transparent relative">
                      <button onClick={() => handleRemoveVehicle(sv.id)} className="absolute top-4 right-4 text-muted-foreground hover:text-destructive">
                        <X className="h-5 w-5" />
                      </button>
                      
                      <div className="flex items-center gap-2 mb-4">
                        <div className="bg-emerald-500/20 p-2 rounded-lg"><Car className="h-4 w-4 text-emerald-500" /></div>
                        <h4 className="font-bold">{sv.year} {sv.make} {sv.model}</h4>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Vehicle Base Price (₦)</Label>
                            <CurrencyInput value={sv.base_price} onChange={e => updateVehicleData(sv.id, "base_price", e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label>Quantity</Label>
                            <Input 
                              type="number" 
                              min="1" 
                              value={sv.quantity} 
                              onChange={e => updateVehicleData(sv.id, "quantity", parseInt(e.target.value) || 1)} 
                              className="bg-background/50 border-white/10"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-3 p-4 bg-black/20 rounded-xl border border-white/5 flex flex-col justify-center">
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id={`duty-${sv.id}`} 
                              checked={sv.has_duty} 
                              onCheckedChange={(c) => updateVehicleData(sv.id, "has_duty", c === true)} 
                            />
                            <Label htmlFor={`duty-${sv.id}`} className="font-semibold text-amber-500 cursor-pointer">Include Custom Duty Price</Label>
                          </div>
                          {sv.has_duty && (
                            <div className="space-y-1 animate-fade-down pt-2">
                              <Label className="text-xs text-muted-foreground">Duty Price Amount (₦) per unit</Label>
                              <CurrencyInput value={sv.duty_price} onChange={e => updateVehicleData(sv.id, "duty_price", e.target.value)} />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Summary */}
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex justify-between items-center mt-6">
                    <span className="font-bold text-lg text-emerald-500 uppercase tracking-wider">Grand Total Estimate</span>
                    <span className="text-3xl font-black text-emerald-500">
                      ₦{selectedVehicles.reduce((sum, v) => sum + ((Number(v.base_price) || 0) * (v.quantity || 1)) + (v.has_duty ? ((Number(v.duty_price) || 0) * (v.quantity || 1)) : 0), 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Additional Notes / Terms</Label>
              <Textarea placeholder="Enter any special conditions, validity period, etc." value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="bg-black/20 rounded-xl" />
            </div>
          </div>

          <DialogFooter className="p-6 border-t border-white/10 bg-black/40">
            <Button variant="outline" onClick={closeDialog} className="rounded-xl">Cancel</Button>
            <Button 
              onClick={() => { setIsSubmitting(true); createQuoteMutation.mutate(); }} 
              disabled={isSubmitting || selectedVehicles.length === 0 || (customerMode === 'manual' && !manualCustomer.name.trim()) || (customerMode === 'existing' && !customerId)}
              className="rounded-xl bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20"
            >
              {isSubmitting ? "Generating..." : "Generate Quote"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
