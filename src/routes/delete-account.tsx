import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout } from "@/components/mba/LegalLayout";
import { DeleteAccountPanel } from "@/components/mba/DeleteAccount";
import { LEGAL } from "@/lib/legal";

export const Route = createFileRoute("/delete-account")({
  head: () => ({
    meta: [
      { title: "Delete your account – MBA" },
      { name: "description", content: "How to delete your MBA account and your data." },
    ],
  }),
  component: DeleteAccountPage,
});

function DeleteAccountPage() {
  return (
    <LegalLayout title="Delete your account">
      <p>You can delete your <b>{LEGAL.appName}</b> account and data at any time.</p>
      <h2>How to delete</h2>
      <ul>
        <li><b>In the App:</b> Settings → Delete account.</li>
        <li><b>Here on the web:</b> sign in, then use the button below.</li>
        <li><b>Cannot sign in?</b> Email <b>{LEGAL.supportEmail}</b> from your registered email address with the subject "Delete my account". We will delete it for you.</li>
      </ul>
      <h2>What gets deleted</h2>
      <ul>
        <li>Your login, profile (name, mobile number, language), streaks and rewards.</li>
        <li>Goals with no saved money, together with their unfinished payments.</li>
        <li>Personal details (mobile number, custom goal names) from goals that must stay for payment records.</li>
      </ul>
      <h2>What we keep</h2>
      <ul>
        <li>Payment records (amount, date, order number and UTR) that the law requires us to keep for accounting and tax. They are no longer linked to your profile, and are deleted when the legal period ends.</li>
        <li>Secure backups may hold your data for a short time before it is removed.</li>
      </ul>
      <h2>If you still have saved money</h2>
      <p>An account with saved money in a goal, or a payment waiting to be checked, cannot be deleted until it is settled. Email <b>{LEGAL.supportEmail}</b> and we will refund or complete it first. See our <a href="/terms">Terms &amp; Refund Policy</a>.</p>
      <div className="pt-2"><DeleteAccountPanel /></div>
    </LegalLayout>
  );
}
