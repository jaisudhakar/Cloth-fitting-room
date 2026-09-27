import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic, Plus_Jakarta_Sans } from "next/font/google";
import { notFound } from "next/navigation";
import { I18nProvider } from "@/components/I18nProvider";
import { FittingRoom } from "@/components/fitting/FittingRoom";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { SearchDialog } from "@/components/layout/SearchDialog";
import { Toast } from "@/components/layout/Toast";
import { LOCALES, dirOf, getDictionary, hasLocale } from "@/lib/i18n";
import "../globals.css";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", weight: ["200", "300", "400", "500", "600", "700", "800"], style: ["normal", "italic"] });
const plexArabic = IBM_Plex_Sans_Arabic({ subsets: ["arabic"], variable: "--font-plex-arabic", weight: ["200", "300", "400", "600", "700"] });

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const d = getDictionary(lang);
  return { title: { default: `${d.brand} — ${d.home.heroTitle1} ${d.home.heroTitle2}`, template: `%s · ${d.brand}` }, description: d.footer.about };
}

// Applied before paint so the saved theme never flashes.
const themeScript = `try{var t=localStorage.getItem("theme");if(t==="dark")document.documentElement.classList.add("dark")}catch(e){}`;

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const d = getDictionary(lang);
  return (
    <html lang={lang} dir={dirOf(lang)} suppressHydrationWarning className={`${jakarta.variable} ${plexArabic.variable} antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen overflow-x-hidden font-sans">
        <I18nProvider lang={lang} dict={d}>
          <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:p-4 focus:text-black">
            {d.skip}
          </a>
          <div className="flex min-h-screen flex-col bg-[var(--background)]">
            <Header />
            <main id="main-content" className="flex-1 pt-20">
              {children}
            </main>
            <Footer />
          </div>
          <FittingRoom />
          <SearchDialog />
          <Toast />
        </I18nProvider>
      </body>
    </html>
  );
}
