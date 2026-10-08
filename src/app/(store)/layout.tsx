import { CartProvider } from "@/components/cart/cart-provider";
import { JsonLd } from "@/components/json-ld";
import { SiteFooter } from "@/components/store/site-footer";
import { SiteHeader } from "@/components/store/site-header";
import { SmoothScroll } from "@/components/store/smooth-scroll";
import { getSettings } from "@/services/settings";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function StoreLayout({ children }: LayoutProps<"/">) {
  const { store, theme, shipping } = await getSettings();
  const sameAs = [store.facebook, store.instagram, store.tiktok].filter(Boolean);

  return (
    <SmoothScroll>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: store.name,
          url: SITE_URL,
          ...(theme.logo_url && { logo: theme.logo_url }),
          ...(sameAs.length > 0 && { sameAs }),
          ...((store.email || store.phone) && {
            contactPoint: { "@type": "ContactPoint", contactType: "customer service", email: store.email || undefined, telephone: store.phone || undefined },
          }),
        }}
      />
      <CartProvider shipping={shipping}>
        <SiteHeader />
        <main id="main" className="flex flex-1 flex-col">
          {children}
        </main>
        <SiteFooter />
      </CartProvider>
    </SmoothScroll>
  );
}
