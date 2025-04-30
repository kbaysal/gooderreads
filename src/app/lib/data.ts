'use server';

import { neon } from '@neondatabase/serverless';
import { bookEntry, Format, Shelf, Todo } from './helper';
import dayjs from 'dayjs';

export interface firstLookup {
    id: number;
    bookid: string;
    formats: Format[];
    shelf: Shelf;
    arc?: string[];
    arcoptional?: boolean;
    arcreviewed?: boolean;
    releasedate?: Date;
    todo?: Todo;
}

export interface LabelFields {
    userid: string;
    sources?: string[];
    diversity?: string[];
    labels?: string[];
    arc?: string[];
    country?: string[];
    genre?: string[];
}

export interface BookData extends LabelFields {
    id: number;
    bookid: string;
    startdate?: Date;
    enddate?: Date;
    formats?: Format[];
    rating?: number | null;
    spice?: number | null;
    arcoptional?: boolean;
    arcreviewed?: boolean;
    diverse?: boolean;
    bipoc?: boolean;
    lgbt?: boolean;
    owned?: boolean;
    wanttobuy?: boolean;
    boughtyear?: number | null;
    releasedateG?: string;
    releasedate?: string;
}

type BookDataColumn = keyof BookData | "shelf" | "sort";
type BoughtYear = Record<"boughtyear", FilterWithOperator<number>>;
type ReleaseYear = Record<"releasedate", FilterWithOperator<string>>;
type Sort = Record<"sort", FilterWithOperator<keyof BookData, "asc" | "desc">>;
export interface FilterWithOperator<T, K = "<" | ">" | "="> {
    operator?: K,
    data?: T
}
export type BookFilter = Partial<Record<BookDataColumn, FilterWithOperator<unknown> | unknown> & BoughtYear & ReleaseYear & Sort>;
export interface ListInfo {
    id: number | string;
    userid: string;
    name: string;
    filters: BookFilter;
}

