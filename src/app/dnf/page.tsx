"use client"

import { Suspense } from "react";
import ShelfView from "../components/ShelfView";
import { Shelf } from "../lib/helper";

export default function DNF() {
    return (
        <Suspense>
            <ShelfView title={Shelf.DNF} filter={{ shelf: [Shelf.DNF] }} />
        </Suspense>
    )
}
