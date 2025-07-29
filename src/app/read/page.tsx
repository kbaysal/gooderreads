"use client"

import { Suspense } from "react";
import ShelfView from "../components/ShelfView";
import { Shelf } from "../lib/helper";

export default function Read() {
    return (
        <Suspense>
            <ShelfView title={Shelf.READ} filter={{ shelf: [Shelf.READ] }} />
        </Suspense>
    )
}
