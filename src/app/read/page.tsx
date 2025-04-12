"use client"

import ShelfView from "../components/ShelfView";
import { Shelf } from "../lib/helper";

export default function Read() {
    return (
        <ShelfView shelf={Shelf.READ} />
    )
}
