"use client"

import ShelfView from "../components/ShelfView";
import { Shelf } from "../lib/helper";

export default function TBR() {
    return (
        <ShelfView shelf={Shelf.TBR} />
    )
}