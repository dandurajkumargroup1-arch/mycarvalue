import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { cn } from "@/lib/utils";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from "@/firebase";

const poppins = Poppins({ 
  subsets: ["latin"],
  weight: ['400', '500', '600', '700'] 
});

export const metadata: Metadata = {
  title: "mycarvalue.in - AI-Powered Car Valuation",
  description: "This valuation helps you sell directly to buyers at the right price.",
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🚗</text></svg>',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
      </head>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          poppins.className
        )}
      >
        <FirebaseClientProvider>
          <div className="relative flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <Toaster />
        </FirebaseClientProvider>
        <Script
          id="mycarvalue-org-schema"
          type="application/ld+json"
          strategy="afterInteractive"
        >
        {`
        {
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "MyCarValue",
          "url": "https://mycarvalue.in",
          "logo": "https://mycarvalue.in/logo.png",
          "description": "MyCarValue helps car owners and dealers get accurate used car valuation and inspection services across India.",
          "foundingDate": "2025",
          "contactPoint": {
            "@type": "ContactPoint",
            "telephone": "+91-9492060040",
            "contactType": "customer support",
            "email": "mycarvalue1@gmail.com",
            "areaServed": "IN",
            "availableLanguage": ["English", "Telugu", "Tamil"]
          }
        }
        `}
        </Script>
      </body>
    </html>
  );
}
