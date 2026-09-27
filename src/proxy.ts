import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, LOCALES } from "@/lib/i18n";

function preferredLocale(req: NextRequest) {
  const saved = req.cookies.get("lang")?.value;
  if (saved && (LOCALES as readonly string[]).includes(saved)) return saved;
  return (req.headers.get("accept-language") ?? "").toLowerCase().startsWith("ar") ? "ar" : DEFAULT_LOCALE;
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (LOCALES.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`))) return;
  req.nextUrl.pathname = `/${preferredLocale(req)}${pathname}`;
  return NextResponse.redirect(req.nextUrl);
}

export const config = {
  // Skip API routes, Next internals and files with an extension (public assets).
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
