
"use client";

import Link from "next/link";
import { Car, Menu, Sparkles, LogIn, LogOut, Calculator, Info, HelpCircle, Phone, UserPlus, LayoutDashboard } from "lucide-react";
import { usePathname } from "next/navigation";
import { signOut as firebaseSignOut } from "firebase/auth";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAuth, useUser } from "@/firebase";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

const navLinks = [
  { href: "/valuation", label: "Valuation", icon: Sparkles },
  { href: "/emi-calculator", label: "EMI Calculator", icon: Calculator },
  { href: "/about", label: "About", icon: Info },
  { href: "/faq", label: "FAQ", icon: HelpCircle },
  { href: "/contact", label: "Contact", icon: Phone },
];

export default function Header() {
  const pathname = usePathname();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      if (auth) {
        await firebaseSignOut(auth);
        // Optional: Redirect to home page after sign out
        // window.location.href = '/'; 
      }
    } catch (error) {
      console.error("Sign-out error", error);
    }
  };

  const renderNavLinks = (isMobile = false) =>
    navLinks.map((link) => (
      <Button
        key={link.href}
        asChild
        variant="ghost"
        onClick={() => isMobile && setIsMobileMenuOpen(false)}
        className={cn(
          "justify-start gap-2",
          pathname.startsWith(link.href)
            ? "bg-primary/10 font-semibold text-primary"
            : "",
          isMobile ? "w-full text-lg py-6" : ""
        )}
      >
        <Link href={link.href}>
          <link.icon className="h-4 w-4" />
          {link.label}
        </Link>
      </Button>
    ));

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-secondary">
      <div className="container flex h-16 items-center">
        <Link href="/" className="mr-2 flex items-center space-x-2 md:mr-6">
          <Car className="h-6 w-6 text-primary" />
          <span className="font-bold text-base sm:text-lg">mycarvalue<span className="text-primary">.in</span></span>
        </Link>
        <nav className="hidden items-center space-x-1 md:flex">
          {renderNavLinks()}
        </nav>
        <div className="flex flex-1 items-center justify-end gap-2">
          {isUserLoading ? (
            <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-20 rounded-md" />
                <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.photoURL ?? ""} alt={user.displayName ?? "User"} />
                    <AvatarFallback>
                      {user.displayName?.charAt(0).toUpperCase() ?? user.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.displayName}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className='hidden md:flex items-center gap-2'>
                <Button asChild variant="ghost" size="sm">
                    <Link href="/login">
                        <LogIn className="mr-2 h-4 w-4" />
                        Login
                    </Link>
                </Button>
                <Button asChild size="sm">
                    <Link href="/register">
                         <UserPlus className="mr-2 h-4 w-4" />
                        Register
                    </Link>
                </Button>
            </div>
          )}
          <div className="flex items-center justify-end md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle className="sr-only">Mobile Menu</SheetTitle>
                </SheetHeader>
                <div className="p-4">
                  <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="mb-8 flex items-center space-x-2">
                    <Car className="h-6 w-6 text-primary" />
                    <span className="font-bold">mycarvalue<span className="text-primary">.in</span></span>
                  </Link>
                  <nav className="flex flex-col space-y-2">
                    {user && (
                      <Button
                        asChild
                        variant="ghost"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn(
                          "justify-start gap-2",
                          pathname.startsWith('/dashboard')
                            ? "bg-primary/10 font-semibold text-primary"
                            : "",
                          "w-full text-lg py-6"
                        )}
                      >
                        <Link href="/dashboard">
                          <LayoutDashboard className="h-4 w-4" />
                          Dashboard
                        </Link>
                      </Button>
                    )}
                    {renderNavLinks(true)}
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}

    