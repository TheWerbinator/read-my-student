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
      SendApprovalEmail({ facultyFirstName: evil, studentFullName: evil, schoolName: evil, schoolEmail: evil, reviewUrl: "https://x.test" }),
    ];
    for (const html of outputs) {
      expect(html).not.toContain(evil);
      expect(html).toContain("&lt;a href=&quot;https://evil.test&quot;&gt;");
    }
  });

  it("keeps the delivery emails free of payment and refund wording", () => {
    const approval = SendApprovalEmail({ facultyFirstName: "A", studentFullName: "B", schoolName: "C", schoolEmail: "c@c.test", reviewUrl: "https://x.test/r/t" });
    expect(approval).not.toMatch(/paid|\$5/);
    expect(approval).toContain("https://x.test/r/t");
    expect(approval).toContain("c@c.test");
    const declined = StudentRejectionEmail({ studentFirstName: "A", facultyName: "B", schoolName: "C", supportUrl: "https://x.test" });
    expect(declined).not.toMatch(/refund|\$5/i);
    const school = InstitutionDeliveryEmail({ schoolName: "Test U", studentFullName: "B", viewUrl: "https://x.test", expiresAt: "2026-12-01T00:00:00Z" });
    expect(school).toContain("not affiliated with or endorsed by Test U");
  });

  it("escapes the contact form fields", () => {
    const html = EmailTemplate({ email: "a@b.test", subject: evil, message: evil } as never);
    expect(html).not.toContain(evil);
  });
});
