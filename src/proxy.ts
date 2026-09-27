import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, LOCALES } from "@/lib/i18n";

function preferredLocale(req: NextRequest) {
  const saved = req.cookies.get("lang")?.value;
  if (saved && (LOCALES as readonly string[]).includes(saved)) return saved;
  const header = req.headers.get("accept-language") ?? "";
  return header.toLowerCase().split(",")[0]?.startsWith("ar") ? "ar" : DEFAULT_LOCALE;
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasLocale = LOCALES.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`));
  if (hasLocale) return;
  req.nextUrl.pathname = `/${preferredLocale(req)}${pathname}`;
  return NextResponse.redirect(req.nextUrl);
}

export const config = {
  // Skip API routes, Next internals and files with an extension (static assets).
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
