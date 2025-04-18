
export enum Format {
    Physical = 0,
    EBook = 1,
    Audiobook = 2
}

export enum Shelf {
    TBR = "TBR",
    READING = "READING",
    READ = "READ",
    DNF = "DNF"
}

export const mobileThreshold = 700;

export const bookEntry = (userId: string, bookId: string, releaseDateG?: string) => {
    console.log("book entry ")
    return `
        INSERT INTO books (userId, bookId${releaseDateG ? ", releaseDateG" : ""})
        VALUES ('${userId}', '${bookId}'${releaseDateG ? `, '${releaseDateG}'` : ""})
        ON CONFLICT (userId, bookId)
        DO UPDATE SET bookId = EXCLUDED.bookId  -- or nothing, just prevents error
        RETURNING id;
    `;
}

export const getBooks = (bookIds: string[]): Promise<Book[] | never[]> => {
    return Promise.all(
        bookIds.map((id: string) => fetch(`https://www.googleapis.com/books/v1/volumes/${id}`))
    ).then((responses) => {
        return Promise.all(responses.map(
            async (response): Promise<Book> => { return await response.json()} 
        )).then(
            (value) => {return (value as Book[])}
        ).catch(() => {return [];})
    }).catch((reason) => {console.log(reason); return [];});
}
