import { z } from "zod";

export const contactFormSchema = z.object({
  email: z.email({ message: "Please enter a valid email." }),
  subject: z
    .string()
    .min(5, { message: "Subject must be at least 5 characters." }),
  message: z
    .string()
    .min(10, { message: "Message must be at least 10 characters." }),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["STUDENT", "FACULTY"]),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  countryCode: z.string().min(2),

  // Student Fields
  university: z.string().optional(),
  universityOpeId: z.string().optional(),
  program: z.string().optional(),
  graduationDate: z.string().optional(),

  // Faculty Fields
  institution: z.string().optional(),
  institutionOpeId: z.string().optional(),
  title: z.string().optional(),
  department: z.string().optional(),
});

export type RegisterFormValues = z.infer<typeof registerSchema>;
