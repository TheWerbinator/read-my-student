# Supabase Auth Migration Guide

## Overview
Your authentication system has been migrated from custom JWT-based auth to Supabase Auth. This improves security, reduces maintenance burden, and enables easier future scaling with features like OAuth and MFA.

## Changes Made

### 1. **Dependencies Updated**
- **Removed**: `bcryptjs`, `jose` (custom password hashing and JWT)
- **Added**: `@supabase/supabase-js`, `@supabase/ssr` (Supabase client libraries)

### 2. **Database Schema**
- **Added**: `supabaseId` field to `User` model (unique reference to `auth.users` table)
- **Removed**: `passwordHash` field (passwords now managed by Supabase)

### 3. **New Files Created**
- `src/lib/supabase.ts` - Supabase client initialization for both browser and server contexts

### 4. **Updated Auth Files**
- `src/lib/auth.ts` - Now uses Supabase sessions instead of custom JWT
- `src/app/api/auth/register/route.ts` - Uses `supabase.auth.admin.createUser()`
- `src/app/api/auth/login/route.ts` - Uses `supabase.auth.signInWithPassword()`
- `src/app/api/auth/logout/route.ts` - Uses `supabase.auth.signOut()`
- `src/app/api/auth/me/route.ts` - Simplified to work with Supabase sessions

### 5. **Environment Variables**
New variables needed (in `.env.local`):
```
NEXT_PUBLIC_SUPABASE_URL="https://YOUR_PROJECT_ID.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_ANON_KEY"
```

## Setup Instructions

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Get Supabase Credentials
1. Go to [Supabase Console](https://app.supabase.com)
2. Select your project
3. Go to **Settings > API**
4. Copy the `Project URL` and `anon public` key
5. Add these to your `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL="your_project_url"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your_anon_key"
   ```

### Step 3: Enable Admin API for register endpoint
In Supabase Dashboard:
1. Go to **Settings > API**
2. Verify you have your service role key (used server-side for creating users)
3. The register endpoint uses `supabase.auth.admin.createUser()` which requires server-side auth
   - For production, ensure environment is secure and this key is never exposed to client

### Step 4: Run Database Migration
```bash
npm run db:migrate
```

This will:
1. Create the `supabaseId` column in your `User` table
2. Remove the `passwordHash` column
3. Update Prisma client

### Step 5: Migrate Existing Users (if applicable)
If you have existing users in your database, you need to link them with Supabase:

**Option A: Bulk import users to Supabase** (Recommended)
1. Export existing users from your database
2. Use Supabase's admin API to batch create these users
3. Update their `supabaseId` in your database

**Option B: Manual migration** (For small user counts)
1. Create users in Supabase manually
2. Update database records with their Supabase IDs

**Option C: Fresh start**
- Start with an empty user table if this is a development project

### Step 6: Test the Flow
```bash
npm run dev
```

Then test the complete auth flow:
1. Sign up: `POST /api/auth/register`
2. Login: `POST /api/auth/login`
3. Check session: `GET /api/auth/me`
4. Logout: `POST /api/auth/logout`

## Key Differences from Previous Implementation

### Registration Flow
**Before:**
```
POST /register 
→ Hash password with bcrypt
→ Store passwordHash in database
→ Create JWT token
→ Set session cookie
```

**After:**
```
POST /register
→ Create user in Supabase Auth
→ Create linked user record in database with supabaseId
→ Supabase handles session automatically
```

### Session Management
**Before:** Manual JWT tokens validated with custom `readSessionToken()`

**After:** Supabase's `auth.getSession()` handles everything

### Password Security
**Before:** Your responsibility to hash correctly

**After:** Supabase uses industry-standard Argon2 hashing

## Future Enhancements

With Supabase Auth, you can now easily add:
- **Email verification** - Built-in templates
- **Password reset** - Automatic email links
- **OAuth** - Google, GitHub, etc. (one function call)
- **MFA** - Time-based or SMS codes
- **Admin Dashboard** - Manage users in Supabase console
- **Audit Logs** - Track auth events

## Troubleshooting

### "Missing NEXT_PUBLIC_SUPABASE_URL"
- Ensure `.env.local` has `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Restart dev server: `npm run dev`

### Register returns "supabaseId" error
- The Prisma migration hasn't been applied yet
- Run: `npm run db:migrate`

### Login doesn't return user
- Check database has the user with correct `supabaseId`
- Verify in Supabase Dashboard that the auth user exists

### Session not persisting
- Supabase uses cookies automatically, but check:
  - Browser DevTools > Cookies > look for `sb-*` cookies
  - Environment is HTTPS in production

## Need Help?

- [Supabase Docs](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Next.js with Supabase](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
