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

export const userId = 3;
export const mobileThreshold = 700;

export const bookEntry = (userId: number, bookId: string) => `
        INSERT INTO books (userId, bookId)
        VALUES (${userId}, '${bookId}')
        ON CONFLICT (userId, bookId)
        DO UPDATE SET bookId = EXCLUDED.bookId  -- or nothing, just prevents error
        RETURNING id;
`;
