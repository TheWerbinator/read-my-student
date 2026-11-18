// Plain HTML string email templates - no React/JSX, safe in Next.js server actions.
// Inline styles and tables only. Fonts fall back cleanly when the web font is absent.

const DISPLAY = "'Big Shoulders Display','Big Shoulders','Arial Narrow',Arial,sans-serif";
const BODY = "Arial,Helvetica,sans-serif";

const HEADER = `
  <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation">
    <tr>
      <td bgcolor="#0c2016" style="background-color:#0c2016;padding:22px 32px;font-family:${DISPLAY};font-size:24px;line-height:28px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:#ffffff;">
        ReadMyStudent
      </td>
    </tr>
  </table>`;

const FOOTER = `
  <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation">
    <tr>
      <td bgcolor="#ffffff" style="background-color:#ffffff;padding:20px 32px;border-top:1px solid #d6d9d3;text-align:center;font-family:${BODY};font-size:12px;line-height:18px;color:#4a5a51;">
        &copy; ReadMyStudent. Secure, Respectful Recommendation Letters.
      </td>
    </tr>
  </table>`;

function wrap(body: string): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>ReadMyStudent</title></head>
<body style="margin:0;padding:0;background-color:#eef2f2;font-family:${BODY};color:#14211a;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" bgcolor="#eef2f2" style="background-color:#eef2f2;">
    <tr>
      <td align="center" style="padding:32px 12px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" bgcolor="#ffffff"
          style="max-width:600px;width:100%;background-color:#ffffff;border:1px solid #d6d9d3;">
          <tr><td>${HEADER}</td></tr>
          <tr><td style="padding:32px;font-family:${BODY};">${body}</td></tr>
          <tr><td>${FOOTER}</td></tr>
        </table>
      </td>
    </tr>
  </table>
</body></html>`;
}

/** Escape user-supplied text so it cannot inject HTML or links into an email. */
export function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function heading(text: string): string {
  return `<h1 style="font-family:${DISPLAY};font-size:30px;line-height:32px;font-weight:bold;letter-spacing:0.5px;text-transform:uppercase;color:#0c2016;margin:0 0 20px 0;">${text}</h1>`;
}

/** Ruled box: 1px border all around, light fill, small caps caption above the content. */
function ruledBox(caption: string, inner: string): string {
  return `<table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="margin:20px 0;">
    <tr>
      <td bgcolor="#eef2f2" style="background-color:#eef2f2;border:1px solid #d6d9d3;padding:14px 16px;">
        <p style="margin:0 0 6px 0;font-family:${BODY};font-size:11px;line-height:14px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;color:#4a5a51;">${caption}</p>
        ${inner}
      </td>
    </tr>
  </table>`;
}

function contextBlock(courseContext: string): string {
  return ruledBox(
    "Course",
    `<p style="margin:0;font-size:15px;line-height:22px;color:#14211a;">${esc(courseContext)}</p>`,
  );
}

function noteBlock(label: string, note: string): string {
  return ruledBox(
    label,
    `<p style="margin:0;font-size:15px;line-height:24px;color:#14211a;">&ldquo;${esc(note)}&rdquo;</p>`,
  );
}

function ctaButton(href: string, label: string): string {
  return `<table border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin-top:24px;margin-bottom:32px;">
    <tr>
      <td bgcolor="#ffaa00" style="background-color:#ffaa00;mso-padding-alt:14px 28px;">
        <a href="${href}" style="display:inline-block;background-color:#ffaa00;color:#07150e;font-family:${BODY};font-size:16px;line-height:16px;font-weight:bold;padding:14px 28px;text-decoration:none;">${label}</a>
      </td>
    </tr>
  </table>`;
}

const P = `font-family:${BODY};font-size:16px;line-height:26px;color:#14211a;margin:0 0 16px 0;`;
const SMALL = `font-family:${BODY};font-size:13px;line-height:20px;color:#4a5a51;margin:0;`;

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
    ${heading("You have a new recommendation request")}
    <p style="${P}">Hi ${esc(p.facultyFirstName)},</p>
    <p style="${P}">
      <strong>${student}</strong> from <strong>${esc(p.studentUniversity)}</strong>
      asked you for a letter of recommendation through ReadMyStudent.
    </p>
    ${p.courseContext ? contextBlock(p.courseContext) : ""}
    ${p.studentNote ? noteBlock(`Personal note from ${student}:`, p.studentNote) : ""}
    <p style="${P}">Open the request to accept it and write the letter, or to decline it. You do not need to log in. The request also appears in your dashboard.</p>
    ${ctaButton(p.requestUrl, "Open the request")}
    <p style="${SMALL}">If you do not answer within 7 days, the request closes.</p>`;

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
    ${heading(`${studentFirst} asked you for a letter of recommendation`)}
    <p style="${P}">
      <strong>${student}</strong> from <strong>${esc(p.studentUniversity)}</strong> listed you as a recommender on ReadMyStudent.
    </p>
    ${p.courseContext ? contextBlock(p.courseContext) : ""}
    ${p.studentNote ? noteBlock(`What ${studentFirst} wrote to you:`, p.studentNote) : ""}
    <p style="${P}">
      The link below opens the request. You can write and sign the letter there, or decline.
      You do not need an account, and writing the letter is free.
    </p>
    ${ctaButton(p.requestUrl, "Open the request")}
    <p style="${SMALL}">
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
    ${heading(`${student} is waiting for your answer`)}
    <p style="${P}">
      ${student} asked you for a letter of recommendation 3 days ago. The request closes in 4 days if you do not answer.
    </p>
    <p style="${P}">Open the request to accept or decline. A quick decline lets ${student} ask someone else.</p>
    ${ctaButton(p.requestUrl, "Open the request")}`;

  return wrap(body);
}

