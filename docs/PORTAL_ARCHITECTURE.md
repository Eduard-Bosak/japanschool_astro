# 🏗️ Portal Architecture (Admin & User Cabinet)

**Created:** November 30, 2025 **Status:** Initialization **Tech Stack:**
Next.js 15 (App Router), TypeScript, Tailwind CSS

---

## 🎯 Purpose

This application serves as the **Admin Dashboard** and **User Cabinet** for the
Japan School. It is completely isolated from the main landing page (Astro) to
ensure stability and safety.

## 🛠️ Technology Choices

### 1. Framework: Next.js (App Router)

- **Why:** Best-in-class React framework, built-in routing, API routes, and
  excellent AI code generation support.
- **Type Safety:** TypeScript is enforced to prevent runtime errors.

### 2. Styling: Tailwind CSS

- **Why:** Utility-first CSS, matches the main site's flexibility, required for
  Shadcn/UI.

### 3. Isolation Strategy ("Satellite Approach")

- **Location:** `/portal` directory in the root.
- **Port:** Runs on `http://localhost:3000` (default) or `5173` (if configured),
  separate from Astro (`4321`).
- **Safety:** Deleting the `/portal` folder completely removes this app without
  breaking the main site.

## 📂 Directory Structure

```text
/portal
├── src/
│   ├── app/              # App Router pages
│   │   ├── admin/        # Admin specific pages
│   │   ├── dashboard/    # User dashboard
│   │   └── login/        # Auth pages
│   ├── components/       # Reusable UI components (Shadcn)
│   ├── lib/              # Utilities & Helpers
│   └── types/            # TypeScript definitions
├── public/               # Static assets for portal
└── package.json          # Separate dependencies
```

## 🚀 Getting Started

1. **Navigate to portal:**

   ```bash
   cd portal
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```

## 📝 Maintenance Guide

- **Adding Components:** We will use Shadcn/UI.
  `npx shadcn@latest add [component-name]`
- **Database:** (Planned) Supabase integration for user management and slots.
- **Deployment:** Can be deployed as a separate Vercel project or essentially
  any Node.js host.

---

**Note:** This document should be updated whenever major architectural decisions
are made.
