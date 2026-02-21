import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { cn } from "@/lib/utils";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from "@/firebase";
import { ThemeProvider } from "@/components/theme-provider";

const poppins = Poppins({ 
  subsets: ["latin"],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-poppins'
});

export const metadata: Metadata = {
  title: "mycarvalue.in - India's #1 AI Car Valuation",
  description: "Get the true market value of your vehicle based on real-world data and professional inspection points.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect x='5' y='25' width='90' height='50' rx='25' fill='%23f9c70a'/><path d='M20 70 L20 60 C20 58 22 56 24 56 L30 56 L35 46 L65 46 L70 56 L76 56 C78 56 80 58 80 60 L80 70 Z' fill='%230D1117'/><circle cx='30' cy='70' r='8' fill='%230D1117'/><circle cx='70' cy='70' r='8' fill='%230D1117'/></svg>",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          poppins.variable,
          poppins.className
        )}
      >
        <FirebaseClientProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <div className="relative flex min-h-screen flex-col selection:bg-primary/30">
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
            <Toaster />
          </ThemeProvider>
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
