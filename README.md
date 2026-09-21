# 🍽️ DineX QR – Restaurant Dine‑In Ordering System

DineX QR is a full‑stack QR‑based dine‑in ordering system for restaurants.

Guests scan table‑specific QR codes to open a mobile‑friendly menu, customize dishes, build a cart, and place orders directly from their phone; staff use an admin dashboard to view and manage orders in real time.[web:316][web:320]

---

## ✨ Features

### Customer (Guest) Experience

- **Table‑specific QR entry**  
  Each table has its own QR code (`/dinein/[restaurantSlug]/[qrToken]`) that sets restaurant and table context in the browser.
- **Interactive digital menu**  
  Browse items by category with descriptions, veg/non‑veg badge, spice level, variations (Half/Full, Regular/Large), and add‑ons.
- **Cart and order placement**  
  Add/remove items, adjust quantities, add special notes, and place an order tied to the current table.
- **Order status page**  
  Guests can view a live order summary with status (`PENDING`, `ACCEPTED`, `IN_KITCHEN`, `SERVED`, `CLOSED`) and item details.

### Staff / Restaurant Operations

- **Admin order dashboard** (`/admin/orders`)  
  See live orders filtered by status and update statuses with one click (Accept → In Kitchen → Served → Closed).
- **Kitchen‑friendly structure**  
  Orders are linked to restaurant, table, and menu items with variations and add‑ons so KOT/production systems can be plugged in later.
- **Menu management ready**  
  Backend exposes a structured menu API (`/public/restaurants/:slug/menu`) with categories, items, variations, and add‑ons.

### Technical Characteristics

- **Full‑stack TypeScript**  
  Next.js (App Router) frontend + Express backend + Prisma ORM + PostgreSQL.[web:323][web:328][web:330]
- **Multi‑table, single‑restaurant**  
  Current seed creates a demo restaurant (`demo-restaurant`) with multiple tables (`table-11-token`, `table-12-token`).
- **Mobile‑first UI**  
  Tailwind‑styled UI optimized for phones; runs on local network (e.g., `http://192.168.x.x:3000`) for real restaurant testing.
- **Docker‑ready**  
  `docker-compose.yml` can spin up Postgres + backend + frontend for local or cloud deployment.

---

## 🧱 Tech Stack

- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS
- **Backend:** Node.js, Express, TypeScript
- **Database & ORM:** PostgreSQL + Prisma
- **Validation:** Zod (for request payloads)
- **State management:** Zustand (for restaurant/table/cart context on the frontend)
- **Containerization:** Docker, Docker Compose

Patterns follow current full‑stack Next.js + Prisma guidance used in production apps.[web:323][web:328][web:330]

---

## 📁 Project Structure

At the repository root:

```txt
restaurant-qr-app/
├── backend/
│   ├── src/
│   │   ├── index.ts          # Express app: QR resolution, menu, orders, admin
│   │   ├── middleware/
│   │   │   ├── adminAuth.ts  # Simple admin auth via header
│   │   │   └── errorHandler.ts
│   │   └── validation/       # Zod schemas (createOrder, admin status update)
│   ├── prisma/
│   │   ├── schema.prisma     # Restaurant, Table, MenuItem, Variation, Addon, Order, OrderItem
│   │   └── seed.ts           # Demo restaurant + tables + menu data
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── app/
│   │   ├── layout.tsx        # Global shell (header/footer)
│   │   ├── page.tsx          # Home dashboard
│   │   ├── dinein/
│   │   │   └── [restaurantSlug]/
│   │   │      └── [qrToken]/page.tsx  # QR landing + context set + redirect to /menu
│   │   ├── menu/page.tsx     # Menu view with categories + MenuItemDetail cards
│   │   ├── cart/page.tsx     # Cart + place order
│   │   ├── order/[id]/page.tsx   # Order status
│   │   └── admin/orders/page.tsx # Staff order dashboard
│   ├── components/
│   │   └── MenuItemDetail.tsx    # Variations/add‑ons + quantity UI
│   ├── store/
│   │   └── useOrderStore.ts      # Zustand store for context + cart
│   ├── lib/
│   │   └── apiTypes.ts           # Shared types for cart/order payloads
│   ├── tailwind.config.ts
│   ├── next.config.ts
│   └── package.json
│
├── docs/
│   ├── architecture.md
│   ├── backend-api.md
│   ├── schema.md
│   └── dev-setup.md
│
├── docker-compose.yml
├── README.md
└── package-lock.json (root)
```

---

## ⚙️ Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose (optional but recommended)
- PostgreSQL (local or via Docker)
- Git

---

## 🚀 Getting Started (Local Dev)

### 1. Clone the repository

```bash
git clone [https://github.com/](https://github.com/)<your-username>/restaurant-qr-app.git
cd restaurant-qr-app
```

### 2. Backend setup

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
DATABASE_URL="postgresql://restaurant_user:restaurant_password@localhost:5432/restaurant_qr?schema=public"
ORDER_TAX_RATE="0.05"        # 5% tax
ADMIN_TOKEN="dev-admin-token-123"
```

Run migrations and seed:

```bash
npx prisma migrate dev --name init
npx prisma db seed
```

Start backend:

```bash
npm run dev
# Backend on http://localhost:4000
```

### 3. Frontend setup

In another terminal:

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL="http://localhost:4000"
NEXT_PUBLIC_ADMIN_TOKEN="dev-admin-token-123"
```

