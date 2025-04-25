import { useQueries } from "@tanstack/react-query";

export const queryForUseBooks = (bookId: string) => ({
    queryKey: ["google book", bookId],
    queryFn: () =>
        fetch(`https://www.googleapis.com/books/v1/volumes/${bookId}?key=AIzaSyCZeh3yvOzMvOlIq3BPZFpVggOrMwrYpKA`).then(
            (val) => val.json() as Promise<Book | BookError>
        )
})

export const useBooks = (bookIds: string[]) => {
    const queries = useQueries({
        queries: bookIds?.map(queryForUseBooks) || []
    });

    const isLoading = queries.some(query => query.isLoading);
    const isError = queries.some(query => query.isError);
    const data = queries.map(query => query.data).filter((book) => !!(book as Book)?.id);

    return { data, isError, isLoading };
}