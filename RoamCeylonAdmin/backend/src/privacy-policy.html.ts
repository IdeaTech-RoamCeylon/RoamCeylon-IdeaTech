export const PRIVACY_POLICY_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Privacy Policy | RoamCeylon &amp; RoamCeylon Admin</title>
  <meta name="description" content="Official Privacy Policy and Google Play Data Safety Disclosures for RoamCeylon (com.ideatech.roamceylon) and RoamCeylon Admin (com.ideatech.roamceylonadmin) by IdeaTech." />
  <style>
    :root {
      --emerald-950: #092618;
      --emerald-900: #0F3D26;
      --emerald-800: #145334;
      --emerald-700: #0E5E2F;
      --gold: #EAD26B;
      --bg: #F8FAF8;
      --card: #FFFFFF;
      --text: #18181B;
      --muted: #52525B;
      --border: #E4E4E7;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.65;
    }
    header {
      background: linear-gradient(135deg, var(--emerald-900), var(--emerald-800), var(--emerald-700));
      color: #fff;
      padding: 3.5rem 1.5rem;
      border-bottom: 1px solid rgba(255,255,255,0.12);
    }
    .container {
      max-width: 960px;
      margin: 0 auto;
    }
    .badge {
      display: inline-block;
      background: rgba(255,255,255,0.14);
      color: var(--gold);
      border: 1px solid rgba(255,255,255,0.22);
      border-radius: 999px;
      padding: 0.3rem 0.9rem;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      margin-bottom: 1rem;
    }
    h1 {
      margin: 0 0 0.75rem;
      font-size: clamp(2rem, 4vw, 2.75rem);
      letter-spacing: -0.02em;
    }
    header p {
      margin: 0;
      max-width: 760px;
      color: rgba(255,255,255,0.9);
      font-size: 1.05rem;
    }
    .meta {
      margin-top: 1.5rem;
      display: flex;
      flex-wrap: wrap;
      gap: 1.5rem;
      font-size: 0.875rem;
      color: rgba(255,255,255,0.85);
    }
    main {
      max-width: 960px;
      margin: 2.5rem auto;
      padding: 0 1.5rem;
    }
    section {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 1.75rem 2rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.02);
    }
    section.highlight {
      background: var(--emerald-950);
      color: #fff;
      border-color: var(--emerald-800);
    }
    section.highlight p,
    section.highlight li {
      color: rgba(255,255,255,0.9);
    }
    section.highlight h2,
    section.highlight h3 {
      color: #fff;
    }
    section.highlight a {
      color: var(--gold);
    }
    h2 {
      margin-top: 0;
      font-size: 1.35rem;
      color: var(--emerald-900);
    }
    h3 {
      margin: 1.25rem 0 0.5rem;
      font-size: 1.02rem;
      color: var(--text);
    }
    p, li {
      color: var(--muted);
      font-size: 0.96rem;
    }
    ul {
      padding-left: 1.25rem;
      margin: 0.5rem 0;
    }
    li {
      margin-bottom: 0.45rem;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 1rem;
      margin-top: 1rem;
    }
    .subcard {
      background: #F2F7F4;
      border: 1px solid #D6E6DC;
      border-radius: 12px;
      padding: 1rem 1.25rem;
    }
    section.highlight .subcard {
      background: rgba(255,255,255,0.08);
      border-color: rgba(255,255,255,0.16);
    }
    code {
      background: #F4F4F5;
      padding: 0.15rem 0.4rem;
      border-radius: 5px;
      font-size: 0.84rem;
      color: #18181B;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 0.75rem;
      font-size: 0.9rem;
    }
    th, td {
      text-align: left;
      padding: 0.75rem 0.6rem;
      border-bottom: 1px solid var(--border);
      vertical-align: top;
    }
    th {
      color: var(--text);
      font-weight: 700;
      background: #FAFAFA;
    }
    footer {
      text-align: center;
      padding: 2rem 1.5rem 3rem;
      color: var(--muted);
      font-size: 0.85rem;
      border-top: 1px solid var(--border);
    }
  </style>
