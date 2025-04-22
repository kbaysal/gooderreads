"use client"

import {
    UserButton
} from '@clerk/nextjs';
import { IconBook, IconBook2, IconBookmark, IconHome, IconVocabularyOff } from "@tabler/icons-react";
import { Button, ConfigProvider, Input, Tooltip } from "antd";
import { usePathname, useRouter } from "next/navigation";
import { KeyboardEvent, useCallback } from "react";
import { Shelf } from "../lib/helper";
import styles from "../page.module.css";

const stylesForSignedInButton = {
    elements: {
        rootBox: styles.userButton,
        userButtonPopoverFooter: styles.userPanelFooter,
        userButtonPopoverCard: styles.userPanel,
        userButtonPopoverMain: styles.userPanelContent,
        userPreview: styles.userPanelInfo,
        userButtonPopoverActions: styles.userPanelActions,
        userButtonPopoverActionButton__manageAccount: styles.displayNone
    }
};

export default function Header(props: { q?: string }) {
    const router = useRouter();

    const onEnter = useCallback(
        (e: KeyboardEvent<HTMLInputElement>) => {
            router.push(`/search?q=${(e.target as HTMLInputElement).value}`);
        },
        [router]
    );

    return (
        <div className={styles.header}>
            <div className={styles.nav}>
                <Tooltip title="Go to home">
                    <Button variant="text" color="magenta" href="/"><IconHome size={32} /></Button>
                </Tooltip>
                <div className={styles.shelfNav}>
                    <Nav shelf={Shelf.TBR} className={styles.tbrnav} color="#2baefa" icon={IconBookmark} />
                    <Nav shelf={Shelf.READING} className={styles.readingnav} color="#4395f3" icon={IconBook} />
                    <Nav shelf={Shelf.READ} className={styles.readnav} color="#5576eb" icon={IconBook2} />
                    <Nav shelf={Shelf.DNF} className={styles.dnfnav} color="#6058e2" icon={IconVocabularyOff} />
                </div>
                <UserButton appearance={stylesForSignedInButton} />
            </div>
            <div className={styles.searchbox}>
                <Input
                    placeholder="search for book, use quotes for exact match, intitle:, inauthor:"
                    onPressEnter={onEnter}
                    defaultValue={props.q}
                />
            </div>
        </div>
    );
};

const Nav = (props: { shelf: Shelf, color: string, className: string, icon: typeof IconBookmark }) => {
    const path = usePathname();
    const href = `/${(props.shelf.toLowerCase())}`;
    const activePath = path === href;
    return (
        <Tooltip title={activePath ? "" : `Go to ${props.shelf}`} >
            <ConfigProvider wave={{ disabled: true }}>
                <Button type="text" href={activePath ? "" : href} className={`${props.className} ${activePath ? styles.activeNav : ""}`}>
                    <props.icon size={32} color={activePath ? "white" : props.color} />
                </Button>
            </ConfigProvider>
        </Tooltip>
    );
};
