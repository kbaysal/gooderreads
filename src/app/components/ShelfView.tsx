"use client"

import { LoadingOutlined } from '@ant-design/icons';
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Spin } from "antd";
import { useBooks } from '../hooks/useBooks';
import { BookFilter, firstLookup, getBooksWithFilter, ListInfo } from "../lib/data";
import styles from "../page.module.css";
import { BookRow } from "./BookRow";
import Header from "./Header";
import { IconEdit, IconTrash } from '@tabler/icons-react';
import Link from 'next/link';
import { useCallback } from 'react';
import { deleteList } from '../lib/lists';
import { useRouter } from 'next/navigation';

export default function ShelfView(props: { filter: BookFilter, title: string, listId?: number }) {
    const { userId } = useAuth();
    const router = useRouter();

    const { data: summarizedBookInfo } = useQuery({
        queryKey: ["getBooksWithFilter", { filter: props.filter, userId }],
        queryFn: () => getBooksWithFilter(userId as string, props.filter),
        enabled: !!userId
    });
    const { data: books } = useBooks(summarizedBookInfo?.map((book) => book.bookid) || []);
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

    return (
        <div className={styles.page}>
            <Header />
            <h3 className={styles.todoTitle}>
                {props.title}{summarizedBookInfo ? ` (${summarizedBookInfo.length})` : ""}:
                {props.listId &&
                    <div className={styles.listEditButtons}>
                        <Button type="default" icon={<Link href={`/lists/${props.listId}/edit`}><IconEdit /></Link>} />
                        <Button type="default" icon={<IconTrash />} onClick={onDeleteList} />
                    </div>
                }
            </h3>
            {!books && <Spin indicator={<LoadingOutlined spin />} size="large" className="pageLoading" />}
            {summarizedBookInfo?.length === 0 && <div>No books were found matching this list</div>}
            {books &&
                <div className={styles.bookResults}>
                    {books.map(
                        (book, index) => {
                            return <BookRow book={book as Book} key={(book as Book).id} firstState={summarizedBookInfo?.[index] as firstLookup} />
                        }
                    )}
                </div>
            }
        </div>
    )
}
