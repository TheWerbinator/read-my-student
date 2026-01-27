import { ContactFormValues } from "@/lib/schemas";

export function EmailTemplate({ email, subject, message }: ContactFormValues) {
  return (
    <div style={{ fontFamily: "sans-serif", color: "#333" }}>
      <h1 style={{ color: "#103f30" }}>New Inquiry Received</h1>
      <p>
        <strong>From:</strong> {email}
      </p>
      <p>
        <strong>Subject:</strong> {subject}
      </p>
      <hr style={{ borderColor: "#eebd32", margin: "20px 0" }} />
      <p style={{ whiteSpace: "pre-wrap" }}>{message}</p>
    </div>
  );
}
