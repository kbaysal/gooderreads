import '@ant-design/v5-patch-for-react-19';
import {
  ClerkProvider,
  SignedIn,
  SignedOut
} from '@clerk/nextjs';
import { ConfigProvider } from "antd";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Signin from './components/Signin';
import "./globals.css";
import { useRouter } from 'next/router';

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const currentPath = router.pathname;

  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable}`}>
          {currentPath === "/_not-found" ?
            <>
              {children}
            </>
            :
            <>
              <SignedIn>
                <ConfigProvider theme={{ components: { Rate: { starColor: "#f45f67" } } }} wave={{ disabled: true }}>
                  {children}
                </ConfigProvider>
              </SignedIn>
              <SignedOut>
                <Signin />
              </SignedOut>
            </>
          }
        </body>
      </html>
    </ClerkProvider>
  );
}
