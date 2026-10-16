import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./store/Provider";
import Header from "./component/Atoms/Header/Header";
import RenderFromOverlay from "./component/Atoms/RenderFromOverlay/RenderFromOverlay";
import ErrorBoundary from "./component/HOC/ErrorBoundary/ErrorBoundary";
import ShopCart from "./component/Features/ShopCart/ShopCart";
import { SERVICES_ENABLED } from "./utils/features";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://gorenovate.in"),
  title: {
    default: SERVICES_ENABLED
      ? "Go Renovate — Home Renovation Vendors & Quotes"
      : "Go Renovate — Furniture, Décor & Home Essentials",
    template: "%s",
  },
  description: SERVICES_ENABLED
    ? "Go get your home interior renovated with Go Renovate. Browse verified renovation vendors, compare services, and request a free quote."
    : "Shop furniture, lighting, rugs and décor from vendors on Go Renovate, or furnish a whole room in one order.",
  icons: {
    icon: "/apple-touch-icon.png",
  },
  openGraph: {
    siteName: "Go Renovate",
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <Providers>
          <>
            <ErrorBoundary title="Navigation is unavailable">
              <Header />
            </ErrorBoundary>
            {/* <Suspense fallback={<Loader />}> */}
            {children}
            <ErrorBoundary title="This feature is unavailable right now">
              <RenderFromOverlay />
            </ErrorBoundary>
            <ErrorBoundary title="The cart is unavailable right now">
              <ShopCart />
            </ErrorBoundary>
            {/* </Suspense> */}
          </>
        </Providers>
      </body>
    </html>
  );
}
