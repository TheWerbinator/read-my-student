import { NextRequest, NextResponse } from 'next/server';
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSessionToken, setSessionCookie } from '@/lib/auth';

const LoginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = LoginSchema.parse(body);

    const invalid = NextResponse.json({ error: "Invalid email or password"}, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if(!user) return invalid;

    const ok = await bcrypt.compare(data.password, user.passwordHash);
    if(!ok) return invalid;

    const token = await createSessionToken({ userId: user.id, role: user.role });
    await setSessionCookie(token);

    return NextResponse.json({ user: { id: user.id, email: user.email, role: user.role }}, { status: 200 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch(err: any) {
    if(err?.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input", details: err.errors}, { status: 400 });
    }
    return NextResponse.json({ error: err?.message ?? "Server error" }, {status: 500 });
  }
}