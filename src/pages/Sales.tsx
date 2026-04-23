import { useState, useRef, useEffect, useMemo } from "react";
import logoAsset from "@/assets/logo.png";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious,
} from "@/components/ui/pagination";
import { Card, CardContent } from "@/components/ui/card";
import { 
  PlusCircle, Pencil, Trash2, Receipt, Download, FileText, Printer, FileOutput, 
  DollarSign, Calendar, Search, Car, Users, QrCode, CheckCircle, Image, FileDown,
  TrendingUp, TrendingDown, ShoppingBag, Target, ArrowUpRight, BarChart3, PieChart as PieChartIcon
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, PieChart, Pie, Cell
} from "recharts";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { toast } from "sonner";
import { exportToCSV, exportToJSON, printTable } from "@/lib/exportHelpers";
import { useAuth } from "@/hooks/useAuth";
import { canEdit } from "@/lib/permissions";
import { getPrintHeaderHTML, getPrintWatermarkHTML } from "@/components/PrintHeader";
import { getPrintFooterHTML } from "@/components/PrintFooter";

import { Checkbox } from "@/components/ui/checkbox";
import { SignaturePad } from "@/components/SignaturePad";
import { QrSignDialog } from "@/lib/qrHelpers";
import { CurrencyInput } from "@/components/CurrencyInput";

