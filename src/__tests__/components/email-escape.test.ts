/**
 * @jest-environment node
 *
 * User-typed names, school names, and contact messages must not inject HTML
 * into outgoing emails.
 */

import {
  InstitutionDeliveryEmail,
  SendApprovalEmail,
  StudentRejectionEmail,
} from "@/components/letter-request-email-templates";
import { EmailTemplate } from "@/components/contact-email-templates";

const evil = '<a href="https://evil.test">click</a>';

describe("email templates escape user input", () => {
  it("escapes names and school names", () => {
    const outputs = [
      InstitutionDeliveryEmail({ schoolName: evil, studentFullName: evil, viewUrl: "https://x.test", expiresAt: "2026-12-01T00:00:00Z" }),
      StudentRejectionEmail({ studentFirstName: evil, facultyName: evil, schoolName: evil, supportUrl: "https://x.test" }),
      SendApprovalEmail({ facultyFirstName: evil, studentFullName: evil, schoolName: evil, dashboardUrl: "https://x.test" }),
    ];
    for (const html of outputs) {
      expect(html).not.toContain(evil);
      expect(html).toContain("&lt;a href=&quot;https://evil.test&quot;&gt;");
    }
  });

  it("escapes the contact form fields", () => {
    const html = EmailTemplate({ email: "a@b.test", subject: evil, message: evil } as never);
    expect(html).not.toContain(evil);
  });
});
