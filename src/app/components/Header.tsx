"use client"

import { IconBook, IconBook2, IconBookmark, IconHome, IconVocabularyOff } from "@tabler/icons-react";
import { Button, Tooltip } from "antd";
import styles from "../page.module.css";

export default function Home() {
    return (
        <div className={styles.nav}>
            <Tooltip title="Go to home">
                <Button variant="text" color="magenta" href="/"><IconHome size={32} /></Button>
            </Tooltip>
            <div className={styles.shelfNav}>
                <Tooltip title="Go to TBR">
                    <Button type="text" href="/tbr" className={styles.tbrnav}><IconBookmark size={32} color="#2baefa" /></Button>
                </Tooltip>
                <Tooltip title="Go to Reading">
                    <Button type="text" href="/reading" className={styles.readingnav}><IconBook size={32} color="#4395f3" /></Button>
                </Tooltip>
                <Tooltip title="Go to Read">
                    <Button type="text" href="/read" className={styles.readnav}><IconBook2 size={32} color="#5576eb" /></Button>
                </Tooltip>
                <Tooltip title="Go to DNF">
                    <Button type="text" href="/dnf" className={styles.dnfnav}><IconVocabularyOff size={32} color="#6058e2" /></Button>
                </Tooltip>
            </div>
        </div>
    );
}