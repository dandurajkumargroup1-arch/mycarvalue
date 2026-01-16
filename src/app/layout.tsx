
import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from "@/firebase";

const openSans = Open_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['300', '400', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: "mycarvalue.in - AI-Powered Car Valuation",
  description: "This valuation helps you sell directly to buyers at the right price.",
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
          openSans.variable
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
      </body>
    </html>
  );
}
