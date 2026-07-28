import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "InkHive | AI Content Marketing",
  description: "Transform one idea into a thriving ecosystem of content. Generate blog posts, social media, and email newsletters with AI.",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} min-h-screen bg-background text-foreground antialiased flex flex-col`}
      >
        <TooltipProvider>
          {children}
        </TooltipProvider>
        <Toaster 
          position="bottom-right" 
          toastOptions={{
            style: {
              background: '#FAFAF9',
              border: '1px solid #E7E5E4',
              borderRadius: '0.75rem',
            },
          }}
        />
      </body>
    </html>
  );
}
