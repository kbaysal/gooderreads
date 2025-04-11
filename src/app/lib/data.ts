'use server';

import { neon } from '@neondatabase/serverless';
import { bookEntry, Format, Shelf } from './helper';

export interface firstLookup {
    id: number;
    bookid: string;
    formats: Format[];
    shelf: Shelf;
}

export interface BookData {
    id: number;
    userid: number;
    bookid: string;
    startdate: Date;
    enddate: Date;
    formats: Format[];
    rating: number;
    spice: number;
    sources: string[];
    diverse: boolean;
    bipoc: boolean;
    lgbt: boolean;
    diversity: string[];
    labels: string[];
    owned: number;
    arc: string[];
    country: string[];
    genre: string[];
}

export async function existsOnShelf(bookIds: string[], userId: number): Promise<firstLookup[]> {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const query = `
        WITH input_bookids(bookid) AS (
            VALUES ('${bookIds.join("'),('")}')),
        matched_books AS (
            SELECT b.id AS id, b.bookid, b.formats
            FROM books b
            INNER JOIN input_bookids i ON i.bookid = b.bookid
        ),
        shelf_lookup AS (
        SELECT 
            m.bookid,
            m.formats,
            m.id,
            CASE
                WHEN m.id = ANY((u.shelves).TBR) THEN 'TBR'
                WHEN m.id = ANY((u.shelves).READING) THEN 'READING'
                WHEN m.id = ANY((u.shelves).READ) THEN 'READ'
                WHEN m.id = ANY((u.shelves).DNF) THEN 'DNF'
            ELSE NULL
            END AS shelf
        FROM matched_books m
        LEFT JOIN bookUsers u ON u.id = ${userId}  -- use your user ID here
        )

        SELECT * FROM shelf_lookup;
`;

    console.log(query);
    const response = await sql.query(query);

    console.log(response);
    return response as firstLookup[];
}

export async function addToShelf(shelf: string, id: number, bookId: string, userId: number, startdate?: string, enddate?: string): Promise<number | null> {
    // Connect to the Neon database
    const sql = neon(`${process.env.DATABASE_URL}`);
    // Insert the comment from the form into the Postgres database
    try {
        let idFromBooks = id;
        if(!idFromBooks) {
            const idFromBooksResults = await sql.query(bookEntry(userId, bookId));
            idFromBooks = idFromBooksResults[0]?.id;
        }
        const query = `UPDATE bookUsers
            SET shelves = ROW(
                (shelves).TBR${shelf === Shelf.TBR ? ` || ${idFromBooks}` : ""},
                (shelves).READING${shelf === Shelf.READING ? ` || ${idFromBooks}` : ""},
                (shelves).READ${shelf === Shelf.READ ? ` || ${idFromBooks}` : ""},
                (shelves).DNF${shelf === Shelf.DNF ? ` || ${idFromBooks}` : ""}
            )::shelvesType
            WHERE id = ${userId} AND NOT (${idFromBooks} = ANY((shelves).${shelf}));
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
        console.log(e);
        return null;
    }
};


export async function removeFromShelf(shelf: string, id: number, userId: number): Promise<boolean> {
    // Connect to the Neon database
    const sql = neon(`${process.env.DATABASE_URL}`);
    // Insert the comment from the form into the Postgres database
    try {
        const query =
            `UPDATE bookUsers
        SET shelves = ROW(
            ${`${shelf === Shelf.TBR ? `array_remove((shelves).TBR, ${id})` : "(shelves).TBR"}`},
            ${`${shelf === Shelf.READ ? `array_remove((shelves).READ, ${id})` : "(shelves).READ"}`},
            ${`${shelf === Shelf.READING ? `array_remove((shelves).READING, ${id})` : "(shelves).READING"}`},
            ${`${shelf === Shelf.DNF ? `array_remove((shelves).DNF, ${id})` : "(shelves).DNF"}`}
        )::shelvesType
        WHERE id = ${userId};
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

export async function editFormats(bookId: string, userId: number, formats: Format[]): Promise<boolean> {
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

export async function getAllBookInfo(id: number): Promise<BookData[]> {
    // Connect to the Neon database
    const sql = neon(`${process.env.DATABASE_URL}`);
    // Insert the comment from the form into the Postgres database
    try {
        const query = `SELECT * FROM books WHERE id=${id}`;
        console.log(query);
        const response = await sql.query(query);
        console.log(response);
        return response as BookData[];
    } catch (e) {
        console.log(e);
        return [];
    }
}



