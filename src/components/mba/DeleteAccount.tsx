import { useEffect, useState } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { deleteAccount } from "@/lib/account.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function DeleteAccountPanel() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);
  const remove = useServerFn(deleteAccount);
  const qc = useQueryClient();
  const nav = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSignedIn(!!data.session?.user);
    });
  }, []);

  const handleDelete = async () => {
    if (busy || confirmText.trim().toUpperCase() !== "DELETE") return;
    setBusy(true);
    try {
      await remove();
      await qc.cancelQueries();
      qc.clear();
      await supabase.auth.signOut();
      toast.success("Your account has been deleted.");
      nav({ to: "/auth", replace: true });
    } catch (e) {
      toast.error((e as Error).message);
      setBusy(false);
    }
  };

  if (signedIn === null) return null;

  if (!signedIn) {
    return (
      <div className="rounded-2xl border bg-card p-4 text-sm space-y-2">
        <p className="text-muted-foreground">Sign in first to delete your account from here.</p>
        <Button asChild variant="outline" className="w-full">
          <Link to="/auth">Sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-2xl border border-destructive/30 bg-destructive/5 p-3">
      <p className="text-xs text-muted-foreground">
        Type <b>DELETE</b> below to permanently remove your account.
      </p>
      <Input
        placeholder="Type DELETE"
        value={confirmText}
        onChange={(e) => setConfirmText(e.target.value)}
        disabled={busy}
      />
      <Button
        variant="destructive"
        className="w-full"
        disabled={busy || confirmText.trim().toUpperCase() !== "DELETE"}
        onClick={handleDelete}
      >
        {busy ? "Deleting…" : "Delete my account"}
      </Button>
    </div>
  );
}
