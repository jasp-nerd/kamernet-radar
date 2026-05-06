import { NextResponse } from "next/server";

const COOKIE_NAME = "radar_auth";
const THIRTY_DAYS = 60 * 60 * 24 * 30;

function publicBase(request: Request): string {
  // Behind Traefik / a reverse proxy, request.url comes from the container's
  // bind address (0.0.0.0:3000), not the public hostname. Use the forwarded
  // headers when present so redirects land on the right URL.
  const proto =
    request.headers.get("x-forwarded-proto") ??
    new URL(request.url).protocol.replace(":", "");
  const host = request.headers.get("host") ?? new URL(request.url).host;
  return `${proto}://${host}`;
}

export async function POST(request: Request) {
  const expected = process.env.DASHBOARD_PASSWORD;
  const formData = await request.formData();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/") || "/";
  const base = publicBase(request);

  if (!expected || password !== expected) {
    const url = new URL("/login", base);
    url.searchParams.set("error", "1");
    if (next !== "/") url.searchParams.set("next", next);
    return NextResponse.redirect(url, { status: 303 });
  }

  const response = NextResponse.redirect(new URL(next, base), { status: 303 });
  response.cookies.set(COOKIE_NAME, expected, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: THIRTY_DAYS,
  });
  return response;
}
