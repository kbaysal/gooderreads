"use client"

import ShelfView from "../components/ShelfView";
import { Shelf } from "../lib/helper";

export default function Reading() {
    return (
        <ShelfView title={Shelf.READING} filter={{ shelf: [Shelf.READING]}}/>
    )
}