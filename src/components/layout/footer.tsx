"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Car, Mail, Phone, ShieldCheck, Instagram, Facebook, Twitter } from 'lucide-react';

export default function Footer() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <footer className="bg-secondary border-t border-border/50">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-8">
          {/* Brand Info */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-2">
              <Car className="h-6 w-6 text-primary" />
              <span className="font-black text-xl tracking-tight">mycarvalue<span className="text-primary">.in</span></span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              India&apos;s #1 AI-powered car valuation platform. Get the true market value of your vehicle based on real-world data and professional inspection points.
            </p>
            <div className="flex items-center gap-4 pt-2">
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors"><Instagram className="h-5 w-5" /></a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors"><Facebook className="h-5 w-5" /></a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors"><Twitter className="h-5 w-5" /></a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider mb-4 text-foreground">Explore</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/valuation" className="text-muted-foreground hover:text-primary hover:translate-x-1 transition-all inline-block">AI Car Valuation</Link></li>
              <li><Link href="/daily-fresh-cars" className="text-muted-foreground hover:text-primary hover:translate-x-1 transition-all inline-block">Hot Market Listings</Link></li>
              <li><Link href="/emi-calculator" className="text-muted-foreground hover:text-primary hover:translate-x-1 transition-all inline-block">EMI Calculator</Link></li>
              <li><Link href="/dashboard" className="text-muted-foreground hover:text-primary hover:translate-x-1 transition-all inline-block">User Dashboard</Link></li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider mb-4 text-foreground">Support</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/about" className="text-muted-foreground hover:text-primary hover:translate-x-1 transition-all inline-block">About Us</Link></li>
              <li><Link href="/faq" className="text-muted-foreground hover:text-primary hover:translate-x-1 transition-all inline-block">FAQs</Link></li>
              <li><Link href="/contact" className="text-muted-foreground hover:text-primary hover:translate-x-1 transition-all inline-block">Contact Us</Link></li>
              <li><Link href="/admin" className="text-muted-foreground hover:text-primary hover:translate-x-1 transition-all inline-block">Admin Panel</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider mb-4 text-foreground">Reach Us</h3>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-primary shrink-0" />
                <a href="mailto:mycarvalue1@gmail.com" className="text-muted-foreground hover:text-foreground transition-colors break-all">
                  mycarvalue1@gmail.com
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-primary shrink-0" />
                <a href="tel:+919492060040" className="text-muted-foreground hover:text-foreground transition-colors">
                  +91 94920 60040
                </a>
              </li>
              <li className="flex items-center gap-2 pt-2 text-xs font-bold text-green-500 uppercase">
                <ShieldCheck className="h-4 w-4" />
                Secure AI Valuations
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
          <p>
            &copy; {isClient ? new Date().getFullYear() : ''} mycarvalue.in. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="/" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link href="/" className="hover:text-foreground transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}