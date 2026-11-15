import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | RoamCeylon & RoamCeylon Admin",
  description:
    "Official Privacy Policy and Data Safety Disclosures for RoamCeylon (Traveler App) and RoamCeylon Admin (Partner & Business Management App) by IdeaTech.",
};

const SECTIONS = [
  { id: "overview", title: "1. Scope & Covered Applications" },
  { id: "data-collected", title: "2. Information We Collect" },
  { id: "permissions", title: "3. Device Permissions We Request" },
  { id: "how-we-use", title: "4. How We Use Your Information" },
  { id: "ai-processing", title: "5. AI Trip Planner & Automated Processing" },
  { id: "sharing", title: "6. Data Sharing & Third-Party Services" },
  { id: "security", title: "7. Data Storage & Security Measures" },
  { id: "retention-deletion", title: "8. Data Retention & Account Deletion" },
  { id: "your-rights", title: "9. Your Privacy Rights (PDPA & GDPR)" },
  { id: "children", title: "10. Children’s Privacy" },
  { id: "changes", title: "11. Changes to This Policy" },
  { id: "contact", title: "12. Contact Us" },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 font-sans">
      {/* Top Hero Banner */}
      <header className="bg-gradient-to-br from-[#0F3D26] via-[#145334] to-[#0E5E2F] text-white border-b border-emerald-900/40">
        <div className="max-w-5xl mx-auto px-6 py-12 sm:py-16">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1 text-xs font-semibold tracking-wider uppercase text-[#EAD26B] border border-white/20">
              Official Legal &amp; Google Play Data Safety Policy
            </span>
            <Link
              href="/"
              className="text-xs font-semibold text-white/85 hover:text-white underline underline-offset-4"
            >
              &larr; Back to Admin Portal
            </Link>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            Privacy Policy
          </h1>
          <p className="mt-4 max-w-3xl text-base sm:text-lg text-emerald-100/90 leading-relaxed">
            This Privacy Policy governs how <strong>IdeaTech</strong> (&ldquo;RoamCeylon&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) collects, uses, stores, shares, and protects information across the{" "}
            <strong>RoamCeylon</strong> traveler application and the{" "}
            <strong>RoamCeylon Admin</strong> partner management application.
          </p>
          <div className="mt-6 flex flex-wrap gap-6 text-xs sm:text-sm text-emerald-100/80">
            <div>
              <span className="font-semibold text-white">Effective Date:</span>{" "}
              May 1, 2026
            </div>
            <div>
              <span className="font-semibold text-white">Last Updated:</span>{" "}
              November 14, 2026
            </div>
            <div>
              <span className="font-semibold text-white">Developer:</span>{" "}
              IdeaTech (Sri Lanka)
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="max-w-5xl mx-auto px-6 py-10 sm:py-14 grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Sticky Table of Contents */}
        <aside className="lg:col-span-4">
          <div className="lg:sticky lg:top-8 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
              Contents
            </h2>
            <nav className="space-y-1.5 text-sm">
              {SECTIONS.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="block rounded-lg px-2.5 py-1.5 text-zinc-700 dark:text-zinc-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors"
                >
                  {s.title}
                </a>
              ))}
            </nav>

            <div className="mt-6 pt-5 border-t border-zinc-200 dark:border-zinc-800">
              <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Need Account or Data Deletion?
              </p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Jump directly to{" "}
                <a
                  href="#retention-deletion"
                  className="text-emerald-700 dark:text-emerald-400 font-semibold underline"
                >
                  Section 8 (Account Deletion)
                </a>{" "}
                for step-by-step instructions.
              </p>
            </div>
          </div>
        </aside>

        {/* Policy Body */}
        <div className="lg:col-span-8 space-y-10">
          {/* 1. Scope & Covered Applications */}
          <section
            id="overview"
            className="scroll-mt-8 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 shadow-sm space-y-4"
          >
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">
              1. Scope &amp; Covered Applications
            </h2>
            <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-300 leading-relaxed">
              This Privacy Policy applies to all users of the RoamCeylon digital tourism ecosystem, including travelers, tourists, drivers, hotel and accommodation managers, tour guides, activity providers, shop owners, and platform administrators across the following applications:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/50 p-4">
                <h3 className="font-bold text-emerald-950 dark:text-emerald-200 text-sm">
                  RoamCeylon (Traveler App)
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 font-mono">
                  Package: com.ideatech.roamceylon
                </p>
                <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 mt-2">
                  Consumer mobile application for AI trip planning, hotel reservations, tour &amp; activity bookings, transport ride-hailing, marketplace discovery, and emergency assistance in Sri Lanka.
                </p>
              </div>
              <div className="rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/50 p-4">
                <h3 className="font-bold text-emerald-950 dark:text-emerald-200 text-sm">
                  RoamCeylon Admin (Partner App)
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 font-mono">
                  Package: com.ideatech.roamceylonadmin
                </p>
                <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 mt-2">
                  Partner &amp; vendor mobile and web application for Accommodation/Booking Managers, Tour Guides, Activity Providers, and Shop Partners to verify businesses and manage listings, bookings, inquiries, and notifications.
                </p>
              </div>
            </div>
          </section>

          {/* 2. Information We Collect */}
          <section
            id="data-collected"
            className="scroll-mt-8 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 shadow-sm space-y-5"
          >
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">
              2. Information We Collect
            </h2>
            <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-300 leading-relaxed">
              We collect only the information necessary to deliver safe, reliable travel planning, booking, transport, and partner management services:
            </p>

            <div className="space-y-4">
              <div className="border-l-4 border-emerald-600 pl-4">
                <h3 className="font-bold text-zinc-900 dark:text-white text-base">
                  2.1 Account &amp; Profile Data (Both Apps)
                </h3>
                <ul className="mt-2 list-disc list-inside text-sm text-zinc-600 dark:text-zinc-300 space-y-1.5">
                  <li>
                    <strong>Identifiers:</strong> Full name, email address, phone number, and unique account ID (Nhost Auth / PostgreSQL UUID).
                  </li>
                  <li>
                    <strong>Authentication Data:</strong> Encrypted password credentials or Google Sign-In OAuth tokens and Google profile ID (when signing in with Google).
                  </li>
                  <li>
                    <strong>Profile Media &amp; Demographics:</strong> Optional profile photograph/avatar; for travelers in <em>RoamCeylon</em>, date of birth, gender, nationality/residency status (Sri Lankan or Foreign), preferred currency (USD, LKR, EUR), and distance units (KM, Miles); for partners in <em>RoamCeylon Admin</em>, partner role (Booking Manager, Tour Guide, Activity Provider, or Shop Partner).
                  </li>
                </ul>
              </div>

              <div className="border-l-4 border-amber-500 pl-4">
                <h3 className="font-bold text-zinc-900 dark:text-white text-base">
                  2.2 Partner Identity &amp; Business Verification (KYC) Data (RoamCeylon Admin Only)
                </h3>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                  To protect travelers from fraudulent listings and verify legitimate tourism operators before publishing listings, <em>RoamCeylon Admin</em> collects:
                </p>
                <ul className="mt-2 list-disc list-inside text-sm text-zinc-600 dark:text-zinc-300 space-y-1.5">
                  <li>
                    <strong>Government ID:</strong> Image or PDF copy of your National Identity Card (NIC) or Passport.
                  </li>
                  <li>
                    <strong>Business Credentials:</strong> Image or PDF copy of your Business Registration Certificate or Tourism Authority License.
                  </li>
                  <li>
                    <strong>Selfie Verification:</strong> A live photograph captured via your device camera to confirm identity ownership against your submitted ID.
                  </li>
                </ul>
              </div>

              <div className="border-l-4 border-blue-600 pl-4">
                <h3 className="font-bold text-zinc-900 dark:text-white text-base">
                  2.3 Location Information (Both Apps)
                </h3>
                <ul className="mt-2 list-disc list-inside text-sm text-zinc-600 dark:text-zinc-300 space-y-1.5">
                  <li>
                    <strong>RoamCeylon (Traveler App):</strong> Precise and approximate GPS coordinates (<code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">ACCESS_FINE_LOCATION</code> and <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">ACCESS_COARSE_LOCATION</code>) when you search for nearby attractions, select ride pickup and drop-off points, track active transport sessions, or open the Emergency Assistance console (which reverse-geocodes your location so you can relay your coordinates to Sri Lanka Police 119, Suwa Seriya Ambulance 1990, Fire 110, or Tourist Police 1331).
                  </li>
                  <li>
                    <strong>RoamCeylon Admin (Partner App):</strong> Map coordinates and street addresses selected via our interactive Mapbox location picker when registering hotel locations, tour pickup points, activity venues, or partner shops.
                  </li>
                </ul>
              </div>

              <div className="border-l-4 border-purple-600 pl-4">
                <h3 className="font-bold text-zinc-900 dark:text-white text-base">
                  2.4 Bookings, Listings, Inquiries &amp; Trip Data
                </h3>
                <ul className="mt-2 list-disc list-inside text-sm text-zinc-600 dark:text-zinc-300 space-y-1.5">
                  <li>
                    <strong>Traveler Bookings &amp; Inquiries:</strong> Hotel room reservations, tour package bookings and inquiries, activity bookings, ride requests, guest names, contact details, travel dates, guest counts, pickup locations, and special requests.
                  </li>
                  <li>
                    <strong>AI Trip Planner &amp; Chat Data:</strong> Travel preferences (destination, duration, budget tier, travel group size, and interest categories), AI chat messages, saved trip itineraries, and itinerary feedback ratings.
                  </li>
                  <li>
                    <strong>Partner Listings &amp; Financial Metrics:</strong> Hotel details, room inventories, nightly rates, tour package descriptions and pricing, activity schedules, shop descriptions, social media/website links, and booking revenue/pipeline summaries displayed in partner analytics dashboards.
                  </li>
                </ul>
              </div>

              <div className="border-l-4 border-zinc-500 pl-4">
                <h3 className="font-bold text-zinc-900 dark:text-white text-base">
                  2.5 Device, Push Notification &amp; Diagnostic Data
                </h3>
                <ul className="mt-2 list-disc list-inside text-sm text-zinc-600 dark:text-zinc-300 space-y-1.5">
                  <li>
                    <strong>Push Notification Tokens:</strong> Expo Push Token and device platform (<code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">android</code> / <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">ios</code>) when you opt in to receive booking, inquiry, or system notifications.
                  </li>
                  <li>
                    <strong>App Interaction &amp; Performance Logs:</strong> Non-identifying feature usage events (such as itinerary generation, trip saves, destination views, and API latency metrics) used to maintain service reliability and improve recommendation quality.
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* 3. Device Permissions We Request */}
          <section
            id="permissions"
            className="scroll-mt-8 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 shadow-sm space-y-4"
          >
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">
              3. Device Permissions We Request
            </h2>
            <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-300 leading-relaxed">
              Depending on which app and features you use, we request the following operating system permissions. You may grant or revoke these permissions at any time through your device&apos;s Settings:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400">
                    <th className="py-3 pr-4 font-semibold">Permission</th>
                    <th className="py-3 px-4 font-semibold">App</th>
                    <th className="py-3 pl-4 font-semibold">Purpose</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
                  <tr>
                    <td className="py-3 pr-4 font-mono text-xs">
                      ACCESS_FINE_LOCATION / ACCESS_COARSE_LOCATION
                    </td>
                    <td className="py-3 px-4">Both Apps</td>
                    <td className="py-3 pl-4">
                      Show nearby places, select map coordinates for rides or business listings, and display current coordinates on the Emergency screen.
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-mono text-xs">CAMERA</td>
                    <td className="py-3 px-4">RoamCeylon Admin</td>
                    <td className="py-3 pl-4">
                      Capture a live selfie photo during Partner Business Verification (KYC).
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-mono text-xs">
                      READ_MEDIA_IMAGES / PHOTO LIBRARY &amp; DOCUMENT PICKER
                    </td>
                    <td className="py-3 px-4">Both Apps</td>
                    <td className="py-3 pl-4">
                      Select profile pictures, upload hotel/room/tour/activity/shop gallery images, and upload NIC/Passport or Business License documents (PNG, JPG, HEIC, PDF).
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-mono text-xs">
                      POST_NOTIFICATIONS
                    </td>
                    <td className="py-3 px-4">Both Apps</td>
                    <td className="py-3 pl-4">
                      Deliver real-time alerts for new bookings, guest inquiries, verification status updates, and trip reminders.
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-mono text-xs">
                      INTERNET &amp; VIBRATE
                    </td>
                    <td className="py-3 px-4">Both Apps</td>
                    <td className="py-3 pl-4">
                      Communicate securely with RoamCeylon cloud servers and provide tactile notification feedback.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 4. How We Use Your Information */}
          <section
            id="how-we-use"
            className="scroll-mt-8 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 shadow-sm space-y-4"
          >
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">
              4. How We Use Your Information
            </h2>
            <ul className="list-disc list-inside text-sm sm:text-base text-zinc-600 dark:text-zinc-300 space-y-2 leading-relaxed">
              <li>
                <strong>Service Delivery:</strong> Create and authenticate your account, process hotel, tour, activity, and transport bookings, and connect travelers with verified service providers.
              </li>
              <li>
                <strong>Partner Trust &amp; Safety Verification:</strong> Review partner NIC/Passport, Business License, and selfie submissions to verify business legitimacy before allowing listings to go live.
              </li>
              <li>
                <strong>Personalization &amp; AI Trip Planning:</strong> Generate tailored day-by-day Sri Lanka itineraries, budget breakdowns, and destination recommendations matching your travel preferences.
              </li>
              <li>
                <strong>Notifications &amp; Partner Operations:</strong> Send booking confirmations, tourist inquiry alerts, calendar updates, and verification review outcomes.
              </li>
              <li>
                <strong>Emergency Support:</strong> Display your real-time reverse-geocoded address and GPS coordinates so you can quickly contact Sri Lankan emergency services (119, 1990, 110, 1331).
              </li>
              <li>
                <strong>Security, Fraud Prevention &amp; Legal Compliance:</strong> Detect unauthorized access, enforce our Terms of Use, and comply with applicable Sri Lankan laws.
              </li>
            </ul>
          </section>

          {/* 5. AI Trip Planner & Automated Processing */}
          <section
            id="ai-processing"
            className="scroll-mt-8 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 shadow-sm space-y-4"
          >
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">
              5. AI Trip Planner &amp; Automated Processing
            </h2>
            <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-300 leading-relaxed">
              When you use the AI Trip Planner or AI Chat in <em>RoamCeylon</em>, your selected destination, travel duration, budget tier, interest categories, and chat prompts are processed by our recommendation engine and Google Gemini AI APIs to generate and enrich travel itineraries. We do <strong>not</strong> send your password, phone number, government ID, or payment credentials to third-party AI models.
            </p>
          </section>

          {/* 6. Data Sharing & Third-Party Services */}
          <section
            id="sharing"
            className="scroll-mt-8 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 shadow-sm space-y-4"
          >
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">
              6. Data Sharing &amp; Third-Party Services
            </h2>
            <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-300 leading-relaxed">
              <strong>We do not sell or rent your personal information to third parties, and we do not use your data for third-party cross-app targeted advertising.</strong> We share data only in the following circumstances:
            </p>
            <ul className="list-disc list-inside text-sm sm:text-base text-zinc-600 dark:text-zinc-300 space-y-2.5 leading-relaxed">
              <li>
                <strong>Between Travelers and Verified Partners:</strong> When a traveler books a room, tour package, activity, or ride—or submits a tour inquiry—the traveler&apos;s name, email, phone number, pickup location, dates, party size, and special requests are shared with the specific partner fulfilling that reservation. Conversely, verified partner business details (property/shop name, location, contact details, and listings) are displayed to travelers.
              </li>
              <li>
                <strong>Cloud &amp; SDK Sub-processors:</strong> We rely on trusted infrastructure providers bound by strict confidentiality and data protection terms:
                <ul className="mt-2 ml-6 list-circle space-y-1 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                  <li>
                    <strong>Nhost:</strong> Authentication management and cloud object storage for profile images, listing media, and KYC verification documents.
                  </li>
                  <li>
                    <strong>Render &amp; Managed PostgreSQL:</strong> Cloud hosting for our backend APIs and encrypted relational database.
                  </li>
                  <li>
                    <strong>Google Sign-In (Google LLC):</strong> Optional OAuth 2.0 authentication.
                  </li>
                  <li>
                    <strong>Google Gemini API (Google LLC):</strong> Natural-language trip planning and itinerary enrichment.
                  </li>
                  <li>
                    <strong>Mapbox, Inc.:</strong> Interactive map rendering, coordinate selection, and route visualization.
                  </li>
                  <li>
                    <strong>Expo Notifications / Google Firebase Cloud Messaging (FCM):</strong> Delivery of push notifications to Android and iOS devices.
                  </li>
                </ul>
              </li>
              <li>
                <strong>Legal &amp; Safety Obligations:</strong> When required by law, court order, or government regulation, or when necessary to protect the vital safety of travelers, partners, or the public.
              </li>
            </ul>
          </section>

          {/* 7. Data Storage & Security Measures */}
          <section
            id="security"
            className="scroll-mt-8 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 shadow-sm space-y-4"
          >
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">
              7. Data Storage &amp; Security Measures
            </h2>
            <ul className="list-disc list-inside text-sm sm:text-base text-zinc-600 dark:text-zinc-300 space-y-2 leading-relaxed">
              <li>
                <strong>Encryption in Transit:</strong> All network traffic between our mobile/web applications and our backend servers (Render, Nhost, Mapbox, and Google APIs) is encrypted using industry-standard HTTPS/TLS.
              </li>
              <li>
                <strong>Encrypted On-Device Storage:</strong> Authentication tokens (<code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">authToken</code>, <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">nhostRefreshToken</code>) are stored on your device using hardware-backed encrypted storage (<code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">expo-secure-store</code> / Android Keystore / iOS Keychain).
              </li>
              <li>
                <strong>Access Controls on KYC Documents:</strong> Partner verification documents (NIC/Passport, Business License, and verification selfies) are restricted to authorized verification administrators and are used solely to verify partner identity and business status.
              </li>
            </ul>
          </section>

          {/* 8. Data Retention & Account Deletion */}
          <section
            id="retention-deletion"
            className="scroll-mt-8 rounded-2xl bg-emerald-950 text-white border border-emerald-800 p-6 sm:p-8 shadow-md space-y-4"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-[#EAD26B]">
              Google Play User Data &amp; Account Deletion Policy
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              8. Data Retention &amp; How to Delete Your Account and Data
            </h2>
            <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed">
              We retain your personal data for as long as your account remains active or as needed to provide you with our services and fulfill active bookings. You have the right to request complete deletion of your account and associated personal data at any time—either inside the mobile apps or via the web/email without needing the app installed.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="rounded-xl bg-white/10 border border-white/15 p-4 space-y-2">
                <h3 className="font-bold text-[#EAD26B] text-sm">
                  Option A: In-App Account Deletion
                </h3>
                <ul className="text-xs sm:text-sm text-emerald-50 space-y-1.5 list-disc list-inside">
                  <li>
                    <strong>RoamCeylon Admin:</strong> Open{" "}
                    <em>Settings &rarr; Danger Zone &rarr; Deactivate Admin Account</em>.
                  </li>
                  <li>
                    <strong>RoamCeylon (Traveler App):</strong> Open{" "}
                    <em>Settings &rarr; Personal Info / Support</em> to request immediate account removal.
                  </li>
                </ul>
              </div>

              <div className="rounded-xl bg-white/10 border border-white/15 p-4 space-y-2">
                <h3 className="font-bold text-[#EAD26B] text-sm">
                  Option B: Web / Email Deletion Request
                </h3>
                <p className="text-xs sm:text-sm text-emerald-50 leading-relaxed">
                  Send an email to{" "}
                  <a
                    href="mailto:privacy@roamceylon.com?subject=Account%20and%20Data%20Deletion%20Request"
                    className="underline font-semibold text-white"
                  >
                    privacy@roamceylon.com
                  </a>{" "}
                  from your registered email address with the subject{" "}
                  <strong>&ldquo;Account Deletion Request&rdquo;</strong> and specify whether you are deleting a <em>RoamCeylon</em>, <em>RoamCeylon Admin</em>, or both accounts.
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-black/25 border border-white/10 p-4 text-xs sm:text-sm text-emerald-100 space-y-2">
              <p className="font-semibold text-white">
                What is deleted and retention timelines:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  <strong>Permanently Deleted (within 30 days):</strong> Account credentials, profile information, profile photos, KYC verification documents (NIC/Passport, Business License, selfie), push notification tokens, saved trips, AI chat sessions, and active listings.
                </li>
                <li>
                  <strong>Partial Data Deletion (Without Deleting Account):</strong> You may also delete individual saved trips, listings, rooms, tour packages, or uploaded verification documents directly inside the app, or request deletion of specific data items via{" "}
                  <a
                    href="mailto:privacy@roamceylon.com"
                    className="underline text-white"
                  >
                    privacy@roamceylon.com
                  </a>
                  .
                </li>
                <li>
                  <strong>Legally Required Retention:</strong> Anonymized system logs and completed booking transaction records required for accounting, tax, or dispute-resolution compliance under Sri Lankan law may be retained for up to 5 years before automatic purging.
                </li>
              </ul>
            </div>
          </section>

          {/* 9. Your Privacy Rights */}
          <section
            id="your-rights"
            className="scroll-mt-8 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 shadow-sm space-y-4"
          >
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">
              9. Your Privacy Rights (Sri Lanka PDPA &amp; International Users)
            </h2>
            <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-300 leading-relaxed">
              In accordance with the <strong>Personal Data Protection Act, No. 9 of 2022 of Sri Lanka (PDPA)</strong> and applicable international frameworks (such as the GDPR for European travelers), you have the right to:
            </p>
            <ul className="list-disc list-inside text-sm sm:text-base text-zinc-600 dark:text-zinc-300 space-y-1.5">
              <li>
                <strong>Access &amp; Portability:</strong> Request a copy of the personal data we hold about you.
              </li>
              <li>
                <strong>Correction / Rectification:</strong> Update inaccurate or incomplete profile or business information directly in Settings or by contacting us.
              </li>
              <li>
                <strong>Erasure:</strong> Request deletion of your account and personal data (see Section 8).
              </li>
              <li>
                <strong>Withdraw Consent:</strong> Disable location access, camera/media permissions, or push notifications at any time via your device or app settings.
              </li>
            </ul>
          </section>

          {/* 10. Children's Privacy */}
          <section
            id="children"
            className="scroll-mt-8 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 shadow-sm space-y-3"
          >
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">
              10. Children&apos;s Privacy
            </h2>
            <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-300 leading-relaxed">
              <em>RoamCeylon</em> is not directed to children under the age of 13, and <em>RoamCeylon Admin</em> is strictly intended for adult business operators and tourism professionals (18 years and older). We do not knowingly collect personal information from children under 13. If we become aware that a child under 13 has provided personal data, we will promptly delete such information from our records.
            </p>
          </section>

          {/* 11. Changes to This Policy */}
          <section
            id="changes"
            className="scroll-mt-8 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 shadow-sm space-y-3"
          >
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">
              11. Changes to This Privacy Policy
            </h2>
            <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-300 leading-relaxed">
              We may update this Privacy Policy periodically to reflect new features, regulatory requirements, or security practices. Whenever we make material changes, we will update the &ldquo;Last Updated&rdquo; date at the top of this page and notify users through an in-app notice or push notification.
            </p>
          </section>

          {/* 12. Contact Us */}
          <section
            id="contact"
            className="scroll-mt-8 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 shadow-sm space-y-4"
          >
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">
              12. Contact Us
            </h2>
            <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-300 leading-relaxed">
              If you have any questions, concerns, or requests regarding this Privacy Policy, your personal data, or Google Play Data Safety disclosures, please contact our Privacy &amp; Data Protection team:
            </p>
            <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800 p-4 text-sm space-y-1.5">
              <p>
                <strong>Entity / Developer:</strong> IdeaTech — RoamCeylon Platform
              </p>
              <p>
                <strong>Privacy &amp; Data Deletion Email:</strong>{" "}
                <a
                  href="mailto:privacy@roamceylon.com"
                  className="text-emerald-700 dark:text-emerald-400 font-semibold underline"
                >
                  privacy@roamceylon.com
                </a>
              </p>
              <p>
                <strong>Partner &amp; General Support:</strong>{" "}
                <a
                  href="mailto:support@roamceylon.com"
                  className="text-emerald-700 dark:text-emerald-400 font-semibold underline"
                >
                  support@roamceylon.com
                </a>
              </p>
              <p>
                <strong>Jurisdiction:</strong> Colombo, Sri Lanka
              </p>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-8 text-center text-xs text-zinc-500 dark:text-zinc-400">
        &copy; {new Date().getFullYear()} IdeaTech (RoamCeylon &amp; RoamCeylon Admin). All rights reserved.
      </footer>
    </div>
  );
}
