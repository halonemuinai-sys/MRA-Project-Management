import { NextRequest, NextResponse } from "next/server";
import { getAuthEmail } from "@/app/api/_auth";
import { sendEmail, emailTest } from "@/lib/email";

export async function POST(req: NextRequest) {
  const email = await getAuthEmail(req);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { subject, html } = emailTest(email);
    const messageId = await sendEmail(email, subject, html);
    return NextResponse.json({ success: true, messageId, sentTo: email });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : "Gagal mengirim email";
    console.error("[test-email]", err);
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}
