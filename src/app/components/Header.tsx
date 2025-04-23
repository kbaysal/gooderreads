"use client"

import {
    UserButton
} from '@clerk/nextjs';
import { IconBook, IconBook2, IconBookmark, IconHome, IconPlus, IconShoppingBag, IconVocabularyOff } from "@tabler/icons-react";
import { Button, ConfigProvider, Dropdown, Input, Tooltip } from "antd";
import { usePathname, useRouter } from "next/navigation";
import { KeyboardEvent, useCallback } from "react";
import { Shelf, wanttobuyPath, wanttobuyTitle } from "../lib/helper";
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
                    <Nav shelf={Shelf.READING} className={styles.readingnav} color="#4199f4" icon={IconBook} />
                    <Nav shelf={Shelf.READ} className={styles.readnav} color="#4f83ee" icon={IconBook2} />
                    <Nav shelf={Shelf.DNF} className={styles.dnfnav} color="#586ee8" icon={IconVocabularyOff} />
                    <SmartList color="#6058e2" />
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
                <Button
                    type="text"
                    href={activePath ? "" : href}
                    style={{
                        backgroundColor: activePath ? props.color : "transparent",
                        color: activePath ? "white" : props.color
                    }}
                    className={`${props.className} ${activePath ? styles.activeNav : ""}`}
                >
                    <props.icon size={32} color={activePath ? "white" : props.color} />
                </Button>
            </ConfigProvider>
        </Tooltip>
    );
};


const SmartList = (props: { color: string }) => {
    const router = useRouter();
    const onClick = useCallback(
        () => {
            router.push(`/lists/${wanttobuyPath}`);
        },
        [router]
    )
    return (
        <Dropdown
            menu={{
                items: [
                    { label: "Add your list", key: "Add", icon: <IconPlus /> },
                    { label: wanttobuyTitle, key: wanttobuyTitle, icon: <IconShoppingBag />, onClick: onClick },
                ]
            }}
        >
            <IconPlus size={32} color={props.color} />
        </Dropdown>
    );
};
