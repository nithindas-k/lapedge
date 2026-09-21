# 💻 LapEdge — Premium E-Commerce Platform for Laptops & Hardware

[![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.21-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas%20%2F%20Mongoose-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![EJS](https://img.shields.io/badge/View_Engine-EJS-B4CA65?style=for-the-badge&logo=ejs&logoColor=white)](https://ejs.co/)
[![Razorpay](https://img.shields.io/badge/Payments-Razorpay-0C2340?style=for-the-badge&logo=razorpay&logoColor=white)](https://razorpay.com/)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-Media%20CDN-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)](https://cloudinary.com/)

> **LapEdge** is an enterprise-grade, full-stack e-commerce web application built using the **MVC (Model-View-Controller)** architecture on **Node.js**, **Express**, **MongoDB**, and **EJS**. Designed specifically for laptop retail, it delivers an intuitive shopping experience for customers and a data-rich administration suite for store operators.

---

## 📑 Table of Contents

- [Features Overview](#-features-overview)
  - [Customer / Storefront Features](#-customer--storefront-features)
  - [Admin Management Suite](#-admin-management-suite)
- [Tech Stack](#-tech-stack)
- [System Architecture & Folder Structure](#-system-architecture--folder-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Configuration](#environment-configuration)
  - [Running the Application](#running-the-application)
- [Payment & Order Workflows](#-payment--order-workflows)
- [Sales Reporting & Analytics](#-sales-reporting--analytics)
- [Security & Middleware](#-security--middleware)
- [License & Author](#-license--author)

---

## 🚀 Features Overview

### 🛍️ Customer / Storefront Features

- **Authentication & Security:**
  - Secure Local Authentication with salted password hashing via `bcrypt`.
  - **Google OAuth 2.0 Single Sign-On** using `passport` & `passport-google-oauth20`.
  - **OTP Verification** for registration and password resets powered by `nodemailer`.
  - Session-based authentication with `express-session` and `nocache` prevention on sensitive pages.

- **Product Discovery & Catalog:**
  - Dynamic product catalog with advanced search and real-time filtering (by Category, Price Range, Specifications).
  - Sorting options (Price: Low to High, High to Low, New Arrivals, Alphabetical).
  - Product variant selector (RAM, Storage, Colors) with instantaneous price and stock updates.
  - Interactive product detail pages featuring image zoom, variant specs, and stock indicators.

- **Wishlist & Cart:**
  - Single-click **Wishlist** toggle with seamless transfer of items directly to the shopping cart.
  - Interactive **Shopping Cart** with per-user quantity increments, decrement validations, and stock limit constraints.

- **Checkout & Flexible Payments:**
  - Multi-address management (Add, Edit, Delete, Default shipping selection).
  - **Razorpay Integration** supporting Credit/Debit cards, Net Banking, and UPI.
  - **Cash on Delivery (COD)** with threshold constraints.
  - **Integrated Digital Wallet** enabling one-click checkout using existing store balance.
  - Coupon redemption engine with instantaneous validation (min purchase, max discount, expiry).

- **Order Management & Invoicing:**
  - Complete order history tracking with detailed progress status (*Pending*, *Processing*, *Shipped*, *Delivered*, *Cancelled*, *Returned*).
  - Item-level and order-level cancellation with instant automated refunds to the user's digital wallet.
  - Return request management with custom reason submission.
  - Automated **PDF Invoice Generation** using `pdfkit` available for download post-delivery.

- **Wallet System:**
  - In-app digital wallet with real-time balance tracking and comprehensive debit/credit ledger.
  - Automated credit for cancellations, approved returns, and promotional incentives.

---

### 🛠️ Admin Management Suite

- **Executive Analytics Dashboard:**
  - Interactive sales metrics, order counts, and revenue graphs powered by `Chart.js`.
  - Filterable by timeframe: Daily, Weekly, Monthly, and Yearly.
  - Top 10 lists for Best-Selling Products, Best-Selling Categories, and Top Brands.

- **Product & Variant Management:**
  - Full CRUD operations on products and hardware variants.
  - Multiple image upload via `multer`, image cropping and optimization via `sharp`, with optional `cloudinary` storage.
  - Soft-delete (List / Unlist) toggles to safely control product visibility on the storefront.
  - Inventory management with stock-level monitoring.

- **Category & Offer Engine:**
  - Category hierarchy management with soft-delete controls.
  - Category-wide and Product-specific discount offers.
  - Automatic discount resolver calculating the optimal savings for the customer.

- **Coupon Engine:**
  - Create, update, and manage promotional coupon codes.
  - Configure discount values (Flat or Percentage), minimum order spend, maximum discount limits, and validity date ranges.

- **Order Processing & Return Approvals:**
  - Granular control over all customer orders and lifecycle states.
  - Review and approve/reject customer return requests with automated wallet refund handling.

- **Customer Oversight:**
  - View all registered users with detailed account stats.
  - Block / Unblock user accounts with immediate session invalidation.

- **Sales Reporting & Exporting:**
  - Custom date-range sales reports.
  - One-click export to **Excel (`.xlsx`)** and **PDF (`pdfkit-table`)**.

---

## 🧰 Tech Stack

| Domain | Technologies Used |
|---|---|
| **Runtime & Framework** | [Node.js](https://nodejs.org/) (v18+), [Express.js](https://expressjs.com/) (v4.21) |
| **Database & ODM** | [MongoDB](https://www.mongodb.com/), [Mongoose](https://mongoosejs.com/) (v8.8) |
| **Templating Engine** | [EJS](https://ejs.co/) (Embedded JavaScript templates) with reusable partials |
| **Authentication** | [Passport.js](http://www.passportjs.org/), Google OAuth 2.0, [Bcrypt](https://www.npmjs.com/package/bcrypt), Express-Session |
| **Payment Gateway** | [Razorpay SDK](https://razorpay.com/) |
| **File & Image Processing** | [Multer](https://github.com/expressjs/multer), [Sharp](https://sharp.pixelplumbing.com/), [Cloudinary](https://cloudinary.com/) |
| **Document Generation** | [PDFKit](https://pdfkit.org/), [PDFKit-Table](https://www.npmjs.com/package/pdfkit-table), [XLSX (SheetJS)](https://sheetjs.com/) |
| **Mailing Service** | [Nodemailer](https://nodemailer.com/) (SMTP / Gmail) |
| **Styling & UI Components** | HTML5, CSS3, [Bootstrap](https://getbootstrap.com/), [SweetAlert2](https://sweetalert2.github.io/), [Chart.js](https://www.chartjs.org/) |

---

## 📁 System Architecture & Folder Structure

```
lapedge/
├── config/                  # Database connection, Passport OAuth strategies
│   ├── db.js
│   └── passport.js
├── constants/               # Global constants
├── controllers/             # Business logic
│   ├── admin/               # Admin controllers (Products, Categories, Orders, Offers, etc.)
│   │   ├── adminController.js
│   │   ├── categoryManagement.js
│   │   ├── couponManagement.js
│   │   ├── offerManagement.js
│   │   ├── productManagement.js
│   │   ├── userManagement.js
│   │   └── variantmanagement.js
│   └── user/                # Storefront controllers (Cart, Checkout, Orders, Wallet, etc.)
│       ├── addressController.js
│       ├── cartController.js
│       ├── ckeckoutController.js
│       ├── orderController.js
│       ├── userController.js
│       ├── walletController.js
│       └── wishlistController.js
├── middleware/              # Auth guards, session validation, upload handlers
├── models/                  # Mongoose data schemas
│   ├── cartModel.js
│   ├── categoryModel.js
│   ├── couponModel.js
│   ├── offerModel.js
│   ├── orderModel.js
│   ├── productModel.js
│   ├── userSchema.js
│   ├── variantModel.js
│   ├── waletTrancations.js
│   ├── wallet.js
│   └── wishlistModel.js
├── public/                  # Static client-side assets (CSS, JS, Fonts, Images)
├── routes/                  # Express route definitions
│   ├── adminRouter.js
│   ├── categoryRoutes.js
│   ├── productRouter.js
│   ├── orderRouter.js
│   ├── checkoutRoutes.js
│   ├── cartRouter.js
│   ├── userRouter.js
│   └── ...
├── views/                   # EJS templates
│   ├── admin/               # Admin dashboard and management screens
│   ├── user/                # Customer storefront, checkout, and profile screens
│   └── partials/            # Header, footer, sidebar reusable components
├── .env.example             # Template of environment variables
├── package.json             # Project dependencies and startup scripts
└── server.js                # Main application entry point
```

---

## ⚡ Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (version 18 or higher recommended)
- [npm](https://www.npmjs.com/) (Node Package Manager)
- [MongoDB](https://www.mongodb.com/) (Local instance or MongoDB Atlas cluster connection string)
- A [Razorpay](https://razorpay.com/) test account for payment keys
- A [Google Cloud Console](https://console.cloud.google.com/) OAuth 2.0 Client ID for Google Login

---

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/nithindas-k/lapedge.git
   cd lapedge
   ```

2. **Install project dependencies:**
   ```bash
   npm install
   ```

---

### Environment Configuration

Create a `.env` file in the project root by copying the template:

```bash
cp .env.example .env
```

Fill in the necessary configuration details:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Connection
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/lapedge?retryWrites=true&w=majority

# Session Secret
SESSION_SECRET=your_super_secret_session_key

# Nodemailer / Email Credentials
NODEMAILER_EMAIL=your_email@gmail.com
NODEMAILER_PASSWORD=your_email_app_password

# Google OAuth 2.0 Credentials
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Razorpay Payment Gateway
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Cloudinary Storage
CLOUD_NAME=your_cloudinary_cloud_name
API_KEY=your_cloudinary_api_key
API_SECRET=your_cloudinary_api_secret
```

---

### Running the Application

- **Production Mode:**
  ```bash
  npm start
  ```

- **Development Mode (with live reload):**
  ```bash
  npx nodemon server.js
  ```

Open your browser and navigate to:
```
http://localhost:3000
```

---

## 💳 Payment & Order Workflows

```
[ Customer Cart ]
       │
       ▼
[ Checkout Page ] ─── (Apply Coupons / Offers)
       │
       ├─────────────────┬─────────────────┐
       ▼                 ▼                 ▼
[ Cash on Delivery ]  [ Wallet Pay ]   [ Razorpay Gateway ]
       │                 │                 │
       │                 │                 ├── Payment Success
       │                 │                 │        │
       │                 │                 │        ▼
       └─────────────────┴─────────────────┴──► [ Order Confirmed ]
                                                    │
                                                    ▼
                                           [ Order Processing ]
                                                    │
                                                    ▼
                                           [ Order Shipped ]
                                                    │
                                                    ▼
                                           [ Order Delivered ]
                                             (Download PDF Invoice)
```

- **Refund Architecture:** When an order item is cancelled or returned, the system automatically computes the refund amount and credits it into the user's in-app **Wallet**, accompanied by a recorded ledger transaction.

---

## 📊 Sales Reporting & Analytics

- **Metrics Tracked:** Total Revenue, Gross Sales, Applied Discounts, Net Revenue, and Order Volume.
- **Visual Dashboards:** Bar and line charts tracking revenue trends over customizable intervals.
- **Reporting:** Export cleanly formatted reports for internal accounting in either `.xlsx` or `.pdf` format.

---

## 🛡️ Security & Middleware

- **Password Encryption:** Sensitive credentials are encrypted with `bcrypt` (10 salt rounds).
- **Session Protection:** Configured with secure HTTP cookies and session destruction on logout.
- **Cache Invalidation:** `nocache` middleware prevents browser caching of authenticated and sensitive pages.
- **Role-Based Route Guards:** Custom authentication middleware ensures unauthorized users cannot access administrative or account routes.
- **Safe Input Sanitization:** Form input validation to protect against malformed payloads.

---

## 📄 License & Author

Developed by **[Nithin Das K](https://github.com/nithindas-k)**.  
Project released for educational and portfolio demonstration purposes.
