import { neon } from "@neondatabase/serverless";
import { BookFilter, firstLookup } from "./data";
import { Shelf, Format, Todo } from "./helper";
import dayjs from "dayjs";

export async function getBooksWithFilter(userId: string, filter: BookFilter): Promise<firstLookup[]> {
    console.log("getBooksWithFilter");
    const sql = neon(`${process.env.DATABASE_URL}`);
    console.log(filter, userId);
    let i = 1;
    const query = `
        SELECT 
            b.bookid, 
            b.id, 
            b.formats, 
            COALESCE(b.releaseDate, b.releaseDateG) AS releaseDate,
            b.arcoptional,
            CASE
                WHEN b.id = ANY((u.shelves).TBR) THEN 'TBR'
                WHEN b.id = ANY((u.shelves).READING) THEN 'READING'
                WHEN b.id = ANY((u.shelves).READ) THEN 'READ'
                WHEN b.id = ANY((u.shelves).DNF) THEN 'DNF'
                ELSE NULL
            END AS shelf
        FROM books b
        JOIN bookUsers u ON u.id = b.userid
        WHERE 
            ${(filter?.shelf as Shelf[])?.length > 0 ? "(" : ""}
            ${filter?.shelf ? (filter.shelf as Shelf[]).map((shelf) => `b.id = ANY((u.shelves).${shelf})`).join(" OR ") : ""}
            ${(filter?.shelf as Shelf[])?.length > 0 ? ") AND " : ""}
            ${(filter?.wanttobuy ? "b.wanttobuy = TRUE AND" : "")}
            ${(filter?.owned ? "b.owned = TRUE AND" : "")}
            ${(filter?.boughtyear ? `b.boughtyear ${filter?.boughtyear.operator} ${filter?.boughtyear.data} AND` : "")}
            ${(filter.formats as Format[])?.length > 0 ? `formats && $${i++} AND` : ""}
            ${(filter?.labels as string[])?.length > 0 ? `labels && $${i++} AND` : ""}
            ${(filter?.sources as string[])?.length > 0 ? `sources && $${i++} AND` : ""}
            ${filter.arcreviewed === true || filter.arcreviewed === false ? `(b.arcreviewed = ${filter.arcreviewed ? "TRUE" : "FALSE"} ${!filter.arcreviewed ? " OR b.arcreviewed IS NULL" : ""}) AND ` : ""}
            ${filter.arcoptional === true || filter.arcoptional === false ? `(b.arcoptional = ${filter.arcoptional ? "TRUE" : "FALSE"} ${!filter.arcoptional ? " OR b.arcoptional IS NULL" : ""}) AND ` : ""}
            ${filter.releasedate ? `COALESCE(b.releaseDate, b.releaseDateG) ${filter.releasedate.operator} ${filter.releasedate.data === "Today" ? "CURRENT_DATE" : `'${filter.releasedate.data}'`} AND COALESCE(b.releaseDate, b.releaseDateG) IS NOT NULL AND` : ""}
            u.id = '${userId}'
        ORDER BY ${filter.sort?.data || "releaseDate"} ${filter.sort?.operator || "desc"};

    `;
    const variables = [];
    if((filter.formats as Format[])?.length > 0) {
        variables.push(filter.formats);
    }
    if((filter.labels as string[])?.length > 0) {
        variables.push(filter.labels);
    }
    if((filter.sources as string[])?.length > 0) {
        variables.push(filter.sources);
        console.log(filter.sources);
    }
    console.log(query);
    console.log(variables);
    const response = await sql.query(query, variables);
    return response as firstLookup[];
}

export const getBookInfo = async (bookIds: string[]): Promise<SimplifiedBook[]> => {
    console.log("getBookInfo")
    try {
        const query = `
        SELECT * FROM bookinfo
        WHERE id = ANY($1);
    `;
        console.log(query);
        const sql = neon(`${process.env.DATABASE_URL}`);
        const result = await sql.query(query, bookIds);
        return result as SimplifiedBook[];
    } catch (error) {
        console.error('Error inserting into bookinfo:', error);
        throw error;
    }
}