export interface EmailInfo {
    bookid: string;
    email: string;
    name: string;
    title: string;
    author: string;
    releasedate: Date;
    shelf: Shelf;
    reviewdone: boolean;
    thumbnail: string;
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

export async function addToShelf(
    shelf: string,
    id: number,
    bookId: string,
    userId: string,
    title: string,
    author: string,
    thumbnail: string,
    pages?: number,
    publisher?: string,
    releaseDate?: string,
    startdate?: string,
    enddate?: string
): Promise<number | null> {
    console.log("addtoshelf");
    
    // Connect to the Neon database
    const sql = neon(`${process.env.DATABASE_URL}`);
    // Insert the comment from the form into the Postgres database
    try {
        let idFromBooks = id;
        if (!idFromBooks) {
            const idFromBooksResults = await sql.query(bookEntry(userId, bookId, releaseDate));
            idFromBooks = idFromBooksResults[0]?.id;
        }
        createBook(bookId, title, author, thumbnail, pages, publisher);
        const query = `UPDATE bookUsers
            SET shelves = ROW(
                (shelves).TBR${shelf === Shelf.TBR ? ` || ${idFromBooks}` : ""},
                (shelves).READING${shelf === Shelf.READING ? ` || ${idFromBooks}` : ""},
                (shelves).READ${shelf === Shelf.READ ? ` || ${idFromBooks}` : ""},
                (shelves).DNF${shelf === Shelf.DNF ? ` || ${idFromBooks}` : ""}
            )::shelvesType
            WHERE id = '${userId}' AND NOT (${idFromBooks} = ANY((shelves).${shelf}));
            `;
        console.log("############", idFromBooks, query);

        const response = await sql.query(query);

        if (startdate || enddate) {
            await sql.query(
                `UPDATE books
                SET ${startdate ? "startdate" : "enddate"} = '${startdate || enddate}'
                WHERE id = ${idFromBooks};
                `
            );
        }

        console.log(response);
        return idFromBooks;
    } catch (e) {
        console.error('Error in addToShelf:', e);
        throw e;
    }
};


export async function removeFromShelf(shelf: string, id: number, userId: string): Promise<boolean> {
    console.log("removefromshelf");
    // Connect to the Neon database
    const sql = neon(`${process.env.DATABASE_URL}`);
    // Insert the comment from the form into the Postgres database
    try {
        const query =
            `UPDATE bookUsers
            SET shelves = ROW(
                ${`${shelf === Shelf.TBR ? `array_remove((shelves).TBR, ${id})` : "(shelves).TBR"}`},
                ${`${shelf === Shelf.READING ? `array_remove((shelves).READING, ${id})` : "(shelves).READING"}`},
                ${`${shelf === Shelf.READ ? `array_remove((shelves).READ, ${id})` : "(shelves).READ"}`},
                ${`${shelf === Shelf.DNF ? `array_remove((shelves).DNF, ${id})` : "(shelves).DNF"}`}
            )::shelvesType
            WHERE id = '${userId}';
        `;
        console.log(query);
        const response = await sql.query(query);
        console.log(response);
        return true;
    } catch (e) {
        console.log(e);
        return false;
    }
}

export async function editFormats(bookId: string, userId: string, formats: Format[]): Promise<boolean> {
    console.log("editformats");
    // Connect to the Neon database
    const sql = neon(`${process.env.DATABASE_URL}`);
    // Insert the comment from the form into the Postgres database
    try {
        const query =
            `UPDATE books
            SET formats = ARRAY[${formats.join(",")}]
            WHERE bookid='${bookId}' AND userId='${userId}';`;
        console.log(query);
        const response = await sql.query(query);
        console.log(response);
        return true;
    } catch (e) {
        console.log(e);
        return false;
    }
}

export async function getAllBookInfo(id: number): Promise<BookData | null> {
    console.log("getAllBookInfo");
    // Connect to the Neon database
    const sql = neon(`${process.env.DATABASE_URL}`);
    // Insert the comment from the form into the Postgres database
    try {
        const query = `SELECT * FROM books WHERE id=${id}`;
        console.log(query);
        const response = await sql.query(query);
        console.log(response);
        return response.length === 1 ? response[0] as BookData : null;
    } catch (e) {
        console.log(e);
        throw e;
    }
}

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

type BookDataKeyType = keyof BookData;

export async function updateBook(data: BookData): Promise<void> {
    console.log("updatebook");
    // Connect to the Neon database
    const sql = neon(`${process.env.DATABASE_URL}`);

    const fields: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const values: any[] = [];
    let i = 1;

    Object.keys(data).map(
        (field: string) => {
            if (data[field as BookDataKeyType] !== undefined) {
                fields.push(`${field} = $${i++}`);
                values.push(data[field as BookDataKeyType]);
            }
        }
    )

    if (fields.length === 0) {
        console.log("Nothing to update");
        return;
    }

    // Add the WHERE clause
    const query = `
    UPDATE books
    SET ${fields.join(", ")}
    WHERE id = $${i}
  `;
    values.push(data.id);

    console.log("@@@@")
    console.log(query);
    console.log(values);

    const result = await sql.query(query, values);
    console.log("====")
    console.log(result);
    //return result;
}

export const addLabel = async (userId: string, label: string, column: string) => {
    console.log("addLabel");
    const query = `
    INSERT INTO labels (userid, ${column})
    VALUES ('${userId}', ARRAY['${label}'])
    ON CONFLICT (userid)
    DO UPDATE SET ${column} = (
        CASE
            WHEN NOT ('${label}' = ANY(COALESCE(labels.${column}, ARRAY[]::text[])))
            THEN array_append(COALESCE(labels.${column}, ARRAY[]::text[]), '${label}')
            ELSE labels.${column}
        END
    );
    `;

    const sql = neon(`${process.env.DATABASE_URL}`);
    try {
        console.log(query);
        const response = await sql.query(query);
        console.log(response);
        return true;
    } catch (e) {
        console.log(e);
        return false;
    }
};

export const getLabels = async (userId: string): Promise<LabelFields | null> => {
    console.log("get labels");
    const query = `
        SELECT * 
        FROM labels
        WHERE userid='${userId}'
    `;

    const sql = neon(`${process.env.DATABASE_URL}`);
    try {
        console.log(query);
        const response = await sql.query(query);
        console.log(response);
        return response.length === 1 ? response[0] as LabelFields : null;
    } catch (e) {
        console.error(e);
        throw e;
    }
}

export const getUpcomingBooks = async (): Promise<EmailInfo[]> => {
    console.log("getUpcomingBooks");
    const query = `
        SELECT 
            b.bookId,
            bi.title,
            bi.author,
            u.name,
            u.email,
            b.arcreviewed AS reviewdone,
            bi.thumbnail,
            COALESCE(b.releaseDate, b.releaseDateG) AS releasedate,
            CASE
                WHEN b.id = ANY((u.shelves).TBR) THEN 'TBR'
                WHEN b.id = ANY((u.shelves).READING) THEN 'READING'
                WHEN b.id = ANY((u.shelves).READ) THEN 'READ'
                WHEN b.id = ANY((u.shelves).DNF) THEN 'DNF'
                ELSE NULL
            END AS shelf
        FROM books b
        JOIN bookUsers u ON u.id = b.userid
        JOIN bookinfo bi ON bi.id = b.bookid
        WHERE COALESCE(b.releaseDate, b.releaseDateG) 
            BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '21 days';
    `;

    const sql = neon(`${process.env.DATABASE_URL}`);
    try {
        const response = await sql.query(query);
        console.log(response);
        return response as EmailInfo[];
    } catch (e) {
        console.log(e);
        return [];
    }
}

export const createBook = async (id: string, title: string, author: string, thumbnail: string, pages?: number, publisher?: string) => {
    console.log("create book");
    title = title.replaceAll("'", "''");
    author = author.replaceAll("'", "''");
    thumbnail = thumbnail.replaceAll("'", "''");
    publisher = publisher?.replaceAll("'", "''");
    try {
        const query = `
            INSERT INTO bookinfo (id, title, author, thumbnail, pages, publisher)
            VALUES ('${id}', '${title}', '${author}', '${thumbnail}', ${pages ?? null}, ${publisher ? `'${publisher}'` : null})
            ON CONFLICT (id) DO NOTHING;
        `;
        console.log(query);
        const sql = neon(`${process.env.DATABASE_URL}`);
        await sql.query(query);
        return true;
    } catch (error) {
        console.error('Error inserting into bookinfo:', error);
        throw error;
    }
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

export const createUser = async (userId: string, name: string, email: string): Promise<boolean> => {
    console.log("createuser");
    const query = `
        INSERT INTO bookUsers (id, name, email)
        VALUES ('${userId}', '${name}', '${email}')
        ON CONFLICT (id) DO NOTHING;
    `;

    const sql = neon(`${process.env.DATABASE_URL}`);
    console.log(query);
    try {
        await sql.query(query);
        console.log("createuser success");
        return true;
    } catch (e) {
        console.log("createuser error", e);
        return false;
    }
}

export const getARCTBR = async (userId: string, name?: string, email?: string): Promise<firstLookup[]> => {
    console.log("getARCTBR");
    if (name && email) {
        await createUser(userId, name, email);
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
const isOverdue = (releaseDate: Date) => {
    if (dayjs(releaseDate).isBefore(twoWeeksAgo)) {
        return true;
    }

    return false;
}
