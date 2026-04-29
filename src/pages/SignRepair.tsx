import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SignaturePad } from "@/components/SignaturePad";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { CheckCircle, Download, FileText } from "lucide-react";
import { logAction } from "@/lib/logger";

export default function SignRepair() {
  const { id } = useParams<{ id: string }>();
  const [submitted, setSubmitted] = useState(false);
  const [signature, setSignature] = useState("");
  const [saving, setSaving] = useState(false);
  const [repairData, setRepairData] = useState<any>(null);

  useEffect(() => {
    if (id) {
      supabase.from("repairs").select("*").eq("id", id).single().then(({ data }) => {
        if (data) setRepairData(data);
      });
    }
  }, [id]);

  const handleSubmit = async () => {
    if (!signature || !id) return;
    setSaving(true);
    const { error } = await supabase.from("repairs").update({ signature_data: signature }).eq("id", id);
    setSaving(false);
    if (error) {
      toast.error("Failed to save signature");
    } else {
      await logAction("SIGNATURE", "Repair", id, { 
        vehicle: repairData ? `${repairData.vehicle_make} ${repairData.vehicle_year_model}` : "Unknown",
        type: "Repair Approval"
      });
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-md text-center">
          <CardContent className="py-12">
            <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground">Signature Submitted</h2>
            <p className="text-sm text-muted-foreground mt-2">Thank you. You can close this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Sign Repair Record</CardTitle>
          <p className="text-sm text-muted-foreground text-center">Please sign below to confirm</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {repairData && (repairData.bill_url || repairData.job_card_url) && (
            <div className="flex flex-col gap-2 mb-4 p-4 bg-muted rounded-xl border border-white/5">
              <p className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2">Available Documents</p>
              {repairData.bill_url && (
                <Button variant="outline" asChild className="w-full justify-between h-12 rounded-xl group">
                  <a href={repairData.bill_url} target="_blank" rel="noopener noreferrer">
                    <span className="flex items-center gap-2"><FileText className="h-4 w-4 text-amber-500" /> Repair Bill</span>
                    <Download className="h-4 w-4 opacity-40 group-hover:opacity-100 transition-opacity" />
                  </a>
                </Button>
              )}
              {repairData.job_card_url && (
                <Button variant="outline" asChild className="w-full justify-between h-12 rounded-xl group">
                  <a href={repairData.job_card_url} target="_blank" rel="noopener noreferrer">
                    <span className="flex items-center gap-2"><FileText className="h-4 w-4 text-emerald-500" /> Job Card</span>
                    <Download className="h-4 w-4 opacity-40 group-hover:opacity-100 transition-opacity" />
                  </a>
                </Button>
              )}
            </div>
          )}
          <SignaturePad value={signature} onChange={setSignature} />
          <Button onClick={handleSubmit} disabled={!signature || saving} className="w-full rounded-xl">
            {saving ? "Submitting..." : "Submit Signature"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
