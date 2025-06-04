import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { AppProvider } from "@/components/providers/app-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nuru Learn - Advanced Multimodal Education",
  description: "AI-powered bilingual learning platform for Kpelle-English education with voice, image, and cultural context",
  keywords: ["Kpelle", "English", "education", "AI", "multimodal", "voice", "cultural learning"],
  authors: [{ name: "Nuru AI" }],
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 dark:bg-gray-900`}
      >
        <AppProvider>
          {children}
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              className: "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700",
            }}
          />
        </AppProvider>
      </body>
    </html>
  );
}
