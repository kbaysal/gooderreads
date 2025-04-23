"use client"

import ShelfView from "../components/ShelfView";
import { Shelf } from "../lib/helper";

export default function DNF() {
    return (
        <ShelfView title={Shelf.DNF} filter={{ shelf: [Shelf.DNF]}}/>
    )
}
