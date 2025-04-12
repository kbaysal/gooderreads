"use client"

import { useEffect, useState } from "react";
import Header from "./Header";
import styles from "../page.module.css";
import { getBooks, Shelf, userId } from "../lib/helper";
import { firstLookup, getBooksFromShelf } from "../lib/data";
import { Spin } from "antd";
import { LoadingOutlined } from '@ant-design/icons';
import { BookRow } from "./BookRow";

export default function ShelfView(props: {shelf: Shelf}) {
    const [books, setBooks] = useState<Book[]>();
    const [summarizedBookInfo, setSummarizedBookInfo]= useState<firstLookup[]>();
    useEffect(
        () => {
            getBooksFromShelf(props.shelf, userId).then(
                (response) => {
                    console.log(response);
                    const bookIds = response.map((value) => value.bookid);
                    setSummarizedBookInfo(response);
                    getBooks(bookIds).then((results) => {
                        console.log("results", results);
                        setBooks(results);
                    });
                }
            );
        },
        [props.shelf]
    );

    return (
        <div className={styles.page}>
            <Header />
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
