import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout } from "@/components/mba/LegalLayout";
import { LEGAL } from "@/lib/legal";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy – MBA" },
      { name: "description", content: "How MBA collects, uses and protects your personal data, and how you can delete your account." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy">
      <p className="rounded-xl bg-primary-soft p-3">
        <b>सार (हिंदी में):</b> हम सिर्फ़ आपका नाम, मोबाइल, ईमेल और बचत/पेमेंट का रिकॉर्ड रखते हैं, ताकि ऐप चल सके। हम आपका डेटा बेचते नहीं, ऐप में विज्ञापन या ट्रैकिंग नहीं है। आप कभी भी Settings → Delete account से अपना अकाउंट हटा सकते हैं।
      </p>
      <p>
        This Privacy Policy explains how <b>{LEGAL.operator}</b> ("we", "us") handles your information when you use <b>{LEGAL.appName}</b> (the "App"). By using the App you agree to this policy.
      </p>

      <h2>1. Information we collect</h2>
      <ul>
        <li><b>Account details:</b> your full name, mobile number, email address and password. Your password is stored in a protected (hashed) form by our login provider; we cannot read it.</li>
        <li><b>Saving activity:</b> the goals you create, daily amount, amount saved, dates, streaks and rewards.</li>
        <li><b>Recharge details:</b> if you start a mobile-recharge goal, the mobile number, operator and plan you choose.</li>
        <li><b>Payment records:</b> order number, amount, fee, time and the UPI reference (UTR) that you type in after paying. We do <b>not</b> collect or see your bank account, card details, UPI PIN or UPI app data.</li>
        <li><b>Settings:</b> your language choice.</li>
        <li><b>Technical data:</b> standard server logs (such as IP address, device/browser type and error details) created by our hosting and security systems, and a login session kept in your device's browser storage.</li>
      </ul>
      <p>The App does not ask for access to your contacts, SMS, camera, microphone, location or files.</p>

      <h2>2. How we use your information</h2>
      <ul>
        <li>To create and run your account and your saving goals.</li>
        <li>To verify your payments and add them to your goal.</li>
        <li>To complete recharges or other goal fulfilment, and to contact you about your goal, payments or refunds.</li>
        <li>To keep the App secure, prevent fraud and fix errors.</li>
        <li>To meet legal, accounting and tax obligations.</li>
      </ul>

      <h2>3. Who we share it with</h2>
      <p>We do not sell your personal data and the App has no advertising or analytics/tracking tools. We share data only with:</p>
      <ul>
        <li><b>Service providers</b> that run the App for us: our database and login provider (Supabase) and our hosting provider (Cloudflare). They process data only to provide their service to us.</li>
        <li><b>Google Fonts:</b> the App loads fonts from Google, so your IP address is sent to Google when a page loads.</li>
        <li><b>The UPI app you choose</b> (for example PhonePe, Google Pay, Paytm). Your payment happens in that app under its own terms and privacy policy.</li>
        <li><b>Authorities</b> when the law requires it, or to protect our rights and prevent fraud.</li>
      </ul>

      <h2>4. How long we keep it</h2>
      <p>We keep your account data for as long as your account is active. When you delete your account, we delete your profile, login, streaks and rewards, and remove personal details from your goals. Payment records (amount, date, order number and UTR) are kept in a form no longer linked to your profile, for as long as accounting, tax or other laws require, and then deleted. Small delays may apply before data disappears from secure backups.</p>

      <h2>5. Your choices and rights</h2>
      <ul>
        <li><b>See and correct:</b> you can view and edit your name and mobile number in Settings.</li>
        <li><b>Delete your account and data:</b> open the App → Settings → <b>Delete account</b>, or visit <a href="/delete-account">/delete-account</a>. If you cannot sign in, email us at {LEGAL.supportEmail} from your registered email.</li>
        <li><b>Money still with us:</b> if your goals still hold saved money or a payment is waiting for checking, we cannot delete the account until it is settled. Email us and we will refund or complete it first (see our Terms &amp; Refund Policy).</li>
        <li>You may also write to us to ask about, correct or object to how your data is used. We reply within a reasonable time.</li>
      </ul>

      <h2>6. Security</h2>
      <p>Data travels over encrypted (HTTPS) connections and access is limited by account-level security rules. No system is completely secure, so please keep your password private and use a strong one.</p>

      <h2>7. Age</h2>
      <p>The App is for people aged {LEGAL.minAge} or older. We do not knowingly collect data from anyone under {LEGAL.minAge}. If you think a minor has registered, email us and we will delete the account.</p>

      <h2>8. Changes to this policy</h2>
      <p>We may update this policy. The date at the top shows the latest version. Big changes will be shown in the App.</p>

      <h2>9. Contact and grievances</h2>
      <p>{LEGAL.operator}<br />{LEGAL.address}<br />Email: {LEGAL.supportEmail}</p>
    </LegalLayout>
  );
}