</head>
<body>
  <header>
    <div class="container">
      <span class="badge">Official Legal &amp; Google Play Data Safety Policy</span>
      <h1>Privacy Policy</h1>
      <p>
        This Privacy Policy explains how <strong>IdeaTech</strong> (&ldquo;RoamCeylon&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) collects, uses, stores, shares, and safeguards personal and sensitive user data across the <strong>RoamCeylon</strong> traveler app and the <strong>RoamCeylon Admin</strong> partner management app.
      </p>
      <div class="meta">
        <div><strong>Effective Date:</strong> May 1, 2026</div>
        <div><strong>Last Updated:</strong> November 14, 2026</div>
        <div><strong>Developer:</strong> IdeaTech (Sri Lanka)</div>
      </div>
    </div>
  </header>

  <main>
    <section id="overview">
      <h2>1. Scope &amp; Covered Applications</h2>
      <p>This Privacy Policy applies to all travelers, tourists, drivers, hotel and accommodation managers, tour guides, activity providers, shop partners, and administrators using the RoamCeylon ecosystem:</p>
      <div class="grid-2">
        <div class="subcard">
          <h3>RoamCeylon (Traveler App)</h3>
          <p><code>com.ideatech.roamceylon</code></p>
          <p>Consumer mobile app for AI trip planning, hotel reservations, tour &amp; activity bookings, ride-hailing transport, marketplace discovery, and emergency assistance in Sri Lanka.</p>
        </div>
        <div class="subcard">
          <h3>RoamCeylon Admin (Partner App)</h3>
          <p><code>com.ideatech.roamceylonadmin</code></p>
          <p>Partner &amp; vendor mobile and web application for Booking Managers, Tour Guides, Activity Providers, and Shop Partners to verify business credentials and manage listings, reservations, inquiries, and notifications.</p>
        </div>
      </div>
    </section>

    <section id="data-collected">
      <h2>2. Information We Collect</h2>
      <h3>2.1 Account &amp; Profile Data (Both Apps)</h3>
      <ul>
        <li><strong>Personal Identifiers:</strong> Full name, email address, phone number, and unique account identifier (Nhost Auth / PostgreSQL UUID).</li>
        <li><strong>Authentication Credentials:</strong> Encrypted password hashes or Google Sign-In OAuth 2.0 tokens and Google account ID when signing in with Google.</li>
        <li><strong>Profile Attributes:</strong> Optional profile photograph/avatar; for travelers in <em>RoamCeylon</em>, date of birth, gender, nationality/residency status (Sri Lankan or Foreign), currency preference (USD, LKR, EUR), and distance unit preference (KM, Miles); for partners in <em>RoamCeylon Admin</em>, partner role (Booking Manager, Tour Guide, Activity Provider, or Shop Partner).</li>
      </ul>

      <h3>2.2 Partner Identity &amp; Business Verification (KYC) Documents (RoamCeylon Admin Only)</h3>
      <p>To prevent fraud and verify tourism businesses before allowing partner listings to be published, <em>RoamCeylon Admin</em> collects:</p>
      <ul>
        <li><strong>Government ID:</strong> Image or PDF copy of your National Identity Card (NIC) or Passport.</li>
        <li><strong>Business License:</strong> Image or PDF copy of your Business Registration Certificate or Tourism Authority License.</li>
        <li><strong>Selfie Verification:</strong> A live camera photograph captured on your device to verify identity ownership against your submitted ID.</li>
      </ul>

      <h3>2.3 Location Information (Both Apps)</h3>
      <ul>
        <li><strong>RoamCeylon (Traveler App):</strong> Precise and approximate GPS location coordinates (<code>ACCESS_FINE_LOCATION</code>, <code>ACCESS_COARSE_LOCATION</code>) when you browse nearby places, book rides, select pickup/drop-off points on the map, or open the Emergency Assistance screen (which reverse-geocodes your coordinates so you can report your location to Sri Lanka Police 119, Suwa Seriya Ambulance 1990, Fire 110, or Tourist Support 1331).</li>
        <li><strong>RoamCeylon Admin (Partner App):</strong> Map coordinates and street addresses selected via our Mapbox location picker when setting property addresses, shop locations, tour pickup points, or activity venues.</li>
      </ul>

      <h3>2.4 Bookings, Listings, Inquiries &amp; AI Trip Data</h3>
      <ul>
        <li><strong>Bookings &amp; Inquiries:</strong> Hotel room bookings, tour package inquiries and reservations, activity bookings, transport ride requests, guest names, contact details, dates, party sizes, pickup locations, and special requests.</li>
        <li><strong>AI Trip Planner &amp; Chat:</strong> Destination queries, travel duration, budget tier, interest categories, AI chat messages, saved trip itineraries, and itinerary feedback ratings.</li>
        <li><strong>Partner Listings &amp; Revenue Analytics:</strong> Hotel and room listings, tour packages, activity schedules, partner shop details, pricing, availability calendars, and booking revenue summaries.</li>
      </ul>

      <h3>2.5 Device, Push Notification &amp; Diagnostic Data</h3>
      <ul>
        <li><strong>Push Notification Tokens:</strong> Expo Push Token and device platform (<code>android</code> / <code>ios</code>) when you enable push notifications.</li>
        <li><strong>Usage &amp; Reliability Telemetry:</strong> Non-identifying app interaction events (such as itinerary generation, trip saves, destination views, and API latency metrics) used to maintain platform stability and improve recommendations.</li>
      </ul>
    </section>

    <section id="permissions">
      <h2>3. Device Permissions We Request</h2>
      <p>You may grant or revoke any of the following permissions at any time in your Android or iOS system Settings:</p>
      <table>
        <thead>
          <tr>
            <th>Permission</th>
            <th>App</th>
            <th>Purpose</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>ACCESS_FINE_LOCATION</code> / <code>ACCESS_COARSE_LOCATION</code></td>
            <td>Both Apps</td>
            <td>Display nearby destinations, select ride or business coordinates on Mapbox maps, and show current coordinates on the Emergency screen.</td>
          </tr>
          <tr>
            <td><code>CAMERA</code></td>
            <td>RoamCeylon Admin</td>
            <td>Capture a live selfie photograph during Partner Business Verification (KYC).</td>
          </tr>
          <tr>
            <td><code>READ_MEDIA_IMAGES</code> / Photo Library &amp; Document Picker</td>
            <td>Both Apps</td>
            <td>Upload profile avatars, property/tour/activity/shop photos, and NIC/Passport or Business License files (PNG, JPG, HEIC, PDF up to 5 MB).</td>
          </tr>
          <tr>
            <td><code>POST_NOTIFICATIONS</code></td>
            <td>Both Apps</td>
            <td>Send real-time alerts for new bookings, tourist inquiries, verification status updates, and trip updates.</td>
          </tr>
          <tr>
            <td><code>INTERNET</code> &amp; <code>VIBRATE</code></td>
            <td>Both Apps</td>
            <td>Connect securely to RoamCeylon cloud APIs and provide notification vibration alerts.</td>
          </tr>
        </tbody>
      </table>
    </section>

    <section id="how-we-use">
      <h2>4. How We Use Your Information</h2>
      <ul>
        <li><strong>Account &amp; Role Management:</strong> Authenticate travelers and partners and enforce role-based access across traveler and partner dashboards.</li>
        <li><strong>Partner KYC Verification:</strong> Verify partner identity and business credentials before publishing accommodations, tours, activities, or shops.</li>
        <li><strong>Bookings &amp; Marketplace Fulfillment:</strong> Process reservations, inquiries, and ride requests between travelers and verified service providers.</li>
        <li><strong>AI Itinerary Generation:</strong> Create personalized day-by-day Sri Lanka travel plans and recommendations using our recommendation engine and Google Gemini AI.</li>
        <li><strong>Safety &amp; Emergency Support:</strong> Provide location-aware emergency calling shortcuts in Sri Lanka.</li>
        <li><strong>Security &amp; Compliance:</strong> Prevent fraud, enforce our Terms of Use, and comply with applicable Sri Lankan laws.</li>
      </ul>
    </section>

    <section id="sharing">
      <h2>5. Data Sharing &amp; Third-Party Service Providers</h2>
      <p><strong>We never sell your personal data to third parties and never share your data for third-party cross-app targeted advertising.</strong> Data is shared only as follows:</p>
      <ul>
        <li><strong>Between Travelers and Verified Partners:</strong> When you book a stay, tour, activity, or ride—or submit a tour inquiry—necessary reservation details (name, email, phone number, dates, guest count, pickup location, and special requests) are shared with the verified provider fulfilling your request.</li>
        <li><strong>Trusted Infrastructure &amp; SDK Providers:</strong>
          <ul>
            <li><strong>Nhost:</strong> Authentication and cloud storage for profile avatars, listing images, and KYC verification documents.</li>
            <li><strong>Render &amp; Managed PostgreSQL:</strong> Cloud backend hosting and encrypted database storage.</li>
            <li><strong>Google Sign-In &amp; Google Gemini AI (Google LLC):</strong> Optional OAuth sign-in and AI itinerary generation/enrichment (passwords, phone numbers, and KYC documents are never sent to AI models).</li>
            <li><strong>Mapbox, Inc.:</strong> Interactive map rendering and location coordinate selection.</li>
            <li><strong>Expo Push Notification Service / Firebase Cloud Messaging (FCM):</strong> Push notification delivery.</li>
          </ul>
        </li>
        <li><strong>Legal Requirements:</strong> When required by law, court order, or governmental authority in Sri Lanka.</li>
      </ul>
    </section>

    <section id="security">
      <h2>6. Data Storage &amp; Security Measures</h2>
      <ul>
        <li><strong>Encryption in Transit:</strong> All data transmitted between our apps and backend services is encrypted over HTTPS/TLS.</li>
        <li><strong>Encrypted On-Device Storage:</strong> Authentication tokens (<code>authToken</code>, <code>nhostRefreshToken</code>) are stored in hardware-backed encrypted storage (<code>expo-secure-store</code>).</li>
        <li><strong>Restricted KYC Access:</strong> Partner verification files (NIC/Passport, Business License, selfie) are strictly restricted to authorized RoamCeylon verification administrators.</li>
      </ul>
    </section>

    <section id="retention-deletion" class="highlight">
      <h2>7. Data Retention &amp; Account / Data Deletion Policy</h2>
      <p>We retain your personal data while your account is active and as needed to fulfill bookings. You may request complete deletion of your account and personal data at any time—either inside the app or via email/web without needing the app installed:</p>
      <div class="grid-2">
        <div class="subcard">
          <h3>Option A: In-App Deletion</h3>
          <ul>
            <li><strong>RoamCeylon Admin:</strong> Go to <em>Settings &rarr; Danger Zone &rarr; Deactivate Admin Account</em>.</li>
            <li><strong>RoamCeylon Traveler App:</strong> Go to <em>Settings &rarr; Personal Info / Support</em>.</li>
          </ul>
        </div>
        <div class="subcard">
          <h3>Option B: Web / Email Deletion Request</h3>
          <p>Email <a href="mailto:privacy@roamceylon.com?subject=Account%20Deletion%20Request">privacy@roamceylon.com</a> from your registered email address with the subject <strong>&ldquo;Account Deletion Request&rdquo;</strong> and state whether your request applies to <em>RoamCeylon</em>, <em>RoamCeylon Admin</em>, or both.</p>
        </div>
      </div>
      <ul>
        <li><strong>Deleted Within 30 Days:</strong> Account credentials, profile details, profile picture, KYC verification documents (NIC/Passport, Business License, selfie), push tokens, saved trips, AI chat sessions, and active listings.</li>
        <li><strong>Partial Data Deletion:</strong> You can also delete individual listings, rooms, tour packages, saved trips, or uploaded files in-app or by emailing <a href="mailto:privacy@roamceylon.com">privacy@roamceylon.com</a> without deleting your account.</li>
        <li><strong>Legal Retention:</strong> Completed transaction records required for tax, accounting, or legal compliance under Sri Lankan law may be retained in archived form for up to 5 years.</li>
      </ul>
    </section>

    <section id="rights-children">
      <h2>8. Your Privacy Rights &amp; Children&apos;s Privacy</h2>
      <p>Under the <strong>Personal Data Protection Act, No. 9 of 2022 of Sri Lanka (PDPA)</strong> and applicable international privacy laws (including GDPR), you have the right to access, correct, export, or erase your personal data, and to withdraw consent for optional permissions at any time.</p>
      <p><strong>Children&apos;s Privacy:</strong> <em>RoamCeylon</em> is not directed to children under 13, and <em>RoamCeylon Admin</em> is intended solely for adult business operators (18+). We do not knowingly collect personal data from children under 13.</p>
    </section>

    <section id="contact">
      <h2>9. Contact Us</h2>
      <p>For privacy inquiries, data access requests, or account deletion requests, please contact:</p>
      <ul>
        <li><strong>Developer / Entity:</strong> IdeaTech — RoamCeylon Platform</li>
        <li><strong>Privacy &amp; Data Protection Email:</strong> <a href="mailto:privacy@roamceylon.com">privacy@roamceylon.com</a></li>
        <li><strong>General &amp; Partner Support:</strong> <a href="mailto:support@roamceylon.com">support@roamceylon.com</a></li>
        <li><strong>Location:</strong> Colombo, Sri Lanka</li>
      </ul>
    </section>
  </main>

  <footer>
    &copy; 2026 IdeaTech (RoamCeylon &amp; RoamCeylon Admin). All rights reserved.
  </footer>
</body>
</html>`;
