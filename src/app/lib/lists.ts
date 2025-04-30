"use server"

import { neon } from "@neondatabase/serverless";
import { BookFilter, ListInfo } from "./data";


export async function editList(listId: number, name: string, filters: BookFilter): Promise<boolean> {
    try {
        console.log("editList");
        const query = `
            UPDATE lists
            SET name = $1,
                filters = $2
            WHERE id = $3;
    `;
        console.log(query);
        const sql = neon(`${process.env.DATABASE_URL}`);
        await sql.query(query, [name, filters, listId]);
        return true;
    } catch (e) {
        console.error("Error in editList", e);
        throw e;
    }
}

export async function deleteList(listId: number): Promise<boolean> {
    try {
        console.log("deleteList");
        const query = `
            DELETE FROM lists WHERE id = ${listId};
        `;
        console.log(query);
        const sql = neon(`${process.env.DATABASE_URL}`);
        await sql.query(query);
        return true;
    } catch (e) {
        console.error("Error in deleteList", e);
        throw e;
    }
}

export async function createList(userId: string, name: string, filters: BookFilter): Promise<number | null> {
    try {
        console.log("createList");
        const query = `
            INSERT INTO lists (userid, name, filters)
            VALUES ($1, $2, $3)
            RETURNING id;
        `;
        console.log(query, userId, name, filters);
        const sql = neon(`${process.env.DATABASE_URL}`);
        const response = await sql.query(query, [userId, name, filters]);
        return response.length === 1 ? response[0].id as number : null;
    } catch (e) {
        console.error("Error in createList", e);
        throw e;
    }
}

export async function getLists(userId: string): Promise<ListInfo[]> {
    try {
        console.log("getLists");
        const query = `
            SELECT * 
            FROM lists
            WHERE lists.userid = '${userId}'
            ORDER BY lists.id asc
        `;
        console.log(query);
        const sql = neon(`${process.env.DATABASE_URL}`);
        const response = await sql.query(query);
        console.log(response);
        return response as ListInfo[];
    } catch (e) {
        console.error("Error in getLists", e);
        throw e;
    }
}