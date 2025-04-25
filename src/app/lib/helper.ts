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

export enum ShelfPriority {
    TBR = 0,
    READING = 1,
    READ = 2,
    DNF = 3
}

export enum Todo {
    None = -1,
    OverdueToRead = 0,
    UpcomingToRead = 1,
    OverdueToReview = 2,
    UpcomingToReview = 3
}

export const mobileThreshold = 700;
export const dateFormat = 'YYYY-MM-DD';
export const wanttobuyPath = "tbb";
export const wanttobuyTitle = "Want to buy";

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
