import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./store/Provider";
import Header from "./component/Atoms/Header/Header";
import RenderFromOverlay from "./component/Atoms/RenderFromOverlay/RenderFromOverlay";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Go Renovate",
  description: "Go get your home interior renovated with Go Renovate",
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
            <Header />
            {/* <Suspense fallback={<Loader />}> */}
            {children}
            <RenderFromOverlay />
            {/* </Suspense> */}
          </>
        </Providers>
      </body>
    </html>
  );
}
