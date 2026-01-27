# Supabase Auth Migration Guide

## Overview
Your authentication system has been migrated from custom JWT-based auth to Supabase Auth. This improves security, reduces maintenance burden, and enables easier future scaling with features like OAuth and MFA.

## Changes Made

### 1. **Dependencies Updated**
- **Removed**: `bcryptjs`, `jose` (custom password hashing and JWT)
- **Added**: `@supabase/supabase-js`, `@supabase/ssr` (Supabase client libraries)

### 2. **New Files Created**
- `src/lib/supabase.ts` - Supabase client initialization for both browser and server contexts

### 3. **Remove Auth Files**
- `src/lib/auth.ts` - Now uses Supabase sessions instead of custom JWT
- `src/app/api/auth/register/route.ts` - Uses `supabase.auth.admin.createUser()` in `actions/register.ts`
- `src/app/api/auth/login/route.ts` - Uses `supabase.auth.signInWithPassword()` in `components/auth/login-form.tsx`
- `src/app/api/auth/logout/route.ts` - Uses `supabase.auth.signOut()` in `components/auth/logout-button.tsx`
- `src/app/api/auth/me/route.ts` - replaced with server actions

### 4. **Environment Variables**
New variables needed (in `.env.local`):
```
NEXT_PUBLIC_SUPABASE_URL="https://YOUR_PROJECT_ID.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_ANON_KEY"
```

## Setup Instructions

### Step 1: Install Dependencies
```bash
npm i
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

### Step 4: Test the Flow
```bash
npm run dev
```

Then test the complete auth flow:
1. Sign up
2. Login
3. Check session
4. Logout

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
actions/register.ts signUpAction
→ Create user in Supabase Auth
→ Create linked user record in database with supabaseId
→ Supabase handles session automatically
```

### Session Management
**Before:** Manual JWT tokens validated with custom `readSessionToken()`

**After:** Supabase's `auth.getSession()` handles everything

### Password Security
**Before:** Our responsibility to hash correctly

**After:** Supabase uses industry-standard Argon2 hashing

## Future Enhancements

With Supabase Auth, we can now easily add:
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
