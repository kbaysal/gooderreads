"use client"

import { LoadingOutlined } from '@ant-design/icons';
import { Input, Spin } from 'antd';
import { KeyboardEvent, useCallback, useState } from "react";
import { BookRow } from './components/BookRow';
import Header from './components/Header';
import { existsOnShelf, firstLookup } from "./lib/data";
import { userId } from './lib/helper';
import styles from "./page.module.css";

const googleURLForTitle = "https://www.googleapis.com/books/v1/volumes?maxResults=20&printType=books&q=";

export default function Home() {
  const [books, setBooks] = useState<Book[]>([]);
  const [existingShelves, setExistingShelves] = useState<Map<string, firstLookup>>();
  const [existingShelfLoading, setExistingShelfLoading] = useState(false);

  const updateId = useCallback(
    (id: number, bookId: string) => {
      const newExistingShelves = new Map(existingShelves);
      newExistingShelves.set(bookId, { ...newExistingShelves.get(bookId) as firstLookup, id });
      setExistingShelves(newExistingShelves);
    },
    [existingShelves]
  )

  const onEnter = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      console.log((e.target as any).value);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fetch(`${googleURLForTitle}${encodeURI((e.target as any).value)}`).then(
        async (response) => {
          setExistingShelfLoading(true);
          const result: BookResponse = await response.json();
          console.log(result);
          const resultSet = new Map<string, Book>();
          if (result?.items?.length > 0) {
            result.items = result.items.filter((book) => {
              if (book.volumeInfo?.title && book.volumeInfo?.authors?.length > 0) {
                resultSet.set(book.id, book);
                return true;
              }
              return false;
            });

            setBooks(Array.from(resultSet.values()));

            const shelfState = await existsOnShelf(result.items.map((book) => book.id), userId);
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
    []
  );

  return (
    <div className={styles.page}>
      <Header />
      <Input placeholder="search for book, use quotes for exact match, intitle:, inauthor:" onPressEnter={onEnter} />
      {existingShelfLoading && <Spin indicator={<LoadingOutlined spin />} size="large" className="pageLoading" />}
      {!existingShelfLoading &&
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
