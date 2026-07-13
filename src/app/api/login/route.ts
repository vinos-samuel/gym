import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, verifyPassphrase, SESSION_COOKIE, SESSION_DAYS } from "@/lib/session";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const passphrase = String(form.get("passphrase") ?? "");

  if (!passphrase || !verifyPassphrase(passphrase)) {
    const url = new URL("/login", request.url);
    url.searchParams.set("error", "1");
    return NextResponse.redirect(url, { status: 303 });
  }

  const response = NextResponse.redirect(new URL("/", request.url), { status: 303 });
  response.cookies.set(SESSION_COOKIE, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
    path: "/",
  });
  return response;
}
