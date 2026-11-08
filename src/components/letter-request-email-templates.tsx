// Plain HTML string email templates - no React/JSX, safe in Next.js server actions.

const HEADER = `
  <div style="background-color:#103f30;padding:15px;text-align:center;">
    <img src="https://readmystudent.com/Logo_Official_White.png" alt="ReadMyStudent" style="height:100px;width:auto;">
  </div>`;

const FOOTER = `
  <div style="background-color:#f9f9f9;padding:20px;text-align:center;border-top:1px solid #eeeeee;">
    <p style="font-size:12px;color:#999999;margin:0;">&copy; ReadMyStudent. Secure, Respectful Recommendation Letters.</p>
  </div>`;

function wrap(body: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#333333;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td align="center" style="padding:40px 0;">
        <table border="0" cellpadding="0" cellspacing="0" width="600"
          style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 4px 10px rgba(0,0,0,0.05);">
          <tr><td>${HEADER}</td></tr>
          <tr><td style="padding:40px;">${body}</td></tr>
          <tr><td>${FOOTER}</td></tr>
        </table>
      </td>
    </tr>
  </table>
</body></html>`;
}

/** Escape user-supplied text so it cannot inject HTML or links into an email. */
function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function contextBlock(courseContext: string): string {
  return `<div style="background-color:#f9f9f0;border-left:4px solid #eebd32;padding:12px 16px;border-radius:4px;margin:20px 0;">
    <p style="margin:0;font-size:14px;color:#555;"><strong>Course / Context:</strong> ${esc(courseContext)}</p>
  </div>`;
}

function noteBlock(label: string, note: string): string {
  return `<div style="background-color:#f5f5f5;padding:16px;border-radius:6px;margin:20px 0;">
    <p style="margin:0 0 6px 0;font-size:13px;font-weight:bold;color:#103f30;">${label}</p>
    <p style="margin:0;font-size:14px;line-height:1.6;color:#444;font-style:italic;">&ldquo;${esc(note)}&rdquo;</p>
  </div>`;
}

function ctaButton(href: string, label: string): string {
  return `<table border="0" cellpadding="0" cellspacing="0" style="margin-top:24px;margin-bottom:32px;">
    <tr>
      <td>
        <a href="${href}" style="background-color:#eebd32;color:#103f30;display:inline-block;font-weight:bold;padding:14px 30px;text-decoration:none;border-radius:4px;font-size:16px;box-shadow:0 2px 4px rgba(0,0,0,0.1);">${label}</a>
      </td>
    </tr>
  </table>`;
}

// New request (faculty already has an account). The link works without logging in.

interface RequestNotificationProps {
  facultyFirstName: string;
  studentFullName: string;
  studentUniversity: string;
  courseContext?: string;
  studentNote?: string;
  requestUrl: string;
}

export function RequestNotificationEmail(p: RequestNotificationProps): string {
  const student = esc(p.studentFullName);
  const body = `
    <h1 style="font-family:'Georgia',serif;font-size:28px;color:#103f30;margin-top:0;">You have a new recommendation request</h1>
    <p style="font-size:16px;line-height:1.6;">Hi ${esc(p.facultyFirstName)},</p>
    <p style="font-size:16px;line-height:1.6;">
      <strong>${student}</strong> from <strong>${esc(p.studentUniversity)}</strong>
      asked you for a letter of recommendation through ReadMyStudent.
    </p>
    ${p.courseContext ? contextBlock(p.courseContext) : ""}
    ${p.studentNote ? noteBlock(`Personal note from ${student}:`, p.studentNote) : ""}
    <p style="font-size:16px;line-height:1.6;">Open the request to accept it and write the letter, or to decline it. You do not need to log in. The request also appears in your dashboard.</p>
    ${ctaButton(p.requestUrl, "Open the request")}
    <p style="font-size:13px;color:#999999;">If you do not answer within 7 days, the request closes.</p>`;

  return wrap(body);
}

// Request to a professor with no account

interface FacultyInvitationProps {
  studentFullName: string;
  studentUniversity: string;
  courseContext?: string;
  studentNote?: string;
  requestUrl: string;
}

export function FacultyInvitationEmail(p: FacultyInvitationProps): string {
  const student = esc(p.studentFullName);
  const studentFirst = esc(p.studentFullName.split(" ")[0]);

  const body = `
    <h1 style="font-family:'Georgia',serif;font-size:28px;color:#103f30;margin-top:0;">
      ${studentFirst} asked you for a letter of recommendation
    </h1>
    <p style="font-size:16px;line-height:1.6;">
      <strong>${student}</strong> from <strong>${esc(p.studentUniversity)}</strong> listed you as a recommender on ReadMyStudent.
    </p>
    ${p.courseContext ? contextBlock(p.courseContext) : ""}
    ${p.studentNote ? noteBlock(`What ${studentFirst} wrote to you:`, p.studentNote) : ""}
    <p style="font-size:16px;line-height:1.6;">
      The link below opens the request. You can write and sign the letter there, or decline.
      You do not need an account, and writing the letter is free.
    </p>
    ${ctaButton(p.requestUrl, "Open the request")}
    <p style="font-size:13px;color:#999999;line-height:1.5;">
      You received this because a student entered your email address. If you do not know this student,
      decline from the link or ignore this email. The request closes after 7 days without an answer.
    </p>`;

  return wrap(body);
}

// Reminder to the professor (day 3, no answer yet)

interface RequestReminderProps {
  studentFullName: string;
  requestUrl: string;
}

export function RequestReminderEmail(p: RequestReminderProps): string {
  const student = esc(p.studentFullName);
  const body = `
    <h1 style="font-family:'Georgia',serif;font-size:28px;color:#103f30;margin-top:0;">${student} is waiting for your answer</h1>
    <p style="font-size:16px;line-height:1.6;">
      ${student} asked you for a letter of recommendation 3 days ago. The request closes in 4 days if you do not answer.
    </p>
    <p style="font-size:16px;line-height:1.6;">Open the request to accept or decline. A quick decline lets ${student} ask someone else.</p>
    ${ctaButton(p.requestUrl, "Open the request")}`;

  return wrap(body);
}

// Notice to the student (day 7, no answer)

interface RequestExpiredProps {
  studentFirstName: string;
  professorEmail: string;
  dashboardUrl: string;
}

export function RequestExpiredEmail(p: RequestExpiredProps): string {
  const body = `
    <h1 style="font-family:'Georgia',serif;font-size:28px;color:#103f30;margin-top:0;">Your request closed without an answer</h1>
    <p style="font-size:16px;line-height:1.6;">Hi ${esc(p.studentFirstName)},</p>
    <p style="font-size:16px;line-height:1.6;">
      ${esc(p.professorEmail)} did not answer your letter request within 7 days, so the request closed.
      You can send a new request to the same professor or to someone else.
    </p>
    ${ctaButton(p.dashboardUrl, "Go to your dashboard")}`;

  return wrap(body);
}

// Institution delivery link (sent to admissions office after faculty approves)

interface InstitutionDeliveryProps {
  schoolName: string;
  studentFullName: string;
  viewUrl: string;
  expiresAt: string; // ISO string
}

export function InstitutionDeliveryEmail(p: InstitutionDeliveryProps): string {
  const expiry = new Date(p.expiresAt).toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });

  const body = `
    <h1 style="font-family:'Georgia',serif;font-size:28px;color:#103f30;margin-top:0;">Recommendation letter available for secure viewing</h1>
    <p style="font-size:16px;line-height:1.6;">Dear Admissions Team,</p>
    <p style="font-size:16px;line-height:1.6;">
      A recommendation letter for <strong>${p.studentFullName}</strong> has been securely delivered
      to <strong>${p.schoolName}</strong> via ReadMyStudent.
    </p>
    <p style="font-size:16px;line-height:1.6;">
      Use the button below to view the letter. This link is <strong>single-use</strong> and
      will expire on <strong>${expiry}</strong>.
    </p>
    <div style="background-color:#f9f9f0;border-left:4px solid #eebd32;padding:12px 16px;border-radius:4px;margin:20px 0;">
      <p style="margin:0;font-size:14px;color:#555;">
        <strong>Applicant:</strong> ${p.studentFullName}
      </p>
      <p style="margin:8px 0 0;font-size:14px;color:#555;">
        <strong>Link expires:</strong> ${expiry}
      </p>
    </div>
    ${ctaButton(p.viewUrl, "View Recommendation Letter")}
    <p style="font-size:13px;color:#999999;">
      This letter was signed and sealed via ReadMyStudent. The link may only be used once.
      If you have questions, reply to this email.
    </p>`;

  return wrap(body);
}

// Request rejection notice (sent to student when faculty declines to write the letter)

interface RequestRejectionProps {
  studentFirstName: string;
  facultyName: string;
  reason?: string;
  supportUrl: string;
}

export function RequestRejectionEmail(p: RequestRejectionProps): string {
  const body = `
    <h1 style="font-family:'Georgia',serif;font-size:28px;color:#103f30;margin-top:0;">Recommendation request declined</h1>
    <p style="font-size:16px;line-height:1.6;">Hi ${esc(p.studentFirstName)},</p>
    <p style="font-size:16px;line-height:1.6;">
      <strong>${esc(p.facultyName)}</strong> has declined your request for a letter of recommendation.
    </p>
    ${p.reason ? noteBlock("Their message", p.reason) : ""}
    <p style="font-size:16px;line-height:1.6;">
      We recommend reaching out to another professor or contacting your institution's advising office for assistance.
    </p>
    ${ctaButton(p.supportUrl, "Contact Support")}
    <p style="font-size:13px;color:#999999;">
      ReadMyStudent &mdash; Secure, Respectful Recommendation Letters.
    </p>`;

  return wrap(body);
}

// Student rejection notice (sent to student when faculty rejects the delivery)

interface StudentRejectionProps {
  studentFirstName: string;
  facultyName: string;
  schoolName: string;
  supportUrl: string;
}

export function StudentRejectionEmail(p: StudentRejectionProps): string {
  const body = `
    <h1 style="font-family:'Georgia',serif;font-size:28px;color:#103f30;margin-top:0;">Delivery request declined</h1>
    <p style="font-size:16px;line-height:1.6;">Hi ${p.studentFirstName},</p>
    <p style="font-size:16px;line-height:1.6;">
      <strong>${p.facultyName}</strong> has declined the delivery of your recommendation letter
      to <strong>${p.schoolName}</strong>.
    </p>
    <p style="font-size:16px;line-height:1.6;">
      The letter was <strong>not</strong> sent to the institution. If you believe this was
      a mistake, we recommend reaching out to your professor directly.
    </p>
    <div style="background-color:#fff0f0;border-left:4px solid #e57373;padding:12px 16px;border-radius:4px;margin:20px 0;">
      <p style="margin:0;font-size:14px;color:#555;">
        A refund for the $5.00 delivery fee will be processed within 5–10 business days
        to your original payment method.
      </p>
    </div>
    ${ctaButton(p.supportUrl, "Contact Support")}
    <p style="font-size:13px;color:#999999;">
      ReadMyStudent &mdash; Secure, Respectful Recommendation Letters.
    </p>`;

  return wrap(body);
}

// Send-to-School Notification (faculty notified when student pays to deliver)

interface SendApprovalProps {
  facultyFirstName: string;
  studentFullName: string;
  schoolName: string;
  dashboardUrl: string;
}

export function SendApprovalEmail(p: SendApprovalProps): string {
  const body = `
    <h1 style="font-family:'Georgia',serif;font-size:28px;color:#103f30;margin-top:0;">Action required: approve letter delivery</h1>
    <p style="font-size:16px;line-height:1.6;">Hi ${p.facultyFirstName},</p>
    <p style="font-size:16px;line-height:1.6;">
      <strong>${p.studentFullName}</strong> has paid to have your finalized recommendation letter
      delivered to <strong>${p.schoolName}</strong>.
    </p>
    <p style="font-size:16px;line-height:1.6;">
      <strong>Your approval is required before the letter is released.</strong>
      Once you approve, the admissions office will receive a secure, one-time view link
      that expires after <strong>48 hours</strong>.
    </p>
    <div style="background-color:#fff8e1;border-left:4px solid #eebd32;padding:12px 16px;border-radius:4px;margin:20px 0;">
      <p style="margin:0;font-size:14px;color:#555;">
        <strong>Destination:</strong> ${p.schoolName}
      </p>
      <p style="margin:8px 0 0;font-size:14px;color:#555;">
        <strong>Requested by:</strong> ${p.studentFullName}
      </p>
    </div>
    <p style="font-size:16px;line-height:1.6;">
      Go to your dashboard to approve or reject this delivery request.
      If you believe this request was made in error, you can safely reject it.
    </p>
    ${ctaButton(p.dashboardUrl, "Review in Dashboard")}
    <p style="font-size:13px;color:#999999;">
      ReadMyStudent &mdash; Secure, Respectful Recommendation Letters.
    </p>`;

  return wrap(body);
}
