import { useQueries } from "@tanstack/react-query";
import { getGoogleBookInfo } from "../lib/data";

export const queryForUseBooks = (bookId: string) => ({
    queryKey: ["google book", bookId],
    queryFn: async () => {
        const res = await fetch(`https://www.googleapis.com/books/v1/volumes/${bookId}?key=AIzaSyCZeh3yvOzMvOlIq3BPZFpVggOrMwrYpKA`);
        const json = await res.json();
        if (json.error) {
            // If error, fallback to getGoogleBookInfo
            const googleBookInfo = await getGoogleBookInfo(bookId)
            return ({
                id: bookId, 
                saleInfo: {country: ""}, 
                volumeInfo: {
                    ...googleBookInfo, 
                    pageCount: googleBookInfo.pages,
                    authors: googleBookInfo.author?.split(", "),
                    description: "",
                    publishedDate: "",
                    imageLinks: {thumbnail: googleBookInfo.thumbnail, smallThumbnail: ""}
                }
            } satisfies Book);
        }
        return json as Book;
    }
})

export const useBooks = (bookIds: string[]) => {
    const queries = useQueries({
        queries: bookIds?.map(queryForUseBooks) || []
    });

    console.log("useBooks queries", queries.map(query => query.data));
    console.log(queries)

    const isLoading = queries.some(query => query.isLoading);
    const isError = queries.some(query => query.isError);
    const data = queries.map(query => query.data).filter((book) => {console.log("book", book?.id, book); return !!(book as Book)?.id});

    return { data, isError, isLoading };
}