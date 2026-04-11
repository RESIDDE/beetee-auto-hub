import { useState, useRef } from "react";
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
import { PlusCircle, Pencil, Trash2, Receipt, Download, FileText, Printer, FileOutput, DollarSign, Calendar } from "lucide-react";
import { toast } from "sonner";
import { exportToCSV, exportToJSON, printTable } from "@/lib/exportHelpers";

const emptyForm = { vehicle_id: "", customer_id: "", sale_price: "", sale_date: new Date().toISOString().split("T")[0], notes: "" };

export default function Sales() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [receiptSale, setReceiptSale] = useState<any>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: sales = [], isLoading } = useQuery({
    queryKey: ["sales"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sales").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("vehicles").select("id, make, model, year");
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

  const vehicleMap = Object.fromEntries(vehicles.map((v) => [v.id, `${v.year} ${v.make} ${v.model}`]));
  const customerMap = Object.fromEntries(customers.map((c) => [c.id, c.name]));
  const customerObjMap = Object.fromEntries(customers.map((c) => [c.id, c]));

  const upsertMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        vehicle_id: form.vehicle_id,
        customer_id: form.customer_id,
        sale_price: parseFloat(form.sale_price),
        sale_date: form.sale_date,
        notes: form.notes || null,
      };
      if (editId) {
        const { error } = await supabase.from("sales").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("sales").insert(payload);
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
      vehicle_id: s.vehicle_id,
      customer_id: s.customer_id,
      sale_price: String(s.sale_price),
      sale_date: s.sale_date,
      notes: s.notes || "",
    });
    setDialogOpen(true);
  };

  const canSubmit = form.vehicle_id && form.customer_id && form.sale_price && !upsertMutation.isPending;

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
    const veh = vehicleMap[sale.vehicle_id] || sale.vehicle_id;
    const html = `<html><head><title>Receipt</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 40px; max-width: 500px; margin: 0 auto; }
      .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 16px; margin-bottom: 24px; }
      .header h1 { font-size: 22px; margin: 0; }
      .header p { color: #666; font-size: 12px; margin: 4px 0 0; }
      .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; font-size: 14px; }
      .row .label { color: #666; }
      .row .value { font-weight: 600; }
      .total { font-size: 20px; text-align: right; margin-top: 16px; padding-top: 16px; border-top: 2px solid #333; }
      .footer { text-align: center; margin-top: 32px; font-size: 11px; color: #999; }
      @media print { body { padding: 20px; } }
    </style></head><body>
    <div class="header">
      <h1>Beetee Autos</h1>
      <p>Sales Receipt</p>
    </div>
    <div class="row"><span class="label">Receipt No</span><span class="value">${sale.id.slice(0, 8).toUpperCase()}</span></div>
    <div class="row"><span class="label">Date</span><span class="value">${new Date(sale.sale_date).toLocaleDateString()}</span></div>
    <div class="row"><span class="label">Customer</span><span class="value">${cust?.name || "—"}</span></div>
    ${cust?.phone ? `<div class="row"><span class="label">Phone</span><span class="value">${cust.phone}</span></div>` : ""}
    ${cust?.email ? `<div class="row"><span class="label">Email</span><span class="value">${cust.email}</span></div>` : ""}
    <div class="row"><span class="label">Vehicle</span><span class="value">${veh}</span></div>
    ${sale.notes ? `<div class="row"><span class="label">Notes</span><span class="value">${sale.notes}</span></div>` : ""}
    <div class="total">Total: ₦${Number(sale.sale_price).toLocaleString()}</div>
    <div class="footer">Thank you for your business!<br/>Beetee Autos</div>
    </body></html>`;
    const win = window.open("", "_blank");
    if (win) { win.document.write(html); win.document.close(); win.print(); }
  };

  return (
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
          <h2 className="text-xl font-bold mb-2">No sales recorded yet.</h2>
          <p className="text-muted-foreground max-w-sm mb-6">You haven't recorded any vehicle sales. Added sales will appear here.</p>
          <Button onClick={() => { setForm(emptyForm); setEditId(null); setDialogOpen(true); }} className="rounded-xl shadow-lg shadow-violet-500/20 bg-violet-500 hover:bg-violet-600 text-white">Record Sale</Button>
        </div>
      ) : (
        <div className="bento-card overflow-hidden">
          <div className="overflow-x-auto w-full">
            <Table className="w-full">
              <TableHeader className="bg-foreground/5 pointer-events-none">
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="font-semibold px-6 py-4">Vehicle</TableHead>
                  <TableHead className="font-semibold">Customer</TableHead>
                  <TableHead className="font-semibold">Sale Price</TableHead>
                  <TableHead className="font-semibold">Sale Date</TableHead>
                  <TableHead className="font-semibold">Notes</TableHead>
                  <TableHead className="text-right font-semibold px-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((s) => (
                  <TableRow key={s.id} className="border-border/10 hover:bg-white/5 transition-colors group">
                    <TableCell className="px-6 py-4 font-semibold text-sm transition-colors group-hover:text-violet-500">
                      {vehicleMap[s.vehicle_id] || s.vehicle_id}
                    </TableCell>
                    <TableCell className="text-sm">
                       {customerMap[s.customer_id] || s.customer_id}
                    </TableCell>
                    <TableCell className="font-semibold">
                       <span className="bg-foreground/5 px-2 py-1 rounded-md group-hover:bg-violet-500/10 group-hover:text-violet-500 transition-colors">
                          ₦{Number(s.sale_price).toLocaleString()}
                       </span>
                    </TableCell>
                    <TableCell className="text-sm font-medium text-muted-foreground">
                      <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{new Date(s.sale_date).toLocaleDateString()}</div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground text-xs">{s.notes || "—"}</TableCell>
                    <TableCell className="text-right px-6">
                      <div className="flex justify-end gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" onClick={() => printReceipt(s)} title="Receipt" className="h-8 w-8 rounded-lg hover:bg-emerald-500/20 hover:text-emerald-500">
                          <Receipt className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => navigate(`/invoices?action=create&customer_id=${s.customer_id}&sale_id=${s.id}&type=sale`)} title="Generate Invoice" className="h-8 w-8 rounded-lg hover:bg-sky-500/20 hover:text-sky-500">
                          <FileOutput className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(s)} className="h-8 w-8 rounded-lg hover:bg-foreground/20">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(s.id)} className="h-8 w-8 rounded-lg hover:bg-destructive/20 hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl glass-panel shadow-2xl border-white/10 p-0 overflow-hidden bg-background/95 backdrop-blur-3xl">
          <div className="p-6 border-b border-white/5 bg-foreground/5 pointer-events-none">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">{editId ? "Edit Sale Details" : "Record New Sale"}</DialogTitle>
            </DialogHeader>
          </div>
          <div className="p-6 space-y-5">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Vehicle *</Label>
              <Select value={form.vehicle_id} onValueChange={(v) => setForm({ ...form, vehicle_id: v })}>
                <SelectTrigger className="rounded-xl h-11 bg-background/50 border-white/10 focus-visible:ring-violet-500"><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                <SelectContent className="glass-panel rounded-xl">
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id} className="rounded-lg">{v.year} {v.make} {v.model}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sale Price *</Label>
                <Input className="rounded-xl h-11 bg-background/50 border-white/10 focus-visible:ring-violet-500" type="number" value={form.sale_price} onChange={(e) => setForm({ ...form, sale_price: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sale Date *</Label>
                <Input className="rounded-xl h-11 bg-background/50 border-white/10 focus-visible:ring-violet-500" type="date" value={form.sale_date} onChange={(e) => setForm({ ...form, sale_date: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
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
    </div>
  );
}
