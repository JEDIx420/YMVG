"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface LayoutWrapperProps {
  children: React.ReactNode;
  user: any;
}

export default function LayoutWrapper({ children, user }: LayoutWrapperProps) {
  const pathname = usePathname();
  
  // Conditionally hide standard Navbar & Footer on any dashboard route
  const isDashboard = pathname?.startsWith("/dashboard");

  return (
    <>
      {!isDashboard && <Navbar user={user} />}
      <main className="flex-grow flex flex-col">
        {children}
      </main>
      {!isDashboard && <Footer />}
    </>
  );
}
