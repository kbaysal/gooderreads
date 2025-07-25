"use client"

import { LoadingOutlined } from '@ant-design/icons';
import { IconEyeglass2, IconWriting } from '@tabler/icons-react';
import { useQueryClient } from '@tanstack/react-query';
import { Collapse, CollapseProps, Spin } from 'antd';
import { memo, useCallback, useEffect, useState } from "react";
import { getTodo } from './clientqueries/getTodo';
import { BookRow } from './components/BookRow';
import Header from './components/Header';
import { queryForUseBooks } from './hooks/useBooks';
import { useGetBooks } from './hooks/useGetBooks';
import { BookData } from "./lib/data";
import { Todo } from './lib/helper';
import styles from "./page.module.css";

const collapsedStyles = [
  { header: { background: "#2baefa08", color: "#2baefa" } },
  { header: { background: "#4199f408", color: "#4199f4" } },
  { header: { background: "#4f83ee08", color: "#4f83ee" } },
  { header: { background: "#586ee808", color: "#586ee8" } },
  { header: { background: "#6058e208", color: "#6058e2" } },
];
export default function Home() {
  const [todoIds, setTodoIds] = useState<string[][]>();
  const [todoBooks, setTodoBooks] = useState<Book[][]>([]);
  const [todoFirstState, setTodoFirstState] = useState<Map<string, BookData>>();
  const queryClient = useQueryClient();
  const { data } = useGetBooks();

  useEffect(
    () => {
      if (Array.isArray(data) && data?.length > 0) {
        const todoBooks = getTodo(data);
        const todoState = new Map<string, BookData>();
        const todoExpiredNew: string[] = [];
        const todoComingNew: string[] = [];
        const todoReviewExpiredNew: string[] = [];
        const todoReviewComingNew: string[] = [];
        const todoOptionalNew: string[] = [];
        todoBooks.forEach((book) => {
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
            case Todo.Optional:
              todoOptionalNew.push(book.bookid);
              break;
          }
          todoState.set(book.bookid, book);
          setTodoFirstState(todoState);
          setTodoIds([todoExpiredNew, todoComingNew, todoReviewExpiredNew, todoReviewComingNew, todoOptionalNew]);
        });
      }
    },
    [data]
  );

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
      children: <TodoSection todolist={todoBooks?.[Todo.OverdueToRead]} todoFirstState={todoFirstState} />,
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
      children: <TodoSection todolist={todoBooks?.[Todo.UpcomingToRead]} todoFirstState={todoFirstState} />,
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
      children: <TodoSection todolist={todoBooks?.[Todo.OverdueToReview]} todoFirstState={todoFirstState} />,
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
      children: <TodoSection todolist={todoBooks?.[Todo.UpcomingToReview]} todoFirstState={todoFirstState} />,
    },
  ];

  const optionalItems: CollapseProps['items'] = [
    {
      key: Todo.Optional,
      styles: collapsedStyles[Todo.Optional],
      label: (
        <div className={styles.collapseTitle}>
          <IconWriting />
          {`Optional (${todoIds?.[Todo.Optional].length || 0})`}
        </div>
      ),
      children: <TodoSection todolist={todoBooks?.[Todo.Optional]} todoFirstState={todoFirstState} />,
    }
  ];

  // the last one in the array is the one that was last updated
  const collapseChange = useCallback(
    async (keys: string[]) => {
      if (keys.length > 0) {
        const todo = (keys[keys.length - 1] as unknown) as Todo;
        if (!todoBooks[todo]) {
          Promise.all((todoIds as string[][])[todo].map(
            (bookId) => {
              return queryClient.fetchQuery(queryForUseBooks(bookId))
            }
          )).then(
            (books) => {
              //if (!(books?.[0]).error) {
                const newTodoBooks = [...todoBooks];
                newTodoBooks[todo] = books as Book[];
                setTodoBooks(newTodoBooks);
              //}
            }
          )
        }
      }
    },
    [todoBooks, todoIds, queryClient]
  );

  return (
    <div className={styles.page}>
      <Header />
      {todoIds &&
        <>
          <h3 className={styles.todoTitle}><span>State of the ARCs:</span></h3>
          <div>
            <Collapse items={toReadItems} onChange={collapseChange} className={styles.collapse} />
            <Collapse items={toReviewItems} onChange={collapseChange} className={styles.collapse} />
            <Collapse items={optionalItems} onChange={collapseChange} className={styles.collapse} />
          </div>
        </>
      }
    </div>
  );
}

const TodoSection = memo(function todosection(props: { todolist: Book[] | undefined, todoFirstState: Map<string, BookData> | undefined }) {
  const { todolist, todoFirstState } = props;
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
            bookData={firstState as BookData}
            showLabels={arcLabels}
          />
        )
      }
    )}
  </div>
});