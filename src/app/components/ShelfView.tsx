"use client"

import { useEffect, useState } from "react";
import Header from "./Header";
import styles from "../page.module.css";
import { getBooks, Shelf } from "../lib/helper";
import { firstLookup, getBooksFromShelf } from "../lib/data";
import { Spin } from "antd";
import { LoadingOutlined } from '@ant-design/icons';
import { BookRow } from "./BookRow";
import { useAuth } from "@clerk/nextjs";

export default function ShelfView(props: { shelf: Shelf }) {
    const [books, setBooks] = useState<Book[]>();
    const [summarizedBookInfo, setSummarizedBookInfo] = useState<firstLookup[]>();
    const { userId } = useAuth();

    useEffect(
        () => {
            if (userId) {
                getBooksFromShelf(props.shelf, userId).then(
                    (response) => {
                        console.log(response);
                        const bookIds = response.map((value) => value.bookid);
                        setSummarizedBookInfo(response);
                        getBooks(bookIds).then((results) => {
                            console.log("results", results);
                            if ((results?.[0] as Book).id && (results?.[0] as Book).volumeInfo) {
                                setBooks(results as Book[]);
                            }
                        });
                    }
                );
            }
        },
        [props.shelf, userId]
    );

    return (
        <div className={styles.page}>
            <Header />
            <h3 className={styles.todoTitle}>{props.shelf}{books ? `(${books.length})` : ""}:</h3>
            {!books && <Spin indicator={<LoadingOutlined spin />} size="large" className="pageLoading" />}
            {books &&
                <div className={styles.bookResults}>
                    {books.map(
                        (book, index) => {
                            return <BookRow book={book} key={book.id} firstState={summarizedBookInfo?.[index] as firstLookup} />
                        }
                    )}
                </div>
            }
        </div>
    )
}
