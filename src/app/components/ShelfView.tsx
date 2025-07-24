"use client"

import { LoadingOutlined } from '@ant-design/icons';
import { IconEdit, IconLayoutGrid, IconListDetails, IconTrash, IconChartPie2 } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Segmented, Spin } from "antd";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { getShelf } from '../clientqueries/getShelf';
import { useBooks } from '../hooks/useBooks';
import { useGetBooks } from '../hooks/useGetBooks';
import { BookData, BookFilter, ListInfo } from "../lib/data";
import { deleteList } from '../lib/lists';
import styles from "../page.module.css";
import { BookRow } from "./BookRow";
import Header from "./Header";
import ShelfGraphs from './ShelfGraphs';

enum ShowAs {
    list = "list",
    grid = "grid",
    graph = "graph"
}

export default function ShelfView(props: { filter: BookFilter, title: string, listId?: number }) {
    const router = useRouter();
    const [showAs, setShowAs] = useState(ShowAs.list);
    const { data } = useGetBooks();

    const filteredBooks = useMemo(() => data ? getShelf(data, props.filter) : undefined, [data, props.filter]);
    const { data: books } = useBooks(filteredBooks?.map((book) => book.bookid) || []);
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: (id: number) => deleteList(id),
        onSuccess: (response, id) => {
            const lists: ListInfo[] = [...(queryClient.getQueryData(["lists"]) as ListInfo[] || [])];
            queryClient.setQueryData(["lists"], lists.filter((list) => list.id !== id));
            router.push("/lists");
        }
    })

    const onDeleteList = useCallback(
        () => {
            mutation.mutate(props.listId as number);
        },
        [mutation, props.listId]
    )

    const listStyleChange = useCallback(
        (value: string) => {
            setShowAs(ShowAs[value as keyof typeof ShowAs]);
        },
        []
    )

    return (
        <div className={`${styles.page} ${showAs === ShowAs.list ? "" : styles.gridPage}`}>
            <Header />
            <h3 className={`${styles.todoTitle} ${showAs === ShowAs.list ? "" : styles.todoTitleGrid}`}>
                <span>{props.title}{filteredBooks ? ` (${filteredBooks.length})` : ""}:</span>
                <Segmented
                    size="middle"
                    shape="round"
                    options={ListStyleOptions}
                    onChange={listStyleChange}
                    className={styles.listToggle}
                />
                {props.listId &&
                    <div className={styles.listEditButtons}>
                        <Button type="default" icon={<Link href={`/lists/${props.listId}/edit`}><IconEdit /></Link>} />
                        <Button type="default" icon={<IconTrash />} onClick={onDeleteList} />
                    </div>
                }
            </h3>
            {!books && <Spin indicator={<LoadingOutlined spin />} size="large" className="pageLoading" />}
            {filteredBooks?.length === 0 && <div>No books were found matching this list</div>}
            {books && showAs !== ShowAs.graph &&
                <div className={`${styles.bookResults} ${showAs === ShowAs.list ? "" : styles.bookResultsGrid}`}>
                    {books.map(
                        (book, index) => {
                            return (
                                <BookRow
                                    book={book as Book}
                                    key={(book as Book).id}
                                    bookData={filteredBooks?.[index] as BookData}
                                    grid={showAs === ShowAs.grid}
                                    showLabels={filteredBooks?.[index].arcoptional ? ["Optional"] : undefined}
                                />
                            )
                        }
                    )}
                </div>
            }
            {books && filteredBooks && showAs === ShowAs.graph &&
                <ShelfGraphs books={books} bookData={filteredBooks}/>
            }
        </div>
    )
}

const ListStyleOptions = [
    { value: ShowAs.list, icon: <IconListDetails /> },
    { value: ShowAs.grid, icon: <IconLayoutGrid /> },
    { value: ShowAs.graph, icon: <IconChartPie2 /> }
];
