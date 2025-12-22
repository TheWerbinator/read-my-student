This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

Secure recommendation letter platform (early dev).  
This repo currently includes:
- Working Auth API (register / login / logout / me)
- Minimal Auth UI for testing
- Prisma + Supabase configured for team development

## Getting Started

## Requirements:
- Node.js (v24+ recommended)
- npm

## Setup
1) Clone repo
2) Install dependencies
3) Copy the example env file into a local .env
4) Run database migrations

# This will create all required tables in the shared Supabase dev databse
- npm run db:migrate 

5) Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Tech Stack

Frontend: React, TailwindCSS, TypeScript, Next.js
Backend: Node.js, postgreSQL, Prisma, Supabase
Hosting: Vercel (Website), Supabase (Backend)

# Useful Scripts:
npm run dev         # start dev server
npm run db:migrate  # apply migrations (dev)
npm run db:deploy   # apply migrations (production-style)
npm run db:studio   # open Prisma Studio

## Common Errors:
### TLS error: `self-signed certificate in certificate chain`
If Prisma fails to connect with a TLS error, your network/antivirus/VPN may be intercepting TLS.
For local development only, you can change in `.env.local`:

- `sslmode=require` → `sslmode=no-verify`

# !!IMPORTANT!! #
Do **not** use `sslmode=no-verify` in production.