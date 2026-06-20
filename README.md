# Relay — a general-purpose delivery platform

A full-stack delivery app covering three roles in one codebase: customers ordering
from restaurants/grocery/pharmacy/courier stores, drivers picking up and delivering,
and admins managing the catalog and watching everything move. The frontend is a
React + Vite PWA (installable on a phone, runs in any browser); the backend is a
small Express API with a file-based JSON datastore, so there's nothing to install
or configure beyond `npm install`.

## Project layout

```
relay/
  server/   Express API + JSON datastore (port 4000)
  client/   React + Vite + Tailwind PWA (port 5173)
```

## Running it

You need two terminals — one for the API, one for the frontend.

**1. Start the API:**
```bash
cd server
npm install
npm run seed     # creates demo accounts + sample stores (only need to run once)
npm run dev       # starts on http://localhost:4000
```

**2. Start the frontend, in a second terminal:**
```bash
cd client
npm install
npm run dev       # starts on http://localhost:5173
```

Open `http://localhost:5173` in your browser. The Vite dev server proxies all
`/api/*` requests to the Express server, so you only ever talk to port 5173.

### Demo accounts (password for all: `password123`)
| Role     | Email               |
|----------|---------------------|
| Customer | customer@relay.app  |
| Driver   | driver@relay.app    |
| Admin    | admin@relay.app     |

Or tap "Sign up" to create your own account with whichever role you want.

## What's included

**Customer** — browse stores by category (Restaurant, Grocery, Pharmacy, Courier),
build a cart, check out with a delivery address, and track the order live as it
moves through Placed → Accepted → Picked Up → Delivered. Order history included.

**Driver** — see the pool of unclaimed orders, accept one (only one active delivery
at a time), advance it through pickup and delivery, and see running earnings.

**Admin** — a dashboard with live counts, full CRUD on stores and their menus, and
a searchable/filterable view of every order on the platform.

The order-tracking "route line" (the dotted line with waypoints) is the same
component reused across the customer tracking screen, the driver's active
delivery screen, and the admin order list — it's literally a sequence, so the
visual treats it as one.

## How the backend works

`server/db.js` is a tiny file-backed JSON store (`server/data/db.json`) — no
native dependencies, no setup, works anywhere Node runs. It's intentionally
simple so you can read the whole thing in a minute, but it's structured so that
swapping it for a real database (Postgres, SQLite, Mongo) later only means
rewriting `db.js`; none of the route files would need to change since they all
go through the same `insert/find/filter/update/remove` interface.

Auth is JWT-based (`jsonwebtoken` + `bcryptjs`), with role checks (`customer`,
`driver`, `admin`) enforced via middleware on every protected route.

## Taking it further

A few natural next steps if you want to keep building on this:
- Swap `db.js` for a real database once you need concurrent writes at scale.
- Replace polling (the customer tracker and driver pool refresh every few
  seconds) with WebSockets or Server-Sent Events for instant updates.
- Add real payment processing (Stripe) at checkout.
- Add real-time driver GPS instead of static pickup/drop-off addresses.
- Wrap the client in Capacitor or React Native if you want native app store
  builds rather than a PWA — the screens and API calls would carry over largely
  as-is.
