import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { SignJWT, jwtVerify } from "jose";

// Create a global instance of PrismaClient
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const prisma = globalForPrisma.prisma ?? new PrismaClient();
if(process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Get the JWT_SECRET
// The JWT is an encrypted string that contains JSON information that needs to be passed from the client to the server
const JWT_SECRET = process.env.JWT_SECRET;
if(!JWT_SECRET) throw new Error("Missing JWT_SECRET environment variable");

// Cookies are used for storing session information on the client side
const SESSION_COOKIE = 'rms_session';

// This helps us turn the JWT into a readable format
const secretKey = new TextEncoder().encode(JWT_SECRET);

// Zod is a schema validator that helps us validate the data we receive from the client
// Zod stands in front of your server and checks if the data is valid before it reaches your server
// No data is allowed to reach your server, if it doesn't pass the Zod schema validation
// This helps us to prevent malicious attackers from sending invalid data to our server
const RegisterSchema = z.object({
  action: z.literal('register'),
  email: z.email(),
  password: z.string().min(8),
  role: z.enum(["STUDENT", "FACULTY"]),
  fullName: z.string().min(2),

  // student fields
  university: z.string().optional(),
  program: z.string().optional(),
  graduationDate: z.string().optional(),

  // faculty fields
  institution: z.string().optional(),
  title: z.string().optional(),
  department: z.string().optional(),
}); 

const LoginSchema = z.object({
  action: z.literal('login'),
  email: z.email(),
  password: z.string().min(1),
});

const LogoutSchema = z.object({
  action: z.literal('logout'),
});

// Let's make sure that the email is an academic email
// This is a very simple version, we will need to improve this in the future (perhaps with an external API call that checks if the email is an academic email)
function isAcademicEmail(email: string) {
  const lowerCaseEmail = email.toLowerCase();
  return lowerCaseEmail.endsWith(".edu");
}

// This function creates a signed JWT token
// It is signed with the JWT_SECRET, and it contains the user's ID and role
// It uses the HS256 algorithm to sign the token from the server
// It then issues a date at which it was signed, and a date at which it will expire
// The token is then signed with the JWT_SECRET, and it is returned as a string
async function createSessionToken(payload: { userId: string, role: string }) {
  return await new SignJWT({ role: payload.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime('6h')
    .sign(secretKey);
}

// Let's read the session token we just made above, and verify it's valid
// If the token is valid, it will return the user's ID and role
// If the token is not valid, it will return null
async function readSessionToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    const userId = payload.sub;
    const role = payload.role;
    if(!userId || typeof role !== 'string') return null;
    return { userId, role };

  } catch {
    return null;
  }
}

// This function sets the token we created above as a session cookie(text file) on the client side
async function setSessionCookie(token: string) {
  const jar = await cookies();

  jar.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 6, // 6 hours
  });
}

// This function clears the session cookie on the client side
async function clearSessionCookie() {
  const jar = await cookies();
  jar.set({
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}

// This is the function to make sure the frontend knows if the user is logged in or not
export async function GET() {
  // Get the cookie jar (the container of all cookies)
  const jar = await cookies();

  // Read the session token from the cookie jar to make sure it exists
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ user: null }, { status: 200 });

  // Read the session token and verify it's valid
  const session = await readSessionToken(token);
  if(!session) return NextResponse.json({ user: null}, { status: 200 });

  // Once we know it exists and it's valid, we can read the user from the database
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, role: true, emailVerified: true },
  });

  // If the user doesn't exist, we return a null user
  if(!user) return NextResponse.json({ user: null }, { status: 200 });

  // We can finally return the user once we know it exists and it's valid
  return NextResponse.json({ user }, { status: 200 });
}

// Register, Login, and Logout in one endpoint
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if(!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const action = body?.action;

  // Register
  if(action === 'register') {
    const data = RegisterSchema.parse(body);

    // Make sure the email is an academic email
    if(data.role === 'STUDENT' && !isAcademicEmail(data.email)) {
      return NextResponse.json(
        { error: "Students must use an academic email (.edu is the only email type for now)" }, { status: 400 });
    }

    // Prevent duplicate emails
    const existingUser = await prisma.user.findUnique({ where: { email: data.email} });
    if (existingUser) return NextResponse.json({ error: "Email already in use"}, { status: 409 });

    // Hash the password, never store the raw password
    const passwordHash = await bcrypt.hash(data.password, 12);

    // Create the user in the database
    const user = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          role: data.role,
          emailVerified: false,
        },
      });

      if(data.role === 'STUDENT') {
        if(!data.university || !data.program) {
          throw new Error("Missing student fields: university or program");
        }

        await tx.student.create({
          data: {
            userId: user.id,
            fullName: data.fullName,
            university: data.university,
            program: data.program,
            graduationDate: data.graduationDate ? new Date(data.graduationDate) : null,
          },
        });
      } else {
        if(!data.institution) {
          throw new Error("Missing faculty field: institution");
        }

        await tx.faculty.create({
          data: {
            userId: user.id,
            fullName: data.fullName,
            institution: data.institution,
            title: data.title ?? null,
            department: data.department ?? null,
          },
        });
      }
      return user;
    });

    // Auto-login after registration
    const token = await createSessionToken({ userId: user.id, role: user.role });
    setSessionCookie(token);

    return NextResponse.json(
      { user: { id: user.id, email: user.email, role: user.role } }, { status: 201 });
  }

  // Login
  if(action === 'login') {
    const data = LoginSchema.parse(body);

    const user = await prisma.user.findUnique({ where: { email: data.email } });

    const invalid = NextResponse.json({ error: "Invalid email or password" }, { status: 401 });

    if(!user) return invalid;

    const ok = await bcrypt.compare(data.password, user.passwordHash);
    if(!ok) return invalid;

    const token = await createSessionToken({ userId: user.id, role: user.role });
    setSessionCookie(token);

    return NextResponse.json(
      { user: { id: user.id, email: user.email, role: user.role } }, { status: 200 });
  }

  // Logout
  if(action === 'logout') {
    LogoutSchema.parse(body);
    clearSessionCookie();
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}