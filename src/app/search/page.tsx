"use client"

import { LoadingOutlined } from '@ant-design/icons';
import { useAuth } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import { Spin } from 'antd';
import { use, useCallback, useEffect, useState } from 'react';
import { BookRow } from '../components/BookRow';
import Header from '../components/Header';
import { addBook } from '../hooks/booksCache';
import { existsOnShelf, firstLookup } from '../lib/data';
import styles from "../page.module.css";

const googleURLForTitle = "https://www.googleapis.com/books/v1/volumes?key=AIzaSyCZeh3yvOzMvOlIq3BPZFpVggOrMwrYpKA&maxResults=20&printType=books&q=";

export default function Search(props: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const [existingShelves, setExistingShelves] = useState<Map<string, firstLookup>>();
    const [books, setBooks] = useState<Book[]>();
    const [existingShelfLoading, setExistingShelfLoading] = useState(false);
    const { userId } = useAuth();
    const q = use(props.searchParams)?.q as string;

    const queryResults = useQuery({
        queryKey: ["search", q],
        queryFn: () => fetch(`${googleURLForTitle}${encodeURI(q)}`).then(
            async (response) => {
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
                }

                return result;
            }
        ),
        enabled: !!q,
    });
    const shelfState = useQuery({
        queryKey: ["shelf", { books: queryResults.data?.items, userId }],
        queryFn: () => existsOnShelf(queryResults.data?.items?.map((book) => book.id) as string[], userId as string),
        enabled: !!userId && !!queryResults.data,
    });

    useEffect(
        () => {
            const shelfMap = new Map<string, firstLookup>();
            shelfState?.data?.forEach(
                (book) => {
                    shelfMap.set(book.bookid, book);
                }
            )
            setExistingShelves(shelfMap);
            setExistingShelfLoading(false);
            console.log(shelfMap);
            console.log("shelfstate", shelfState);
        },
        [shelfState]
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