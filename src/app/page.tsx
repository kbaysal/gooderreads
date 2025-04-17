"use client"

import { LoadingOutlined } from '@ant-design/icons';
import { Spin } from 'antd';
import { KeyboardEvent, useCallback, useEffect, useState } from "react";
import { BookRow } from './components/BookRow';
import Header from './components/Header';
import { existsOnShelf, firstLookup, getARCTBR } from "./lib/data";
import { getBooks, userId } from './lib/helper';
import styles from "./page.module.css";

const googleURLForTitle = "https://www.googleapis.com/books/v1/volumes?maxResults=20&printType=books&q=";

const todoSort = (a: Book, b: Book) =>
  new Date(a.volumeInfo?.publishedDate).valueOf() - new Date(b.volumeInfo?.publishedDate).valueOf();

export default function Home() {
  const [books, setBooks] = useState<Book[]>();
  const [existingShelves, setExistingShelves] = useState<Map<string, firstLookup>>();
  const [existingShelfLoading, setExistingShelfLoading] = useState(false);
  const [todo, setTodo] = useState<Book[]>();
  const [todoFirstState, setTodoFirstState] = useState<Map<string, firstLookup>>();

  useEffect(
    () => {
      getARCTBR(userId).then(
        (response) => {
          console.log(response);
          if (response?.length > 0) {
            const todoState = new Map();
            const bookIds = response.map((book) => {
              todoState.set(book.bookid, book);
              return book.bookid;
            })
            setTodoFirstState(todoState);
            getBooks(bookIds).then(
              (todoBooks) => {
                todoBooks = todoBooks.sort(todoSort);
                setTodo(todoBooks)
              }
            )
          }
        }
      )
    },
    []
  );

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

  console.log(books, existingShelfLoading);

  return (
    <div className={styles.page}>
      <Header onEnter={onEnter}/>
      {todo && !books && !existingShelfLoading &&
        (
          <>
            <h3>TODO:</h3>
            <div className={styles.bookResults}>
              {todo.map(
                (book) => {
                  const firstState = todoFirstState?.get(book.id);
                  return <BookRow book={book} key={book.id} firstState={firstState as firstLookup} updateId={updateId} showLabels={firstState?.arc}/>
                }
              )}
            </div>
          </>
        )
      }
      {existingShelfLoading && <Spin indicator={<LoadingOutlined spin />} size="large" className="pageLoading" />}
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
