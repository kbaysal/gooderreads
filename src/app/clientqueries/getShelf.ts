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
                filter.enddate?.data
            ) {
                if (!book.enddate) {
                    return false;
                }
                const enddate = typeof book.enddate !== "string" ? dayjs(book.enddate).format(dateFormat) : book.enddate;
                const filterDateString = filter.enddate.data === "Today" ? dayjs().format(dateFormat) : filter.enddate.data;
                if ((filter.enddate.operator === ">" && enddate <= filterDateString) ||
                    (filter.enddate?.operator === "<" && enddate >= filterDateString)
                ) {
                    return false;
                } if (filter.enddate.operator === "><") {
                    const [start, end] = filter.enddate.data as [string, string];
                    const filterStartString = typeof start !== "string" ? dayjs(start).format(dateFormat) : start;
                    const filterEndString = typeof end !== "string" ? dayjs(end).format(dateFormat) : end;
                    if (enddate < filterStartString || enddate > filterEndString) {
                        return false;
                    }
                }
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
                } if (filter.releasedate.operator === "><") {
                    const [start, end] = filter.releasedate.data as [string, string];
                    if (book.releasedate < start || book.releasedate > end) {
                        return false;
                    }
                }
            }
            console.log("filter.boughtyear", filter.boughtyear, book.boughtyear); // IGNORE
            if (
                filter.boughtyear?.data &&
                (!book.boughtyear || (
                    filter.boughtyear.operator === ">" ?
                        book.boughtyear <= filter.boughtyear.data :
                        filter.boughtyear?.operator === "<" ?
                            book.boughtyear >= filter.boughtyear.data :
                            book.boughtyear !== filter.boughtyear.data
                ))
            ) {
                return false;
            }
            if (filter.formats && (!book.formats || hasNoneOf(filter.formats, book.formats))) {
                return false;
            }
            if (filter.labels && (!book.labels || hasNoneOf(filter.labels, book.labels))) {
                return false;
            }
            console.log("filter.sources", filter.sources, book.sources); // IGNORE
            if (filter.sources && (!book.sources || hasNoneOf(filter.sources, book.sources))) {
                return false;
            }
            if (filter.arc && (!book.arc || hasNoneOf(filter.arc, book.arc))) {
                return false;
            }
            if (filter.diversity && (!book.diversity || hasNoneOf(filter.diversity, book.diversity))) {
                return false;
            }
            if(filter.diverse && filter.diverse.operator === "=" && !book.diverse) {
                return false;
            }
            if(filter.bipoc && filter.bipoc.operator === "=" && !book.bipoc) {
                return false;
            }
            if(filter.lgbt && filter.lgbt.operator === "=" && !book.lgbt) {
                return false;
            }
            if(filter.owned && filter.owned.operator === "=" && !book.owned) {
                return false;
            }
            if(filter.wanttobuy && filter.wanttobuy.operator === "=" && !book.wanttobuy) {
                return false;
            }

            return true;
        }
    );

    if (filter.sort?.data && filteredBooks.length > 1) {
       filteredBooks.sort(
            (a, b) => {
                const key = filter.sort?.data as keyof BookData;
                const valueA = a[key];
                const valueB = b[key];

                if (typeof valueA === 'number' && typeof valueB === 'number') {
                    if (filter.sort?.operator === "asc") {
                        return valueA - valueB;
                    }
                    return valueB - valueA;
                }

                if (typeof valueA === 'string' && typeof valueB === 'string') {
                    if (filter.sort?.operator === "asc") {
                        return valueA.localeCompare(valueB);
                    }
                    return valueB.localeCompare(valueA);
                }

                if (typeof valueA === "object" && typeof valueB === "object") {
                    // These should be date objects
                    const dateA = dayjs(valueA as unknown as Date);
                    const dateB = dayjs(valueB as unknown as Date);
                    return (
                        dateA.isBefore(dateB) ?
                            (filter.sort?.operator === "asc" ? -1 : 1) :
                            dateA.isAfter(dateB) ?
                                (filter.sort?.operator === "asc" ? 1 : -1) :
                                0);
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
