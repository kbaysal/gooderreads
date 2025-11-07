import { useQueries } from "@tanstack/react-query";
import { getGoogleBookInfo } from "../lib/data";

export const queryForUseBooks = (bookId: string) => ({
    queryKey: ["google book", bookId],
    queryFn: async () => {
        const res = await fetch(`https://www.googleapis.com/books/v1/volumes/${bookId}?key=AIzaSyCZeh3yvOzMvOlIq3BPZFpVggOrMwrYpKA`);
        const json = await res.json();
        if (json.error) {
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
                    // Add a fallback image URL
                    imageLinks: {
                        thumbnail: googleBookInfo.thumbnail || '/placeholder-book.svg',
                        smallThumbnail: googleBookInfo.thumbnail || '/placeholder-book.svg'
                    }
                }
            } satisfies Book);
        }
        // Add validation for the successful API response
        return {
            ...json,
            volumeInfo: {
                ...json.volumeInfo,
                imageLinks: {
                    thumbnail: json.volumeInfo?.imageLinks?.thumbnail || '/placeholder-book.svg',
                    smallThumbnail: json.volumeInfo?.imageLinks?.smallThumbnail || '/placeholder-book.svg'
                }
            }
        } as Book;
    }
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