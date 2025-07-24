import { BookData } from "../lib/data"
import { Todo } from "../lib/helper";

export const getTodo = (books: BookData[]) => {
    return books.filter(
        (book) => typeof book.todo !== "undefined" && book.todo > Todo.None
    ).sort((a, b) => (a.releasedate as string).localeCompare(b.releasedate as string))
};
