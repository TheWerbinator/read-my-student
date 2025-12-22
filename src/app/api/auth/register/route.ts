import { NextRequest, NextResponse } from 'next/server';
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSessionToken, setSessionCookie } from '@/lib/auth';

const RegisterSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  role: z.enum(["STUDENT", "FACULTY"]),
  fullName: z.string().min(2),

  // student
  university: z.string().optional(),
  program: z.string().optional(),
  graduationDate: z.string().optional(),

  // faculty
  institution: z.string().optional(),
  title: z.string().optional(),
  department: z.string().optional(),
});

function isAcademicEmail(email: string) {
  const lowerCaseEmail = email.toLowerCase();
  return lowerCaseEmail.endsWith(".edu"); // Simple .edu check, will need to be more robust in production (like an external API)
}

export async function POST(req: NextRequest) {
  console.log("REGISTER ROUTE HIT ✅");
  try {
    const body = await req.json();
    const data = RegisterSchema.parse(body);

    if(data.role === "STUDENT" && !isAcademicEmail(data.email)) {
      return NextResponse.json(
        { error: "Students must use an academic email (.edu for now)" }, { status: 400 }
      );
    }

  const existingUser = await prisma.user.findUnique({ where:  { email: data.email } });
  if(existingUser) {
    return NextResponse.json({ error: "Email already in use. "}, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(data.password, 8); // Minimum of 8 characters

  const user = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: data.email,
        passwordHash,
        role: data.role,
        emailVerified: false,
      },
    });

    if(data.role === "STUDENT") {
      if(!data.university || !data.program) throw new Error("Missing student fields: university and program required.");

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
      if(!data.institution) throw new Error("Missing faculty field: institution required.");

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
  await setSessionCookie(token);

  return NextResponse.json({ user: { id: user.id, email: user.email, role: user.role } }, { status: 201 });

  } catch(err: unknown)  {
    if(err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: err.issues }, { status: 400 });
    }

    const message = err instanceof Error ? err.message : `Unknown error: ${String(err)}`;

    return NextResponse.json({ error: message, type: typeof err }, { status: 500 });
  }
}