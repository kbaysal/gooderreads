"use client"

import { KeyboardEvent, useState } from "react";
import styles from "./page.module.css";
import { Input } from 'antd';

const googleURLForTitle = "https://www.googleapis.com/books/v1/volumes?maxResults=20&printType=books&q=intitle:";
const openLibraryURL = "https://openlibrary.org/search.json?q="

export default function Home() {
  const [books, setBooks] = useState<Book[]>([]);

  const onEnter = (e: KeyboardEvent<HTMLInputElement>) => {
    console.log((e.target as any).value);
    fetch(`${googleURLForTitle}"${encodeURI((e.target as any).value)}"`).then(
      async (response) => {
        const result: BookResponse = await response.json();
        console.log(result);
        if(result?.items?.length > 0) {
          result.items = result.items.filter((book) => book.volumeInfo?.title && book.volumeInfo?.authors?.length > 0);
          setBooks(result.items);
        }
      }
    )

    fetch(`${openLibraryURL}${encodeURI((e.target as any).value)}`).then(
      async (response) => {
        const result: BookResponse = await response.json();
        console.log("other");
        console.log(result);
      }
    )
  };

  return (
    <div className={styles.page}>
        <Input placeholder="book name" onPressEnter={onEnter}/>
        <div className={styles.bookResults}>
        {books.map(
          (book) => 
            <BookRow book={book} key={book.id}/>
        )}
        </div>
    </div>
  );
}


const BookRow = (props: {book: Book}) => {
  const bookInfo = props.book.volumeInfo;
  return (
    <>
      <img className={styles.bookImg} src={bookInfo.imageLinks?.smallThumbnail ?? bookInfo.imageLinks?.thumbnail} />
      <div>
        <div className={styles.bookTitle}>{bookInfo.title}</div>
        <div className={styles.author}>{bookInfo.authors?.join(", ")}</div>
        <div className={styles.metadata}>
          <span>{bookInfo.pageCount}p</span>
          <span>{bookInfo.publishedDate}</span>
          <span>{bookInfo.publisher}</span>
          <span>{props.book.saleInfo.country}</span>
        </div>
      </div>
    </>
  )
}