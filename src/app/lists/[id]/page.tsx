"use client"

import { ListInfo } from "@/app/lib/data";
import { getLists } from "@/app/lib/lists";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { Suspense, use, useMemo } from "react";
import ShelfView from "../../components/ShelfView";
import { wanttobuyPath, wanttobuyTitle } from "../../lib/helper";

const wanttobuyListInfo: Omit<ListInfo, "userid"> = {
    id: wanttobuyPath,
    name: wanttobuyTitle,
    filters: { wanttobuy: {"operator": "="} }
}

export default function List(props: { params: Promise<{ id: string }> }) {
    const id = use(props.params).id;
    const { userId } = useAuth();
    const { data: lists } = useQuery({
        queryKey: ["lists"],
        queryFn: () => getLists(userId as string),
        enabled: !!userId
    });

    const list = useMemo(
        () => {
            return id === wanttobuyPath ?
                wanttobuyListInfo :
                lists && lists.find((list) => list.id + "" === id)

        },
        [lists, id]
    );

    return (
        id && list && (
            <Suspense>
                <ShelfView title={list.name} filter={list.filters} listId={id === wanttobuyPath ? undefined : parseInt(id)} />
            </Suspense>
        )
    )
}