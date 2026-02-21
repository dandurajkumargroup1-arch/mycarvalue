"use client";

import Link from "next/link";
import { Car, Menu, Sparkles, LogIn, LogOut, Calculator, Info, HelpCircle, Phone, UserPlus, LayoutDashboard, Shield, Flame } from "lucide-react";
import { usePathname } from "next/navigation";
import { signOut as firebaseSignOut } from "firebase/auth";
import { useState, useMemo, useEffect } from "react";
import { doc } from 'firebase/firestore';
import type { User } from 'firebase/auth';

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAuth, useUser, useFirestore, useDoc } from "@/firebase";
import type { UserProfile } from "@/lib/firebase/user-profile-service";

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
  { href: "/daily-fresh-cars", label: "Hot Listings", icon: Flame, highlight: true },
  { href: "/valuation", label: "Valuation", icon: Sparkles },
  { href: "/emi-calculator", label: "EMI Calculator", icon: Calculator },
  { href: "/about", label: "About", icon: Info },
  { href: "/faq", label: "FAQ", icon: HelpCircle },
  { href: "/contact", label: "Contact", icon: Phone },
];

function AuthSection({
  user,
  userProfile,
  isUserLoading,
  isProfileLoading,
  isAdmin
}: {
  user: User | null;
  userProfile: UserProfile | null;
  isUserLoading: boolean;
  isProfileLoading: boolean;
  isAdmin: boolean;
}) {
  const auth = useAuth();
  
  const handleSignOut = async () => {
    try {
      if (auth) {
        await firebaseSignOut(auth);
        window.location.href = '/';
      }
    } catch (error) {
      console.error("Sign-out error", error);
    }
  };

  if (isUserLoading || (user && isProfileLoading)) {
    return (
      <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    );
  }

  if (user) {
    const displayName = userProfile?.displayName || user.email;

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.photoURL ?? ""} alt={displayName ?? "User"} />
              <AvatarFallback>
                {displayName?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{displayName}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {isAdmin ? (
             <DropdownMenuItem asChild>
              <Link href="/admin">
                <Shield className="mr-2 h-4 w-4" />
                <span>Admin Panel</span>
              </Link>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem asChild>
              <Link href="/dashboard">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                <span>Dashboard</span>
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className='hidden md:flex items-center gap-2'>
        <Button asChild variant="outline" size="sm">
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
  );
}


export default function Header() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const userProfileRef = useMemo(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  const isAdmin = useMemo(() => {
    if (isUserLoading || !user) {
        return false;
    }
    if (user.email === 'rajmycarvalue@gmail.com') {
        return true;
    }
    if (isProfileLoading) {
        return false;
    }
    return userProfile?.role === 'Admin';
  }, [user, isUserLoading, userProfile, isProfileLoading]);


  const renderNavLinks = (isMobile = false) =>
    navLinks.map((link) => (
      <Button
        key={link.href}
        asChild
        variant="ghost"
        onClick={() => isMobile && setIsMobileMenuOpen(false)}
        className={cn(
          "justify-start gap-2 transition-all",
          pathname.startsWith(link.href)
            ? "bg-primary/10 font-bold text-primary"
            : "",
          link.highlight && !pathname.startsWith(link.href) ? "bg-muted/50 hover:bg-primary/10" : "",
          isMobile ? "w-full text-lg py-6" : "px-3"
        )}
      >
        <Link href={link.href} className="flex items-center gap-2">
          <link.icon className={cn("h-4 w-4", link.highlight && "text-primary")} />
          <span>{link.label}</span>
          {link.highlight && !isMobile && <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>}
        </Link>
      </Button>
    ));

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-secondary backdrop-blur-md">
      <div className="container flex h-16 items-center">
        <Link href="/" className="mr-2 flex items-center space-x-2 md:mr-6">
          <Car className="h-7 w-7 text-primary" />
          <span className="font-black text-lg sm:text-xl tracking-tight">mycarvalue<span className="text-primary">.in</span></span>
        </Link>
        <nav className="hidden items-center space-x-1 md:flex">
          {renderNavLinks()}
        </nav>
        <div className="flex flex-1 items-center justify-end gap-2">
          <AuthSection 
            user={user}
            userProfile={userProfile as UserProfile | null}
            isUserLoading={isUserLoading}
            isProfileLoading={isProfileLoading}
            isAdmin={isAdmin}
          />
          <div className="flex items-center justify-end md:hidden">
            {isClient ? (
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Toggle Menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px]">
                  <SheetHeader>
                    <SheetTitle className="sr-only">Mobile Menu</SheetTitle>
                  </SheetHeader>
                  <div className="p-4 flex flex-col h-full">
                    <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="mb-10 flex items-center space-x-2">
                      <Car className="h-8 w-8 text-primary" />
                      <span className="font-black text-2xl tracking-tighter">mycarvalue<span className="text-primary">.in</span></span>
                    </Link>
                    <nav className="flex flex-col space-y-3 flex-1 overflow-y-auto">
                       {user && (
                          isAdmin ? (
                            <Button
                              asChild
                              variant="ghost"
                              onClick={() => setIsMobileMenuOpen(false)}
                              className={cn("justify-start gap-3 w-full text-xl py-8", pathname.startsWith('/admin') && "bg-primary/10 font-bold text-primary")}
                            >
                              <Link href="/admin"><Shield className="h-6 w-6 text-primary" />Admin Panel</Link>
                            </Button>
                          ) : (
                             <Button
                              asChild
                              variant="ghost"
                              onClick={() => setIsMobileMenuOpen(false)}
                              className={cn("justify-start gap-3 w-full text-xl py-8", pathname.startsWith('/dashboard') && "bg-primary/10 font-bold text-primary")}
                            >
                              <Link href="/dashboard"><LayoutDashboard className="h-6 w-6 text-primary" />Dashboard</Link>
                            </Button>
                          )
                       )}
                      {!user && (
                          <div className="flex flex-col space-y-3 pb-4 border-b">
                              <Button asChild variant="ghost" size="lg" className="w-full text-xl py-8 justify-start font-bold">
                                  <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                                      <LogIn className="mr-3 h-6 w-6 text-primary" />
                                      Login
                                  </Link>
                              </Button>
                              <Button asChild size="lg" className="w-full text-xl py-8 justify-start font-black">
                                  <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
                                      <UserPlus className="mr-3 h-6 w-6" />
                                      Register
                                  </Link>
                              </Button>
                          </div>
                       )}
                      <div className="space-y-2 pt-4">
                        {renderNavLinks(true)}
                      </div>
                    </nav>
                    <div className="mt-auto pt-6 border-t text-center text-xs text-muted-foreground">
                        <p>&copy; {new Date().getFullYear()} mycarvalue.in</p>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            ) : (
               <Skeleton className="h-10 w-10" />
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
