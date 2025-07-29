"use client"

import { Suspense } from "react";
import ShelfView from "../components/ShelfView";
import { Shelf } from "../lib/helper";

export default function TBR() {
    return (
        <Suspense>
            <ShelfView title={Shelf.TBR} filter={{ shelf: [Shelf.TBR] }} />
        </Suspense>
    );
}