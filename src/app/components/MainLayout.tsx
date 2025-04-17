'use client'

import { SignedIn, SignedOut } from '@clerk/nextjs';
import { ConfigProvider } from 'antd';
import { usePathname } from 'next/navigation';
import Signin from './Signin';

const paths = [
    "/tbr",
    "reading",
    "/read",
    "/dnf"
]

export default function MainLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const path = usePathname();

    return (
        <>
            {path === "/" || path in paths ?
                <>
                    <SignedIn>
                        <ConfigProvider theme={{ components: { Rate: { starColor: "#f45f67" } } }} wave={{ disabled: true }}>
                            {children}
                        </ConfigProvider>
                    </SignedIn>
                    <SignedOut>
                        <Signin />
                    </SignedOut>
                </> :
                <>
                    {children}
                </>
            }
        </>
    )
}