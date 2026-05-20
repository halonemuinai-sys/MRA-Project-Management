import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { sendEmail, emailTest } from "@/lib/email";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { subject, html } = emailTest(session.user.email);
    const messageId = await sendEmail(session.user.email, subject, html);
    return NextResponse.json({ success: true, messageId, sentTo: session.user.email });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : "Gagal mengirim email";
    console.error("[test-email]", err);
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}
