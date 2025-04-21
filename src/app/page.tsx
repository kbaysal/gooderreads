"use client"

import { LoadingOutlined } from '@ant-design/icons';
import { useAuth, useUser } from '@clerk/nextjs';
import { Collapse, CollapseProps, Spin } from 'antd';
import { KeyboardEvent, memo, useCallback, useEffect, useRef, useState } from "react";
import { BookRow } from './components/BookRow';
import Header from './components/Header';
import { addBook } from './hooks/booksCache';
import { existsOnShelf, firstLookup, getARCTBR } from "./lib/data";
import { getBooks, Todo } from './lib/helper';
import styles from "./page.module.css";
import { IconEyeglass2, IconWriting } from '@tabler/icons-react';

const googleURLForTitle = "https://www.googleapis.com/books/v1/volumes?key=AIzaSyCZeh3yvOzMvOlIq3BPZFpVggOrMwrYpKA&maxResults=20&printType=books&q=";

const collapsedStyles = [
  { header: { background: "#2baefa08", color: "#2baefa" } },
  { header: { background: "#4395f308", color: "#4395f3" } },
  { header: { background: "#5576eb08", color: "#5576eb" } },
  { header: { background: "#6058e208", color: "#6058e2" } }
];
export default function Home() {
  const [books, setBooks] = useState<Book[]>();
  const [existingShelves, setExistingShelves] = useState<Map<string, firstLookup>>();
  const [existingShelfLoading, setExistingShelfLoading] = useState(false);
  const [todoIds, setTodoIds] = useState<string[][]>();
  const [todoBooks, setTodoBooks] = useState<Book[][]>([]);
  const [todoFirstState, setTodoFirstState] = useState<Map<string, firstLookup>>();
  const { userId } = useAuth();
  const { user } = useUser();
  const requestsMade = useRef(false);

  useEffect(
    () => {
      console.log("user", user, "userId", userId);
      if (user && userId && !requestsMade.current) {
        const recent = true; //(new Date().valueOf() - (user.createdAt as Date).valueOf()) < 60000
        console.log("user created", user.createdAt, (new Date().valueOf() - (user.createdAt as Date).valueOf()) < 6000000);
        requestsMade.current = true;
        getARCTBR(userId, recent ? (user.fullName as string) : undefined).then(
          (response) => {
            console.log(response);
            if (response?.length > 0) {
              const todoState = new Map<string, firstLookup>();
              const todoExpiredNew: string[] = [];
              const todoComingNew: string[] = [];
              const todoReviewExpiredNew: string[] = [];
              const todoReviewComingNew: string[] = [];
              response.forEach((book) => {
                switch (book.todo) {
                  case Todo.OverdueToRead:
                    todoExpiredNew.push(book.bookid);
                    break;
                  case Todo.UpcomingToRead:
                    todoComingNew.push(book.bookid);
                    break;
                  case Todo.OverdueToReview:
                    todoReviewExpiredNew.push(book.bookid);
                    break;
                  case Todo.UpcomingToReview:
                    todoReviewComingNew.push(book.bookid);
                    break;
                }
                todoState.set(book.bookid, book);
                return book.bookid;
              })
              setTodoFirstState(todoState);
              setTodoIds([todoExpiredNew, todoComingNew, todoReviewExpiredNew, todoReviewComingNew]);
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
    [userId]
  );

  console.log(books, existingShelfLoading);

  const toReadItems: CollapseProps['items'] = [
    {
      key: Todo.OverdueToRead,
      styles: collapsedStyles[Todo.OverdueToRead],
      label: (
        <div className={styles.collapseTitle}>
          <IconEyeglass2 />
          <span>{`To read - Overdue (${todoIds?.[Todo.OverdueToRead].length || 0})`}</span>
        </div>
      ),
      children: <TodoSection todolist={todoBooks?.[Todo.OverdueToRead]} todoFirstState={todoFirstState} updateId={updateId} />,
    },
    {
      key: Todo.UpcomingToRead,
      styles: collapsedStyles[Todo.UpcomingToRead],
      label: (
        <div className={styles.collapseTitle}>
          <IconEyeglass2 />
          {`To read - Upcoming (${todoIds?.[Todo.UpcomingToRead].length || 0})`}
        </div>
      ),
      children: <TodoSection todolist={todoBooks?.[Todo.UpcomingToRead]} todoFirstState={todoFirstState} updateId={updateId} />,
    }
  ];

  const toReviewItems: CollapseProps['items'] = [
    {
      key: Todo.OverdueToReview,
      styles: collapsedStyles[Todo.OverdueToReview],
      label: (
        <div className={styles.collapseTitle}>
          <IconWriting />
          {`To review - Overdue (${todoIds?.[Todo.OverdueToReview].length || 0})`}
        </div>
      ),
      children: <TodoSection todolist={todoBooks?.[Todo.OverdueToReview]} todoFirstState={todoFirstState} updateId={updateId} />,
    },
    {
      key: Todo.UpcomingToReview,
      styles: collapsedStyles[Todo.UpcomingToReview],
      label: (
        <div className={styles.collapseTitle}>
          <IconWriting />
          {`To review - Upcoming (${todoIds?.[Todo.UpcomingToReview].length || 0})`}
        </div>
      ),
      children: <TodoSection todolist={todoBooks?.[Todo.UpcomingToReview]} todoFirstState={todoFirstState} updateId={updateId} />,
    },
  ];

  // the last one in the array is the one that was last updated
  const collapseChange = useCallback(
    async (keys: string[]) => {
      if (keys.length > 0) {
        const todo = (keys[keys.length - 1] as unknown) as Todo;
        if (!todoBooks[todo]) {
          const books = await getBooks((todoIds as string[][])[todo]);
          if (!(books?.[0] as BookError).error) {
            const newTodoBooks = [...todoBooks];
            newTodoBooks[todo] = books as Book[];
            setTodoBooks(newTodoBooks);

          }
        }
      }
    },
    [todoBooks, todoIds]
  );

  return (
    <div className={styles.page}>
      <Header onEnter={onEnter} />
      {todoIds && !books && !existingShelfLoading &&
        <>
          <h3 className={styles.todoTitle}>State of the ARCs:</h3>
          <div>
            <Collapse items={toReadItems} onChange={collapseChange} className={styles.collapse} />
            <Collapse items={toReviewItems} onChange={collapseChange} className={styles.collapse} />
          </div>
        </>
      }
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

const TodoSection = memo(function todosection(props: { todolist: Book[] | undefined, todoFirstState: Map<string, firstLookup> | undefined, updateId: (id: number, bookId: string) => void }) {
  const { todolist, todoFirstState, updateId } = props;
  console.log("TODOSECTUON", todolist)
  return <div className={styles.bookResults}>
    {!todolist && <Spin indicator={<LoadingOutlined spin />} size="large" className={styles.pageLoading} />}
    {todolist?.map(
      (book) => {
        const firstState = todoFirstState?.get(book.id);
        const arcLabels: string[] = [];
        if (firstState?.arcreviewed) {
          arcLabels.push("Reviewed");
        }
        if (firstState?.arcoptional) {
          arcLabels.push("Optional");
        }
        if (firstState?.arc) {
          arcLabels.push(...firstState?.arc);
        }
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
});