import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout } from "@/components/mba/LegalLayout";
import { LEGAL } from "@/lib/legal";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Refund Policy – MBA" },
      { name: "description", content: "Terms of use, fees and refund policy for the MBA savings app." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <LegalLayout title="Terms & Refund Policy">
      <p className="rounded-xl bg-primary-soft p-3">
        <b>सार (हिंदी में):</b> आप रोज़ थोड़ी रकम UPI से जमा करते हैं, हम पेमेंट चेक करके आपके गोल में जोड़ते हैं। रोज़ की service fee पेमेंट से पहले साफ़ दिखती है और गोल में नहीं जुड़ती। बचत की रकम पर कोई ब्याज नहीं मिलता। आप गोल पूरा होने से पहले अपनी जमा बचत (fee छोड़कर) {LEGAL.refundDays} कामकाजी दिनों में वापस माँग सकते हैं।
      </p>
      <p>
        These Terms are between you and <b>{LEGAL.operator}</b> ("we", "us"), who runs <b>{LEGAL.appName}</b> (the "App"). By creating an account you accept them.
      </p>

      <h2>1. What MBA is</h2>
      <ul>
        <li>MBA helps you save a small amount every day towards a goal (mobile recharge, phone, laptop, bike, college or a custom goal).</li>
        <li>MBA is <b>not a bank</b>, does not pay <b>interest</b> or returns on your savings, and is not investment or financial advice.</li>
      </ul>

      <h2>2. Who can use it</h2>
      <p>You must be {LEGAL.minAge} or older and give correct name, mobile number and email. You are responsible for your password and for activity on your account.</p>

      <h2>3. How saving and payments work</h2>
      <ul>
        <li>You pick a goal and pay each day through UPI to the UPI ID shown inside the App at the time of payment.</li>
        <li>Each payment has two parts: your <b>saving</b> (added to your goal) and a small <b>service fee</b> (our charge, <b>not</b> added to your goal). Both are shown before you pay.</li>
        <li>After paying, you enter the UPI reference number (UTR). We check our account and then approve the payment. Savings are added to your goal <b>only after we approve</b>.</li>
        <li>Entering a wrong, fake or reused UTR will get the payment rejected and may lead to your account being suspended or closed.</li>
        <li>Pay the exact amount shown. Our last payment for a goal is capped at what is left to reach the goal.</li>
      </ul>

      <h2>4. Goals and fulfilment</h2>
      <ul>
        <li><b>Mobile recharge goals:</b> when your saved amount reaches the plan price, we recharge the number you entered and share a reference. We do this manually, so it is not instant. Please enter the correct number: a recharge done on the number you entered cannot be reversed. Plans and prices are set by telecom operators and may differ by state or change.</li>
        <li><b>Phone, laptop, bike, college and custom goals:</b> these are savings targets. When a goal is complete we will contact you on your registered mobile or email to complete the purchase or to refund your saved amount, as you choose. Product prices shown are indicative.</li>
        <li>If we cannot deliver a goal for any reason, your saved amount is refunded in full under Section 6.</li>
      </ul>

      <h2>5. Fees</h2>
      <p>The service fee per daily payment is shown before you pay and is fixed for a goal when you start it. We may change fees for new goals. Fees already charged for a service we have provided are not refundable, except where Section 6 says otherwise.</p>

      <h2>6. Refunds and cancellation</h2>
      <ul>
        <li>You can ask to close a goal and get your <b>saved amount</b> back <b>at any time before it is fulfilled</b> (before the recharge is done or the purchase is completed).</li>
        <li>We refund within <b>{LEGAL.refundDays} working days</b> of confirming your request, to the same UPI/bank account the payment came from.</li>
        <li>We refund in full (including the service fee) if the problem is ours: we could not deliver the goal, we charged you twice, or the amount charged was wrong.</li>
        <li>Otherwise the service fee for days already paid is not refunded.</li>
        <li>To request a refund, email <b>{LEGAL.supportEmail}</b> from your registered email with your mobile number and the goal name.</li>
      </ul>

      <h2>7. Rewards, streaks and offers</h2>
      <p>Streaks, rewards and offers are promotional. They have no cash value, may have conditions shown with them, and we can change or stop them at any time.</p>

      <h2>8. Account deletion</h2>
      <p>You can delete your account in Settings → Delete account or at <a href="/delete-account">/delete-account</a>. See our <a href="/privacy">Privacy Policy</a> for what is deleted and kept. If money is still held in a goal, it must be refunded or completed first.</p>

      <h2>9. Acceptable use</h2>
      <p>Do not misuse the App: no fake payments or UTRs, no attempts to break, overload or get unauthorised access to the App, and no use for anything illegal. We may suspend or close accounts that do, and we will refund any saved amount that is rightfully yours.</p>

      <h2>10. Our responsibility</h2>
      <p>We work to keep the App running but cannot promise it will always be available or error-free. To the extent the law allows, we are not liable for indirect losses, and our total liability for any claim is limited to the amount you have paid us for the goal concerned. Nothing here limits rights you have under Indian consumer law.</p>

      <h2>11. Changes and governing law</h2>
      <p>We may update these Terms; the date at the top shows the latest version. Continued use after a change means you accept it. These Terms follow the laws of India, and Indian courts that have jurisdiction will decide any dispute.</p>

      <h2>12. Contact</h2>
      <p>{LEGAL.operator}<br />{LEGAL.address}<br />Email: {LEGAL.supportEmail}</p>
    </LegalLayout>
  );
}
