import nodemailer from "nodemailer";
import { Resend } from "resend";

type EmailMessage = {
  from: string;
  to: string | string[];
  subject: string;
  html: string;
};

export async function sendEmail(message: EmailMessage) {
  try {
    if (process.env.EMAIL_TRANSPORT === "local") {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

      if (!/^http:\/\/(127\.0\.0\.1|localhost):54321\/?$/.test(url)) {
        throw new Error("Local email requires local Supabase.");
      }

      const transport = nodemailer.createTransport({
        host: "127.0.0.1",
        port: 54325,
        secure: false,
        ignoreTLS: true,
        connectionTimeout: 5000,
        socketTimeout: 10000,
      });

      const result = await transport.sendMail(message);

      return {
        data: { id: result.messageId },
        error: null,
      };
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    return await resend.emails.send(message);
  } catch (error) {
    return {
      data: null,
      error: {
        message:
          error instanceof Error ? error.message : "Email delivery failed.",
      },
    };
  }
}
