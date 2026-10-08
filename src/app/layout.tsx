import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Suspense } from "react";
import { Be_Vietnam_Pro, Inter, Space_Grotesk } from "next/font/google";
import { ThemeStyle } from "@/components/theme-style";
import { getSettings } from "@/services/settings";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({ variable: "--font-space-grotesk", subsets: ["latin", "vietnamese"] });
const inter = Inter({ variable: "--font-inter", subsets: ["latin", "vietnamese"] });
const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-be-vietnam-pro",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "700", "800"],
  preload: false,
});

// Runs before first paint so a saved light/dark choice never flashes.
const THEME_SCRIPT = `try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export async function generateMetadata(): Promise<Metadata> {
  const { seo, store, banners } = await getSettings();
  // Admin-set share image, else the hero banner so links always get a large preview.
  const shareImage = seo.og_image || banners[0]?.image_url;
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
    title: { default: seo.title, template: `%s | ${store.name}` },
    description: seo.description,
    openGraph: {
      type: "website",
      locale: "vi_VN",
      siteName: store.name,
      images: shareImage ? [{ url: shareImage, width: 1200, height: 630, alt: seo.title }] : undefined,
    },
    twitter: { card: "summary_large_image", images: shareImage ? [shareImage] : undefined },
  };
}

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { theme } = await getSettings();
  return (
    <html
      lang="vi"
      data-theme="dark"
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${inter.variable} ${beVietnamPro.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <ThemeStyle theme={theme} />
      </head>
      <body className="min-h-dvh flex flex-col">
        {children}
        {/* Cookieless page views (Vercel only: /_vercel/insights exists only there). Reads the URL, so it sits in Suspense. */}
        {process.env.VERCEL && (
          <Suspense>
            <Analytics />
          </Suspense>
        )}
      </body>
    </html>
  );
}
