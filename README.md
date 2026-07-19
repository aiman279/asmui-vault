# Asmu'i Vault

A minimalist personal money management app for daily use. Track income and expenses quickly, see monthly summaries, manage fixed commitments, and stay on track with savings goals — plus a dedicated Grab tracker.

## Features

- **Dashboard** — balance, monthly income/expenses/savings, Grab performance card, goals, spending snapshot, smart insights
- **Grab tracker** — daily earn / petrol / other / credit, net profit, weekly & monthly tracking (kept separate from regular expenses)
- **Income tracker** — salary and other non-Grab income
- **Expense tracker** — housing, car, family, food, utilities, entertainment, shopping, transport, others
- **Monthly summary** — totals, saving rate, biggest category, this month vs last month
- **Financial goals** — target, current amount, progress, target date
- **Fixed commitments** — editable recurring monthly amounts
- **Smart insights** — short, plain-language tips (no complex analysis)
- **Light / dark mode** — toggle in the top bar

Data is stored in your browser (`localStorage`). No account required.

## Run locally

```bash
npm install
npm run dev
```

Then open the URL shown in the terminal (usually `http://localhost:5173`).

## Build

```bash
npm run build
npm run preview
```

## Install as an app (no website tab)

This project is a **PWA**. After you open it once, you can install it like an app:

### iPhone
1. Open the site in **Safari**
2. Tap **Share** → **Add to Home Screen**
3. Open **Asmu'i Vault** from your home screen (full-screen, no browser bar)

### Android
1. Open the site in **Chrome**
2. Tap menu **⋮** → **Install app** / **Add to Home screen**
3. Open from the app drawer like a normal app

### Live app

Production: https://asmui-vault.vercel.app

```bash
npm run deploy
```

Open the HTTPS link on your phone, then **Add to Home Screen** (iPhone) or **Install app** (Android).

### Real APK (optional, advanced)
For a true `.apk` file you need **Capacitor + Android Studio**. PWA is usually enough for personal use.

## Stack

- React + TypeScript
- Vite
- React Router
- PWA (installable)
- Local storage persistence
