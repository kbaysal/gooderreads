'use server';

import { neon } from '@neondatabase/serverless';
import { bookEntry, Format, Shelf } from './helper';

export interface firstLookup {
    id: number;
    bookid: string;
    formats: Format[];
    shelf: Shelf;
}

export interface LabelFields {
    userid: number;
    sources?: string[];
    diversity?: string[];
    labels?: string[];
    arc?: string[];
    country?: string[];
    genre?: string[];
}

export interface BookData extends LabelFields{
    id: number;
    bookid: string;
    startdate?: Date;
    enddate?: Date;
    formats?: Format[];
    rating?: number;
    spice?: number;
    diverse?: boolean;
    bipoc?: boolean;
    lgbt?: boolean;
    owned?: number;
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
        if (!idFromBooks) {
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
            ${`${shelf === Shelf.READING ? `array_remove((shelves).READING, ${id})` : "(shelves).READING"}`},
            ${`${shelf === Shelf.READ ? `array_remove((shelves).READ, ${id})` : "(shelves).READ"}`},
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

export async function getBooksFromShelf(shelf: Shelf, userId: number): Promise<firstLookup[]> {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const response = await sql.query(`
        SELECT b.bookid, b.id, b.formats, '${shelf}' AS shelf
        FROM books b
        JOIN bookUsers u ON u.id = b.userid
        WHERE b.id = ANY((u.shelves).${shelf})
        AND u.id = ${userId};
    `);
    console.log(response);
    return response as firstLookup[];
}

export async function updateBook(data: BookData): Promise<void> {
    // Connect to the Neon database
    const sql = neon(`${process.env.DATABASE_URL}`);

    const fields: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const values: any[] = [];
    let i = 1;

    // Only push fields that are defined
    if (data.startdate !== undefined) {
        fields.push(`startdate = $${i++}`);
        values.push(data.startdate);
    }
    if (data.enddate !== undefined) {
        fields.push(`enddate = $${i++}`);
        values.push(data.enddate);
    }
    if (data.formats !== undefined) {
        fields.push(`formats = $${i++}`);
        values.push(data.formats);
    }
    if (data.rating !== undefined) {
        fields.push(`rating = $${i++}`);
        values.push(data.rating);
    }
    if (data.spice !== undefined) {
        fields.push(`spice = $${i++}`);
        values.push(data.spice);
    }
    if (data.sources !== undefined) {
        fields.push(`sources = $${i++}`);
        values.push(data.sources);
    }
    if (data.diverse !== undefined) {
        fields.push(`diverse = $${i++}`);
        values.push(data.diverse);
    }
    if (data.bipoc !== undefined) {
        fields.push(`bipoc = $${i++}`);
        values.push(data.bipoc);
    }
    if (data.lgbt !== undefined) {
        fields.push(`lgbt = $${i++}`);
        values.push(data.lgbt);
    }
    if (data.diversity !== undefined) {
        fields.push(`diversity = $${i++}`);
        values.push(data.diversity);
    }
    if (data.labels !== undefined) {
        fields.push(`labels = $${i++}`);
        values.push(data.labels);
    }
    if (data.owned !== undefined) {
        fields.push(`owned = $${i++}`);
        values.push(data.owned);
    }
    if (data.arc !== undefined) {
        fields.push(`arc = $${i++}`);
        values.push(data.arc);
    }
    if (data.country !== undefined) {
        fields.push(`country = $${i++}`);
        values.push(data.country);
    }
    if (data.genre !== undefined) {
        fields.push(`genre = $${i++}`);
        values.push(data.genre);
    }

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

export const addLabel = async (userId: number, label: string, column: string) => {
    const query = `
    UPDATE labels
    SET ${column} = array_append(${column}, '${label}')
    WHERE userid = ${userId} AND NOT ('${label}' = ANY(${column}));
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

export const getLabels = async (userId: number): Promise<LabelFields[]> => {
    const query = `
        SELECT * 
        FROM labels
        WHERE userid=${userId}
    `;

    const sql = neon(`${process.env.DATABASE_URL}`);
    try {
        console.log(query);
        const response = await sql.query(query);
        console.log(response);
        return response as LabelFields[];
    } catch (e) {
        console.log(e);
        return [];
    }
}

export const getARCTBR = async (userId: number): Promise<firstLookup[]> => {
    const query = `
        SELECT 
            b.bookid, 
            b.id, 
            CASE
                WHEN b.id = ANY((u.shelves).TBR) THEN 'TBR'
                WHEN b.id = ANY((u.shelves).READING) THEN 'READING'
            END AS shelf, 
            b.formats
        FROM books b
        JOIN bookUsers u ON u.id = b.userid
        WHERE (b.id = ANY((u.shelves).TBR) OR b.id = ANY((u.shelves).READING))
            AND u.id = ${userId}
            AND 'arc' = ANY(b.sources);
    `;

    const sql = neon(`${process.env.DATABASE_URL}`);
    try {
        console.log("qqqqq", query);
        const response = await sql.query(query);
        console.log(response);
        console.log(typeof response[0]);
        return response as firstLookup[];
    } catch (e) {
        console.log(e);
        return [];
    }
}
