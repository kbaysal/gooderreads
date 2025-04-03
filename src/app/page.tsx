"use client"

import { KeyboardEvent, useState } from "react";
import styles from "./page.module.css";
import { Button, Input, Tooltip } from 'antd';
import {IconBook, IconBook2, IconBookmark, IconTag, IconVocabularyOff} from "@tabler/icons-react";
import Image from "next/image";

const googleURLForTitle = "https://www.googleapis.com/books/v1/volumes?maxResults=20&printType=books&q=";

export default function Home() {
  const [books, setBooks] = useState<Book[]>([]);

  const onEnter = (e: KeyboardEvent<HTMLInputElement>) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    console.log((e.target as any).value);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fetch(`${googleURLForTitle}"${encodeURI((e.target as any).value)}"`).then(
      async (response) => {
        const result: BookResponse = await response.json();
        console.log(result);
        if(result?.items?.length > 0) {
          result.items = result.items.filter((book) => book.volumeInfo?.title && book.volumeInfo?.authors?.length > 0);
          setBooks(result.items);
        }
      }
    );
  }

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
      <Image 
        className={styles.bookImg} src={bookInfo.imageLinks?.smallThumbnail ?? bookInfo.imageLinks?.thumbnail} 
        alt={`Thumbnail for ${bookInfo.title} by ${bookInfo.authors?.join(", ")}`}
      />
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
      <div className={styles.buttons}>
        <Tooltip title="TBR">
          <Button icon={<IconBookmark />} />
        </Tooltip>
        <Tooltip title="Reading">
          <Button icon={<IconBook />} />
        </Tooltip>
        <Tooltip title="Read">
          <Button icon={<IconBook2 />} />
        </Tooltip>
        <Tooltip title="DNF">
          <Button icon={<IconVocabularyOff />} />
        </Tooltip>
        <Tooltip title="Tag">
          <Button icon={<IconTag />} />
        </Tooltip>
      </div>
    </>
  )
}