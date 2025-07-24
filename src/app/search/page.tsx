"use client"

import { LoadingOutlined } from '@ant-design/icons';
import { useAuth } from '@clerk/nextjs';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Spin } from 'antd';
import { use, useCallback, useMemo } from 'react';
import { BookRow } from '../components/BookRow';
import Header from '../components/Header';
import { addBook } from '../hooks/booksCache';
import { useGetBooks } from '../hooks/useGetBooks';
import { BookData } from '../lib/data';
import styles from "../page.module.css";

const googleURLForTitle = "https://www.googleapis.com/books/v1/volumes?key=AIzaSyCZeh3yvOzMvOlIq3BPZFpVggOrMwrYpKA&maxResults=20&printType=books&q=";

export default function Search(props: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const { userId } = useAuth();
    const q = use(props.searchParams)?.q as string;
    const queryClient = useQueryClient();
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
    const { data: books, isLoading: searchLoading } = useQuery({
        queryKey: ["search", q],
        queryFn: fetchBooks,
        enabled: !!q,
    });
    const { data, isLoading: shelvesLoading } = useGetBooks();
    const existingShelves = useMemo(() => {
        if (data && books) {
            const shelfMap = new Map<string, BookData>();
            books.forEach(
                (book) => {
                    const bookData = data.find((shelfBook) => shelfBook.bookid === book.id);
                    if (bookData) {
                        shelfMap.set(book.id, bookData);
                    }
                }
            );
            return shelfMap;
        }
    }, [data, books]);


    const updateId = useCallback(
        (id: number, bookId: string) => {
            queryClient.setQueryData(["allBooks", userId], ((oldData: BookData[] | undefined) => {
                if (!oldData) return oldData;
                const updatedData = oldData.map((book) => {
                    if (book.bookid === bookId) {
                        return { ...book, id };
                    }
                    return book;
                });
                return updatedData;
            })
            )
        },
        [userId, queryClient]
    );

    return (
        <div className={styles.page}>
            <Header q={q} />
            {(shelvesLoading || searchLoading) && <Spin indicator={<LoadingOutlined spin />} size="large" className={styles.pageLoading} />}
            {books && !shelvesLoading &&
                <div className={styles.bookResults}>
                    {books.map(
                        (book) => {
                            const bookData = existingShelves?.get(book.id);
                            return <BookRow book={book} key={book.id} bookData={bookData as BookData} updateId={updateId} />
                        }
                    )}
                </div>
            }
        </div>
    );
}