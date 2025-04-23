"use client"

import { BookFilter } from "@/app/lib/data";
import { use, useEffect, useState } from "react";
import ShelfView from "../../components/ShelfView";
import { wanttobuyPath, wanttobuyTitle } from "../../lib/helper";

export default function TBR(props: { params: Promise<{ id: string }> }) {
    const id = use(props.params).id;
    const [filters, setFilters] = useState<BookFilter>();
    const [title, setTitle] = useState<string>();

    useEffect(
        () => {
            if (id == wanttobuyPath) {
                setFilters({wanttobuy: true});
                setTitle(wanttobuyTitle);
            }
        },
        [id]
    )

    return (
        id && filters && title && <ShelfView title={title} filter={filters} />
    )
}