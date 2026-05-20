import nodemailer from "nodemailer";

// ─── Transporter ──────────────────────────────────────────────────────────────

function createTransporter() {
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   Number(process.env.SMTP_PORT ?? 465),
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendEmail(to: string, subject: string, html: string) {
  const transporter = createTransporter();
  const info = await transporter.sendMail({
    from: `"${process.env.SMTP_FROM_NAME ?? "MRA Project"}" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
  return info.messageId;
}

// ─── Base template wrapper ────────────────────────────────────────────────────

function baseTemplate(content: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MRA Project Management</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Inter,system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#1e3a8a 0%,#2563eb 100%);border-radius:16px 16px 0 0;padding:28px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <div style="width:36px;height:36px;background:rgba(255,255,255,0.2);border-radius:10px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px;">
                  <span style="color:#fff;font-weight:800;font-size:16px;">M</span>
                </div>
                <p style="margin:0;color:rgba(255,255,255,0.7);font-size:12px;font-weight:500;letter-spacing:0.05em;text-transform:uppercase;">MRA Project Management</p>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#ffffff;padding:32px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
          ${content}
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f8fafc;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 16px 16px;padding:20px 32px;text-align:center;">
          <p style="margin:0;color:#94a3b8;font-size:11px;line-height:1.6;">
            This email was sent automatically by the MRA Project Management system.<br>
            Do not reply to this email — <a href="${process.env.NEXTAUTH_URL}/dashboard" style="color:#2563eb;text-decoration:none;">Open Dashboard</a>
          </p>
          <p style="margin:8px 0 0;color:#cbd5e1;font-size:10px;">
            PT MRA Retail · ${new Date().getFullYear()}
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── Button helper ────────────────────────────────────────────────────────────

function btn(href: string, label: string) {
  return `<a href="${href}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:10px;margin-top:24px;">${label} →</a>`;
}

// ─── Templates ────────────────────────────────────────────────────────────────

/** Sent to new assignee when a task is assigned */
export function emailTaskAssigned(opts: {
  to: string;
  assigneeName: string;
  assignerName: string;
  taskTitle: string;
  projectName: string;
  priority: string;
  dueDate?: string | null;
  taskUrl: string;
}) {
  const priorityColor: Record<string, string> = {
    CRITICAL: "#ef4444", HIGH: "#f97316", MEDIUM: "#f59e0b", LOW: "#94a3b8",
  };

  const content = `
    <p style="margin:0 0 6px;color:#0f172a;font-size:20px;font-weight:700;">New Task Assigned 📋</p>
    <p style="margin:0 0 24px;color:#64748b;font-size:14px;">
      Hello <strong>${opts.assigneeName}</strong>, <strong>${opts.assignerName}</strong> has assigned a task to you.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
      <tr><td style="padding:20px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td colspan="2" style="padding-bottom:14px;border-bottom:1px solid #e2e8f0;">
              <p style="margin:0;color:#0f172a;font-size:16px;font-weight:700;">${opts.taskTitle}</p>
              <p style="margin:4px 0 0;color:#64748b;font-size:13px;">📁 ${opts.projectName}</p>
            </td>
          </tr>
          <tr>
            <td style="padding-top:14px;color:#64748b;font-size:13px;width:50%;">
              <span style="font-weight:600;color:#475569;">Priority:</span><br>
              <span style="display:inline-block;margin-top:4px;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;color:#fff;background:${priorityColor[opts.priority] ?? "#94a3b8"};">
                ${opts.priority}
              </span>
            </td>
            <td style="padding-top:14px;color:#64748b;font-size:13px;">
              <span style="font-weight:600;color:#475569;">Deadline:</span><br>
              <span style="margin-top:4px;display:block;font-size:13px;color:#0f172a;">
                ${opts.dueDate ? new Date(opts.dueDate).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" }) : "No deadline"}
              </span>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>

    ${btn(opts.taskUrl, "View Task")}
  `;

  return {
    subject: `[MRA] New task: "${opts.taskTitle}"`,
    html: baseTemplate(content),
  };
}

/** Sent to a user mentioned in a comment */
export function emailMentioned(opts: {
  to: string;
  mentionedName: string;
  mentionerName: string;
  taskTitle: string;
  projectName: string;
  commentPreview: string;
  taskUrl: string;
}) {
  const preview = opts.commentPreview.length > 200
    ? opts.commentPreview.slice(0, 200) + "…"
    : opts.commentPreview;

  const content = `
    <p style="margin:0 0 6px;color:#0f172a;font-size:20px;font-weight:700;">You Were Mentioned in a Comment 💬</p>
    <p style="margin:0 0 24px;color:#64748b;font-size:14px;">
      Hello <strong>${opts.mentionedName}</strong>, <strong>${opts.mentionerName}</strong> mentioned you in a comment.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
      <tr><td style="padding:16px 20px;">
        <p style="margin:0 0 4px;color:#475569;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Task</p>
        <p style="margin:0 0 12px;color:#0f172a;font-size:14px;font-weight:600;">${opts.taskTitle} · <span style="color:#64748b;font-weight:400;">${opts.projectName}</span></p>
        <div style="background:#ffffff;border-left:3px solid #2563eb;padding:12px 16px;border-radius:0 8px 8px 0;">
          <p style="margin:0;color:#334155;font-size:14px;line-height:1.6;">${preview}</p>
        </div>
      </td></tr>
    </table>

    ${btn(opts.taskUrl, "Reply to Comment")}
  `;

  return {
    subject: `[MRA] ${opts.mentionerName} mentioned you in "${opts.taskTitle}"`,
    html: baseTemplate(content),
  };
}

/** Sent as a deadline reminder for tasks approaching their due date */
export function emailDeadlineReminder(opts: {
  to: string;
  userName: string;
  tasks: { title: string; projectName: string; dueDate: string; priority: string; url: string }[];
  daysLeft: number;
}) {
  const priorityColor: Record<string, string> = {
    CRITICAL: "#ef4444", HIGH: "#f97316", MEDIUM: "#f59e0b", LOW: "#94a3b8",
  };

  const taskRows = opts.tasks.map((t) => `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;">
        <a href="${t.url}" style="color:#2563eb;text-decoration:none;font-weight:600;font-size:14px;">${t.title}</a>
        <p style="margin:2px 0 0;color:#64748b;font-size:12px;">📁 ${t.projectName}</p>
      </td>
      <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;white-space:nowrap;">
        <span style="display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;color:#fff;background:${priorityColor[t.priority] ?? "#94a3b8"};">
          ${t.priority}
        </span>
      </td>
      <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;white-space:nowrap;color:#ef4444;font-size:13px;font-weight:600;">
        ${new Date(t.dueDate).toLocaleDateString("en-US", { day: "numeric", month: "short" })}
      </td>
    </tr>
  `).join("");

  const urgencyLabel = opts.daysLeft === 0 ? "today!" : opts.daysLeft < 0 ? "already overdue!" : `in ${opts.daysLeft} day(s)`;
  const urgencyColor = opts.daysLeft <= 1 ? "#ef4444" : opts.daysLeft <= 3 ? "#f97316" : "#f59e0b";

  const content = `
    <p style="margin:0 0 6px;color:#0f172a;font-size:20px;font-weight:700;">⏰ Deadline Reminder</p>
    <p style="margin:0 0 24px;color:#64748b;font-size:14px;">
      Hello <strong>${opts.userName}</strong>, you have <strong>${opts.tasks.length} task(s)</strong> with deadlines
      <span style="color:${urgencyColor};font-weight:700;">${urgencyLabel}</span>
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
      <thead>
        <tr style="background:#f8fafc;">
          <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">Task</th>
          <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">Priority</th>
          <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">Deadline</th>
        </tr>
      </thead>
      <tbody>
        ${taskRows}
      </tbody>
    </table>

    ${btn(`${process.env.NEXTAUTH_URL}/dashboard`, "Open Dashboard")}
  `;

  return {
    subject: `[MRA] ⚠️ ${opts.tasks.length} task(s) deadline ${urgencyLabel}`,
    html: baseTemplate(content),
  };
}

/** Account verification email after registration */
export function emailVerifyAccount(opts: {
  to: string;
  name: string;
  verifyUrl: string;
}) {
  const content = `
    <p style="margin:0 0 6px;color:#0f172a;font-size:20px;font-weight:700;">Verify Your Email ✉️</p>
    <p style="margin:0 0 24px;color:#64748b;font-size:14px;">
      Hello <strong>${opts.name}</strong>, thank you for registering with MRA Project Management.
      Click the button below to activate your account.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;">
      <tr><td style="padding:16px 20px;">
        <p style="margin:0;color:#1e40af;font-size:13px;">
          🔐 This verification link is valid for <strong>24 hours</strong>.<br>
          If you did not register, please ignore this email.
        </p>
      </td></tr>
    </table>

    ${btn(opts.verifyUrl, "Verify My Account")}

    <p style="margin:24px 0 0;color:#94a3b8;font-size:12px;">
      Or copy this link into your browser:<br>
      <a href="${opts.verifyUrl}" style="color:#2563eb;word-break:break-all;">${opts.verifyUrl}</a>
    </p>
  `;
  return {
    subject: "[MRA] Verify your account email",
    html: baseTemplate(content),
  };
}

/** Test email — verify SMTP is working */
export function emailTest(to: string) {
  const content = `
    <p style="margin:0 0 6px;color:#0f172a;font-size:20px;font-weight:700;">✅ Email Connection Successful</p>
    <p style="margin:0 0 24px;color:#64748b;font-size:14px;">
      MRA Project Management SMTP configuration is working correctly.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;">
      <tr><td style="padding:16px 20px;">
        <p style="margin:0;color:#166534;font-size:14px;">
          📧 SMTP Host: <strong>${process.env.SMTP_HOST}</strong><br>
          🔒 Port: <strong>${process.env.SMTP_PORT}</strong> (SSL)<br>
          👤 Sender: <strong>${process.env.SMTP_USER}</strong><br>
          🕐 Test time: <strong>${new Date().toLocaleString("en-US")}</strong>
        </p>
      </td></tr>
    </table>
    ${btn(`${process.env.NEXTAUTH_URL}/dashboard`, "Open Dashboard")}
  `;
  return {
    subject: "[MRA] Test Email — SMTP Configuration Successful",
    html: baseTemplate(content),
  };
}
