"use client"

import {
    useAuth,
    UserButton
} from '@clerk/nextjs';
import { IconBook, IconBook2, IconBookmark, IconHome, IconPlus, IconShoppingBag, IconVocabularyOff } from "@tabler/icons-react";
import { Button, ConfigProvider, Dropdown, Input, Tooltip } from "antd";
import { usePathname, useRouter } from "next/navigation";
import { KeyboardEvent, memo, useCallback, useMemo, useState } from "react";
import { Shelf, wanttobuyPath, wanttobuyTitle } from "../lib/helper";
import styles from "../page.module.css";
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { getLists } from '../lib/lists';

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

function Header(props: { q?: string }) {
    const router = useRouter();

    const onEnter = useCallback(
        (e: KeyboardEvent<HTMLInputElement>) => {
            router.push(`/search?q=${(e.target as HTMLInputElement).value}`);
        },
        [router]
    );
    const onHomeClick = useCallback(() => router.push("/"), [router]);

    return (
        <div className={styles.header}>
            <div className={styles.nav}>
                <UserButton appearance={stylesForSignedInButton} />
                <Tooltip title="Go to home">
                    <Button variant="text" color="magenta" onClick={onHomeClick}>
                        <IconHome size={32} />
                    </Button>
                </Tooltip>
                <div className={styles.shelfNav}>
                    <Nav shelf={Shelf.TBR} className={styles.tbrnav} color="#2baefa" icon={IconBookmark} />
                    <Nav shelf={Shelf.READING} className={styles.readingnav} color="#4199f4" icon={IconBook} />
                    <Nav shelf={Shelf.READ} className={styles.readnav} color="#4f83ee" icon={IconBook2} />
                    <Nav shelf={Shelf.DNF} className={styles.dnfnav} color="#586ee8" icon={IconVocabularyOff} />
                    <SmartList color="#6058e2" />
                </div>
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
    const [isHover, setHover] = useState(false);
    const router = useRouter();

    const onMouseEnter = useCallback(
        () => {
            setHover(true);
        },
        []
    );
    const onMouseExit = useCallback(
        () => {
            setHover(false);
        },
        []
    );

    const onClick = useCallback(() => !activePath && router.push(href), [router, href, activePath]);
    return (
        <Tooltip title={activePath ? "" : `Go to ${props.shelf}`} >
            <ConfigProvider wave={{ disabled: true }}>
                <Button
                    type="text"
                    style={{
                        backgroundColor: activePath ? props.color : isHover ? `${props.color}20` : "transparent",
                        color: activePath ? "white" : props.color
                    }}
                    className={`${props.className} ${activePath ? styles.activeNav : ""}`}
                    onMouseEnter={onMouseEnter}
                    onMouseLeave={onMouseExit}
                    onClick={onClick}
                >
                    <props.icon size={32} color={activePath ? "white" : props.color} />
                </Button>
            </ConfigProvider>
        </Tooltip>
    );
};


const SmartList = (props: { color: string }) => {
    const [isHover, setHover] = useState(false);
    const { userId } = useAuth();
    const { data: lists } = useQuery({
        queryKey: ["lists"],
        queryFn: () => getLists(userId as string),
        enabled: !!userId
    })

    console.log("lists", lists)
    const onMouseEnter = useCallback(
        (open: boolean) => {
            setHover(open);
        },
        []
    );

    const listElements = useMemo(() => {
        if (lists) {
            return lists?.map(
                (list) => {
                    return ({ label: <Link href={`/lists/${list.id}`} className={styles.customList}>{list.name}</Link>, key: list.id })
                })
        }

        return [];
    },
        [lists]
    )

    return (
        <Dropdown
            menu={{
                items: [
                    { label: <Link href="/lists">Add your list</Link>, key: "Add", icon: <IconPlus /> },
                    { label: <Link href={`/lists/${wanttobuyPath}`}>{wanttobuyTitle}</Link>, key: wanttobuyTitle, icon: <IconShoppingBag /> },
                    ...listElements
                ]
            }}
            onOpenChange={onMouseEnter}
        >
            <IconPlus
                size={32}
                color={props.color}
                style={{
                    backgroundColor: isHover ? `${props.color}20` : "transparent",
                }}
            />
        </Dropdown>
    );
};

export default memo(Header);
