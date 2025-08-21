"use client";
import React, { JSX, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "./ThemeProvider";
import { User, LogOut, LogIn, Plus, Palette, ChevronDown, Menu, X } from "lucide-react";

const Header: React.FC<{ className?: string }> = ({ className }) => {
  const router = useRouter();
  const { theme, themes, setTheme, toggle } = useTheme();

  const [visible] = useState(true);
  const [username, setUsername] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const authed = useMemo(() => (mounted ? !!localStorage.getItem("token") : false), [mounted, username]);

  useEffect(() => {
    setMounted(true);
    try {
      setUsername(localStorage.getItem("username"));
    } catch {}
    const onStorage = () => setUsername(localStorage.getItem("username"));
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowThemeDropdown(false);
      setShowMobileMenu(false);
    };
    if (showThemeDropdown || showMobileMenu) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [showThemeDropdown, showMobileMenu]);

  const navItems: { name: string; link: string; icon?: JSX.Element }[] = useMemo(() => {
    const items: { name: string; link: string; icon?: JSX.Element }[] = [{ name: "Home", link: "/" }];
    if (authed)
      items.push({ name: "Create", link: "/create", icon: <Plus size={18} /> });
    else
      items.push(
        { name: "Login", link: "/login", icon: <LogIn size={18} /> },
        { name: "Signup", link: "/signup", icon: <User size={18} /> }
      );
    return items;
  }, [authed]);

  const logout = () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userId");
      localStorage.removeItem("username");
      // Expire auth cookie so middleware stops treating user as logged in
      document.cookie = `auth=; Path=/; Max-Age=0; SameSite=Lax`;
    } catch {}
    setUsername(null);
    router.push("/login");
  };

  const Logo = () => (
    <Link
      href="/"
      className={cn(
        "relative flex items-center px-5 py-2 rounded-full border border-border bg-background shadow-sm"
      )}
      tabIndex={0}
    >
      <span className="text-lg font-bold text-primary tracking-tight">Whispurr</span>
      <span
        className="absolute left-1/4 right-1/4 bottom-1 h-0.5 rounded bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-75"
        aria-hidden="true"
      />
    </Link>
  );

  const ThemeSelector = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={cn("relative", !mobile && "ml-2")}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowThemeDropdown(!showThemeDropdown);
        }}
        title="Select theme"
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-full border border-border transition-colors bg-background text-primary hover:bg-muted",
          mobile && "w-full justify-start"
        )}
        type="button"
        tabIndex={0}
      >
        <Palette size={16} />
        <span suppressHydrationWarning className="text-xs font-medium capitalize">{theme}</span>
        <ChevronDown size={14} className={cn("transition-transform", showThemeDropdown && "rotate-180")} />
      </button>

      {showThemeDropdown && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          className={cn(
            "absolute right-0 top-full mt-2 py-2 min-w-[140px] rounded-lg border border-border bg-background shadow-lg z-50",
            mobile && "left-0 right-auto"
          )}
        >
          {themes.map((themeOption) => (
            <button
              key={themeOption}
              onClick={() => {
                setTheme(themeOption);
                setShowThemeDropdown(false);
              }}
              className={cn(
                "w-full px-4 py-2 text-left text-sm font-medium transition-colors hover:bg-muted",
                theme === themeOption ? "text-accent bg-muted/50" : "text-primary"
              )}
            >
              <span className="capitalize">{themeOption}</span>
              {theme === themeOption && <span className="float-right">✓</span>}
            </button>
          ))}
          <hr className="my-1 border-border" />
          <button
            onClick={() => {
              toggle();
              setShowThemeDropdown(false);
            }}
            className="w-full px-4 py-2 text-left text-sm font-medium text-muted-foreground hover:bg-muted hover:text-primary"
          >
            Cycle themes
          </button>
        </motion.div>
      )}
    </div>
  );

  const MobileMenu = () => (
    <div className="relative md:hidden">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowMobileMenu(!showMobileMenu);
        }}
        className={cn(
          "flex items-center px-3 py-2 rounded-full border border-border transition-colors bg-background text-primary hover:bg-muted"
        )}
        type="button"
        tabIndex={0}
      >
        {showMobileMenu ? <X size={18} /> : <Menu size={18} />}
      </button>

      <AnimatePresence>
        {showMobileMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className={cn(
              "absolute right-0 top-full mt-2 py-3 min-w-[200px] rounded-lg border border-border bg-background shadow-lg z-50"
            )}
          >
            {/* Navigation Items */}
            <div className="px-2 pb-3">
              {navItems.map((navItem, idx) => (
                <Link
                  key={`mobile-nav-${idx}`}
                  href={navItem.link}
                  onClick={() => setShowMobileMenu(false)}
                  className={cn(
                    "flex items-center w-full px-3 py-2 mb-1 rounded-full text-sm font-medium transition-colors bg-muted/60 hover:bg-muted text-primary",
                    authed && navItem.name === "Create" && "font-semibold text-accent"
                  )}
                  tabIndex={0}
                >
                  <span className="mr-3">{navItem.icon}</span>
                  <span>{navItem.name}</span>
                </Link>
              ))}
            </div>

            {/* Auth Section */}
            {authed && (
              <div className="px-2 pb-3 border-b border-border mb-3">
                <Link
                  href="/account/profile"
                  onClick={() => setShowMobileMenu(false)}
                  className="flex items-center gap-1 px-3 py-2 rounded-full bg-muted text-primary text-sm font-medium mb-2 hover:bg-muted/80"
                >
                  <span>Hello,</span>
                  <span className="font-bold">{username || "User"}</span>
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setShowMobileMenu(false);
                  }}
                  className={cn(
                    "flex items-center w-full px-3 py-2 rounded-full border border-border text-sm transition-colors font-medium bg-muted hover:bg-accent/10 text-primary"
                  )}
                  tabIndex={0}
                >
                  <LogOut size={16} className="mr-3" />
                  Logout
                </button>
              </div>
            )}

            {/* Theme Selector */}
            <div className="px-2">
              <ThemeSelector mobile />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <AnimatePresence mode="wait">
      <motion.header
        initial={{ opacity: 1 }}
        animate={{ opacity: visible ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "fixed inset-x-0 top-3 z-[5000] flex items-center justify-between mx-auto max-w-4xl px-4 py-2 rounded-full border border-border bg-background shadow-lg",
          className
        )}
        role="navigation"
      >
        {/* Logo */}
        <Logo />

        {/* Desktop Navigation */}
        <nav className="hidden md:flex gap-2 items-center">
          {navItems.map((navItem, idx) => (
            <Link
              key={`nav-${idx}`}
              href={navItem.link}
              className={cn(
                "group flex items-center px-4 py-1.5 mx-1 rounded-full text-sm font-medium transition-colors bg-muted/60 hover:bg-muted text-primary",
                authed && navItem.name === "Create" && "font-semibold text-accent"
              )}
              tabIndex={0}
            >
              <span className="mr-2">{navItem.icon}</span>
              <span>{navItem.name}</span>
            </Link>
          ))}
        </nav>

        {/* Desktop Right Section */}
        <div className="hidden md:flex items-center gap-3 pl-3 border-l border-border ml-3">
          {authed ? (
            <>
              <Link
                href="/account/profile"
                className="hidden lg:flex items-center gap-1 px-3 py-1 rounded-full bg-muted text-primary text-xs font-medium hover:bg-muted/80"
              >
                <span>Hello,</span>
                <span className="font-bold">{username || "User"}</span>
              </Link>
              <button
                onClick={logout}
                className={cn(
                  "flex items-center px-4 py-1.5 rounded-full border border-border text-sm transition-colors font-medium bg-muted hover:bg-accent/10 text-primary"
                )}
                tabIndex={0}
              >
                <LogOut size={16} className="mr-2" />
                <span className="hidden lg:inline">Logout</span>
                <span className="lg:hidden">
                  <LogOut size={16} />
                </span>
              </button>
            </>
          ) : null}
          <ThemeSelector />
        </div>

        {/* Mobile Menu */}
        <MobileMenu />
      </motion.header>
    </AnimatePresence>
  );
};

export default Header;
