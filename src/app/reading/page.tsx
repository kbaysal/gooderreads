"use client"

import { Suspense } from "react";
import ShelfView from "../components/ShelfView";
import { Shelf } from "../lib/helper";

export default function Reading() {
    return (
        <Suspense>
            <ShelfView title={Shelf.READING} filter={{ shelf: [Shelf.READING] }} />
        </Suspense>
    )
}