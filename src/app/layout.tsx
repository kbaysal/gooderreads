import '@ant-design/v5-patch-for-react-19';
import {
  ClerkProvider
} from '@clerk/nextjs';
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import MainLayout from './components/MainLayout';
import "./globals.css";
import Providers from './providers';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gooder Reads",
  description: "Created by @bookwithacherryontop",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable}`}>
          <MainLayout>
            <Providers>
              {children}
            </Providers>
          </MainLayout>
        </body>
      </html>
    </ClerkProvider>
  );
}
