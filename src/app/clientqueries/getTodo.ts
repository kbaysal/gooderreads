import { BookData } from "../lib/data"

export const getTodo = (books: BookData[]) => {
    return books.filter(
        (book) => book.sources ? book.sources.indexOf("arc") > -1 : false
    ).sort((a, b) => (a.releasedate as string).localeCompare(b.releasedate as string))
};
