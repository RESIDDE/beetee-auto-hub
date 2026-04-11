import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Pencil, Trash2, PlusCircle, Wrench, Car, QrCode, FileOutput } from "lucide-react";
import VehicleMakeModelSelector from "@/components/VehicleMakeModelSelector";
import { SignaturePad } from "@/components/SignaturePad";
import { QrSignDialog } from "@/lib/qrHelpers";

type Repair = {
  id: string;
  vehicle_id: string | null;
  customer_id: string | null;
  manual_make: string | null;
  manual_model: string | null;
  manual_year: string | null;
  model_year: number | null;
  unit: string | null;
  condition: string | null;
  company: string | null;
  replacement_parts: string | null;
  damaged_parts: string | null;
  to_be_resprayed: boolean;
  repair_cost: number | null;
  deposit_amount: number | null;
  payment_status: string | null;
  payment_type: string | null;
  brought_in_by: string | null;
  handed_to: string | null;
  signature_data: string | null;
  created_at: string;
  updated_at: string;
  vehicles?: { make: string; model: string; year: number } | null;
};

const emptyForm = {
  vehicle_id: "",
  customer_id: "",
  make: "",
  model: "",
  year: "",
  unit: "",
  condition: "",
  company: "",
  replacement_parts: "",
  damaged_parts: "",
  to_be_resprayed: false,
  repair_cost: "",
  deposit_amount: "",
  payment_status: "deposit",
  payment_type: "cash",
  brought_in_by: "",
  handed_to: "",
  signature_data: "",
};

