# FitHub OS — Multi-Gym Management SaaS

## Live Server :- https://darshil158.github.io/Fithub-OS/ 

**FitHub OS** is a production-style, multi-tenant Gym Management SaaS application engineered exclusively with **HTML5**, **CSS3**, **Vanilla JavaScript (ES6+)**, and **Bootstrap 5**. All application data is persistently stored and managed client-side using a normalized **LocalStorage CRUD Engine** (500+ realistic records across 26 collections).

The application runs directly in any modern web browser simply by opening `index.html` or `login.html` — with **zero backend dependencies, zero build steps, and zero database servers**.

---

## 🏛 Product Hierarchy & Multi-Tenancy

```
Platform Admin (FitHub OS)
 ├── Gym 1: FitZone Club
 │    ├── Branch 1: Andheri West (Mumbai)
 │    ├── Branch 2: Bandra East (Mumbai)
 │    └── Branch 3: South Mumbai (Mumbai)
 ├── Gym 2: IronCore Fitness
 │    ├── Branch 1: Koramangala (Bengaluru)
 │    └── Branch 2: Indiranagar (Bengaluru)
 └── Gym 3: FlexPulse Studios
      ├── Branch 1: Cyber City (Gurugram)
      └── Branch 2: Golf Course Road (Gurugram)
```

The top navigation bar provides instant multi-tenant filtering by Gym and Branch, dynamically scoping members, trainers, attendance logs, equipment, classes, and revenue metrics.

---

## 📁 Category-Based Folder Architecture

FitHub OS adheres strictly to a **clean, scalable category-based folder architecture**:

```
fithub-os/
│
├── index.html                   (Landing Portal & Direct Launch Gateway)
├── login.html                   (Dedicated Login & 1-Click Role Switcher)
├── README.md                    (Architecture & Platform Documentation)
│
├── assets/
│   ├── images/                  (Logos, badges, SVG visual marks)
│   ├── icons/                   (Favicons, app icons)
│   └── fonts/                   (Typography references)
│
├── css/
│   ├── style.css                (Design tokens, base reset, core app layout)
│   ├── components.css           (Cards, tables, modals, badges, stats widgets)
│   └── responsive.css           (Media queries: 320px, 375px, 425px, 768px, 1440px+)
│
├── js/
│   ├── app.js                   (Application lifecycle & tenant isolation query engine)
│   ├── storage.js               (Normalized LocalStorage CRUD engine & backup/restore)
│   ├── seed.js                  (Initial 500+ records generator across 26 collections)
│   ├── auth.js                  (Client-side session authentication state)
│   ├── permissions.js           (6-tier RBAC Matrix & action authorization)
│   ├── navigation.js            (Route resolver, dynamic sidebar, topbar & breadcrumbs)
│   ├── utils.js                 (Multi-currency converter, date/number formatting, CSV export)
│   ├── charts.js                (Chart.js presets, color themes & responsive options)
│   │
│   └── modules/                 (Individual module controllers)
│       ├── dashboard.js
│       ├── gyms.js
│       ├── branches.js
│       ├── members.js
│       ├── trainers.js
│       ├── staff.js
│       ├── memberships.js
│       ├── subscriptions.js
│       ├── payments.js
│       ├── invoices.js
│       ├── attendance.js
│       ├── classes.js
│       ├── bookings.js
│       ├── workouts.js
│       ├── exercises.js
│       ├── diets.js
│       ├── crm.js
│       ├── followups.js
│       ├── offers.js
│       ├── equipment.js
│       ├── maintenance.js
│       ├── reports.js
│       ├── notifications.js
│       ├── reviews.js
│       ├── users.js
│       ├── audit-logs.js
│       └── settings.js
│
└── pages/
    ├── dashboard/
    │   └── dashboard.html       (Executive KPIs, Revenue streams, peak hours)
    │
    ├── organization/
    │   ├── gyms.html            (Gym tenant management & subscription tiers)
    │   ├── branches.html        (Branch locations & facility managers)
    │   └── settings.html        (Platform settings, global currency & DB reset)
    │
    ├── people/
    │   ├── members.html         (120+ Member directory, profiles & statuses)
    │   ├── trainers.html        (Certified instructors & assigned clients)
    │   ├── staff.html           (Operations staff, shifts & payroll)
    │   └── users.html           (System credentials & role administration)
    │
    ├── memberships/
    │   ├── membership-plans.html (Tier packages, durations & feature matrices)
    │   └── subscriptions.html    (Active agreements, renewals & expirations)
    │
    ├── finance/
    │   ├── payments.html        (UPI/Card/Cash receipts & refund processing)
    │   ├── invoices.html        (Itemized tax billing statements & print mode)
    │   └── offers.html          (Promotional coupons & discount campaigns)
    │
    ├── operations/
    │   ├── attendance.html      (Turnstile check-ins, barcode & dwell times)
    │   ├── classes.html         (Studio schedule, capacity & instructor timetable)
    │   ├── bookings.html        (Class seat reservations & attendance marking)
    │   ├── equipment.html       (Fitness asset inventory & machine health)
    │   └── maintenance.html     (Service logs, technician repairs & cost ledger)
    │
    ├── fitness/
    │   ├── workouts.html        (Trainer-crafted workout splits & daily exercises)
    │   ├── exercises.html       (Movement taxonomy, muscle groups & mechanics)
    │   └── diets.html           (Macronutrient meal plans & caloric targets)
    │
    ├── crm/
    │   ├── leads.html           (Sales inquiry pipeline & 1-click member intake)
    │   └── follow-ups.html      (Prospect call scheduling & reminder logs)
    │
    ├── analytics/
    │   └── reports.html         (Chart.js revenue analytics & retention reporting)
    │
    ├── engagement/
    │   ├── notifications.html   (In-app announcements & broadcast alerts)
    │   └── reviews.html         (Member ratings, star reviews & testimonials)
    │
    ├── security/
    │   └── audit-logs.html      (Immutable activity log & forensic audit trail)
    │
    └── errors/
        └── 404.html             (Custom branded 404 error page)
```

