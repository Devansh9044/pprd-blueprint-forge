import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, Share2, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { createDemoOrder } from "@/lib/goals.functions";
import { supabase } from "@/integrations/supabase/client";
import { inr } from "@/lib/savings";

export function PayDialog({ goalId, open, onOpenChange }: { goalId: string | null; open: boolean; onOpenChange: (o: boolean) => void }) {
  const create = useServerFn(createDemoOrder);
  const qc = useQueryClient();
  const [order, setOrder] = useState<{ orderId: string; amount: number; upi: string; qr: string } | null>(null);
  const [status, setStatus] = useState<"idle" | "pending" | "verified">("idle");

  useEffect(() => {
    if (!open || !goalId) return;
    setOrder(null); setStatus("idle");
    create({ data: { goalId } })
      .then(async (o) => { setOrder({ ...o, qr: await QRCode.toDataURL(o.upi, { width: 260, margin: 1 }) }); setStatus("pending"); })
      .catch((e) => { toast.error(e.message); onOpenChange(false); });
  }, [open, goalId]); // eslint-disable-line react-hooks/exhaustive-deps

  const confirm = async () => {
    if (!order) return;
    const { error } = await supabase.rpc("confirm_demo_payment", { _order_id: order.orderId });
    if (error) return toast.error(error.message);
    setStatus("verified");
    toast.success(`${inr(order.amount)} saved!`);
    qc.invalidateQueries();
  };
  const share = async () => {
    if (!order) return;
    if (navigator.share) await navigator.share({ title: "MBA saving", text: order.upi }).catch(() => {});
    else { await navigator.clipboard.writeText(order.upi); toast.success("Payment link copied"); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-accent">Scan & Pay</DialogTitle>
          <DialogDescription>Demo mode — no real money moves. Your balance updates only after confirmation.</DialogDescription>
        </DialogHeader>
        {!order ? <p className="py-10 text-center text-muted-foreground">Creating payment order…</p> : status === "verified" ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <CheckCircle2 className="h-16 w-16 text-success" />
            <p className="text-lg font-bold">Payment verified</p>
            <p className="text-sm text-muted-foreground">Order {order.orderId}</p>
            <Button className="w-full" onClick={() => onOpenChange(false)}>Done</Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <p className="text-3xl font-extrabold text-accent">{inr(order.amount)}</p>
            <img src={order.qr} alt="UPI QR code" className="h-56 w-56 rounded-xl border" />
            <p className="text-xs text-muted-foreground">Order {order.orderId} · expires in 15 min</p>
            <div className="flex w-full gap-2">
              <Button variant="outline" className="flex-1" asChild><a href={order.qr} download={`${order.orderId}.png`}><Download className="h-4 w-4" />Download</a></Button>
              <Button variant="outline" className="flex-1" onClick={share}><Share2 className="h-4 w-4" />Share</Button>
            </div>
            <Button className="w-full h-12 bg-success text-primary-foreground hover:bg-success/90" onClick={confirm}>Simulate payment confirmed</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