Start frontend:

```bash
npm run dev
# Frontend on http://localhost:3000
```

---

## 🧪 Test the Flow (Desktop)

1. **QR entry**  
   Open:

   ```text
   http://localhost:3000/dinein/demo-restaurant/table-11-token
   ```

   You should see the QR landing page and be redirected to `/menu` after validation.

2. **Menu & cart**  
   - On `/menu`, you should see categories and items from the seeded menu.  
   - Add items via the item cards (MenuItemDetail).  
   - Go to `/cart`, verify items, and click “Place order”.

3. **Order status**  
   - You’ll be redirected to `/order/[id]` where you can see status and item breakdown.

4. **Staff dashboard**  
   - Visit `/admin/orders`.  
   - You should see the new order under `PENDING`.  
   - Update status (`ACCEPTED`, `IN_KITCHEN`, `SERVED`, `CLOSED`) via the action buttons.

Admin routes use a simple header token for now:

```http
x-admin-token: dev-admin-token-123
```

The frontend sets this automatically using `NEXT_PUBLIC_ADMIN_TOKEN`.

---

## 📱 Testing on Phone (Same Wi‑Fi)

To test the experience on a real device in the restaurant:

1. Ensure laptop and phone are on the **same Wi‑Fi**.
2. Find laptop IP, e.g. `192.168.0.12`.
3. Update `frontend/.env.local`:

   ```env
   NEXT_PUBLIC_API_BASE_URL="http://192.168.0.12:4000"
   ```

4. Restart frontend:

   ```bash
   cd frontend
   npm run dev
   ```

5. On your phone, visit:

   ```text
   http://192.168.0.12:3000/dinein/demo-restaurant/table-11-token
   ```

   or generate a QR code that encodes this URL and scan it.

The QR page will call `http://192.168.0.12:4000/public/qr/...` and then redirect to `/menu` on your phone.

---

## 🧾 Core Backend API

### Health

- `GET /health`  
  Returns service status.

### QR resolution

- `GET /public/qr/:qrToken`  
  Resolves a QR token to `{ table, restaurant }`.

### Menu

- `GET /public/restaurants/:restaurantSlug/menu`  
  Returns restaurant info + categories + items (+ variations and add‑ons).

### Orders (guest)

- `POST /public/orders`  
  Creates a new order for a table.

  Body (simplified):

  ```json
  {
    "restaurantSlug": "demo-restaurant",
    "tableQrToken": "table-11-token",
    "items": [
      {
        "itemId": 1,
        "variationId": 2,
        "quantity": 2,
        "addons": [{ "addonId": 10, "quantity": 1 }],
        "specialNotes": "Less spicy"
      }
    ]
  }
  ```

- `GET /public/orders/:id`  
  Returns full order details and status.

### Orders (admin / staff)

- `GET /admin/orders?status=PENDING`  
  Lists orders by status.

- `PATCH /admin/orders/:id/status`  
  Updates order status. Requires `x-admin-token` header.

---

## 🧩 Data Model (Prisma)

Simplified overview:

- `Restaurant` – `id`, `name`, `slug`, `description`
- `Table` – `id`, `name`, `area`, `qrToken`, `restaurantId`, `capacity`
- `MenuCategory` – `id`, `name`, `slug`, `displayOrder`, `restaurantId`, `isActive`
- `MenuItem` – `id`, `categoryId`, `restaurantId`, `name`, `description`, `basePrice`, `isVeg`, `spiceLevel`, `imageUrl`, `tags`, `isActive`
- `ItemVariation` – `id`, `menuItemId`, `name`, `priceDelta`
- `ItemAddon` – `id`, `menuItemId`, `name`, `priceDelta`, `maxQuantity`
- `Order` – `id`, `restaurantId`, `tableId`, `status`, `subtotal`, `tax`, `total`, `paymentStatus`, timestamps
- `OrderItem` – `id`, `orderId`, `itemId`, `variationId`, `quantity`, `unitPrice`, `addons` (JSON), `specialNotes`

The schema follows common QR‑based restaurant ordering patterns documented in similar systems.[web:316][web:320][web:322]

---

## 🐳 Docker & Docker Compose

You can run the whole stack via Docker for consistent local setup.

From the repo root:

```bash
docker-compose up --build
```

Typical services:

- `postgres` – database
- `backend` – Express + Prisma API
- `frontend` – Next.js app

Once up:

- Frontend: `http://localhost:3000`  
- Backend: `http://localhost:4000`

---

## 🔒 Security & Hardening (Roadmap)

- Replace header‑based admin token with proper auth (NextAuth, Cognito, etc.).
- Add rate limiting and stricter validation on all public endpoints.
- Add role‑based dashboards (admin vs kitchen vs captain).
- Add HTTPS and reverse proxy for production deployments.

---

## 📌 Status

This project is currently in **local dev / prototype** stage:

- Single demo restaurant seeded.  
- QR → menu → cart → order → staff flow working.  
- Ready for extension into multi‑restaurant, AI‑assisted menu, and analytics.

Contributions, issues, and feature requests are welcome.