---

## 💱 Multi-Currency & Real-Time Exchange Rate Engine

FitHub OS features an automatic client-side currency conversion engine:

| Currency Code | Symbol | Name | Exchange Rate (Base INR) |
|---|---|---|---|
| **INR** | `₹` | Indian Rupee | `1.0` (Base) |
| **USD** | `$` | US Dollar | `1 / 83.50` (1 USD = ₹83.50 INR) |
| **EUR** | `€` | Euro | `1 / 91.00` (1 EUR = ₹91.00 INR) |
| **GBP** | `£` | British Pound | `1 / 106.00` (1 GBP = ₹106.00 INR) |

### Currency Behavior
- **Global Dropdown**: Located in the top navigation bar and in `pages/organization/settings.html`.
- **Automatic Conversion**: Switching currency automatically updates every KPI card, financial table, receipt, tax invoice, and Chart.js visualization.
- **Base Currency Integrity**: Form inputs (e.g. entering a payment in `$ USD`) are automatically converted back to base currency before storing in LocalStorage, preventing arithmetic drift.

---

## 👥 1-Click Role Switcher Demo Accounts

FitHub OS includes 6 pre-configured user personas accessible directly from `login.html`, `index.html`, and the topbar user profile menu:

| Persona | Demo Email | Role Scope & Privileges |
|---|---|---|
| **Super Admin** | `admin@fithubos.com` | Complete platform oversight across all 3 gym brands and 7 branches |
| **Gym Owner** | `owner@fitzone.in` | Financial oversight and branch management for FitZone Club |
| **Branch Manager** | `manager@fitzone.in` | Operational control over Andheri West branch, intake & staff |
| **Fitness Trainer** | `trainer@fitzone.in` | Assigned client rosters, workout splits, and nutrition plans |
| **Front-Desk Staff** | `staff@fitzone.in` | Member check-ins, class reservations, and inquiries |
| **Club Member** | `member@fitzone.in` | Self-service membership profile, attendance logs, and workout routines |

*Default password for all accounts is `admin123`.*

---

## 📱 Responsive Breakpoint Architecture

The design system incorporates tailored CSS media queries supporting viewports from **320px to 1440px+**:

- **1440px+**: Expanded layout with full data density and 320px chart canvases.
- **1024px - 1280px**: Compact sidebar (240px) with responsive tables.
- **768px - 991px**: Collapsible slide-in sidebar drawer with backdrop blur and condensed table toolbars.
- **576px**: Touch-friendly controls, full-width modal dialogs, and stacked KPI stats.
- **320px - 425px**: Mobile-optimized headers, compact currency selector, and overflow-free card grids.

---

## 🚀 How to Run FitHub OS

1. Open your web browser (Google Chrome, Microsoft Edge, Mozilla Firefox, or Safari).
2. Double-click **`index.html`** or **`login.html`** directly from your file explorer.
3. FitHub OS will automatically initialize the database in your browser's `LocalStorage` and launch the application.
