"use client"

import { LoadingOutlined } from '@ant-design/icons';
import { useAuth } from "@clerk/nextjs";
import { Spin } from "antd";
import { useEffect, useState } from "react";
import { BookFilter, firstLookup, getBooksWithFilter } from "../lib/data";
import { getBooks } from "../lib/helper";
import styles from "../page.module.css";
import { BookRow } from "./BookRow";
import Header from "./Header";

export default function ShelfView(props: { filter: BookFilter, title: string }) {
    const [books, setBooks] = useState<Book[]>();
    const [summarizedBookInfo, setSummarizedBookInfo] = useState<firstLookup[]>();
    const { userId } = useAuth();
    const [noResults, setNoResults] = useState(false);

    useEffect(
        () => {
            if (userId) {
                getBooksWithFilter(userId, props.filter).then(
                    (response) => {
                        console.log(response);
                        const bookIds = response.map((value) => value.bookid);
                        setSummarizedBookInfo(response);
                        getBooks(bookIds).then((results) => {
                            console.log("results", results);
                            if (results.length === 0) {
                                setBooks([]);
                                setNoResults(true);
                            } else if ((results?.[0] as Book).id && (results?.[0] as Book).volumeInfo) {
                                setBooks(results.filter((result) => (result as Book).id) as Book[]);
                            }
                        });
                    }
                );
            }
        },
        [props.filter, userId]
    );

    return (
        <div className={styles.page}>
            <Header />
            <h3 className={styles.todoTitle}>{props.title}{books ? ` (${books.length})`: ""}:</h3>
            {!books && <Spin indicator={<LoadingOutlined spin />} size="large" className="pageLoading" />}
            {noResults && <div>No books were found matching this list</div>}
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
