"use client"

import { LoadingOutlined } from '@ant-design/icons';
import { useAuth } from '@clerk/nextjs';
import { Spin } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { BookRow } from '../components/BookRow';
import Header from '../components/Header';
import { addBook } from '../hooks/booksCache';
import { existsOnShelf, firstLookup } from '../lib/data';
import { googleURLForTitle } from '../page';
import styles from "../page.module.css";

export default function Search(props: {
    searchParams: { [key: string]: string }
}) {
    const [existingShelves, setExistingShelves] = useState<Map<string, firstLookup>>();
    const [books, setBooks] = useState<Book[]>();
    const [existingShelfLoading, setExistingShelfLoading] = useState(false);
    const { userId } = useAuth();

    const q = props.searchParams.q;

    useEffect(
        () => {
            fetch(`${googleURLForTitle}${encodeURI(q)}`).then(
                async (response) => {
                    setExistingShelfLoading(true);
                    const result: BookResponse = await response.json();
                    console.log(result);
                    const resultSet = new Map<string, Book>();
                    if (result?.items?.length > 0) {
                        result.items = result.items.filter((book) => {
                            if (book.volumeInfo?.title && book.volumeInfo?.authors?.length > 0) {
                                addBook(book);
                                resultSet.set(book.id, book);
                                return true;
                            }
                            return false;
                        });

                        setBooks(Array.from(resultSet.values()));

                        const shelfState = await existsOnShelf(result.items.map((book) => book.id), userId as string);
                        const shelfMap = new Map<string, firstLookup>();
                        shelfState.forEach(
                            (book) => {
                                shelfMap.set(book.bookid, book);
                            }
                        )
                        setExistingShelves(shelfMap);
                        setExistingShelfLoading(false);
                        console.log(shelfMap);
                        console.log("shelfstate", shelfState);
                    }
                }
            );
        },
        [userId, q]
    );



    const updateId = useCallback(
        (id: number, bookId: string) => {
            const newExistingShelves = new Map(existingShelves);
            newExistingShelves.set(bookId, { ...newExistingShelves.get(bookId) as firstLookup, id });
            setExistingShelves(newExistingShelves);
        },
        [existingShelves]
    );

    return (
        <div className={styles.page}>
            <Header q={q} />
            {existingShelfLoading && <Spin indicator={<LoadingOutlined spin />} size="large" className={styles.pageLoading} />}
            {books && !existingShelfLoading &&
                <div className={styles.bookResults}>
                    {books.map(
                        (book) => {
                            const firstState = existingShelves?.get(book.id);
                            return <BookRow book={book} key={book.id} firstState={firstState as firstLookup} updateId={updateId} />
                        }
                    )}
                </div>
            }
        </div>
    );
}