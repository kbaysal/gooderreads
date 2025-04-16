'use client'

import * as Clerk from '@clerk/elements/common'
import * as SignIn from '@clerk/elements/sign-in'

export default function SignInPage() {
    return (
        <>
            <SignIn.Root>
                <SignIn.Step name="start">
                    <Clerk.Connection name="google">Sign in with Google</Clerk.Connection>
                </SignIn.Step>
            </SignIn.Root>
        </>
    )
}