import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Grid",
  description: "AI Agent Platform for Messaging",
};

const navItems = [
  { href: "/", label: "Overview" },
  { href: "/prompts", label: "Prompts" },
  { href: "/agents", label: "Agents" },
  { href: "/chats", label: "Chats" },
  { href: "/events", label: "Events" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <div className="flex h-screen">
          <aside className="w-56 border-r border-border bg-card flex flex-col">
            <div className="p-4 border-b border-border">
              <h1 className="text-xl font-bold tracking-tight">Grid</h1>
              <p className="text-xs text-muted-foreground">AI Agent Platform</p>
            </div>
            <nav className="flex-1 p-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
