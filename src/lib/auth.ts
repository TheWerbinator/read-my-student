import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

const SESSION_COOKIE = 'rms_session';

const JWT_SECRET = process.env.JWT_SECRET;
if(!JWT_SECRET) throw new Error("Missing JWT_SECRET in env");

const secretKey = new TextEncoder().encode(JWT_SECRET);

export type Session = { userId: string; role: "STUDENT" | "FACULTY" | "ADMIN" };

export async function createSessionToken(session: Session) {
  return await new SignJWT({ role: session.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(session.userId)
    .setIssuedAt()
    .setExpirationTime('6h')
    .sign(secretKey);
}

export async function readSessionToken(token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    const userId = payload.sub;
    const role = payload.role;

    if(!userId) return null;
    if(role !== "STUDENT" && role !== "FACULTY" && role !== "ADMIN") return null;

    return { userId, role };
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string) {
  const jar = await cookies();

  jar.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === "production",
    path: '/',
    maxAge: 1000 * 60 * 60 * 6, // 6 hours
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();

  jar.set({
    name: SESSION_COOKIE,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === "production",
    path: '/',
    maxAge: 0,
  });
}

export async function getSession(): Promise<Session | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if(!token) return null;
  return await readSessionToken(token);
}