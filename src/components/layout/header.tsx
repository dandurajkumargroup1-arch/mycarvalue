
"use client";

import Link from "next/link";
import { Car, Menu, Sparkles, LogIn, LogOut, Calculator, Info, HelpCircle, Phone } from "lucide-react";
import { usePathname } from "next/navigation";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { useState } from "react";
import { doc, getDoc } from 'firebase/firestore';

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAuth, useUser, useFirestore } from "@/firebase";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { upsertUserProfile } from "@/lib/firebase/user-profile-service";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { RoleSelectionDialog } from "../RoleSelectionDialog";

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
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [pendingUser, setPendingUser] = useState<User | null>(null);

  const handleGoogleSignIn = async () => {
    if (!auth || !firestore) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Firebase is not initialized. Please try again later.",
      });
      return;
    }
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const signedInUser = result.user;

      const userDocRef = doc(firestore, 'users', signedInUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        await upsertUserProfile(firestore, signedInUser, {});
        toast({
          title: "Signed In",
          description: `Welcome back, ${signedInUser.displayName}!`,
        });
      } else {
        setPendingUser(signedInUser);
        setShowRoleDialog(true);
      }

    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
        console.error("Google sign-in error", error);
        toast({
          variant: "destructive",
          title: "Sign-in Failed",
          description: "Could not sign you in with Google. Please try again.",
        });
      }
    }
  };

  const handleRoleSelected = async (role: 'Owner' | 'Agent' | 'Mechanic') => {
    if (pendingUser && firestore) {
      await upsertUserProfile(firestore, pendingUser, { role });
      toast({
        title: "Welcome!",
        description: `Your profile as a ${role} has been created.`,
      });
      setShowRoleDialog(false);
      setPendingUser(null);
    }
  };

  const handleSignOut = async () => {
    try {
      if (auth) {
        await firebaseSignOut(auth);
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
      <RoleSelectionDialog 
        open={showRoleDialog}
        onOpenChange={setShowRoleDialog}
        onRoleSelect={handleRoleSelected}
      />
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
            <Skeleton className="h-8 w-20 rounded-md" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.photoURL ?? ""} alt={user.displayName ?? "User"} />
                    <AvatarFallback>
                      {user.displayName?.charAt(0) ?? user.email?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={handleGoogleSignIn} size="sm">
              <LogIn className="mr-2 h-4 w-4" />
              Sign In
            </Button>
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
                  <nav className="flex flex-col space-y-2">{renderNavLinks(true)}</nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
