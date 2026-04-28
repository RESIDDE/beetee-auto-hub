import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useFormPersistence } from "@/hooks/useFormPersistence";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious,
} from "@/components/ui/pagination";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PlusCircle, Pencil, Trash2, MessageSquare, Car, Users, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { canEdit } from "@/lib/permissions";
import { CustomerSelect } from "@/components/CustomerSelect";

const statuses = ["Open", "In Progress", "Closed"];
const emptyForm = {
  customer_id: "",
  vehicle_id: "",
  message: "",
  status: "Open",
  manual_customer_name: "",
  manual_customer_phone: "",
  manual_customer_email: "",
  manual_vehicle_make: "",
  manual_vehicle_model: "",
  manual_vehicle_year: "",
  is_new_customer: false,
  manual_customer_address: ""
};

export default function Inquiries() {
  const { role } = useAuth();
  const hasEdit = canEdit(role, "inquiries");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm, clearDraft] = useFormPersistence("inquiry", emptyForm, !!editId, editId || undefined);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 15;
  const queryClient = useQueryClient();

  const { data: inquiries = [], isLoading } = useQuery({
    queryKey: ["inquiries"],
    queryFn: async () => {
      const { data, error } = await supabase.from("inquiries").select("*").order("created_at", { ascending: false });
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
      const { data, error } = await supabase.from("customers").select("id, name, phone, email, address").order("name");
      if (error) throw error;
      return data;
    },
  });

  const vehicleMap = Object.fromEntries(vehicles.map((v) => [v.id, `${v.year} ${v.make} ${v.model}`]));
  const customerMap = Object.fromEntries(customers.map((c) => [c.id, c.name]));

  const filtered = (inquiries as any[]).filter((i) => {
    const q = search.toLowerCase();
    const cName = i.customer_id
      ? (customerMap[i.customer_id] || "").toLowerCase()
      : (i.manual_customer_name || "").toLowerCase();
    const cPhone = (i.manual_customer_phone || "").toLowerCase();
    const cEmail = (i.manual_customer_email || "").toLowerCase();

    const vName = i.vehicle_id
      ? (vehicleMap[i.vehicle_id] || "").toLowerCase()
      : `${i.manual_vehicle_year || ""} ${i.manual_vehicle_make || ""} ${i.manual_vehicle_model || ""}`.trim().toLowerCase();

    const msg = i.message.toLowerCase();
    return !q || cName.includes(q) || cPhone.includes(q) || cEmail.includes(q) || vName.includes(q) || msg.includes(q);
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const upsertMutation = useMutation({
    mutationFn: async () => {
      let finalCustomerId = form.customer_id;

      if (form.is_new_customer && form.manual_customer_name) {
        const { data: newCust, error: cErr } = await supabase.from("customers").insert({
          name: form.manual_customer_name,
          phone: form.manual_customer_phone || null,
          email: form.manual_customer_email || null,
          address: form.manual_customer_address || null,
        }).select().single();
        if (cErr) throw cErr;
        finalCustomerId = newCust.id;
      }

      if (form.is_new_customer && !form.manual_customer_name) {
        throw new Error("Please enter a customer name for the new customer.");
      }

      const payload = {
        customer_id: (finalCustomerId && finalCustomerId !== "none") ? finalCustomerId : null,
        vehicle_id: (form.vehicle_id && form.vehicle_id !== "none") ? form.vehicle_id : null,
        message: form.message,
        status: form.status,
        manual_customer_name: form.manual_customer_name || null,
        manual_customer_phone: form.manual_customer_phone || null,
        manual_customer_email: form.manual_customer_email || null,
        manual_vehicle_make: form.manual_vehicle_make || null,
        manual_vehicle_model: form.manual_vehicle_model || null,
        manual_vehicle_year: form.manual_vehicle_year || null,
      };

      if (editId) {
        const { error } = await supabase.from("inquiries").update(payload as any).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("inquiries").insert(payload as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inquiries"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success(editId ? "Inquiry updated" : "Inquiry added");
      clearDraft();
      setForm(emptyForm);
      setEditId(null);
      setDialogOpen(false);
    },
    onError: (error: any) => {
      console.error("Save error:", error);
      toast.error(`Failed to save inquiry: ${error.message || "Unknown error"}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("inquiries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inquiries"] });
      toast.success("Inquiry deleted");
    },
    onError: () => toast.error("Failed to delete inquiry"),
  });

  const closeDialog = () => { setDialogOpen(false); setEditId(null); };

  const openEdit = (i: any) => {
    setEditId(i.id);
    setForm({
      customer_id: i.customer_id || "",
      vehicle_id: i.vehicle_id || "",
      message: i.message,
      status: i.status,
      manual_customer_name: i.manual_customer_name || "",
      manual_customer_phone: i.manual_customer_phone || "",
      manual_customer_email: i.manual_customer_email || "",
      manual_vehicle_make: i.manual_vehicle_make || "",
      manual_vehicle_model: i.manual_vehicle_model || "",
      manual_vehicle_year: i.manual_vehicle_year || "",
      is_new_customer: false,
      manual_customer_address: i.manual_customer_address || "",
    });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-8 animate-fade-up pb-10 max-w-6xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 opacity-80">
            <MessageSquare className="w-4 h-4 text-indigo-500" />
            <span className="text-sm font-medium uppercase tracking-wider text-indigo-500">Support & Leads</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-foreground via-foreground to-foreground/70 tracking-tight">
            Inquiries
          </h1>
          <p className="text-base text-muted-foreground mt-2 max-w-xl">
            Track customer requests, messages, and vehicle interest logs.
          </p>
        </div>
        <div className="shrink-0">
          <Button onClick={() => { setEditId(null); setDialogOpen(true); }} size="lg" className="rounded-2xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all bg-indigo-500 hover:bg-indigo-600 text-white">
            <PlusCircle className="mr-2 h-5 w-5" /> Add Inquiry
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="glass-panel p-4 rounded-3xl flex flex-col sm:flex-row gap-4 items-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-transparent pointer-events-none" />
        <div className="relative w-full group z-10">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-indigo-500 transition-colors" />
          <Input
            placeholder="Search by customer, vehicle, or inquiry content..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="pl-10 h-10 rounded-xl bg-background/50 border-white/10 focus-visible:ring-indigo-500/50 transition-all font-medium text-sm w-full"
          />
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-16 w-full rounded-2xl bg-card/40 animate-pulse border border-white/5" />)}
        </div>
      ) : inquiries.length === 0 ? (
        <div className="bento-card p-12 flex flex-col items-center justify-center text-center">
          <div className="bg-indigo-500/10 p-5 rounded-full mb-4">
            <MessageSquare className="h-10 w-10 text-indigo-500" />
          </div>
          <h2 className="text-xl font-bold mb-2">No inquiries yet.</h2>
          <p className="text-muted-foreground max-w-sm mb-6">There are currently no active messages from customers.</p>
          <Button onClick={() => { setForm(emptyForm); setEditId(null); setDialogOpen(true); }} className="rounded-xl shadow-lg shadow-indigo-500/20 bg-indigo-500 hover:bg-indigo-600 text-white">Add Inquiry</Button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bento-card overflow-hidden">
            <div className="hidden md:block table-container">
              <Table className="w-full">
                <TableHeader className="bg-foreground/5 pointer-events-none">
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="font-semibold px-6 py-4">Customer</TableHead>
                    <TableHead className="font-semibold">Vehicle Interest</TableHead>
                    <TableHead className="font-semibold">Message</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="text-right font-semibold px-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map((i: any) => (
                    <TableRow key={i.id} className="border-border/10 hover:bg-white/5 transition-colors group">
                      <TableCell className="px-6 py-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="font-semibold text-sm transition-colors group-hover:text-indigo-500">
                              {i.customer_id ? customerMap[i.customer_id] || "—" : i.manual_customer_name || "—"}
                            </span>
                          </div>
                          {(i.manual_customer_phone || i.manual_customer_email) && (
                            <div className="text-[10px] text-muted-foreground ml-6 mt-0.5">
                              {i.manual_customer_phone} {i.manual_customer_email ? `| ${i.manual_customer_email}` : ""}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {(i.vehicle_id || i.manual_vehicle_make) ? <Car className="h-4 w-4 text-muted-foreground" /> : null}
                          <span className="text-sm">
                            {i.vehicle_id
                              ? vehicleMap[i.vehicle_id] || "—"
                              : i.manual_vehicle_make
                                ? `${i.manual_vehicle_year || ""} ${i.manual_vehicle_make} ${i.manual_vehicle_model || ""}`.trim()
                                : "—"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate text-sm text-muted-foreground">{i.message}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${i.status === "Open" ? "bg-indigo-500/10 text-indigo-500 border border-indigo-500/20" :
                            i.status === "In Progress" ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" :
                              "bg-muted/50 text-muted-foreground border border-white/5"
                          }`}>{i.status}</span>
                      </TableCell>
                      <TableCell className="text-right px-6">
                        <div className="flex justify-end gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                          {hasEdit && (
                            <>
                              <Button variant="ghost" size="icon" onClick={() => openEdit(i)} className="h-8 w-8 rounded-lg hover:bg-foreground/20">
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => setDeleteId(i.id)} className="h-8 w-8 rounded-lg hover:bg-destructive/20 hover:text-destructive">
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

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-white/5">
              {paged.map((i: any) => (
                <div key={i.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-sm tracking-tight">{i.customer_id ? customerMap[i.customer_id] || "—" : i.manual_customer_name || "—"}</p>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase mt-0.5">
                        {i.vehicle_id
                          ? vehicleMap[i.vehicle_id] || "—"
                          : i.manual_vehicle_make
                            ? `${i.manual_vehicle_year || ""} ${i.manual_vehicle_make} ${i.manual_vehicle_model || ""}`.trim()
                            : "General Inquiry"}
                      </p>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${i.status === "Open" ? "bg-indigo-500/10 text-indigo-500" :
                        i.status === "In Progress" ? "bg-amber-500/10 text-amber-500" : "bg-muted/50 text-muted-foreground"
                      }`}>{i.status}</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 italic">"{i.message}"</p>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-[10px] text-muted-foreground">{new Date(i.created_at).toLocaleDateString()}</span>
                    <div className="flex gap-1">
                      {hasEdit && (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => openEdit(i)} className="h-8 rounded-lg hover:bg-foreground/20">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setDeleteId(i.id)} className="h-8 rounded-lg hover:bg-destructive/20 hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
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

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl glass-panel shadow-2xl border-white/10 p-0 bg-background/95 backdrop-blur-3xl">
          <div className="p-6 border-b border-white/5 bg-foreground/5 pointer-events-none">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">{editId ? "Edit Inquiry Details" : "Log New Inquiry"}</DialogTitle>
            </DialogHeader>
          </div>
          <div className="p-6 space-y-5">
            {/* Customer Section */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-500" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-500">Customer Information</h3>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[10px] font-bold uppercase text-indigo-500 hover:text-indigo-600 hover:bg-indigo-500/5"
                  onClick={() => setForm({
                    ...form,
                    is_new_customer: !form.is_new_customer,
                    customer_id: !form.is_new_customer ? "none" : form.customer_id
                  })}
                >
                  {form.is_new_customer ? "Select Existing" : "Add New Customer"}
                </Button>
              </div>

              {!form.is_new_customer ? (
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Select Existing</Label>
                  <CustomerSelect
                    customers={customers}
                    value={form.customer_id}
                    onValueChange={(v) => setForm({ ...form, customer_id: v })}
                    onAddNew={() => setForm({ ...form, is_new_customer: true, customer_id: "none" })}
                    placeholder="Choose from database"
                    className="h-10"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 animate-fade-down">
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Full Name *</Label>
                    <Input className="rounded-lg h-9 bg-background/50 border-white/10" value={form.manual_customer_name} onChange={(e) => setForm({ ...form, manual_customer_name: e.target.value })} placeholder="Customer's full name" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Phone</Label>
                    <Input className="rounded-lg h-9 bg-background/50 border-white/10" value={form.manual_customer_phone} onChange={(e) => setForm({ ...form, manual_customer_phone: e.target.value })} placeholder="0812..." />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Email</Label>
                    <Input className="rounded-lg h-9 bg-background/50 border-white/10" value={form.manual_customer_email} onChange={(e) => setForm({ ...form, manual_customer_email: e.target.value })} placeholder="example@mail.com" />
                  </div>
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Address</Label>
                    <Input className="rounded-lg h-9 bg-background/50 border-white/10" value={form.manual_customer_address} onChange={(e) => setForm({ ...form, manual_customer_address: e.target.value })} placeholder="Physical address" />
                  </div>
                </div>
              )}
            </div>

            {/* Vehicle Section */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 mb-1">
                <Car className="w-4 h-4 text-indigo-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-500">Vehicle Interest</h3>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Select Existing</Label>
                <Select value={form.vehicle_id} onValueChange={(v) => setForm({ ...form, vehicle_id: v })}>
                  <SelectTrigger className="rounded-xl h-10 bg-background/50 border-white/10 focus-visible:ring-indigo-500"><SelectValue placeholder="Choose from inventory" /></SelectTrigger>
                  <SelectContent className="glass-panel rounded-xl">
                    <SelectItem value="none" className="rounded-lg text-muted-foreground italic">None (Use Manual Entry)</SelectItem>
                    {vehicles.map((v) => (
                      <SelectItem key={v.id} value={v.id} className="rounded-lg">{v.year} {v.make} {v.model}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {!form.vehicle_id || form.vehicle_id === "none" ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 animate-fade-down">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Make</Label>
                    <Input className="rounded-lg h-9 bg-background/50 border-white/10" value={form.manual_vehicle_make} onChange={(e) => setForm({ ...form, manual_vehicle_make: e.target.value })} placeholder="e.g. Toyota" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Model</Label>
                    <Input className="rounded-lg h-9 bg-background/50 border-white/10" value={form.manual_vehicle_model} onChange={(e) => setForm({ ...form, manual_vehicle_model: e.target.value })} placeholder="e.g. Camry" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Year</Label>
                    <Input className="rounded-lg h-9 bg-background/50 border-white/10" value={form.manual_vehicle_year} onChange={(e) => setForm({ ...form, manual_vehicle_year: e.target.value })} placeholder="e.g. 2022" />
                  </div>
                </div>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Message *</Label>
              <Textarea className="rounded-xl min-h-[100px] bg-background/50 border-white/10 focus-visible:ring-indigo-500" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Type the inquiry description here..." />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger className="rounded-xl h-11 bg-background/50 border-white/10 focus-visible:ring-indigo-500"><SelectValue /></SelectTrigger>
                <SelectContent className="glass-panel rounded-xl">
                  {statuses.map((s) => (
                    <SelectItem key={s} value={s} className="rounded-lg">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="p-6 border-t border-white/5 bg-foreground/5 flex justify-end gap-3">
            <Button variant="outline" onClick={closeDialog} className="rounded-xl border-white/10 hover:bg-white/5">Cancel</Button>
            <Button 
              onClick={() => upsertMutation.mutate()} 
              disabled={!form.message || (form.is_new_customer && !form.manual_customer_name) || upsertMutation.isPending} 
              className="rounded-xl bg-sky-500 hover:bg-sky-600 text-white shadow-lg shadow-sky-500/20"
            >
              {upsertMutation.isPending ? "Saving..." : editId ? "Update Inquiry" : "Save Inquiry"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-3xl glass-panel border-white/10 p-6 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-foreground">Delete Inquiry</AlertDialogTitle>
            <AlertDialogDescription className="text-base text-muted-foreground">This action cannot be undone. Any logged information about this inquiry will be permanently deleted.</AlertDialogDescription>
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
