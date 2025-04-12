"use client"

import ShelfView from "../components/ShelfView";
import { Shelf } from "../lib/helper";

export default function Reading() {
    return (
        <ShelfView shelf={Shelf.READING} />
    )
}