import { ContactFormValues } from "@/lib/schemas";

export function EmailTemplate({
  email,
  subject,
  message,
}: ContactFormValues): string {
  return `
    <div style="font-family:sans-serif;color:#333;">
      <h1 style="color:#103f30;">New Inquiry Received</h1>
      <p><strong>From:</strong> ${email}</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <hr style="border-color:#eebd32;margin:20px 0;">
      <p style="white-space:pre-wrap;">${message}</p>
    </div>
  `;
}
