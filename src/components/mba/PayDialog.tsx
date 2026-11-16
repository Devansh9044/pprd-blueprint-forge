import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, Share2, CheckCircle2, Copy, QrCode, Smartphone, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createDemoOrder } from "@/lib/goals.functions";
import { supabase } from "@/integrations/supabase/client";
import { inr } from "@/lib/savings";

type Order = { orderId: string; amount: number; upi: string; query: string; payeeId: string; payeeName: string; demo: boolean; qr: string };

/** UPI apps, each opened with its own deep link carrying the same order details. */
export const UPI_APPS = [
  { id: "phonepe", name: "PhonePe", mark: "पे", scheme: "phonepe://pay?", color: "bg-brand-phonepe" },
  { id: "gpay", name: "Google Pay", mark: "G", scheme: "tez://upi/pay?", color: "bg-brand-gpay" },
  { id: "paytm", name: "Paytm", mark: "P", scheme: "paytmmp://pay?", color: "bg-brand-paytm" },
  { id: "cred", name: "CRED", mark: "C", scheme: "credpay://upi/pay?", color: "bg-brand-cred" },
  { id: "bhim", name: "BHIM", mark: "B", scheme: "upi://pay?", color: "bg-brand-bhim" },
  { id: "amazon", name: "Amazon Pay", mark: "a", scheme: "upi://pay?", color: "bg-brand-amazon" },
] as const;

