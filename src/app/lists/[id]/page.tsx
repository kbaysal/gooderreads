"use client"

import { ListInfo } from "@/app/lib/data";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { use, useMemo } from "react";
import ShelfView from "../../components/ShelfView";
import { wanttobuyPath, wanttobuyTitle } from "../../lib/helper";
import { getLists } from "@/app/lib/lists";
import { useAuth } from "@clerk/nextjs";

const wanttobuyListInfo: Omit<ListInfo, "userid"> = {
    id: wanttobuyPath,
    name: wanttobuyTitle,
    filters: { wanttobuy: true }
}

export default function List(props: { params: Promise<{ id: string }> }) {
    const id = use(props.params).id;
    const queryClient = useQueryClient();
    const { userId } = useAuth();
    const { data: lists } = useQuery({
        queryKey: ["lists"],
        queryFn: () => getLists(userId as string),
        enabled: !!userId
    });

    const list = useMemo(
        () => {
            console.log(id, lists);
            return id === wanttobuyPath ?
                wanttobuyListInfo :
                lists && lists.find((list) => list.id + "" === id)

        },
        [lists]
    );

    return (
        id && list && <ShelfView title={list.name} filter={list.filters} listId={id === wanttobuyPath ? undefined : parseInt(id)} />
    )
}