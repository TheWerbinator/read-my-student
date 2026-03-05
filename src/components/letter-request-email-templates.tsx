// Plain HTML string email templates - no React/JSX, safe in Next.js server actions.

const HEADER = `
  <div style="background-color:#103f30;padding:30px;text-align:center;">
    <img src="https://readmystudent.com/Logo_Official_White.png" alt="ReadMyStudent" style="height:50px;width:auto;">
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

function contextBlock(courseContext: string): string {
  return `<div style="background-color:#f9f9f0;border-left:4px solid #eebd32;padding:12px 16px;border-radius:4px;margin:20px 0;">
    <p style="margin:0;font-size:14px;color:#555;"><strong>Course / Context:</strong> ${courseContext}</p>
  </div>`;
}

function noteBlock(label: string, note: string): string {
  return `<div style="background-color:#f5f5f5;padding:16px;border-radius:6px;margin:20px 0;">
    <p style="margin:0 0 6px 0;font-size:13px;font-weight:bold;color:#103f30;">${label}</p>
    <p style="margin:0;font-size:14px;line-height:1.6;color:#444;font-style:italic;">&ldquo;${note}&rdquo;</p>
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

// New Request Notification (faculty already has an account)

interface RequestNotificationProps {
  facultyFirstName: string;
  studentFullName: string;
  studentUniversity: string;
  courseContext?: string;
  studentNote?: string;
  dashboardUrl: string;
}

export function RequestNotificationEmail(p: RequestNotificationProps): string {
  const body = `
    <h1 style="font-family:'Georgia',serif;font-size:28px;color:#103f30;margin-top:0;">You have a new recommendation request</h1>
    <p style="font-size:16px;line-height:1.6;">Hi ${p.facultyFirstName},</p>
    <p style="font-size:16px;line-height:1.6;">
      <strong>${p.studentFullName}</strong> from <strong>${p.studentUniversity}</strong>
      has requested a letter of recommendation from you through ReadMyStudent.
    </p>
    ${p.courseContext ? contextBlock(p.courseContext) : ""}
    ${p.studentNote ? noteBlock(`Personal note from ${p.studentFullName}:`, p.studentNote) : ""}
    <p style="font-size:16px;line-height:1.6;">Log in to your ReadMyStudent dashboard to review the request and begin drafting your letter.</p>
    ${ctaButton(p.dashboardUrl, "View Request in Dashboard")}
    <p style="font-size:13px;color:#999999;">If you believe this request was sent in error, you may decline it from your dashboard.</p>`;

  return wrap(body);
}

// Faculty Invitation (professor not yet registered)

interface FacultyInvitationProps {
  studentFullName: string;
  studentUniversity: string;
  courseContext?: string;
  studentNote?: string;
  signupUrl: string;
}

export function FacultyInvitationEmail(p: FacultyInvitationProps): string {
  const studentFirst = p.studentFullName.split(" ")[0];

  const body = `
    <h1 style="font-family:'Georgia',serif;font-size:28px;color:#103f30;margin-top:0;">
      ${studentFirst} needs your help &mdash; and only you can provide it.
    </h1>
    <p style="font-size:16px;line-height:1.6;">
      <strong>${p.studentFullName}</strong>, a student at <strong>${p.studentUniversity}</strong>,
      has reached out asking you to write a letter of recommendation on their behalf.
      They took the time to look you up specifically &mdash; because to them, your recommendation carries real weight.
    </p>
    ${p.courseContext ? contextBlock(p.courseContext) : ""}
    ${p.studentNote ? noteBlock(`Here's what ${studentFirst} wrote to you:`, p.studentNote) : ""}
    <p style="font-size:16px;line-height:1.6;">
      A letter of recommendation from you could make the difference between ${studentFirst} getting into their
      program &mdash; or not. It takes just a few minutes on ReadMyStudent, and your words could genuinely
      change the course of their life.
    </p>
    <p style="font-size:16px;line-height:1.6;">
      <strong>ReadMyStudent</strong> is a free platform built for faculty to write, manage, and securely deliver
      recommendation letters. Your account takes less than 2 minutes to set up, and ${studentFirst}'s request
      will be waiting for you the moment you sign in.
    </p>
    ${ctaButton(p.signupUrl, `Help ${studentFirst} &mdash; Create My Free Account`)}
    <p style="font-size:13px;color:#999999;line-height:1.5;">
      You're receiving this because a student listed your email as their professor.
      If you believe this was sent in error, you can safely ignore it &mdash; no account will be created without your action.
    </p>`;

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