const COLORS = ["hsl(var(--primary))", "hsl(142 76% 36%)", "hsl(38 92% 50%)", "hsl(262 83% 58%)", "hsl(0 84% 60%)", "hsl(199 89% 48%)"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel p-3 border border-white/20 shadow-2xl rounded-xl z-50 min-w-[150px]">
        <p className="font-semibold text-foreground mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm font-medium flex justify-between gap-4" style={{ color: entry.color || entry.fill }}>
            <span>{entry.name}:</span> <span>₦{entry.value.toLocaleString()}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const emptyForm = { 
  customer_id: "", 
  selected_vehicle_ids: [] as string[],
  sale_price: "", 
  sale_date: new Date().toISOString().split("T")[0], 
  payment_type: "cash",
  payment_status: "paid_in_full",
  rep_name: "",
  rep_signature: "",
  buyer_signature: "",
  buyer_signature_date: "",
  notes: "" 
};

export default function Sales() {
  const { role } = useAuth();
  const hasEdit = canEdit(role, "sales");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [qrId, setQrId] = useState<string | null>(null);
  const [receiptSale, setReceiptSale] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [page, setPage] = useState(0);
  const [showAnalytics, setShowAnalytics] = useState(true);
  const PAGE_SIZE = 15;
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: sales = [], isLoading } = useQuery({
    queryKey: ["sales"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sales").select("*, sale_vehicles(*)").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel('sales_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sales' },
        () => queryClient.invalidateQueries({ queryKey: ["sales"] })
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const { data: vehicles = [] } = useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("vehicles").select("id, make, model, year, color, cost_price");
      if (error) throw error;
      return data;
    },
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("customers").select("id, name, phone, email, address");
      if (error) throw error;
      return data;
    },
  });

  const vehicleMap = Object.fromEntries(vehicles.map((v) => [
    v.id, 
    `${v.year} ${v.make} ${v.model} ${v.color ? `(${v.color})` : ""}`.trim()
  ]));
  const fullVehicleMap = Object.fromEntries(vehicles.map((v) => [v.id, v]));
  const customerMap = Object.fromEntries(customers.map((c) => [c.id, c.name]));
  const customerObjMap = Object.fromEntries(customers.map((c) => [c.id, c]));

  const filtered = sales.filter((s) => {
    const q = search.toLowerCase();
    const vName = (vehicleMap[s.vehicle_id] || "").toLowerCase();
    const cName = (customerMap[s.customer_id] || "").toLowerCase();
    return !q || vName.includes(q) || cName.includes(q);
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const upsertMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        customer_id: form.customer_id,
        sale_price: parseFloat(form.sale_price),
        sale_date: form.sale_date,
        payment_type: form.payment_type,
        payment_status: form.payment_status,
        rep_name: form.rep_name,
        rep_signature: form.rep_signature,
        buyer_signature: form.buyer_signature || null,
        buyer_signature_date: form.buyer_signature_date || null,
        notes: form.notes || null,
        // For backward compatibility, also keep first vehicle_id if any
        vehicle_id: form.selected_vehicle_ids[0] || null,
      };

      let saleId = editId;
      if (editId) {
        const { error } = await supabase.from("sales").update(payload).eq("id", editId);
        if (error) throw error;
        // Clear existing links
        await supabase.from("sale_vehicles").delete().eq("sale_id", editId);
      } else {
        const { data, error } = await supabase.from("sales").insert(payload).select().single();
        if (error) throw error;
        if (!data) throw new Error("Failed to retrieve new sale ID");
        saleId = data.id;
      }

      if (form.selected_vehicle_ids.length > 0) {
        const links = form.selected_vehicle_ids.map(vid => ({
          sale_id: saleId,
          vehicle_id: vid,
          price: parseFloat(form.sale_price) / form.selected_vehicle_ids.length // Provisional split
        }));
        const { error } = await supabase.from("sale_vehicles").insert(links);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      toast.success(editId ? "Sale updated" : "Sale recorded");
      closeDialog();
    },
    onError: () => toast.error("Failed to save sale"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sales").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      toast.success("Sale deleted");
    },
    onError: () => toast.error("Failed to delete sale"),
  });

  const closeDialog = () => { setDialogOpen(false); setEditId(null); setForm(emptyForm); };

  const openEdit = (s: any) => {
    setEditId(s.id);
    setForm({
      customer_id: s.customer_id,
      selected_vehicle_ids: s.sale_vehicles?.map((sv: any) => sv.vehicle_id) || (s.vehicle_id ? [s.vehicle_id] : []),
      sale_price: String(s.sale_price),
      sale_date: s.sale_date,
      payment_type: s.payment_type || "cash",
      payment_status: s.payment_status || "paid_in_full",
      rep_name: s.rep_name || "",
      rep_signature: s.rep_signature || "",
      buyer_signature: s.buyer_signature || "",
      buyer_signature_date: s.buyer_signature_date || "",
      notes: s.notes || "",
    });
    setDialogOpen(true);
  };

  const canSubmit = form.selected_vehicle_ids.length > 0 && form.customer_id && form.sale_price && !upsertMutation.isPending;

  const handleExportCSV = () => {
    const rows = sales.map((s) => ({
      Vehicle: vehicleMap[s.vehicle_id] || s.vehicle_id,
      Customer: customerMap[s.customer_id] || s.customer_id,
      "Sale Price": s.sale_price,
      "Sale Date": s.sale_date,
      Notes: s.notes || "",
    }));
    exportToCSV(rows, "sales_export");
  };

  const handleExportJSON = () => {
    exportToJSON(sales, "sales_export");
  };

  const handlePrint = () => {
    const rows = sales.map((s) => ({
      vehicle: vehicleMap[s.vehicle_id] || s.vehicle_id,
      customer: customerMap[s.customer_id] || s.customer_id,
      sale_price: `₦${Number(s.sale_price).toLocaleString()}`,
      sale_date: new Date(s.sale_date).toLocaleDateString(),
      notes: s.notes || "",
    }));
    printTable("Sales Report — Beetee Autos", rows, [
      { key: "vehicle", label: "Vehicle" },
      { key: "customer", label: "Customer" },
      { key: "sale_price", label: "Sale Price" },
      { key: "sale_date", label: "Sale Date" },
      { key: "notes", label: "Notes" },
    ]);
  };

  const printReceipt = (sale: any) => {
    const cust = customerObjMap[sale.customer_id];
    const saleItems = sale.sale_vehicles?.length > 0 
      ? sale.sale_vehicles.map((sv: any) => vehicleMap[sv.vehicle_id] || "Unknown Vehicle")
      : [vehicleMap[sale.vehicle_id] || "Unknown Vehicle"];

    const html = `<html><head><title>Receipt</title>
    <style>
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; line-height: 1.5; color: #333; }
      .header { text-align: center; border-bottom: 2px solid #1a1a2e; padding-bottom: 20px; margin-bottom: 30px; }
      .header h1 { font-size: 24px; margin: 0; color: #1a1a2e; }
      .header p { color: #666; font-size: 13px; margin: 5px 0 0; }
      .section { margin-bottom: 25px; }
      .section-title { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #999; margin-bottom: 8px; border-bottom: 1px solid #eee; padding-bottom: 4px; }
      .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
      .row .label { color: #666; }
      .row .value { font-weight: 600; }
      .vehicle-list { list-style: none; padding: 0; margin: 10px 0; }
      .vehicle-item { padding: 8px; background: #f9f9f9; border-radius: 6px; margin-bottom: 5px; font-size: 14px; font-weight: 500; }
      .total { font-size: 22px; text-align: right; margin-top: 20px; padding-top: 15px; border-top: 2px solid #1a1a2e; font-weight: bold; }
      .refund-note { margin-top: 30px; padding: 15px; background: #fff5f5; border: 1px solid #feb2b2; border-radius: 8px; color: #c53030; font-weight: bold; font-size: 14px; text-align: center; }
      .signature-area { display: flex; justify-content: space-between; margin-top: 40px; }
      .sig-box { width: 45%; border-top: 1px solid #333; padding-top: 10px; font-size: 12px; text-align: center; }
      .signature-img { max-height: 60px; display: block; margin: 0 auto 10px; }
      .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #999; }
      @media print { body { padding: 20px; } .refund-note { background: #fee2e2 !important; } }
    </style></head><body>
    ${getPrintWatermarkHTML()}
    ${getPrintHeaderHTML()}
    <div class="header">
      <h1>SALES RECEIPT</h1>
      <p>Receipt No: ${sale.id.slice(0, 8).toUpperCase()}</p>
    </div>

    <div class="section">
      <div class="section-title">Customer Information</div>
      <div class="row"><span class="label">Name</span><span class="value">${cust?.name || "—"}</span></div>
      ${cust?.phone ? `<div class="row"><span class="label">Phone</span><span class="value">${cust.phone}</span></div>` : ""}
      <div class="row"><span class="label">Date</span><span class="value">${new Date(sale.sale_date).toLocaleDateString(undefined, { dateStyle: 'long' })}</span></div>
    </div>

    <div class="section">
      <div class="section-title">Purchased vehicles</div>
      <ul class="vehicle-list">
        ${saleItems.map((v: string) => `<li class="vehicle-item">${v}</li>`).join("")}
      </ul>
    </div>

    <div class="section">
      <div class="section-title">Payment Details</div>
      <div class="row"><span class="label">Payment Type</span><span class="value" style="text-transform: capitalize;">${sale.payment_type || 'Cash'}</span></div>
      <div class="row"><span class="label">Status</span><span class="value" style="text-transform: capitalize;">${(sale.payment_status || 'Paid').replace(/_/g, ' ')}</span></div>
      <div class="total">Total Paid: ₦${Number(sale.sale_price).toLocaleString()}</div>
    </div>

    <div class="refund-note">
       NOTICE: NO REFUND AFTER PAYMENT
    </div>

      ${sale.rep_signature || sale.buyer_signature ? `<div class="signature-area">
        <div class="sig-box">
          ${sale.buyer_signature ? `<img src="${sale.buyer_signature}" class="signature-img" />` : ""}
          <p>Customer Signature</p>
          <p style="font-size:10px; color:#999; margin-top:2px;">${sale.buyer_signature_date ? new Date(sale.buyer_signature_date).toLocaleDateString() : ""}</p>
        </div>
        <div class="sig-box">
          ${sale.rep_signature ? `<img src="${sale.rep_signature}" class="signature-img" />` : ""}
          <p>Seller/Representative: <strong>${sale.rep_name || 'Beetee Autos'}</strong></p>
        </div>
      </div>` : `
      <div class="signature-area">
        <div class="sig-box"><p>Customer Signature</p></div>
        <div class="sig-box"><p>Representative</p></div>
      </div>`}

    <div class="footer">
      <p>Thank you for choosing Beetee Autos!</p>
    </div>
    ${getPrintFooterHTML()}
    </body></html>`;
    const win = window.open("", "_blank");
    if (win) { win.document.write(html); win.document.close(); win.print(); }
  };

  const downloadSaleReceipt = async (sale: any, format: "png" | "jpeg" | "pdf") => {
    const cust = customerObjMap[sale.customer_id];
    const saleItems = sale.sale_vehicles?.length > 0
      ? sale.sale_vehicles.map((sv: any) => vehicleMap[sv.vehicle_id] || "Unknown Vehicle")
      : [vehicleMap[sale.vehicle_id] || "Unknown Vehicle"];

    const receiptNo = sale.id.slice(0, 8).toUpperCase();
    const filename = `sale-receipt-${receiptNo}`;

    try {
      toast.loading("Preparing download...", { id: "receipt-dl" });

      // Convert logo to base64 so it renders inside the sandboxed iframe
      const logoBase64 = await fetch(logoAsset)
        .then(r => r.blob())
        .then(blob => new Promise<string>((res, rej) => {
          const reader = new FileReader();
          reader.onload = () => res(reader.result as string);
          reader.onerror = rej;
          reader.readAsDataURL(blob);
        }));

      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Sales Receipt</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px 48px 0 48px; width: 700px; background: transparent; color: #1a1a2e; line-height: 1.6; }

        /* ── Receipt Title ── */
        .receipt-title { text-align: center; margin-bottom: 24px; position: relative; z-index: 10; }
        .receipt-title h2 { font-size: 18px; letter-spacing: 3px; text-transform: uppercase; color: #1D3557; border-bottom: 1px solid #ddd; padding-bottom: 8px; display: inline-block; }
        .receipt-title p { font-size: 12px; color: #666; margin-top: 6px; }

        /* ── Sections ── */
        .section { margin-bottom: 20px; position: relative; z-index: 10; }
        .section-title { font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: #999; border-bottom: 1px solid #eee; padding-bottom: 4px; margin-bottom: 10px; font-weight: bold; }
        .row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 13px; border-bottom: 1px dotted #f0f0f0; }
        .row:last-child { border-bottom: none; }
        .row .label { color: #555; }
        .row .value { font-weight: 600; color: #1a1a2e; }

        /* ── Vehicles ── */
        .vehicle-list { list-style: none; }
        .vehicle-item { padding: 8px 12px; background: #f0f4ff; border-left: 3px solid #1D3557; border-radius: 4px; margin-bottom: 6px; font-size: 13px; font-weight: 500; }

        /* ── Total ── */
        .total-box { display: flex; justify-content: flex-end; margin-top: 16px; position: relative; z-index: 10; }
        .total-inner { background: #1D3557; color: #fff; padding: 12px 24px; border-radius: 6px; text-align: right; }
        .total-inner .label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.8; }
        .total-inner .amount { font-size: 22px; font-weight: bold; margin-top: 2px; }

        /* ── Refund Notice ── */
        .refund-note { margin-top: 20px; padding: 12px; background: #fff5f5; border: 1px solid #fca5a5; border-radius: 6px; color: #b91c1c; font-weight: bold; font-size: 12px; text-align: center; letter-spacing: 1px; position: relative; z-index: 10; }

        /* ── Signatures ── */
        .signature-area { display: flex; justify-content: space-between; margin-top: 40px; padding-top: 20px; position: relative; z-index: 10; }
        .sig-box { width: 44%; text-align: center; }
        .sig-line { border-top: 1.5px solid #333; padding-top: 8px; font-size: 11px; color: #444; }
        .signature-img { max-height: 56px; display: block; margin: 0 auto 8px; }
        .sig-date { font-size: 10px; color: #999; margin-top: 4px; }

        /* ── Footer Swoosh ── */
        .swoosh-footer { position: relative; width: 100%; height: 120px; overflow: hidden; margin-top: 40px; background: transparent; }
      </style>
      </head><body>

      ${getPrintWatermarkHTML(logoBase64)}
      ${getPrintHeaderHTML(logoBase64)}

      <!-- Receipt Title -->
      <div class="receipt-title">
        <h2>Sales Receipt</h2>
        <p>Receipt No: ${receiptNo} &nbsp;&bull;&nbsp; ${new Date(sale.sale_date).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
      </div>

      <!-- Customer Information -->
      <div class="section">
        <div class="section-title">Customer Information</div>
        <div class="row"><span class="label">Name</span><span class="value">${cust?.name || '—'}</span></div>
        ${cust?.phone ? `<div class="row"><span class="label">Phone</span><span class="value">${cust.phone}</span></div>` : ''}
        ${cust?.email ? `<div class="row"><span class="label">Email</span><span class="value">${cust.email}</span></div>` : ''}
        ${cust?.address ? `<div class="row"><span class="label">Address</span><span class="value">${cust.address}</span></div>` : ''}
      </div>

      <!-- Vehicles -->
      <div class="section">
        <div class="section-title">Purchased Vehicle(s)</div>
        <ul class="vehicle-list">
          ${saleItems.map((v: string) => `<li class="vehicle-item">${v}</li>`).join('')}
        </ul>
      </div>

      <!-- Payment -->
      <div class="section">
        <div class="section-title">Payment Details</div>
        <div class="row"><span class="label">Payment Type</span><span class="value" style="text-transform:capitalize">${(sale.payment_type || 'Cash').replace(/_/g,' ')}</span></div>
        <div class="row"><span class="label">Payment Status</span><span class="value">${(sale.payment_status || 'Paid').replace(/_/g, ' ')}</span></div>
        ${sale.rep_name ? `<div class="row"><span class="label">Sales Representative</span><span class="value">${sale.rep_name}</span></div>` : ''}
        <div class="total-box">
          <div class="total-inner">
            <div class="label">Total Amount Paid</div>
            <div class="amount">&#8358;${Number(sale.sale_price).toLocaleString()}</div>
          </div>
        </div>
      </div>

      <!-- Refund Notice -->
      <div class="refund-note">&#9888; NOTICE: NO REFUND AFTER PAYMENT</div>

      <!-- Signatures -->
      <div class="signature-area">
        <div class="sig-box">
          ${sale.buyer_signature ? `<img src="${sale.buyer_signature}" class="signature-img" />` : '<div style="height:56px"></div>'}
          <div class="sig-line">Customer Signature</div>
          ${sale.buyer_signature_date ? `<div class="sig-date">${new Date(sale.buyer_signature_date).toLocaleDateString()}</div>` : ''}
        </div>
        <div class="sig-box">
          ${sale.rep_signature ? `<img src="${sale.rep_signature}" class="signature-img" />` : '<div style="height:56px"></div>'}
          <div class="sig-line">Representative: <strong>${sale.rep_name || 'Beetee Autos'}</strong></div>
        </div>
      </div>

      <!-- Swoosh Footer -->
      <div class="swoosh-footer">
        <svg style="position:absolute;bottom:0;left:0;width:100%;height:100%;" viewBox="0 0 1000 150" preserveAspectRatio="none">
          <path d="M 400 150 C 650 150 900 80 1000 0 L 1000 150 Z" fill="#1e3a8a" />
          <path d="M 600 150 C 800 150 950 120 1000 40 L 1000 150 Z" fill="#0f172a" />
          <path d="M 0 132 C 80 132 180 150 240 150 L 0 150 Z" fill="#0f172a" />
        </svg>
      </div>

      </body></html>`;

      // Render HTML in a hidden iframe sized wide enough for the layout
      const iframe = document.createElement("iframe");
      iframe.style.cssText = "position:fixed;left:-9999px;top:-9999px;width:700px;height:2400px;border:none;visibility:hidden;";
      document.body.appendChild(iframe);
      const iDoc = iframe.contentDocument!;
      iDoc.open(); iDoc.write(html); iDoc.close();

      // Wait for images (logo, signatures) to load
      await new Promise<void>(res => {
        const imgs = Array.from(iDoc.images);
        if (imgs.length === 0) { setTimeout(res, 400); return; }
        let loaded = 0;
        const done = () => { if (++loaded >= imgs.length) setTimeout(res, 200); };
        imgs.forEach(img => {
          if (img.complete) done();
          else { img.onload = done; img.onerror = done; }
        });
        setTimeout(res, 1200); // Safety timeout
      });

      // Measure the full content height
      const contentEl = iDoc.documentElement;
      const fullHeight = contentEl.scrollHeight;
      // Resize iframe to exactly match content so nothing is clipped
      iframe.style.height = `${fullHeight}px`;
      await new Promise<void>(res => setTimeout(res, 100));

      const { toPng, toJpeg } = await import("html-to-image");
      const captureOptions = {
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        width: 700,
        height: fullHeight,
      };

      if (format === "pdf") {
        const { default: jsPDF } = await import("jspdf");
        const imgData = await toPng(contentEl, captureOptions);
        // Calculate PDF page height proportionally to A4 width (595px)
        const a4Width = 595;
        const scale = a4Width / (700 * 2); // pixelRatio: 2
        const pdfPageH = fullHeight * 2 * scale; // height in PDF points
        const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: [a4Width, pdfPageH] });
        pdf.addImage(imgData, "PNG", 0, 0, a4Width, pdfPageH);
        pdf.save(`${filename}.pdf`);
      } else if (format === "jpeg") {
        const dataUrl = await toJpeg(contentEl, { ...captureOptions, quality: 0.95 });
        const a = document.createElement("a");
        a.href = dataUrl; a.download = `${filename}.jpg`; a.click();
      } else {
        const dataUrl = await toPng(contentEl, captureOptions);
        const a = document.createElement("a");
        a.href = dataUrl; a.download = `${filename}.png`; a.click();
      }

      document.body.removeChild(iframe);
      toast.success(`Receipt downloaded as ${format.toUpperCase()}`, { id: "receipt-dl" });
    } catch (err) {
      console.error("Download error:", err);
      toast.error("Failed to generate download", { id: "receipt-dl" });
    }
  };

  return (
    <>
      <div className="space-y-8 animate-fade-up pb-10 max-w-6xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 opacity-80">
            <DollarSign className="w-4 h-4 text-violet-500" />
            <span className="text-sm font-medium uppercase tracking-wider text-violet-500">Revenue</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-foreground via-foreground to-foreground/70 tracking-tight">
            Sales
          </h1>
          <p className="text-base text-muted-foreground mt-2 max-w-xl">
            Track vehicle sales, generate receipts, and manage sales history.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button 
            variant="outline" 
            size="lg" 
            onClick={() => setShowAnalytics(!showAnalytics)}
            className={`rounded-2xl glass-panel border-white/10 transition-all ${showAnalytics ? 'bg-violet-500/20 text-violet-500 border-violet-500/20' : 'hover:bg-white/5'}`}
          >
            <TrendingUp className="mr-2 h-4 w-4" /> {showAnalytics ? "Hide Analytics" : "Analytics"}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="lg" className="rounded-2xl glass-panel border-white/10 hover:bg-white/5 transition-all">
                <Download className="mr-2 h-4 w-4" /> Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="rounded-xl glass-panel p-2 shadow-2xl border-white/10" align="end">
              <DropdownMenuItem onClick={handleExportCSV} className="rounded-lg cursor-pointer"><FileText className="mr-2 h-4 w-4" /> Export to CSV</DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportJSON} className="rounded-lg cursor-pointer"><FileText className="mr-2 h-4 w-4" /> Export to JSON</DropdownMenuItem>
              <DropdownMenuItem onClick={handlePrint} className="rounded-lg cursor-pointer text-violet-500"><Printer className="mr-2 h-4 w-4" /> Print / PDF</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => { setForm(emptyForm); setEditId(null); setDialogOpen(true); }} size="lg" className="rounded-2xl shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all bg-violet-500 hover:bg-violet-600 text-white">
            <PlusCircle className="mr-2 h-5 w-5" /> Record Sale
          </Button>
        </div>
      </div>

      {showAnalytics && (
        <div className="space-y-6 animate-fade-down">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <Card className="bento-card border-none shadow-xl">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-emerald-500/10 rounded-2xl"><DollarSign className="h-6 w-6 text-emerald-500" /></div>
                </div>
                <h3 className="text-3xl font-bold truncate">₦{sales.reduce((sum, s) => sum + (Number(s.sale_price) || 0), 0).toLocaleString()}</h3>
                <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider mt-1">Total Revenue</p>
              </CardContent>
            </Card>

            <Card className="bento-card border-none shadow-xl">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-violet-500/10 rounded-2xl"><TrendingUp className="h-6 w-6 text-violet-500" /></div>
                </div>
                <h3 className="text-3xl font-bold truncate">₦{sales.reduce((sum, s) => {
                  const vehicleId = s.vehicle_id || s.sale_vehicles?.[0]?.vehicle_id;
                  const v = vehicleId ? fullVehicleMap[vehicleId] : null;
                  const cost = Number(v?.cost_price) || 0;
                  const sale = Number(s.sale_price) || 0;
                  return sum + (sale - cost);
                }, 0).toLocaleString()}</h3>
                <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider mt-1">Total profit</p>
              </CardContent>
            </Card>

            <Card className="bento-card border-none shadow-xl">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-primary/10 rounded-2xl"><ShoppingBag className="h-6 w-6 text-primary" /></div>
                </div>
                <h3 className="text-3xl font-bold">{sales.length}</h3>
                <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider mt-1">Units Sold</p>
              </CardContent>
            </Card>

            <Card className="bento-card border-none shadow-xl">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-amber-500/10 rounded-2xl"><Target className="h-6 w-6 text-amber-500" /></div>
                </div>
                <h3 className="text-3xl font-bold">{((sales.reduce((sum, s) => sum + (Number(s.sale_price) || 0), 0) / 5000000) * 100).toFixed(1)}%</h3>
                <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider mt-1">Target Achievement</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 bento-card p-6 min-h-[400px]">
              <h3 className="font-bold text-lg flex items-center gap-2 mb-6"><BarChart3 className="w-5 h-5 text-emerald-500" /> Revenue & Profit Trend</h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={(() => {
                    const data = [];
                    const now = new Date();
                    for (let i = 5; i >= 0; i--) {
                      const d = subMonths(now, i);
                      const m = d.getMonth();
                      const y = d.getFullYear();
                      const mSales = sales.filter(s => {
                        const sd = new Date(s.sale_date || s.created_at);
                        return sd.getMonth() === m && sd.getFullYear() === y;
                      });
                      const rev = mSales.reduce((sum, s) => sum + (Number(s.sale_price) || 0), 0);
                      const prf = mSales.reduce((sum, s) => {
                        const vehicleId = s.vehicle_id || s.sale_vehicles?.[0]?.vehicle_id;
                        const v = vehicleId ? fullVehicleMap[vehicleId] : null;
                        const cost = Number(v?.cost_price) || 0;
                        const sale = Number(s.sale_price) || 0;
                        return sum + (sale - cost);
                      }, 0);
                      data.push({ name: format(d, 'MMM'), Revenue: rev, Profit: prf });
                    }
                    return data;
                  })()} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevS" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/><stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/></linearGradient>
                      <linearGradient id="colorPrfS" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(142 76% 36%)" stopOpacity={0.8}/><stop offset="95%" stopColor="hsl(142 76% 36%)" stopOpacity={0}/></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--foreground)/0.05)" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₦${(v/1000000).toFixed(1)}M`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="Revenue" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorRevS)" strokeWidth={3} />
                    <Area type="monotone" dataKey="Profit" stroke="hsl(142 76% 36%)" fillOpacity={1} fill="url(#colorPrfS)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="lg:col-span-4 bento-card p-6 flex flex-col justify-center">
              <h3 className="font-bold text-lg flex items-center gap-2 mb-6"><PieChartIcon className="w-5 h-5 text-amber-500" /> Top Makes</h3>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={(() => {
                      const makes: Record<string, number> = {};
                      sales.forEach(s => {
                        const vehicleId = s.vehicle_id || s.sale_vehicles?.[0]?.vehicle_id;
                        const v = vehicleId ? fullVehicleMap[vehicleId] : null;
                        const make = v?.make || 'Unknown';
                        makes[make] = (makes[make] || 0) + 1;
                      });
                      return Object.entries(makes).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value).slice(0, 5);
                    })()} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {COLORS.map((color, i) => <Cell key={i} fill={color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="glass-panel p-4 rounded-3xl flex flex-col sm:flex-row gap-4 items-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-transparent pointer-events-none" />
        <div className="relative w-full group z-10">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-violet-500 transition-colors" />
          <Input 
            placeholder="Search by vehicle or customer name..." 
            value={search} 
            onChange={(e) => { setSearch(e.target.value); setPage(0); }} 
            className="pl-10 h-10 rounded-xl bg-background/50 border-white/10 focus-visible:ring-violet-500/50 transition-all font-medium text-sm w-full"
          />
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="space-y-4">
          {[1,2,3,4,5].map(i => <div key={i} className="h-16 w-full rounded-2xl bg-card/40 animate-pulse border border-white/5" />)}
        </div>
      ) : sales.length === 0 ? (
        <div className="bento-card p-12 flex flex-col items-center justify-center text-center">
          <div className="bg-violet-500/10 p-5 rounded-full mb-4">
            <DollarSign className="h-10 w-10 text-violet-500" />
          </div>
          <h2 className="text-xl font-bold mb-2">No sales recorded.</h2>
          <p className="text-muted-foreground max-w-sm mb-6">Start tracking your dealership revenue by recording your first sale.</p>
          <Button onClick={() => { setForm(emptyForm); setEditId(null); setDialogOpen(true); }} className="rounded-xl shadow-lg shadow-violet-500/20 bg-violet-500 hover:bg-violet-600 text-white">Record Sale</Button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bento-card overflow-hidden">
            <div className="overflow-x-auto w-full">
              <Table className="w-full">
                <TableHeader className="bg-foreground/5 pointer-events-none">
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="font-semibold px-6 py-4">Vehicle</TableHead>
                    <TableHead className="font-semibold">Customer</TableHead>
                    <TableHead className="font-semibold">Sale Price</TableHead>
                    <TableHead className="font-semibold">Sale Date</TableHead>
                    <TableHead className="text-right font-semibold px-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map((s) => (
                    <TableRow key={s.id} className="border-border/10 hover:bg-white/5 transition-colors group">
                      <TableCell className="px-6 py-4">
                         <div className="flex items-center gap-2">
                            <Car className="h-4 w-4 text-muted-foreground" />
                            <span className="font-semibold text-sm transition-colors group-hover:text-violet-500">{vehicleMap[s.vehicle_id] || "—"}</span>
                         </div>
                      </TableCell>
                      <TableCell>
                         <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{customerMap[s.customer_id] || "—"}</span>
                         </div>
                      </TableCell>
                      <TableCell className="font-semibold">₦{Number(s.sale_price).toLocaleString()}</TableCell>
                      <TableCell className="text-muted-foreground text-sm flex items-center gap-2"><Calendar className="h-3.5 w-3.5" /> {new Date(s.sale_date).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right px-6">
                        <div className="flex justify-end gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="sm" className="h-8 rounded-lg hover:bg-foreground/20 text-amber-500" onClick={() => setQrId(s.id)}>
                            <QrCode className="h-4 w-4 mr-1.5" /> Sign Link
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 rounded-lg hover:bg-foreground/20 text-sky-500">
                                <FileDown className="h-4 w-4 mr-1.5" /> Download
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="rounded-xl glass-panel p-2 shadow-2xl border-white/10" align="end">
                              <DropdownMenuItem onClick={() => downloadSaleReceipt(s, "png")} className="rounded-lg cursor-pointer gap-2">
                                <Image className="h-4 w-4 text-emerald-500" /> Save as PNG
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => downloadSaleReceipt(s, "jpeg")} className="rounded-lg cursor-pointer gap-2">
                                <Image className="h-4 w-4 text-amber-500" /> Save as JPEG
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => downloadSaleReceipt(s, "pdf")} className="rounded-lg cursor-pointer gap-2">
                                <FileDown className="h-4 w-4 text-violet-500" /> Save as PDF
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <Button variant="ghost" size="sm" className="h-8 rounded-lg hover:bg-foreground/20" onClick={() => printReceipt(s)}>
                            <Receipt className="h-4 w-4 mr-1.5" /> Receipt
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 rounded-lg hover:bg-violet-500/10 hover:text-violet-500" onClick={() => navigate(`/invoices?action=create&customer_id=${s.customer_id}&sale_id=${s.id}&type=sale`)}>
                            <FileOutput className="h-4 w-4 mr-1.5" /> Invoice
                          </Button>
                          {hasEdit && (
                            <>
                              <Button variant="ghost" size="icon" onClick={() => openEdit(s)} className="h-8 w-8 rounded-lg hover:bg-foreground/20">
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => setDeleteId(s.id)} className="h-8 w-8 rounded-lg hover:bg-destructive/20 hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-6 border-t border-border/10">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => page > 0 && setPage(page - 1)}
                      className={page === 0 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  
                  {[...Array(totalPages)].map((_, i) => (
                    <PaginationItem key={i} className="hidden sm:block">
                      <PaginationLink 
                        isActive={page === i}
                        onClick={() => setPage(i)}
                        className="cursor-pointer"
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => page < totalPages - 1 && setPage(page + 1)}
                      className={page >= totalPages - 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
              <div className="text-center mt-4 text-xs text-muted-foreground sm:hidden">
                Page {page + 1} of {totalPages}
              </div>
            </div>
          )}
        </div>
      )}
    </div>

    {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl glass-panel shadow-2xl border-white/10 p-0 bg-background/95 backdrop-blur-3xl">
          <div className="p-6 border-b border-white/5 bg-foreground/5 pointer-events-none">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">{editId ? "Edit Sale Details" : "Record New Sale"}</DialogTitle>
            </DialogHeader>
          </div>
          <div className="p-6 space-y-5">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Customer *</Label>
              <Select value={form.customer_id} onValueChange={(v) => setForm({ ...form, customer_id: v })}>
                <SelectTrigger className="rounded-xl h-11 bg-background/50 border-white/10 focus-visible:ring-violet-500"><SelectValue placeholder="Select customer" /></SelectTrigger>
                <SelectContent className="glass-panel rounded-xl">
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="rounded-lg">{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Select Vehicles *</Label>
              <div className="bg-foreground/5 border border-white/5 p-4 rounded-2xl flex flex-col gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input 
                    placeholder="Search by make, model, or year..." 
                    className="h-9 pl-9 rounded-xl bg-background/50 border-white/10 text-sm"
                    value={vehicleSearch}
                    onChange={(e) => setVehicleSearch(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                  {vehicles
                    .filter((v) => `${v.year} ${v.make} ${v.model}`.toLowerCase().includes(vehicleSearch.toLowerCase()))
                    .map((v) => (
                    <div 
                      key={v.id} 
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                        form.selected_vehicle_ids.includes(v.id) 
                          ? 'bg-violet-500/10 border-violet-500/20 text-violet-500' 
                          : 'bg-background/40 border-white/5 hover:bg-white/5'
                      }`}
                      onClick={() => {
                        const ids = form.selected_vehicle_ids.includes(v.id)
                          ? form.selected_vehicle_ids.filter(id => id !== v.id)
                          : [...form.selected_vehicle_ids, v.id];
                        setForm({ ...form, selected_vehicle_ids: ids });
                      }}
                    >
                      <Checkbox checked={form.selected_vehicle_ids.includes(v.id)} className="data-[state=checked]:bg-violet-500 pointer-events-none" />
                      <span className="text-[13px] font-medium leading-tight">{v.year} {v.make} {v.model}</span>
                    </div>
                  ))}
                  {vehicles.filter((v) => `${v.year} ${v.make} ${v.model}`.toLowerCase().includes(vehicleSearch.toLowerCase())).length === 0 && (
                     <div className="col-span-1 sm:col-span-2 text-center text-sm text-muted-foreground py-4 italic">No matching vehicles found.</div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Sale Price *</Label>
                <CurrencyInput className="rounded-xl h-11 bg-background/50 border-white/10 focus-visible:ring-violet-500 font-bold" placeholder="0" value={form.sale_price} onChange={(e) => setForm({ ...form, sale_price: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sale Date *</Label>
                <Input className="rounded-xl h-11 bg-background/50 border-white/10 focus-visible:ring-violet-500" type="date" value={form.sale_date} onChange={(e) => setForm({ ...form, sale_date: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Payment Type</Label>
                 <Select value={form.payment_type} onValueChange={(v) => setForm({ ...form, payment_type: v })}>
                   <SelectTrigger className="rounded-xl h-11 bg-background/50 border-white/10"><SelectValue /></SelectTrigger>
                   <SelectContent className="glass-panel border-white/10 rounded-xl">
                     <SelectItem value="cash">Cash</SelectItem>
                     <SelectItem value="transfer">Bank Transfer</SelectItem>
                     <SelectItem value="pos">POS</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
               <div className="space-y-2">
                 <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Payment Status</Label>
                 <Select value={form.payment_status} onValueChange={(v) => setForm({ ...form, payment_status: v })}>
                   <SelectTrigger className="rounded-xl h-11 bg-background/50 border-white/10"><SelectValue /></SelectTrigger>
                   <SelectContent className="glass-panel border-white/10 rounded-xl">
                     <SelectItem value="paid_in_full">Paid in Full</SelectItem>
                     <SelectItem value="deposit">Deposit Only</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
            </div>

            <div className="pt-4 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-4">
                  <div className="space-y-2">
                     <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Seller / Rep Name</Label>
                     <Input className="rounded-xl h-11 bg-background/50 border-white/10" placeholder="Full name" value={form.rep_name} onChange={(e) => setForm({ ...form, rep_name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                     <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Rep Signature</Label>
                     <div className="rounded-2xl overflow-hidden border border-white/10 bg-background/50">
                        <SignaturePad value={form.rep_signature} onChange={(v) => setForm({ ...form, rep_signature: v })} />
                     </div>
                  </div>
               </div>

               <div className="space-y-4">
                  <div className="space-y-2">
                     <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Buyer Signature (In-Person)</Label>
                     <div className="rounded-2xl overflow-hidden border border-white/10 bg-background/50">
                        <SignaturePad value={form.buyer_signature} onChange={(v) => setForm({ ...form, buyer_signature: v })} />
                     </div>
                  </div>
                  {form.buyer_signature && (
                    <div className="space-y-2">
                       <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Buyer Signed Date</Label>
                       <Input type="date" className="rounded-xl h-11 bg-background/50 border-white/10" value={form.buyer_signature_date} onChange={(e) => setForm({ ...form, buyer_signature_date: e.target.value })} />
                    </div>
                  )}
                  <p className="text-[10px] text-muted-foreground italic">Or use the "Sign Link" in the table to send this to the customer.</p>
               </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-white/5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notes</Label>
              <Textarea className="rounded-xl min-h-[80px] bg-background/50 border-white/10 focus-visible:ring-violet-500" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Additional remarks regarding the sale..." />
            </div>
          </div>
          <div className="p-6 border-t border-white/5 bg-foreground/5 flex justify-end gap-3">
            <Button variant="outline" onClick={closeDialog} className="rounded-xl border-white/10 hover:bg-white/5">Cancel</Button>
            <Button onClick={() => upsertMutation.mutate()} disabled={!canSubmit} className="rounded-xl bg-violet-500 hover:bg-violet-600 text-white border-0 shadow-lg shadow-violet-500/20">
              {editId ? "Update Sale" : "Record Sale"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-3xl glass-panel border-white/10 p-6 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-foreground">Delete Sale</AlertDialogTitle>
            <AlertDialogDescription className="text-base text-muted-foreground">This action cannot be undone and will permanently remove the sale record.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2">
            <AlertDialogCancel className="rounded-xl border-white/10 text-foreground hover:bg-white/5 sm:mt-0">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (deleteId) deleteMutation.mutate(deleteId); setDeleteId(null); }}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg shadow-destructive/20 border-none"
            >Delete Forever</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <QrSignDialog 
        open={!!qrId} 
        onOpenChange={(open) => !open && setQrId(null)} 
        type="sale" 
        id={qrId} 
      />
    </>
  );
}
