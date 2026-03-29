import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Flushion Fabric AI",
  description: "Next-Generation AI Fabric-to-Fashion Engine",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} h-full antialiased`}>
      <head>
        <meta name="theme-color" content="#0f0f11" />
      </head>
      <body className="font-sans text-neutral-200 selection:bg-rose-500/30">
        <div className="relative z-10 min-h-screen flex flex-col">
          <header className="w-full flex justify-between items-center px-8 py-5 border-b border-white/5 backdrop-blur-md sticky top-0 z-50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-500 to-violet-600 flex items-center justify-center animate-pulse shadow-lg shadow-rose-500/20">
                <span className="text-white font-bold text-xs">AI</span>
              </div>
              <h1 className="text-xl font-bold tracking-tight">Flushion <span className="text-white/40 font-light">Engine</span></h1>
            </div>
            <nav className="hidden md:flex gap-6 text-sm font-medium text-neutral-400">
              <a href="#" className="hover:text-white transition-colors">Studio</a>
              <a href="#" className="hover:text-white transition-colors">Gallery</a>
              <a href="#" className="hover:text-white transition-colors">Analytics</a>
            </nav>
            <button className="px-5 py-2 text-sm font-medium rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-white">
              Connect
            </button>
          </header>
          <main className="flex-1 w-full max-w-[1400px] mx-auto p-4 md:p-8 flex flex-col items-center">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
