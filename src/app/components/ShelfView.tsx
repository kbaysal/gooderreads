"use client"

import { LoadingOutlined } from '@ant-design/icons';
import { IconEdit, IconLayoutGrid, IconListDetails, IconTrash } from '@tabler/icons-react';
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

export default function ShelfView(props: { filter: BookFilter, title: string, listId?: number }) {
    const router = useRouter();
    const [showAsList, setShowAsList] = useState(true);
    const data = useGetBooks();

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
            setShowAsList(value === "list");
        },
        []
    )

    return (
        <div className={`${styles.page} ${showAsList ? "" : styles.gridPage}`}>
            <Header />
            <h3 className={`${styles.todoTitle} ${showAsList ? "" : styles.todoTitleGrid}`}>
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
            {books &&
                <div className={`${styles.bookResults} ${showAsList ? "" : styles.bookResultsGrid}`}>
                    {books.map(
                        (book, index) => {
                            return (
                                <BookRow
                                    book={book as Book}
                                    key={(book as Book).id}
                                    bookData={filteredBooks?.[index] as BookData}
                                    grid={!showAsList}
                                    showLabels={filteredBooks?.[index].arcoptional ? ["Optional"] : undefined}
                                />
                            )
                        }
                    )}
                </div>
            }
        </div>
    )
}

const ListStyleOptions = [
    { value: 'list', icon: <IconListDetails /> },
    { value: 'grid', icon: <IconLayoutGrid /> }
];
