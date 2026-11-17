# 🛍️ Urban Thread — Modern E-Commerce Frontend Storefront & Admin Portal

A responsive, high-performance web storefront and staff management dashboard for **Urban Thread**, built with **React 19**, **Vite 8**, **React Router v6**, **Axios**, and **Google OAuth**. Seamlessly connects to the Django REST Framework API, featuring a floating AI customer support widget, real-time inventory validation, dynamic zone-based checkout, order tracking, and a full-featured staff administration portal.

---

## 🌐 Quick Links & Preview

| Resource | URL | Purpose |
| :--- | :--- | :--- |
| **Live Storefront (Production)** | [urbanthreadshop.vercel.app](https://urbanthreadshop.vercel.app/) | Deployed live customer storefront |
| **Vite Development Server** | `http://localhost:5173/` | Local frontend development server |
| **Production Backend API** | `https://urbanthread-6nok.onrender.com/` | Hosted Render REST API |
| **Local Backend Target** | `http://127.0.0.1:8000/` | Local Django REST API |
| **Swagger API Docs** | `http://127.0.0.1:8000/api/docs/` | Interactive API documentation |

---

## 📋 Table of Contents

- [🛍️ Urban Thread — Modern E-Commerce Frontend Storefront & Admin Portal](#️-urban-thread--modern-e-commerce-frontend-storefront--admin-portal)
  - [🌐 Quick Links \& Preview](#-quick-links--preview)
  - [📋 Table of Contents](#-table-of-contents)
  - [🛠 Tech Stack](#-tech-stack)
  - [📁 Project Structure](#-project-structure)
  - [✨ Features](#-features)
    - [1. Customer Storefront \& Catalog](#1-customer-storefront--catalog)
    - [2. Variant Selection \& Real-Time Stock Validation](#2-variant-selection--real-time-stock-validation)
    - [3. Shopping Cart, Coupons \& Dynamic Checkout](#3-shopping-cart-coupons--dynamic-checkout)
    - [4. Order Tracking, Invoices \& Self-Service Returns](#4-order-tracking-invoices--self-service-returns)
    - [5. Authentication, Google Sign-In \& Security](#5-authentication-google-sign-in--security)
    - [6. AI Customer Support Chatbot Widget](#6-ai-customer-support-chatbot-widget)
    - [7. Staff \& Store Administration Portal](#7-staff--store-administration-portal)
  - [⚙️ Setup \& Local Development](#️-setup--local-development)
    - [Prerequisites](#prerequisites)
    - [Step 1: Start the Backend API](#step-1-start-the-backend-api)
    - [Step 2: Install Frontend Dependencies](#step-2-install-frontend-dependencies)
    - [Step 3: Configure Environment Variables](#step-3-configure-environment-variables)
    - [Step 4: Launch Vite Dev Server](#step-4-launch-vite-dev-server)
  - [🔑 Environment Variables](#-environment-variables)
  - [🗺 Storefront \& Admin Route Map](#-storefront--admin-route-map)
  - [📜 Available NPM Scripts](#-available-npm-scripts)
  - [🚀 Production Build \& Vercel Deployment](#-production-build--vercel-deployment)
  - [📝 License](#-license)

---

## 🛠 Tech Stack

| Category | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Core Framework** | React | `^19.3.1` | Modern declarative component UI |
| **DOM Renderer** | React DOM | `^19.3.1` | Web rendering engine |
| **Build Tool & Bundler** | Vite | `^8.3.7` | Lightning-fast HMR and optimized production bundling |
| **Routing** | React Router DOM | `^6.26.2` | Single Page Application (SPA) client-side routing |
| **HTTP Client** | Axios | `^1.7.7` | Centralized API client with JWT interceptor & auto-refresh |
| **Authentication** | Google Identity Services | Web GIS | Google One-Tap & standard OAuth Sign-In |
| **Linter** | Oxlint | `^1.90.0` | Ultra-fast Rust-based JavaScript/React linter |
| **Styling** | Modern CSS | CSS3 | Responsive flexbox & grid design with custom variables |
| **Deployment** | Vercel | SPA Rewrites | Ready-to-deploy configuration via `vercel.json` |

---

## 📁 Project Structure

```
urbanthread-frontend/
├── public/
│   ├── favicon.svg             # Storefront favicon
│   └── icons.svg               # SVG sprite asset
├── src/
│   ├── assets/                 # Static images, promotional banners, and icons
│   │   ├── hero.png
│   │   ├── react.svg
│   │   └── vite.svg
│   ├── components/             # Reusable UI & Layout Components
│   │   ├── ChatWidget.jsx      # Floating AI Assistant chatbot component
│   │   ├── common.jsx          # Navbar, Footer, ProtectedRoute, AdminRoute, Loading spinners
│   │   ├── ErrorBoundary.jsx   # Top-level React error catch boundary
│   │   ├── GoogleSignInButton.jsx # Google GIS OAuth button & One-Tap integration
│   │   ├── Paginated.jsx       # Reusable pagination & limit/offset controller
│   │   └── ResponsiveImage.jsx # Lazy-loaded image wrapper with fallback support
│   ├── contexts/               # Global Application Contexts
│   │   ├── AuthContext.jsx     # User authentication, tokens, roles, and profile state
│   │   ├── context.js          # Shared context hooks
│   │   └── useAuth.js          # Convenient `useAuth()` hook
│   ├── pages/                  # Page-Level Views
│   │   ├── AdminCustomerProfilePage.jsx # Staff view: individual customer orders & details
│   │   ├── AdminDashboard.jsx  # Staff view: store analytics, sales, orders, reports
│   │   ├── CartPage.jsx        # Shopping cart, coupon validation, checkout & address picker
│   │   ├── CouponsPage.jsx     # Active discount coupons list
│   │   ├── InventoryPage.jsx   # Staff view: variant stock editor & low-stock monitor
│   │   ├── LoginPage.jsx       # Login form with email/password + Google OAuth
│   │   ├── OrdersPage.jsx      # Customer order history & order cancellation
│   │   ├── OrderTrackingPage.jsx # Visual timeline tracker & courier details (customer & admin)
│   │   ├── PasswordSecurityPage.jsx # Forgot password request & OTP reset confirmation
│   │   ├── PaymentResultPage.jsx # Return landing page for success/fail/cancel outcomes
│   │   ├── PaymentsPage.jsx    # Payment history & transaction logs
│   │   ├── ProductDetailPage.jsx # Variant selection (size/color), stock check, review list
│   │   ├── ProductsPage.jsx    # Catalog browsing, hero carousel, filtering & search
│   │   ├── ProfilePage.jsx     # Personal info & delivery address book management
│   │   ├── RegisterPage.jsx    # Account registration & email OTP verification flow
│   │   ├── ReturnsPage.jsx     # Customer self-service return request submission & tracking
│   │   ├── ReviewsPage.jsx     # Product rating & customer review submission
│   │   └── WishlistPage.jsx    # Saved favorite products list
│   ├── api.js                  # Axios instance configured with base URL, token refresh & guest cart
│   ├── App.css                 # Application-wide styling & utility classes
│   ├── App.jsx                 # Route definitions and provider tree
│   ├── index.css               # Global theme variables, typography, and base styles
│   └── main.jsx                # React root mount point
├── .env.example                # Sample environment template
├── .gitignore
├── .oxlintrc.json              # Oxlint rules configuration
├── index.html                  # HTML template with Google GIS script
├── package.json
├── package-lock.json
├── vercel.json                 # Vercel SPA redirect rules
└── vite.config.js              # Vite configuration with React plugin
```

---

## ✨ Features

### 1. Customer Storefront & Catalog
- **Dynamic Hero Banners:** Responsive carousel loading promotional banners from `/products/banners/`.
- **Faceted Product Filtering:** Filter garments by category, brand, availability, price ordering, and real-time keyword search.
- **Responsive Media:** Images automatically handle WebP/retina rendering and fallback placeholders through `ResponsiveImage.jsx`.
- **Wishlist:** One-click favorite button with instant synchronization to the customer's account.

### 2. Variant Selection & Real-Time Stock Validation
- Interactive color chips and garment size buttons (S, M, L, XL, etc.).
- **Live Inventory Inspection:** When a customer selects a size and color, the frontend calls the backend `/inventory/inventorys/check_availability/` endpoint to confirm stock in real time.
- Prevents out-of-stock items from being added to the cart, displaying instant availability status badges.

### 3. Shopping Cart, Coupons & Dynamic Checkout
- **Universal Cart Support:** Supports signed-in customers as well as guest shoppers via local `X-Guest-Cart` session tokens.
- **Coupon System:** Instant promo code validation (`/coupons/validate_coupon/`) with applied discount deduction.
- **Zone-Aware Delivery Fee:** Fetches store settings (`/products/store-settings/`) to apply Dhaka delivery fee, Outside Dhaka fee, or waived free shipping when total passes the threshold.
- **Payment Method Choice:** Direct choice between **Cash on Delivery (COD)** and **SSLCommerz Online Payment** gateway.

### 4. Order Tracking, Invoices & Self-Service Returns
- **Visual Order Progression:** Step-by-step timeline tracker (`/orders/:orderId/track`) showing status updates (`pending` → `processing` → `shipped` → `delivered`).
- **PDF Invoice Download:** Direct download of generated PDF invoices with order itemization.
- **Order Cancellation:** Customers can cancel eligible pending orders before they are dispatched.
- **Self-Service Returns (`/returns`):** Customers can submit return requests for delivered items with reasons and track approval status.

### 5. Authentication, Google Sign-In & Security
- **JWT Auto-Refresh:** Axios interceptors attach JWT bearer tokens and automatically rotate expired access tokens using the refresh token.
- **Google OAuth:** One-tap sign-in and Google Sign-In button powered by Google Identity Services (`GoogleSignInButton.jsx`).
- **Email & Phone OTP:** Two-step verification on registration and secure OTP-based password reset (`/forgot-password`).
- **Route Protection:** `ProtectedRoute` guards customer pages; `AdminRoute` restricts staff management areas.

### 6. AI Customer Support Chatbot Widget
- Persistent floating chat bubble available across all storefront pages (`ChatWidget.jsx`).
- Directly calls the backend `/chatbot/` API.
- **Intelligent Shopping Assistance:**
  - Speaks both English and Bengali (Bangla & Romanized Bangla).
  - Understands product inquiries, finds matching catalog items, and prints clickable product links.
  - Answers delivery charges, return procedures, and payment questions accurately.

### 7. Staff & Store Administration Portal
- **Dashboard Overview (`/admin`):** High-level view of store performance, revenue, pending orders, and registered customers.
- **Order Management (`/admin/orders/:orderId`):** Staff can update order fulfillment status, set courier names, and input shipment tracking codes.
- **Customer CRM (`/admin/customers/:customerUsername`):** Review customer contact info, delivery addresses, and full order history.
- **Inventory Matrix (`/inventory`):** In-place stock management for every product color and size combination.
- **Coupons & Reviews Management:** Moderate product reviews and create promotional discounts.

---

## ⚙️ Setup & Local Development

### Prerequisites
- **Node.js**: `v18.0.0` or higher (Node 20+ recommended)
- **npm**: `v9.0.0` or higher
- **UrbanThread Backend API**: Running at `http://127.0.0.1:8000/`

---

### Step 1: Start the Backend API
Before launching the frontend, ensure the Django backend server is running. From the project root:

```powershell
# In Terminal 1:
.\venv\Scripts\Activate.ps1
Set-Location .\urbanthread
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```

---

### Step 2: Install Frontend Dependencies
Open a second terminal window and navigate to the `urbanthread-frontend` directory:

```powershell
# In Terminal 2:
Set-Location .\urbanthread-frontend
npm ci
```
> `npm ci` installs exact dependency versions from `package-lock.json`. If you are installing for the first time or adding packages, you can also run `npm install`.

---

### Step 3: Configure Environment Variables
Create a `.env` file in the `urbanthread-frontend/` directory (or copy from `.env.example`):

```dotenv
# Backend API Base URL (Origin only, no trailing slash or path)
VITE_API_URL=http://127.0.0.1:8000

# Optional: Google OAuth Web Client ID (from Google Cloud Console)
VITE_GOOGLE_CLIENT_ID=your-google-oauth-web-client-id.apps.googleusercontent.com
```

> ⚠️ **Note:** Vite exposes variables prefixed with `VITE_` to client-side code. Never place secret private keys in this file. Restart the Vite server after editing `.env`.

---

### Step 4: Launch Vite Dev Server
```powershell
npm run dev
```

The Vite dev server will start instantly, typically at:
👉 **`http://localhost:5173/`**

Django's CORS settings in `urbanthread/urbanthread/settings.py` are already pre-configured to accept requests from `http://localhost:5173`.

---

## 🔑 Environment Variables

| Variable | Default Value | Required | Purpose |
| :--- | :--- | :---: | :--- |
| `VITE_API_URL` | `http://127.0.0.1:8000` | No | Base URL of the Django REST Framework backend API |
| `VITE_GOOGLE_CLIENT_ID` | *Empty* | No | Google OAuth 2.0 Web Client ID for Google One-Tap & Sign-In button |

---

## 🗺 Storefront & Admin Route Map

| Path | View Component | Access | Description |
| :--- | :--- | :---: | :--- |
| `/` or `/products` | `<ProductsPage />` | Public | Storefront catalog, hero carousel, search & category filters |
| `/product/:slug` | `<ProductDetailPage />` | Public | Product details, variant selection, stock check, reviews |
| `/cart` | `<CartPage />` | Public / Guest | Cart items, coupon application, address selection, checkout |
| `/login` | `<LoginPage />` | Public (Guest) | Login with username/email & password or Google OAuth |
| `/register` | `<RegisterPage />` | Public (Guest) | Registration with email verification code OTP confirmation |
| `/forgot-password` | `<PasswordResetPage />` | Public | OTP-based password reset request and new password confirmation |
| `/profile` | `<ProfilePage />` | Customer | Profile info, change password, saved delivery addresses |
| `/orders` | `<OrdersPage />` | Customer | Customer order history and order cancellation |
| `/orders/:orderId/track` | `<OrderTrackingPage />` | Customer | Order status tracking pipeline, courier info & invoice download |
| `/returns` | `<ReturnsPage />` | Customer | Self-service return requests for delivered orders |
| `/wishlist` | `<WishlistPage />` | Customer | Saved favorite products |
| `/payments` | `<PaymentsPage />` | Customer | Payment transaction history |
| `/payment/success` | `<PaymentResultPage outcome="success" />` | Customer | SSLCommerz payment success return page |
| `/payment/failed` | `<PaymentResultPage outcome="failed" />` | Customer | SSLCommerz payment failed return page |
| `/payment/cancelled` | `<PaymentResultPage outcome="cancelled" />` | Customer | SSLCommerz payment cancelled return page |
| `/coupons` | `<CouponsPage />` | Public | Available store coupons and discount percentages |
| `/reviews` | `<ReviewsPage />` | Public | All product reviews |
| `/reviews/:productId` | `<ReviewsPage />` | Public | Reviews filtered for a specific product |
| `/admin` | `<AdminDashboard />` | **Staff Only** | Store sales summary, total orders, revenue analytics |
| `/admin/orders/:orderId` | `<OrderTrackingPage adminView />` | **Staff Only** | Order fulfillment, tracking code & status modifier |
| `/admin/customers/:customerUsername` | `<AdminCustomerProfilePage />` | **Staff Only** | Customer order records and contact profile |
| `/inventory` | `<InventoryPage />` | **Staff Only** | Stock level management per product variant |

---

## 📜 Available NPM Scripts

Run from the `urbanthread-frontend/` directory:

```bash
# Start Vite development server with Hot Module Replacement (HMR)
npm run dev

# Run fast code linting via Oxlint
npm run lint

# Build production bundle into the dist/ directory
npm run build

# Preview the production build locally
npm run preview
```

---

## 🚀 Production Build & Vercel Deployment

### Build Locally
To create a production-optimized build:
```bash
npm run build
```
This generates static HTML, CSS, and JS files in the `dist/` directory.

### Deploy to Vercel
This repository includes a `vercel.json` configuration that automatically rewrites all SPA routes to `/index.html`:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

1. Connect your GitHub repository to [Vercel](https://vercel.com/).
2. Set the **Root Directory** to `urbanthread-frontend`.
3. In the Vercel Project Settings, add the Environment Variable:
   - `VITE_API_URL`: Your deployed production backend URL (e.g. `https://urbanthread-6nok.onrender.com`).
   - `VITE_GOOGLE_CLIENT_ID`: Your Google OAuth Web Client ID.
4. Deploy!

---

## 📝 License

This project is licensed under the **MIT License**.