export function PayDialog({ goalId, open, onOpenChange }: { goalId: string | null; open: boolean; onOpenChange: (o: boolean) => void }) {
  const create = useServerFn(createDemoOrder);
  const qc = useQueryClient();
  const [order, setOrder] = useState<Order | null>(null);
  const [status, setStatus] = useState<"idle" | "pending" | "submitted" | "verified">("idle");
  const [utr, setUtr] = useState("");
  const [sending, setSending] = useState(false);
  const [tab, setTab] = useState<"apps" | "qr" | "id">("apps");
  const [opened, setOpened] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !goalId) return;
    setOrder(null); setStatus("idle"); setUtr(""); setTab("apps"); setOpened(null);
    create({ data: { goalId } })
      .then(async (o) => { setOrder({ ...o, qr: await QRCode.toDataURL(o.upi, { width: 260, margin: 1 }) }); setStatus("pending"); })
      .catch((e) => { toast.error(e.message); onOpenChange(false); });
  }, [open, goalId]); // eslint-disable-line react-hooks/exhaustive-deps

  const confirm = async () => {
    if (!order) return;
    const { error } = await supabase.rpc("confirm_demo_payment", { _order_id: order.orderId });
    if (error) { toast.error(error.message); return; }
    setStatus("verified");
    toast.success(`${inr(order.amount)} saved!`);
    qc.invalidateQueries();
  };
  const submitUtr = async () => {
    if (!order) return;
    const clean = utr.replace(/\s/g, "");
    if (!/^\d{12}$/.test(clean)) { toast.error("Enter the 12-digit UPI reference number (UTR)"); return; }
    setSending(true);
    const { error } = await supabase.rpc("submit_payment_utr", { _order_id: order.orderId, _utr: clean });
    setSending(false);
    if (error) { toast.error(error.message); return; }
    setStatus("submitted");
    qc.invalidateQueries();
  };
  const openApp = (app: (typeof UPI_APPS)[number]) => {
    if (!order) return;
    setOpened(app.name);
    window.location.href = app.scheme + order.query;
  };
  const share = async () => {
    if (!order) return;
    if (navigator.share) await navigator.share({ title: "MBA saving", text: order.upi }).catch(() => {});
    else { await navigator.clipboard.writeText(order.upi); toast.success("Payment link copied"); }
  };
  const copy = async (text: string, label: string) => { await navigator.clipboard.writeText(text); toast.success(`${label} copied`); };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] max-w-sm overflow-y-auto rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-accent">Pay with UPI</DialogTitle>
          <DialogDescription>Your balance updates only after the payment is confirmed.</DialogDescription>
        </DialogHeader>
        {!order ? <p className="py-10 text-center text-muted-foreground">Creating payment order…</p> : status === "verified" ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <CheckCircle2 className="h-16 w-16 text-success" />
            <p className="text-lg font-bold">Payment verified</p>
            <p className="text-sm text-muted-foreground">Order {order.orderId}</p>
            <Button className="w-full" onClick={() => onOpenChange(false)}>Done</Button>
          </div>
        ) : status === "submitted" ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2 className="h-16 w-16 text-primary" />
            <p className="text-lg font-bold">Payment sent for checking</p>
            <p className="text-sm text-muted-foreground">We will match your UPI reference with the money received. {inr(order.amount)} is added to your goal once it is confirmed.</p>
            <p className="text-xs text-muted-foreground">Order {order.orderId}</p>
            <Button className="w-full" onClick={() => onOpenChange(false)}>Done</Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="rounded-2xl bg-primary-soft p-3 text-center">
              <p className="text-3xl font-extrabold text-accent">{inr(order.amount)}</p>
              <p className="text-xs text-muted-foreground">to {order.payeeName} · {order.payeeId}</p>
            </div>

            <div className="grid grid-cols-3 rounded-2xl bg-muted p-1 text-xs font-bold">
              {([["apps", "UPI apps", Smartphone], ["qr", "Scan QR", QrCode], ["id", "UPI ID", Copy]] as const).map(([k, l, I]) => (
                <button key={k} onClick={() => setTab(k)} className={`flex items-center justify-center gap-1 rounded-xl py-2 ${tab === k ? "bg-card text-accent shadow-card" : "text-muted-foreground"}`}>
                  <I className="h-3.5 w-3.5" />{l}
                </button>
              ))}
            </div>

            {tab === "apps" && (
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  {UPI_APPS.map((a) => (
                    <button key={a.id} onClick={() => openApp(a)} className="flex flex-col items-center gap-1 rounded-2xl border bg-card p-2 transition active:scale-95">
                      <span className={`flex h-11 w-11 items-center justify-center rounded-xl text-lg font-extrabold text-primary-foreground ${a.color}`}>{a.mark}</span>
                      <span className="text-[11px] font-semibold">{a.name}</span>
                    </button>
                  ))}
                </div>
                <button onClick={() => { setOpened("UPI app"); window.location.href = order.upi; }} className="flex w-full items-center justify-between rounded-2xl border bg-card px-3 py-3 text-sm font-semibold">
                  <span>Other UPI apps <span className="font-normal text-muted-foreground">(WhatsApp, bank apps…)</span></span><ChevronRight className="h-4 w-4" />
                </button>
                <p className="text-center text-[11px] text-muted-foreground">Works on a phone with the app installed. On a computer, use Scan QR.</p>
                {opened && <p className="rounded-xl bg-primary-soft p-2 text-center text-xs">Opened {opened}. Finish paying there, then come back here.</p>}
              </div>
            )}

            {tab === "qr" && (
              <div className="flex flex-col items-center gap-2">
                <img src={order.qr} alt="UPI QR code" className="h-56 w-56 rounded-xl border" />
                <p className="text-xs text-muted-foreground">Scan with any UPI app · expires in 15 min</p>
                <div className="flex w-full gap-2">
                  <Button variant="outline" className="flex-1" asChild><a href={order.qr} download={`${order.orderId}.png`}><Download className="h-4 w-4" />Download</a></Button>
                  <Button variant="outline" className="flex-1" onClick={share}><Share2 className="h-4 w-4" />Share</Button>
                </div>
              </div>
            )}

            {tab === "id" && (
              <div className="space-y-2 text-sm">
                {([["UPI ID", order.payeeId], ["Amount", order.amount.toFixed(2)], ["Note / reference", order.orderId]] as const).map(([l, v]) => (
                  <button key={l} onClick={() => copy(v, l)} className="flex w-full items-center justify-between rounded-xl border bg-card px-3 py-2 text-left">
                    <span><span className="block text-xs text-muted-foreground">{l}</span><b>{v}</b></span><Copy className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
                <p className="text-[11px] text-muted-foreground">Open any UPI app, choose "Pay UPI ID", paste the ID and add the reference in the note.</p>
              </div>
            )}

            <p className="text-center text-[11px] text-muted-foreground">Order {order.orderId}</p>
            {order.demo ? (
              <>
                <p className="rounded-xl bg-muted p-2 text-center text-[11px] text-muted-foreground">Demo mode — no receiving UPI ID is set yet, so no real money moves.</p>
                <Button className="h-12 w-full bg-success text-primary-foreground hover:bg-success/90" onClick={confirm}>Simulate payment confirmed</Button>
              </>
            ) : (
              <div className="space-y-2 rounded-2xl border bg-card p-3">
                <label htmlFor="utr" className="block text-sm font-bold">Paid? Enter the UPI reference number</label>
                <p className="text-[11px] text-muted-foreground">Find the 12-digit UTR / UPI Ref No. on the success screen of your UPI app.</p>
                <Input id="utr" inputMode="numeric" maxLength={14} placeholder="e.g. 412345678901" value={utr} onChange={(e) => setUtr(e.target.value.replace(/[^\d\s]/g, ""))} />
                <Button className="h-12 w-full bg-success text-primary-foreground hover:bg-success/90" disabled={sending} onClick={submitUtr}>{sending ? "Sending…" : "I have paid"}</Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
