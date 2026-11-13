# UrbanThread frontend

React 19 and Vite storefront for the Django REST API in `../urbanthread`. The client uses React Router for navigation and Axios for API requests.

## Requirements

- Node.js and npm (use a current Node release supported by Vite 8)
- The UrbanThread Django API running locally or at a reachable URL

## Run locally

Start the API first. From the workspace root:

```powershell
.\venv\Scripts\Activate.ps1
Set-Location .\urbanthread
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```

If the virtual environment is inside the backend folder, activate it there with `\.venv\Scripts\Activate.ps1` instead.

In a second terminal, change to this frontend directory:

```powershell
Set-Location .\urbanthread-frontend
npm ci
npm run dev
```

Open the Vite URL (normally `http://localhost:5173`). Django's local CORS settings already allow this origin.

## Environment

Copy `.env.example` to `.env` in this directory if the API is not at the local default:

```dotenv
VITE_API_URL=http://127.0.0.1:8000
```

`VITE_API_URL` is the origin only; do not append an API path. It defaults to `http://127.0.0.1:8000`. Vite exposes `VITE_` variables to browser code, so do not put secrets in this file. Restart Vite after changing environment variables.

## Storefront routes

| Path | Page |
| --- | --- |
| `/` and `/products` | Product collection |
| `/product/:slug` | Product details, variant selection, reviews and inventory-aware add to cart |
| `/cart` | Customer cart, coupons, delivery address selection, checkout and payment choice (sign-in required) |
| `/login`, `/register` | Account access |
| `/profile` | Account and personal details, saved delivery addresses, delivered recent orders |
| `/orders` | Customer order history and cancellation for eligible orders (sign-in required) |
| `/orders/:orderId/track` | Customer order status, event history, delivery details and products (sign-in required) |
| `/payments` | Payment history and retry/refund flows (sign-in required) |
| `/payment/success`, `/payment/failed`, `/payment/cancelled` | Payment return pages (sign-in required) |
| `/reviews` and `/reviews/:productId` | Product reviews |
| `/coupons` | Available coupons |
| `/wishlist` | Saved products (sign-in required) |
| `/admin` | Staff store dashboard and management sections |
| `/admin/customers/:username` | Staff-only customer details and orders |
| `/admin/orders/:orderId` | Staff-only order detail view |
| `/inventory` | Staff-only inventory management |

Protected customer pages redirect signed-out users to login. Admin routes require a staff or superuser account. Django admin is separate at `http://127.0.0.1:8000/admin/`.

## Main flows

- Registration and login use Django JWT. Axios attaches the access token, attempts refresh after an expired-token response, and clears local auth state if refresh fails. Logout invalidates the refresh token.
- Product pages load categories, brands, sizes, colors and images from the API. A selected variant is checked against inventory before it can be added to the authenticated customer's cart.
- Customers manage their profile and delivery addresses, then choose an address, optional coupon, and cash-on-delivery or SSLCommerz payment at checkout.
- Orders include a snapshot of delivery details. Customers can view tracking history and cancel only when the backend allows it.
- The staff dashboard covers sales overview, orders, customers, reviews, payments/refunds, coupons, reports and store settings. Staff can open customer and order detail pages from linked names and order numbers.

SSLCommerz requires backend credentials and a public callback URL. A local payment provider cannot call a localhost backend IPN endpoint.

## Scripts

Run from this frontend directory:

```powershell
npm run dev       # start Vite development server
npm run build     # create production bundle in dist/
npm run preview   # serve the built bundle locally
npm run lint      # run Oxlint
```

`npm ci` installs the exact dependency versions from `package-lock.json`. The package currently defines no frontend test script; use `npm run lint` and `npm run build` to check the client bundle.

## API reference

The frontend calls the Django API described in `../urbanthread/README.md`. With Django running, open Swagger at `http://127.0.0.1:8000/api/docs/` or the OpenAPI schema at `http://127.0.0.1:8000/api/schema/`.
