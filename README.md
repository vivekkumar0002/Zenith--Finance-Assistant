# Zenith Finance

Zenith Finance is a Next.js personal finance assistant with a public landing experience, MongoDB-backed authentication, and an authenticated dashboard for accounts, investments, loans, profile data, stocks, and wallet views.

## Features

- Landing page with a guided product narrative, blueprint section, and registration form
- Email/password authentication with sessions backed by MongoDB
- Protected dashboard with account summary, metrics, stock ticker, and news feed
- Dedicated pages for login, signup, profile, stocks, and wallet
- Google Sheets form submission for incoming leads and registrations
- Python ML service for transaction categorization and anomaly detection
- Sample data seeding for local dashboard development

## Tech Stack

- Next.js 14.2.x with React 18
- Tailwind CSS 3
- MongoDB for users and dashboard data
- bcryptjs and jsonwebtoken for auth flows
- Google Sheets API for form submissions
- Flask, pandas, joblib, and pickle for the ML service

## Project Structure

```text
app/
  page.js                 # Landing page
  login/page.js           # Login screen
  signup/page.js          # Signup screen
  dashboard/page.js       # Protected dashboard shell
  profile/page.js         # Profile page
  stocks/page.js          # Stocks page
  wallet/page.js          # Wallet page
  api/
    auth/
      login/route.js
      logout/route.js
      me/route.js
      register/route.js
    submit-form/route.js
    dashboard/account/route.js
modules/
  auth/                   # Session hook and protected route wrapper
  dashboard/              # Dashboard UI, charts, and data hooks
  landing/                # Hero, demo, CTA, form, and related sections
scripts/seed-dashboard-data.js
ml_service/server.py
datasets/
```

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm
- MongoDB connection string for auth and dashboard data

### Install

```bash
npm install
```

### Configure Environment

Create a local environment file and add the values used by the app:

```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash-preview-05-20

GOOGLE_SHEETS_ID=your_google_sheets_id_here
GOOGLE_SERVICE_ACCOUNT_TYPE=service_account
GOOGLE_SERVICE_ACCOUNT_PROJECT_ID=your_project_id
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_ID=your_private_key_id
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_CLIENT_ID=your_client_id
GOOGLE_SERVICE_ACCOUNT_AUTH_URI=https://accounts.google.com/o/oauth2/auth
GOOGLE_SERVICE_ACCOUNT_TOKEN_URI=https://oauth2.googleapis.com/token

MONGODB_URI=your_mongodb_connection_string_here
JWT_SECRET=replace_with_a_long_random_secret
```

The AI demo now calls the internal `/api/ai-demo` route, which keeps the Gemini key on the server and avoids browser CORS issues.

### Run the App

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## Local Data Setup

Seed sample dashboard users and account data with:

```bash
node scripts/seed-dashboard-data.js
```

That script clears and repopulates the `users` and `accountsData` collections, so only use it when you want a fresh local dataset.

## ML Service

The Flask service in `ml_service/server.py` exposes:

- `POST /categorize`
- `POST /detect-anomalies`
- `GET /health`

It listens on port `5001` by default.

## Available Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Notes

- The login page routes authenticated users to `/dashboard`.
- The landing form posts to the Google Sheets submit route.
- Auth endpoints live in `app/api/auth/login/route.js`, `app/api/auth/logout/route.js`, `app/api/auth/me/route.js`, and `app/api/auth/register/route.js`.
- Dashboard data is served through `app/api/dashboard/account/route.js` and the other routes under `app/api/dashboard/`.
- The current codebase uses modular feature folders under `app/modules/` instead of a flat components directory.

## Support

For setup and troubleshooting, check the code under `app/api/auth/_lib/`, `scripts/seed-dashboard-data.js`, and `ml_service/server.py`.
