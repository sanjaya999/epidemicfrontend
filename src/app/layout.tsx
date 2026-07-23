import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "EpidemicSim",
  description: "Epidemic spread simulator",
};

import { Toaster } from "@/components/ui/sonner";
import { Sidebar } from "@/components/sidebar";
import { AuthProvider } from "@/components/auth-provider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${ibmPlexSans.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex">
        <AuthProvider>
          <Sidebar />
          <main className="flex-1 flex flex-col min-h-screen min-w-0 bg-background">
            {children}
          </main>
        </AuthProvider>
        <Toaster position="top-right" closeButton />
      </body>
    </html>
  );
}