export default function RepairsMaintenance() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [qrId, setQrId] = useState<string | null>(null);

  const { data: repairs = [], isLoading } = useQuery({
    queryKey: ["repairs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("repairs")
        .select("*, vehicles(make, model, year)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Repair[];
    },
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ["vehicles-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("vehicles").select("id, make, model, year").order("make");
      if (error) throw error;
      return data;
    },
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["customers-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("customers").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });

  const upsert = useMutation({
    mutationFn: async () => {
      const payload: any = {
        vehicle_id: form.vehicle_id || null,
        customer_id: form.customer_id || null,
        manual_make: form.vehicle_id ? null : (form.make || null),
        manual_model: form.vehicle_id ? null : (form.model || null),
        manual_year: form.vehicle_id ? null : (form.year || null),
        model_year: form.year ? Number(form.year) : null,
        unit: form.unit || null,
        condition: form.condition || null,
        company: form.company || null,
        replacement_parts: form.replacement_parts || null,
        damaged_parts: form.damaged_parts || null,
        to_be_resprayed: form.to_be_resprayed,
        repair_cost: form.repair_cost ? Number(form.repair_cost) : 0,
        deposit_amount: form.deposit_amount ? Number(form.deposit_amount) : 0,
        payment_status: form.payment_status,
        payment_type: form.payment_type,
        brought_in_by: form.brought_in_by || null,
        handed_to: form.handed_to || null,
        signature_data: form.signature_data || null,
      };
      if (editId) {
        const { error } = await supabase.from("repairs").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("repairs").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["repairs"] });
      toast.success(editId ? "Repair updated" : "Repair added");
      closeDialog();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("repairs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["repairs"] });
      toast.success("Repair deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const closeDialog = () => { setOpen(false); setForm(emptyForm); setEditId(null); };

  const openEdit = (r: Repair) => {
    setForm({
      vehicle_id: r.vehicle_id || "",
      customer_id: r.customer_id || "",
      make: r.manual_make || r.vehicles?.make || "",
      model: r.manual_model || r.vehicles?.model || "",
      year: r.manual_year || r.model_year?.toString() || r.vehicles?.year?.toString() || "",
      unit: r.unit || "",
      condition: r.condition || "",
      company: r.company || "",
      replacement_parts: r.replacement_parts || "",
      damaged_parts: r.damaged_parts || "",
      to_be_resprayed: r.to_be_resprayed,
      repair_cost: r.repair_cost?.toString() || "",
      deposit_amount: r.deposit_amount?.toString() || "",
      payment_status: r.payment_status || "deposit",
      payment_type: r.payment_type || "cash",
      brought_in_by: r.brought_in_by || "",
      handed_to: r.handed_to || "",
      signature_data: r.signature_data || "",
    });
    setEditId(r.id);
    setOpen(true);
  };

  const handleVehicleSelect = (vehicleId: string) => {
    const v = vehicles.find((x) => x.id === vehicleId);
    if (v) {
      setForm({ ...form, vehicle_id: vehicleId, make: v.make, model: v.model, year: v.year.toString() });
    }
  };

  const getVehicleLabel = (r: Repair) => {
    if (r.vehicles) return `${r.vehicles.year} ${r.vehicles.make} ${r.vehicles.model}`;
    if (r.manual_make) return `${r.manual_year || ""} ${r.manual_make} ${r.manual_model || ""}`.trim();
    return "Unknown vehicle";
  };

  const paymentStatusLabel = (s: string | null) => s === "paid_in_full" ? "Paid in Full" : "Deposit";
  const paymentTypeLabel = (t: string | null) => t === "transfer" ? "Transfer" : t === "pos" ? "POS" : "Cash";

  return (
    <div className="space-y-8 animate-fade-up pb-10 max-w-6xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 opacity-80">
            <Wrench className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium uppercase tracking-wider text-amber-500">Service Department</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-foreground via-foreground to-foreground/70 tracking-tight">
            Repairs & Maintenance
          </h1>
          <p className="text-base text-muted-foreground mt-2 max-w-xl">
            Track vehicle repairs, maintenance schedules, signatures, and associated costs.
          </p>
        </div>
        <div className="shrink-0">
          <Button onClick={() => { setForm(emptyForm); setEditId(null); setOpen(true); }} size="lg" className="rounded-2xl shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all bg-amber-500 hover:bg-amber-600 text-white">
            <PlusCircle className="mr-2 h-5 w-5" /> Record Repair
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((n) => <div key={n} className="h-40 rounded-3xl bg-card/40 animate-pulse border border-white/5" />)}
        </div>
      ) : repairs.length === 0 ? (
        <div className="bento-card p-12 flex flex-col items-center justify-center text-center">
          <div className="bg-amber-500/10 p-5 rounded-full mb-4">
            <Wrench className="h-10 w-10 text-amber-500" />
          </div>
          <h2 className="text-xl font-bold mb-2">No repairs recorded yet.</h2>
          <p className="text-muted-foreground max-w-sm mb-6">Service records, parts replacements, and associated costs will appear here.</p>
          <Button onClick={() => { setForm(emptyForm); setEditId(null); setOpen(true); }} className="rounded-xl shadow-lg shadow-amber-500/20 bg-amber-500 hover:bg-amber-600 text-white">Record Repair</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {repairs.map((r) => (
            <div key={r.id} className="bento-card p-6 flex flex-col justify-between group">
              <div>
                <div className="flex items-start gap-4 mb-4">
                  <div className="bg-foreground/5 p-3 rounded-2xl group-hover:bg-amber-500/10 transition-colors shrink-0">
                    <Car className="h-5 w-5 text-foreground/70 group-hover:text-amber-500 transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-foreground truncate group-hover:text-primary transition-colors" title={getVehicleLabel(r)}>{getVehicleLabel(r)}</h3>
                    
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                      {r.company && <span className="text-xs text-muted-foreground">Company: {r.company}</span>}
                      {r.brought_in_by && <span className="text-xs text-muted-foreground">By: {r.brought_in_by}</span>}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-3">
                         {r.repair_cost != null && <span className="text-sm font-semibold text-foreground bg-foreground/5 px-2 py-1 rounded-md">₦{Number(r.repair_cost).toLocaleString()}</span>}
                         <span className={`inline-flex text-[11px] font-bold uppercase px-2 py-1.5 rounded-lg border ${r.payment_status === "paid_in_full" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20"}`}>
                           {paymentStatusLabel(r.payment_status)}
                         </span>
                         <span className="text-[11px] font-medium text-muted-foreground bg-foreground/5 px-2 py-1.5 rounded-lg uppercase tracking-wider">{paymentTypeLabel(r.payment_type)}</span>
                         {r.to_be_resprayed && <span className="text-[11px] font-bold uppercase px-2 py-1.5 rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20">Re-spray</span>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-6 pt-4 border-t border-white/5 justify-end">
                <Button variant="ghost" size="sm" className="h-8 rounded-lg hover:bg-foreground/10 hover:text-foreground text-muted-foreground transition-all" onClick={() => openEdit(r)}>
                  <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit
                </Button>
                <Button variant="ghost" size="sm" className="h-8 rounded-lg hover:bg-amber-500/10 hover:text-amber-500 text-muted-foreground transition-all" onClick={() => setQrId(r.id)}>
                  <QrCode className="h-3.5 w-3.5 mr-1.5" /> QR Sign
                </Button>
                <Button variant="ghost" size="sm" className="h-8 rounded-lg hover:bg-sky-500/10 hover:text-sky-500 text-muted-foreground transition-all" title="Generate Invoice"
                  onClick={() => {
                    if (!r.customer_id) { toast.error("Assign a customer to this repair before invoicing"); return; }
                    navigate(`/invoices?action=create&customer_id=${r.customer_id}&repair_id=${r.id}&type=repair`);
                  }}
                ><FileOutput className="h-3.5 w-3.5 mr-1.5" /> Invoice</Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all" onClick={() => { if(window.confirm("Are you sure?")) deleteMut.mutate(r.id) }}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* QR Dialog */}
      <QrSignDialog open={!!qrId} onOpenChange={() => setQrId(null)} type="repair" id={qrId} />

      {/* Form Dialog */}
      <Dialog open={open} onOpenChange={(v) => !v && closeDialog()}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl glass-panel shadow-2xl border-white/10 p-0 overflow-hidden bg-background/95 backdrop-blur-3xl">
          <div className="p-6 border-b border-white/5 bg-foreground/5 pointer-events-none">
             <DialogHeader><DialogTitle className="text-xl font-bold">{editId ? "Edit Repair Details" : "Record New Repair"}</DialogTitle></DialogHeader>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); upsert.mutate(); }} className="p-6 space-y-5">
            {/* Customer */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Customer</Label>
              <Select value={form.customer_id} onValueChange={(v) => setForm({ ...form, customer_id: v })}>
                <SelectTrigger className="rounded-xl h-11 bg-background/50 border-white/10 focus-visible:ring-amber-500"><SelectValue placeholder="Select customer..." /></SelectTrigger>
                <SelectContent className="glass-panel rounded-xl">
                  {customers.map((c) => <SelectItem key={c.id} value={c.id} className="rounded-lg">{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Vehicle from inventory */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Select from Inventory</Label>
              <Select value={form.vehicle_id} onValueChange={handleVehicleSelect}>
                <SelectTrigger className="rounded-xl h-11 bg-background/50 border-white/10 focus-visible:ring-amber-500"><SelectValue placeholder="Select inventory vehicle..." /></SelectTrigger>
                <SelectContent className="glass-panel rounded-xl">
                  {vehicles.map((v) => <SelectItem key={v.id} value={v.id} className="rounded-lg">{v.year} {v.make} {v.model}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Manual vehicle details */}
            <div className="bg-background/40 border border-white/10 rounded-2xl p-5 space-y-4 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground relative z-10">Or Enter Details Manually</p>
              <div className="relative z-10">
                <VehicleMakeModelSelector
                  make={form.make}
                  model={form.model}
                  year={form.year}
                  onMakeChange={(v) => setForm({ ...form, make: v, vehicle_id: "" })}
                  onModelChange={(v) => setForm({ ...form, model: v, vehicle_id: "" })}
                  onYearChange={(v) => setForm({ ...form, year: v, vehicle_id: "" })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Unit</Label><Input className="rounded-xl h-11 bg-background/50 border-white/10 focus-visible:ring-amber-500" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></div>
              <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Condition</Label><Input className="rounded-xl h-11 bg-background/50 border-white/10 focus-visible:ring-amber-500" value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })} /></div>
            </div>

            <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Company</Label><Input className="rounded-xl h-11 bg-background/50 border-white/10 focus-visible:ring-amber-500" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></div>

            <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Replacement Parts</Label><Textarea className="rounded-xl min-h-[80px] bg-background/50 border-white/10 focus-visible:ring-amber-500" value={form.replacement_parts} onChange={(e) => setForm({ ...form, replacement_parts: e.target.value })} placeholder="List replacement parts..." /></div>

            <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Damaged Parts</Label><Textarea className="rounded-xl min-h-[80px] bg-background/50 border-white/10 focus-visible:ring-amber-500" value={form.damaged_parts} onChange={(e) => setForm({ ...form, damaged_parts: e.target.value })} placeholder="List damaged parts..." /></div>

            <div className="flex items-center space-x-3 bg-background/50 border border-white/10 p-4 rounded-xl hover:bg-white/5 transition-colors cursor-pointer" onClick={() => setForm({ ...form, to_be_resprayed: !form.to_be_resprayed })}>
              <Checkbox id="respray" checked={form.to_be_resprayed} onCheckedChange={(v) => setForm({ ...form, to_be_resprayed: v === true })} className="data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500" />
              <Label htmlFor="respray" className="text-sm font-semibold cursor-pointer">Requires Re-spraying</Label>
            </div>

            <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Repair Cost (Total)</Label><Input className="rounded-xl h-11 bg-background/50 border-white/10 focus-visible:ring-amber-500" type="number" step="0.01" value={form.repair_cost} onChange={(e) => setForm({ ...form, repair_cost: e.target.value })} placeholder="0.00" /></div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Payment Status</Label>
                <Select value={form.payment_status} onValueChange={(v) => setForm({ ...form, payment_status: v })}>
                  <SelectTrigger className="rounded-xl h-11 bg-background/50 border-white/10 focus-visible:ring-amber-500"><SelectValue /></SelectTrigger>
                  <SelectContent className="glass-panel rounded-xl">
                    <SelectItem value="deposit" className="rounded-lg">Deposit</SelectItem>
                    <SelectItem value="paid_in_full" className="rounded-lg">Paid in Full</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Payment Type</Label>
                <Select value={form.payment_type} onValueChange={(v) => setForm({ ...form, payment_type: v })}>
                  <SelectTrigger className="rounded-xl h-11 bg-background/50 border-white/10 focus-visible:ring-amber-500"><SelectValue /></SelectTrigger>
                  <SelectContent className="glass-panel rounded-xl">
                    <SelectItem value="cash" className="rounded-lg">Cash</SelectItem>
                    <SelectItem value="transfer" className="rounded-lg">Transfer</SelectItem>
                    <SelectItem value="pos" className="rounded-lg">POS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {form.payment_status === "deposit" && (
              <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Deposit Amount Paid</Label><Input className="rounded-xl h-11 bg-background/50 border-white/10 focus-visible:ring-amber-500" type="number" step="0.01" value={form.deposit_amount} onChange={(e) => setForm({ ...form, deposit_amount: e.target.value })} placeholder="0.00" /></div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Brought In By</Label><Input className="rounded-xl h-11 bg-background/50 border-white/10 focus-visible:ring-amber-500" value={form.brought_in_by} onChange={(e) => setForm({ ...form, brought_in_by: e.target.value })} /></div>
              <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Handed To</Label><Input className="rounded-xl h-11 bg-background/50 border-white/10 focus-visible:ring-amber-500" value={form.handed_to} onChange={(e) => setForm({ ...form, handed_to: e.target.value })} /></div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Electronic Signature</Label>
              <div className="rounded-xl overflow-hidden border border-white/10">
                 <SignaturePad value={form.signature_data} onChange={(v) => setForm({ ...form, signature_data: v })} />
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-white/5">
              <Button type="button" variant="outline" onClick={closeDialog} className="rounded-xl border-white/10 hover:bg-white/5">Cancel</Button>
              <Button type="submit" disabled={upsert.isPending} className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20">{editId ? "Update Repair" : "Save Repair"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
