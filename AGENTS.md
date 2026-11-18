<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

- Saving math lives in src/lib/savings.ts and is re-run server-side in src/lib/goals.functions.ts; goals are credited only by the internal `_credit_transaction` DB function (idempotent per order), reached through `confirm_demo_payment` (demo mode only) or `admin_review_payment` (admin approves a member-submitted UTR) — never trust client amounts.
- Real vs demo payments is decided by `real_upi_enabled()` (a valid app_config upi_id); the demo confirm is refused whenever it is true, because UPI intent links give no automatic payment proof.
- Product photos: image_url is either a plain link (CDN pointers in src/assets/products-cdn) or `storage:<path>` in the private product-images bucket, resolved to signed URLs by withImageSrc in data.ts, since public buckets are blocked.
- UPI payee (upi_id/upi_name) is read from app_config inside createDemoOrder, which returns one UPI query string; PayDialog only prefixes app-specific schemes (PhonePe, GPay, Paytm…) so amounts never come from the client.
- Recharge goals save exactly the plan price with daily = rechargeDaily (rounded up); completed recharge goals are fulfilled manually by an admin via `admin_mark_fulfilled` (stores fulfilled_at/ref), because there is no recharge-provider API yet.
- Members may only update `status` (active/paused) on their own saving_goals (column grant + policy), so saved_amount/completion can only change through security-definer DB functions.
- app_config is readable by members only for an explicit whitelist of display keys (RLS policy "read member cfg"); payee/secret config (upi_id, upi_name) is read server-side with supabaseAdmin — add new member-visible keys to that policy.
- product-images storage reads are limited to admins or objects referenced by an enabled product's `storage:<path>` image_url, so unlinked uploads stay private.
