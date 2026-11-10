# Customer Loyalty and Reward Management System (MERN)

A submission-ready starter project built with React (Vite), Express, MongoDB, and JWT authentication.

## Features
- Customer registration and login
- Admin login and protected admin dashboard
- Admin-managed reward earning rule (points per currency amount)
- Admin creates, edits, activates/deactivates, and deletes rewards
- Customers can record demo purchases and earn points
- Customers can redeem rewards if they have enough points
- Transaction history and basic analytics
- Responsive UI

## Requirements
- Node.js 20+ and npm
- MongoDB running locally OR a MongoDB Atlas connection string

## 1. Configure backend
Open a terminal in `server`:
```bash
npm install
```
Copy `.env.example` to `.env` and set `MONGODB_URI` and `JWT_SECRET`.

For a local MongoDB installation, the default URI is:
`mongodb://127.0.0.1:27017/customer_loyalty`

## 2. Create the demo admin
In the `server` folder:
```bash
npm run seed:admin
```
Default demo admin:
- Email: `admin@example.com`
- Password: `Admin@12345`

Change these credentials before any public deployment. The seed script will not overwrite an existing admin.

## 3. Start backend
In `server`:
```bash
npm run dev
```
API runs on `http://localhost:5000`.

## 4. Start frontend
Open a second terminal in `client`:
```bash
npm install
npm run dev
```
Open the URL printed by Vite (usually `http://localhost:5173`).

## Demo workflow
1. Log in as admin and create/activate rewards or change the earning rule.
2. Register a customer from the Register page.
3. Log in as that customer.
4. Record a demo purchase to earn points.
5. Redeem a reward when the balance is sufficient.
6. Return to the admin dashboard to view the system overview.

## Important notes
- The purchase form is a demo/manual purchase-entry feature, not a real payment gateway.
- The app stores point changes as transactions. For production, use database transactions, idempotency keys, audit logging, rate limiting, email verification, password reset, and stronger operational security.
- Do not expose `.env` or commit secrets to GitHub.
