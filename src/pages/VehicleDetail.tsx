import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { canEdit } from "@/lib/permissions";
import { logAction } from "@/lib/logger";

export default function VehicleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { role } = useAuth();
  const { permissions } = usePermissions();

  const { data: vehicle, isLoading } = useQuery({
    queryKey: ["vehicle", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const pageKey = vehicle?.inventory_type === "resale" ? "resale-vehicles" : "vehicles";
  const hasEdit = canEdit(role, pageKey, permissions);

  const { data: images = [] } = useQuery({
    queryKey: ["vehicle-images", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicle_images")
        .select("*")
        .eq("vehicle_id", id!);
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("vehicles").delete().eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      logAction("DELETE", "Vehicle", id!, { vehicle: `${vehicle?.year} ${vehicle?.make} ${vehicle?.model}` });
      toast.success("Vehicle deleted");
      navigate(vehicle?.inventory_type === 'resale' ? "/resale-vehicles" : "/vehicles");
    },
    onError: () => toast.error("Failed to delete"),
  });

  if (isLoading) return <p className="text-muted-foreground">Loading...</p>;
  if (!vehicle) return <p className="text-destructive">Vehicle not found</p>;

  const info = (label: string, value: any) => (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium">{value || "—"}</p>
    </div>
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20 px-4 sm:px-6">
      {/* Header Section - Mobile Optimized */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild className="h-9 w-9 rounded-full bg-foreground/5 shrink-0">
            <Link to={vehicle?.inventory_type === 'resale' ? "/resale-vehicles" : "/vehicles"}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-3xl font-bold text-foreground truncate leading-tight">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </h1>
            {vehicle.trim && <p className="text-xs sm:text-sm text-muted-foreground font-medium uppercase tracking-wider">{vehicle.trim}</p>}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 bg-muted/30 p-3 rounded-2xl sm:bg-transparent sm:p-0">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              vehicle.status?.toLowerCase() === 'available' ? 'bg-emerald-500/10 text-emerald-500' : 
              vehicle.status?.toLowerCase() === 'sold' ? 'bg-blue-500/10 text-blue-500' : 'bg-amber-500/10 text-amber-500'
            }`}>
              {vehicle.status || "Unknown"}
            </span>
            <span className="text-[10px] font-bold text-muted-foreground bg-foreground/5 px-2 py-0.5 rounded-full uppercase">
              {vehicle.condition}
            </span>
          </div>

          <div className="flex gap-2">
            {hasEdit && (
              <>
                <Button variant="outline" size="sm" asChild className="h-8 rounded-lg border-white/10 glass-panel">
                  <Link to={`/vehicles/${id}/edit`}>
                    <Pencil className="mr-1.5 h-3.5 w-3.5" />
                    Edit
                  </Link>
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="h-8 rounded-lg shadow-lg shadow-destructive/20">
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-3xl glass-panel border-white/10 mx-4">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Vehicle</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete this vehicle record and all
                        associated images.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteMutation.mutate()}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Image Gallery - More responsive */}
      {images.length > 0 && (
        <Card className="bento-card overflow-hidden border-none shadow-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Gallery</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-4">
              {images.map((img) => (
                <div key={img.id} className="aspect-video relative rounded-2xl overflow-hidden border border-white/5 shadow-inner group">
                  <img
                    src={img.image_url}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Grids - Responsive columns */}
      <div className="grid gap-6 sm:grid-cols-2">
        <Card className="bento-card border-none shadow-xl">
          <CardHeader className="pb-3 border-b border-white/5 mb-4">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-sky-500">Vehicle Specifications</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 xs:grid-cols-2 gap-y-5 gap-x-4">
            {info("Make", vehicle.make)}
            {info("Model", vehicle.model)}
            {info("Trim", vehicle.trim)}
            {info("Year", vehicle.year)}
            <div className="col-span-1 xs:col-span-2">
              {info("Chassis (VIN)", vehicle.vin)}
            </div>
            {info("Color", vehicle.color)}
            {info("Mileage", vehicle.mileage ? `${vehicle.mileage.toLocaleString()} KM` : "0 KM")}
            {info("Fuel Type", vehicle.fuel_type)}
            {info("Transmission", vehicle.transmission)}
          </CardContent>
        </Card>

        <Card className="bento-card border-none shadow-xl">
          <CardHeader className="pb-3 border-b border-white/5 mb-4">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-emerald-500">Pricing & Status</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 xs:grid-cols-2 gap-y-5 gap-x-4">
            <div className="col-span-1 xs:col-span-2">
              <p className="text-sm text-muted-foreground font-medium mb-1">Selling Price</p>
              <p className="text-3xl font-black text-emerald-500">₦{vehicle.price?.toLocaleString()}</p>
            </div>
            {info("Cost Price", `₦${vehicle.cost_price?.toLocaleString()}`)}
            {info("Current Status", vehicle.status)}
            {info("Conditions", vehicle.condition)}
          </CardContent>
        </Card>

        <Card className="bento-card border-none shadow-xl">
          <CardHeader className="pb-3 border-b border-white/5 mb-4">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-amber-500">Inventory Info</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 xs:grid-cols-2 gap-y-5 gap-x-4">
            {info(
              "Date Arrived",
              vehicle.date_arrived
                ? new Date(vehicle.date_arrived).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                : null
            )}
            {info(
              "Date Stored",
              vehicle.date_stored
                ? new Date(vehicle.date_stored).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                : null
            )}
            {info("Keys", vehicle.num_keys)}
            {vehicle.inventory_type !== 'resale' && (
              <>
                {info("Company/Owner Source", vehicle.source_company)}
                <div className="col-span-1 xs:col-span-2 space-y-4 pt-2 border-t border-white/5">
                  {info("Company/Owner Contact", (vehicle as any).source_company_phone)}
                  {info("Representative Name", (vehicle as any).source_rep_name)}
                  {info("Representative Contact", (vehicle as any).source_rep_phone)}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {vehicle.inventory_type !== 'resale' && (vehicle.accepted_by_name || vehicle.accepted_signature) && (
          <Card className="bento-card border-none shadow-xl bg-violet-500/5">
            <CardHeader className="pb-3 border-b border-violet-500/10 mb-4">
              <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-violet-500">Acceptance Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
                {info("Accepted By", vehicle.accepted_by_name)}
                {info("Contact of Person Who Brought It", (vehicle as any).accepted_by_phone)}
                {info("Date", vehicle.accepted_date ? new Date(vehicle.accepted_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : null)}
              </div>
              
              {vehicle.accepted_signature && (
                <div className="space-y-3 pt-4 border-t border-violet-500/10">
                  <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Digital Signature</p>
                  <div className="bg-white p-3 rounded-2xl border border-violet-500/10 inline-block shadow-sm">
                    <img src={vehicle.accepted_signature} alt="Signature" className="max-h-[80px] object-contain mix-blend-multiply" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {vehicle.description && (
          <Card className="bento-card border-none shadow-xl sm:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Description / Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-foreground/80 bg-foreground/5 p-4 rounded-2xl italic border border-white/5">{vehicle.description}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
