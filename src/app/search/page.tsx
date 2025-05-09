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
    const [existingShelfLoading, setExistingShelfLoading] = useState(false);
    const { userId } = useAuth();
    const q = use(props.searchParams)?.q as string;

    const fetchBooks = useCallback(
        () => fetch(`${googleURLForTitle}${encodeURI(q)}`).then(
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
                }

                return Array.from(resultSet.values());
            }
        ),
        [q]
    );
    const { data: books } = useQuery({
        queryKey: ["search", q],
        queryFn: fetchBooks,
        enabled: !!q,
    });

    const callExistsOnShelf = useCallback(
        () => {
            if (books && userId) {
                return existsOnShelf((books)?.map((book) => book.id) as string[], userId as string);
            }
        },
        [books, userId]
    );
    const { data: shelfState } = useQuery({
        queryKey: ["shelf", { books: (books)?.map((book) => book.id).join(""), userId }],
        queryFn: callExistsOnShelf,
        enabled: !!userId && !!books && books.length > 0,
    });

    useEffect(
        () => {
            if (shelfState) {
                const shelfMap = new Map<string, firstLookup>();
                shelfState.forEach(
                    (book) => {
                        shelfMap.set(book.bookid, book);
                    }
                );
                setExistingShelves(shelfMap);
                setExistingShelfLoading(false);
                console.log(shelfMap);
                console.log("shelfstate", shelfState);
            }
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