export const getARCTBR = async (userId: string, name?: string, email?: string): Promise<firstLookup[]> => {
    console.log("getARCTBR");
    if (name && email) {
        //await createUser(userId, name, email);
    }

    const query = `
        SELECT 
            b.bookid, 
            b.id, 
            CASE
                WHEN b.id = ANY((u.shelves).TBR) THEN 'TBR'
                WHEN b.id = ANY((u.shelves).READING) THEN 'READING'
                WHEN b.id = ANY((u.shelves).READ) THEN 'READ'
            END AS shelf, 
            b.formats,
            b.arc,
            b.arcoptional,
            b.arcreviewed,
            COALESCE(b.releaseDate, b.releaseDateG) AS releaseDate
        FROM books b
        JOIN bookUsers u ON u.id = b.userid
        WHERE (b.id = ANY((u.shelves).TBR) OR b.id = ANY((u.shelves).READING) OR (b.id = ANY((u.shelves).READ) AND (arcreviewed IS NULL OR arcreviewed = FALSE)))
            AND u.id = '${userId}'
            AND 'arc' = ANY(b.sources);
    `;

    const sql = neon(`${process.env.DATABASE_URL}`);
    try {
        const response = await sql.query(query) as firstLookup[];
        response.sort(todoSort);
        return response.map(
            (book: firstLookup) => {
                const overdueBook = isOverdue(book.releasedate as Date);
                if(book.arcoptional) {
                    book.todo = Todo.Optional;
                } else if (book.shelf === Shelf.READ) {
                    book.todo = overdueBook ? Todo.OverdueToReview : Todo.UpcomingToReview;
                } else {
                    book.todo = overdueBook ? Todo.OverdueToRead : Todo.UpcomingToRead;
                }

                return book;
            }
        ) as firstLookup[];
    } catch (e) {
        console.log(e);
        return [];
    }
}

const todoSort = (a: firstLookup, b: firstLookup) =>
    (a.releasedate?.valueOf() || 0) - (b.releasedate?.valueOf() || 0);

const twoWeeksAgo = dayjs().subtract(2, 'week');
const isOverdue = (releaseDate: string | Date) => {
    if (dayjs(releaseDate).isBefore(twoWeeksAgo)) {
        return true;
    }

    return false;
}



export async function existsOnShelf(bookIds: string[], userId: string): Promise<firstLookup[]> {
    console.log("existsonshelf");
    try {

        const sql = neon(`${process.env.DATABASE_URL}`);
        const query = `
            WITH input_bookids(bookid) AS (
                VALUES ('${bookIds.join("'),('")}')),
            matched_books AS (
                SELECT b.id AS id, b.bookid, b.formats, b.releaseDate, b.releasedateg
                FROM books b
                INNER JOIN input_bookids i ON i.bookid = b.bookid
            ),
            shelf_lookup AS (
                SELECT 
                    m.bookid,
                    m.formats,
                    m.id,
                    COALESCE(m.releaseDate, m.releaseDateG) AS releaseDate,
                    CASE
                        WHEN m.id = ANY((u.shelves).TBR) THEN 'TBR'
                        WHEN m.id = ANY((u.shelves).READING) THEN 'READING'
                        WHEN m.id = ANY((u.shelves).READ) THEN 'READ'
                        WHEN m.id = ANY((u.shelves).DNF) THEN 'DNF'
                    ELSE NULL
                    END AS shelf
                FROM matched_books m
                LEFT JOIN bookUsers u ON u.id = '${userId}'  -- use your user ID here
            )
    
            SELECT * FROM shelf_lookup;
        `;

        console.log(query);
        const response = await sql.query(query);

        console.log(response);
        return response as firstLookup[];
    } catch (e) {
        console.error('Error in existsInShelf:', e);
        throw e;
    }
}

