"use client"

import { ListInfo } from "@/app/lib/data";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { use, useMemo, } from "react";
import ListEdit from "../../ListEdit";
import { getLists } from "@/app/lib/lists";
import { useAuth } from "@clerk/nextjs";

export default function EditList(props: { params: Promise<{ id: string }> }) {
    const id = use(props.params).id;
    const { userId } = useAuth();
    const { data: lists } = useQuery({
        queryKey: ["lists"],
        queryFn: () => getLists(userId as string),
        enabled: !!userId
    });

    const listInfo = useMemo(() => lists && lists.find((list) => list.id + "" === id), [lists])

    return listInfo && <ListEdit name={listInfo.name} filter={listInfo.filters} id={listInfo.id as number}/>
}
