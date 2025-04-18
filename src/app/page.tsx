"use client"

import { LoadingOutlined } from '@ant-design/icons';
import { Spin } from 'antd';
import { KeyboardEvent, useCallback, useEffect, useState } from "react";
import { BookRow } from './components/BookRow';
import Header from './components/Header';
import { existsOnShelf, firstLookup, getARCTBR } from "./lib/data";
import { getBooks } from './lib/helper';
import styles from "./page.module.css";
import { useAuth, useUser } from '@clerk/nextjs';
import dayjs from 'dayjs';

const googleURLForTitle = "https://www.googleapis.com/books/v1/volumes?maxResults=20&printType=books&q=";

const todoSort = (a: Book, b: Book) =>
  (a.volumeInfo?.publishedDateOverride?.valueOf() || new Date(a.volumeInfo?.publishedDate).valueOf()) -
  (b.volumeInfo?.publishedDateOverride?.valueOf() || new Date(b.volumeInfo?.publishedDate).valueOf());

export default function Home() {
  const [books, setBooks] = useState<Book[]>();
  const [existingShelves, setExistingShelves] = useState<Map<string, firstLookup>>();
  const [existingShelfLoading, setExistingShelfLoading] = useState(false);
  const [todoExpired, setTodoExpired] = useState<Book[]>();
  const [todoComing, setTodoComing] = useState<Book[]>();
  const [todoFirstState, setTodoFirstState] = useState<Map<string, firstLookup>>();
  const { userId } = useAuth();
  const { user } = useUser();

  useEffect(
    () => {
      console.log("user", user, "userId", userId);
      if (user && userId) {
        const recent = true; //(new Date().valueOf() - (user.createdAt as Date).valueOf()) < 60000
        console.log("user created", user.createdAt, (new Date().valueOf() - (user.createdAt as Date).valueOf()) < 6000000);
        getARCTBR(userId, recent  ? (user.fullName as string) : undefined).then(
          (response) => {
            console.log(response);
            if (response?.length > 0) {
              const todoState = new Map<string, firstLookup>();
              const bookIds = response.map((book) => {
                todoState.set(book.bookid, book);
                return book.bookid;
              })
              setTodoFirstState(todoState);
              getBooks(bookIds).then(
                (todoBooks) => {
                  todoBooks.map(todoBook => todoBook.volumeInfo.publishedDateOverride = todoState.get(todoBook.id)?.releasedate);
                  todoBooks = todoBooks.sort(todoSort);
                  const todoExpiredNew: Book[] = [];
                  const todoComingNew: Book[] = [];
                  const twoWeeksAgo = dayjs().subtract(2, 'week');
                  todoBooks.forEach(
                    (book) => {
                      const releaseDate = book.volumeInfo.publishedDateOverride || book.volumeInfo.publishedDate;
                      if(dayjs(releaseDate).isBefore(twoWeeksAgo)) {
                        todoExpiredNew.push(book);
                      } else {
                        todoComingNew.push(book);
                      }
                    }
                  )
                  setTodoExpired(todoExpiredNew);
                  setTodoComing(todoComingNew);
                }
              )
            }
          }
        )
      }
    },
    [user, userId]
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
    [userId]
  );

  console.log(books, existingShelfLoading);

  return (
    <div className={styles.page}>
      <Header onEnter={onEnter} />
      {todoExpired && todoComing && !books && !existingShelfLoading &&
        (
          <>
            <div className={styles.todoTitle}><h3>TODO:</h3><p className={styles.red}>(Expired: {todoExpired?.length})</p></div>
            <div className={styles.bookResults}>
              {todoExpired.map(
                (book) => {
                  const firstState = todoFirstState?.get(book.id);
                  const arcLabels: string[] = [];
                  if(firstState?.arcreviewed) {
                    arcLabels.push("Reviewed");
                  }
                  if(firstState?.arcoptional) {
                    arcLabels.push("Optional");
                  }
                  if(firstState?.arc) {
                    arcLabels.push(...firstState?.arc);
                  }
                  console.log(firstState);
                  return (
                    <BookRow
                      book={book}
                      key={book.id}
                      firstState={firstState as firstLookup}
                      updateId={updateId}
                      showLabels={arcLabels}
                    />
                  )
                }
              )}
              {todoComing.map(
                (book) => {
                  const firstState = todoFirstState?.get(book.id);
                  const arcLabels: string[] = [];
                  if(firstState?.arcreviewed) {
                    arcLabels.push("Reviewed");
                  }
                  if(firstState?.arcoptional) {
                    arcLabels.push("Optional");
                  }
                  if(firstState?.arc) {
                    arcLabels.push(...firstState?.arc);
                  }
                  console.log(firstState);
                  return (
                    <BookRow
                      book={book}
                      key={book.id}
                      firstState={firstState as firstLookup}
                      updateId={updateId}
                      showLabels={arcLabels}
                    />
                  )
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
