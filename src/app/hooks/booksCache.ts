'use client';

const books = new Map<string, Book>();

export function addBook(book: Book) {
    books.set(book.id, book);
}

export function setPubDateOverride(book: Book, pubdate: Date) {
    books.set(book.id, { ...book, volumeInfo: { ...book.volumeInfo, publishedDateOverride: pubdate } });
}

export function getBook(id: string) {
    return books.get(id);
}
