import { ContactFormValues } from "@/lib/schemas";
import { esc } from "./letter-request-email-templates";

export function EmailTemplate({
  email,
  subject,
  message,
}: ContactFormValues): string {
  // Visitor input: escape so it cannot inject HTML into the owner's inbox.
  return `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#14211a;background-color:#ffffff;">
      <h1 style="font-family:'Big Shoulders Display','Big Shoulders','Arial Narrow',Arial,sans-serif;text-transform:uppercase;color:#0c2016;">New Inquiry Received</h1>
      <p><strong>From:</strong> ${esc(email)}</p>
      <p><strong>Subject:</strong> ${esc(subject)}</p>
      <hr style="border:0;border-top:1px solid #d6d9d3;margin:20px 0;">
      <p style="white-space:pre-wrap;">${esc(message)}</p>
    </div>
  `;
}
