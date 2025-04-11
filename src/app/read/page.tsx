"use client"

import Header from "../components/Header";
import styles from "../page.module.css";

export default function TBR() {
    return (
        <div className={styles.page}>
            <Header />
            These are your read books!
        </div>
    )
}