// Notice to the student (day 7, no answer)

interface RequestExpiredProps {
  studentFirstName: string;
  professorEmail: string;
  dashboardUrl: string;
  /** The request's credit went back to the student's balance. */
  creditReturned?: boolean;
}

export function RequestExpiredEmail(p: RequestExpiredProps): string {
  const body = `
    ${heading("Your request closed without an answer")}
    <p style="${P}">Hi ${esc(p.studentFirstName)},</p>
    <p style="${P}">
      ${esc(p.professorEmail)} did not answer your letter request within 7 days, so the request closed.
      You can send a new request to the same professor or to someone else.
    </p>
    ${p.creditReturned ? `<p style="${P}">${CREDIT_BACK}</p>` : ""}
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

export function InstitutionDeliveryEmail(raw: InstitutionDeliveryProps): string {
  const p = { ...raw, studentFullName: esc(raw.studentFullName), schoolName: esc(raw.schoolName) };
  const expiry = new Date(p.expiresAt).toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });

  const body = `
    ${heading("Recommendation letter available for secure viewing")}
    <p style="${P}">Dear Admissions Team,</p>
    <p style="${P}">
      A recommendation letter for <strong>${p.studentFullName}</strong> has been securely delivered
      to <strong>${p.schoolName}</strong> via ReadMyStudent.
    </p>
    <p style="${P}">
      Use the button below to view the letter. You will confirm your email address first.
      The link expires on <strong>${expiry}</strong>.
    </p>
    ${ruledBox(
      "Delivery",
      `<p style="margin:0;font-size:15px;line-height:22px;color:#14211a;">
        <strong>Applicant:</strong> ${p.studentFullName}
      </p>
      <p style="margin:8px 0 0;font-size:15px;line-height:22px;color:#14211a;">
        <strong>Link expires:</strong> ${expiry}
      </p>`,
    )}
    ${ctaButton(p.viewUrl, "View Recommendation Letter")}
    <p style="${SMALL}">
      This letter was signed and sealed via ReadMyStudent. The link is for your office only.
      If you have questions, reply to this email.
    </p>
    <p style="${SMALL}">
      ReadMyStudent is an independent service that students and professors use to deliver
      letters. It is not affiliated with or endorsed by ${p.schoolName}.
    </p>`;

  return wrap(body);
}

// Request rejection notice (sent to student when faculty declines to write the letter)

interface RequestRejectionProps {
  studentFirstName: string;
  facultyName: string;
  reason?: string;
  supportUrl: string;
  /** The request's credit went back to the student's balance. */
  creditReturned?: boolean;
}

const CREDIT_BACK = "The credit you used for this request is back in your balance.";

export function RequestRejectionEmail(p: RequestRejectionProps): string {
  const body = `
    ${heading("Recommendation request declined")}
    <p style="${P}">Hi ${esc(p.studentFirstName)},</p>
    <p style="${P}">
      <strong>${esc(p.facultyName)}</strong> has declined your request for a letter of recommendation.
    </p>
    ${p.reason ? noteBlock("Their message", p.reason) : ""}
    ${p.creditReturned ? `<p style="${P}">${CREDIT_BACK}</p>` : ""}
    <p style="${P}">
      We recommend reaching out to another professor or contacting your institution's advising office for assistance.
    </p>
    ${ctaButton(p.supportUrl, "Contact Support")}
    <p style="${SMALL}">
      ReadMyStudent. Secure, Respectful Recommendation Letters.
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

export function StudentRejectionEmail(raw: StudentRejectionProps): string {
  const p = {
    ...raw,
    studentFirstName: esc(raw.studentFirstName),
    facultyName: esc(raw.facultyName),
    schoolName: esc(raw.schoolName),
  };
  const body = `
    ${heading("Delivery request declined")}
    <p style="${P}">Hi ${p.studentFirstName},</p>
    <p style="${P}">
      <strong>${p.facultyName}</strong> has declined the delivery of your recommendation letter
      to <strong>${p.schoolName}</strong>.
    </p>
    <p style="${P}">
      The letter was <strong>not</strong> sent to the institution. If you believe this was
      a mistake, we recommend reaching out to your professor directly.
    </p>
    ${ctaButton(p.supportUrl, "Contact Support")}
    <p style="${SMALL}">
      ReadMyStudent. Secure, Respectful Recommendation Letters.
    </p>`;

  return wrap(body);
}

// Send-to-School Notification (faculty asked to approve a school delivery)

interface SendApprovalProps {
  facultyFirstName: string;
  studentFullName: string;
  schoolName: string;
  schoolEmail: string;
  /** The request page (/r/<token>), where the professor approves with or without an account. */
  reviewUrl: string;
}

export function SendApprovalEmail(raw: SendApprovalProps): string {
  const p = {
    ...raw,
    facultyFirstName: esc(raw.facultyFirstName),
    studentFullName: esc(raw.studentFullName),
    schoolName: esc(raw.schoolName),
    schoolEmail: esc(raw.schoolEmail),
  };
  const body = `
    ${heading("Action required: approve letter delivery")}
    <p style="${P}">Hi ${p.facultyFirstName},</p>
    <p style="${P}">
      <strong>${p.studentFullName}</strong> asked to send your finalized recommendation letter
      to <strong>${p.schoolName}</strong>.
    </p>
    <p style="${P}">
      <strong>Your approval is required before the letter is released.</strong>
      Once you approve, the admissions office will receive a secure view link
      that expires after <strong>48 hours</strong>.
    </p>
    ${ruledBox(
      "Delivery request",
      `<p style="margin:0;font-size:15px;line-height:22px;color:#14211a;">
        <strong>Destination:</strong> ${p.schoolName}
      </p>
      <p style="margin:8px 0 0;font-size:15px;line-height:22px;color:#14211a;">
        <strong>Sent to:</strong> ${p.schoolEmail}
      </p>
      <p style="margin:8px 0 0;font-size:15px;line-height:22px;color:#14211a;">
        <strong>Requested by:</strong> ${p.studentFullName}
      </p>`,
    )}
    <p style="${P}">
      Check that the address belongs to the school's admissions office. If it does not,
      or if you did not expect this request, decline it.
    </p>
    ${ctaButton(p.reviewUrl, "Review the delivery")}
    <p style="${SMALL}">
      ReadMyStudent. Secure, Respectful Recommendation Letters.
    </p>`;

  return wrap(body);
}

// Faculty dependent invite, sent from the admin screen (owner, 2026-11-11)

interface DependentInviteProps {
  dependentName: string;
  facultyName: string;
  signupUrl: string;
}

export function DependentInviteEmail(p: DependentInviteProps): string {
  const body = `
    ${heading("Your letter requests are free for 3 years")}
    <p style="${P}">Hi ${esc(p.dependentName)},</p>
    <p style="${P}">
      ${esc(p.facultyName)} asked us to set up a faculty family account for you. Every letter request you send through ReadMyStudent is free for 3 years. You do not need credits or a membership.
    </p>
    <p style="${P}">Sign up with this email address. If you already have a student account with it, log in instead. The 3 years start the first time you open your dashboard after you confirm your email.</p>
    ${ctaButton(p.signupUrl, "Create your account")}
    <p style="${SMALL}">If you did not expect this email, you can ignore it.</p>`;

  return wrap(body);
}
