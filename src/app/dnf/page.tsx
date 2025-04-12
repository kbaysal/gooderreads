"use client"

import ShelfView from "../components/ShelfView";
import { Shelf } from "../lib/helper";

export default function DNF() {
    return (
        <ShelfView shelf={Shelf.DNF} />
    )
}
