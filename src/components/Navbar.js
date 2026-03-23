"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { clearSession, getSession } from "@/lib/auth";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setUser(getSession());
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  function handleLogout() {
    clearSession();
    router.push("/");
  }

  const links = [
    { href: "/dashboard", label: "IPQC Records" },
    { href: "/ipqc/new", label: "New IPQC" },
    { href: "/settings", label: "Settings" },
    ...(user?.isAdmin ? [{ href: "/members", label: "Members" }] : []),
  ];

  function isActive(href) {
    return pathname === href;
  }

  return (
    <nav className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border-b border-white/10 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <img src="/candor-logo.jpg" alt="Logo" className="w-7 h-7 sm:w-8 sm:h-8 rounded-md object-contain bg-white p-0.5" />
            <span className="text-base sm:text-lg font-bold text-white tracking-tight">Candor QC</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  isActive(link.href)
                    ? "bg-white/15 text-white"
                    : "text-blue-200/70 hover:text-white hover:bg-white/10"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop user area */}
          <div className="hidden md:flex items-center gap-3">
            {user && (
              <span className="text-sm text-blue-200/60">{user.displayName}</span>
            )}
            <button
              onClick={handleLogout}
              className="text-sm text-red-300/80 hover:text-red-300 font-medium px-3 py-1.5 rounded-lg hover:bg-white/10 transition-all"
            >
              Logout
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg text-blue-200/70 hover:text-white hover:bg-white/10 transition-all"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 bg-slate-900/95 backdrop-blur-xl">
          <div className="px-4 py-3 space-y-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive(link.href)
                    ? "bg-white/15 text-white"
                    : "text-blue-200/70 hover:text-white hover:bg-white/10"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="border-t border-white/10 px-4 py-3 flex items-center justify-between">
            {user && (
              <span className="text-sm text-blue-200/60">{user.displayName}</span>
            )}
            <button
              onClick={handleLogout}
              className="text-sm text-red-300/80 hover:text-red-300 font-medium px-3 py-1.5 rounded-lg hover:bg-white/10 transition-all"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
