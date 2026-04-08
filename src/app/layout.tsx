import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["400", "600", "700"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0078D7",
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "أبو الزهراء - الاتصال الآمن",
  description: "تطبيق VoIP عربي احترافي للاتصالات الآمنة عبر Twilio",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "أبو الزهراء",
  },
  formatDetection: {
    telephone: false,
  },
};

// Service Worker registration script
const swScript = `
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js').then(function(registration) {
      console.log('SW registered:', registration.scope);
      registration.update();
    }).catch(function(error) {
      console.log('SW registration failed:', error);
    });
  });
}
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#0078D7" />
        <meta name="msapplication-TileImage" content="/icons/icon-144x144.png" />
        <script dangerouslySetInnerHTML={{ __html: swScript }} />
      </head>
      <body className={`${cairo.variable} antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
