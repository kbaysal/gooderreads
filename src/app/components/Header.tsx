"use client"

import { IconBook, IconBook2, IconBookmark, IconHome, IconVocabularyOff } from "@tabler/icons-react";
import { Button, ConfigProvider, Tooltip } from "antd";
import { usePathname } from "next/navigation";
import { Shelf } from "../lib/helper";
import styles from "../page.module.css";

export default function Home() {
    const path = usePathname();
    console.log("path", path);
    return (
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
