'use server';

import { neon } from '@neondatabase/serverless';
import { bookEntry, Format, Shelf } from './helper';

export interface firstLookup {
    bookid: string;
    formats: Format[];
    shelf: string
}

export async function existsOnShelf(bookIds: string[], userId: number): Promise<firstLookup[]> {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const query = `
        WITH input_bookids(bookid) AS (
            VALUES ('${bookIds.join("'),('")}')),
        matched_books AS (
            SELECT b.id AS book_id_int, b.bookid, b.formats
            FROM books b
            INNER JOIN input_bookids i ON i.bookid = b.bookid
        ),
        shelf_lookup AS (
        SELECT 
            m.bookid,
            m.formats,
            CASE
            WHEN m.book_id_int = ANY((u.shelves).TBR) THEN 'TBR'
            WHEN m.book_id_int = ANY((u.shelves).READING) THEN 'READING'
            WHEN m.book_id_int = ANY((u.shelves).READ) THEN 'READ'
            WHEN m.book_id_int = ANY((u.shelves).DNF) THEN 'DNF'
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

export async function addToShelf(shelf: string, bookId: string, userId: number): Promise<boolean> {
    // Connect to the Neon database
    const sql = neon(`${process.env.DATABASE_URL}`);
    // Insert the comment from the form into the Postgres database
    try {
        const idFromBooksResults = await sql.query(bookEntry(userId, bookId));
        const idFromBooks = idFromBooksResults[0]?.id;
        const query = `UPDATE bookUsers
            SET shelves = ROW(
                (shelves).TBR${shelf === Shelf.TBR ? ` || ${idFromBooks}` : ""},
                (shelves).READING${shelf === Shelf.READING ? ` || ${idFromBooks}` : ""},
                (shelves).READ${shelf === Shelf.READ ? ` || ${idFromBooks}` : ""},
                (shelves).DNF${shelf === Shelf.DNF ? ` || ${idFromBooks}` : ""}
            )::shelvesType
            WHERE id = ${userId} AND NOT (${idFromBooks} = ANY((shelves).${shelf}));
            `;
            console.log("############", idFromBooksResults, query);

        const response = await sql.query(query);

        console.log(response);
        return true;
    } catch (e) {
        console.log(e);
        return false;
    }
};


export async function removeFromShelf(shelf: string, bookId: string, userId: number): Promise<boolean> {
    // Connect to the Neon database
    const sql = neon(`${process.env.DATABASE_URL}`);
    // Insert the comment from the form into the Postgres database
    try {
        const idFromBooksResults = await sql.query(bookEntry(userId, bookId));
        const idFromBooks = idFromBooksResults[0]?.id;
        const query = 
        `UPDATE bookUsers
        SET shelves = ROW(
            ${`${shelf === Shelf.TBR ? `array_remove((shelves).TBR, ${idFromBooks})` : "(shelves).TBR"}`},
            ${`${shelf === Shelf.READ ? `array_remove((shelves).READ, ${idFromBooks})` : "(shelves).READ"}`},
            ${`${shelf === Shelf.READING ? `array_remove((shelves).READING, ${idFromBooks})` : "(shelves).READING"}`},
            ${`${shelf === Shelf.DNF ? `array_remove((shelves).DNF, ${idFromBooks})` : "(shelves).DNF"}`}
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



