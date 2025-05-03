import dayjs from "dayjs";
import { BookData, BookFilter } from "../lib/data";
import { dateFormat, Format, Shelf } from "../lib/helper";

export const getShelf = (books: BookData[], filter: BookFilter) => {
    const filteredBooks = books.filter(
        (book) => {
            if (filter.shelf && filter.shelf.indexOf(book.shelf as Shelf) < 0) {
                return false;
            }
            if (
                filter.wanttobuy !== null &&
                typeof filter.wanttobuy !== "undefined" &&
                !!filter.wanttobuy !== !!book.wanttobuy
            ) {
                return false;
            }
            if (
                filter.owned !== null &&
                typeof filter.owned !== "undefined" &&
                !!filter.owned !== !!book.owned
            ) {
                return false;
            }
            if (
                filter.arcreviewed !== null &&
                typeof filter.arcreviewed !== "undefined" &&
                !!filter.arcreviewed !== !!book.arcreviewed
            ) {
                return false;
            }
            if (
                filter.arcoptional !== null &&
                typeof filter.arcoptional !== "undefined" &&
                !!filter.arcoptional !== !!book.arcoptional
            ) {
                return false;
            }
            if (
                filter.releasedate?.data
            ) {
                if (!book.releasedate) {
                    return false;
                }
                const filterDateString = filter.releasedate.data === "Today" ? dayjs().format(dateFormat) : filter.releasedate.data;
                if (filter.releasedate.operator === ">" ?
                    book.releasedate <= filterDateString :
                    filter.releasedate?.operator === "<" ?
                        book.releasedate >= filterDateString :
                        book.releasedate !== filterDateString
                ) {
                    return false;
                }
            }
            if (
                filter.boughtyear?.data &&
                (!book.boughtyear || (
                    filter.boughtyear.operator === ">" ?
                        book.boughtyear <= filter.boughtyear.data :
                        filter.boughtyear?.operator === "<" ?
                            book.boughtyear >= filter.boughtyear.data :
                            book.boughtyear !== filter.boughtyear
                ))
            ) {
                return false;
            }
            if (filter.formats && (!book.formats || hasNoneOf(filter.formats, book.formats))) {
                console.log("formats mismatch", book.formats, filter.formats);
                return false;
            }
            if (filter.labels && (!book.labels || hasNoneOf(filter.labels, book.labels))) {
                return false;
            }
            if (filter.sources && (!book.sources || hasNoneOf(filter.sources, book.sources))) {
                return false;
            }
            if (filter.arc && (!book.arc || hasNoneOf(filter.arc, book.arc))) {
                return false;
            }
            if (filter.diversity && (!book.diversity || hasNoneOf(filter.diversity, book.diversity))) {
                return false;
            }

            return true;
        }
    );

    if (filter.sort?.data && filteredBooks.length > 1) {
        console.log("sorting");
        console.log(filter.sort?.data, filteredBooks[0][(filter.sort?.data) as keyof BookData], filteredBooks[1][(filter.sort?.data) as keyof BookData]);
        filteredBooks.sort(
            (a, b) => {
                const key = filter.sort?.data as keyof BookData;
                const valueA = a[key];
                const valueB = b[key];

                if (typeof valueA === 'number' && typeof valueB === 'number') {
                    return valueA - valueB;
                }

                if (typeof valueA === 'string' && typeof valueB === 'string') {
                    return valueA.localeCompare(valueB);
                }

                return String(valueA).localeCompare(String(valueB));
            }
        );
    }

    return filteredBooks;
};

function hasNoneOf(arrayA: (string | Format)[], arrayB: (string | Format)[]) {
    // For tiny arrays, direct comparison is often faster
    for (let i = 0; i < arrayA.length; i++) {
        for (let j = 0; j < arrayB.length; j++) {
            if (arrayA[i] === arrayB[j]) {
                return false;
            }
        }
    }
    return true;
}
