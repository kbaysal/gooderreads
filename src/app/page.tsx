"use client"

import { LoadingOutlined } from '@ant-design/icons';
import { IconBook, IconBook2, IconBookmark, IconBooks, IconDeviceTabletBolt, IconHeadphones, IconTag, IconVocabularyOff } from "@tabler/icons-react";
import { Button, Input, Spin, Tooltip } from 'antd';
import { KeyboardEvent, useCallback, useEffect, useState } from "react";
import { addToShelf, editFormats, existsOnShelf, firstLookup, removeFromShelf } from "./lib/data";
import styles from "./page.module.css";
import { Format } from './lib/helper';

const googleURLForTitle = "https://www.googleapis.com/books/v1/volumes?maxResults=20&printType=books&q=";
const userId = 3;

export default function Home() {
  const [books, setBooks] = useState<Book[]>([]);
  const [existingShelves, setExistingShelves] = useState<Map<string, firstLookup>>();
  const [existingShelfLoading, setExistingShelfLoading] = useState(false);

  const onEnter = (e: KeyboardEvent<HTMLInputElement>) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    console.log((e.target as any).value);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fetch(`${googleURLForTitle}"${encodeURI((e.target as any).value)}"`).then(
      async (response) => {
        setExistingShelfLoading(true);
        const result: BookResponse = await response.json();
        console.log(result);
        if (result?.items?.length > 0) {
          result.items = result.items.filter((book) => book.volumeInfo?.title && book.volumeInfo?.authors?.length > 0);
          setBooks(result.items);

          const shelfState = await existsOnShelf(result.items.map((book) => book.id), userId);
          const shelfMap = new Map<string, firstLookup>();
          shelfState.forEach(
            (book) => {
              shelfMap.set(book.bookid, book);
            }
          )
          setExistingShelves(shelfMap);
          setExistingShelfLoading(false);
          console.log(shelfMap);
          console.log("shelfstate", shelfState);
        }
      }
    );
  }

  return (
    <div className={styles.page}>
      <Input placeholder="book name" onPressEnter={onEnter} />
      {existingShelfLoading && <Spin indicator={<LoadingOutlined spin />} size="large" />}
      {!existingShelfLoading &&
        <div className={styles.bookResults}>
          {books.map(
            (book) => {
              const firstState = existingShelves?.get(book.id);
              return <BookRow book={book} key={book.id} inShelf={firstState?.shelf} formats={firstState?.formats} />
            }
          )}
        </div>
      }
    </div>
  );
}


const BookRow = (props: { book: Book, inShelf: string | undefined, formats: Format[] | undefined }) => {
  const bookInfo = props.book.volumeInfo;
  const [onShelf, setOnShelf] = useState<string | undefined>(props.inShelf);
  const [formatsChosen, setFormatChosen] = useState<boolean[]>([false, false, false]);

  useEffect(
    () => {
      if (props.formats) {
        const formats = [...formatsChosen];
        props.formats.map(
          (format: Format) => {
            formats[format] = true;
          }
        );

        setFormatChosen(formats);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [props.formats]
  );

  useEffect(
    () => {
      if (props.inShelf) {
        console.log("inshelf: ", props.inShelf);
        setOnShelf(props.inShelf);
      }
    },
    [props.inShelf]
  )

  const shelfClick = useCallback(
    async (shelf: string) => {
      if (onShelf !== shelf) {
        if (onShelf) {
          console.log("removing from existing", onShelf);
          await removeFromShelf(onShelf, props.book.id, userId);
        }
        console.log("adding to", shelf);
        const response = await addToShelf(shelf, props.book.id, userId);
        if (response) {
          console.log("success");
          setOnShelf(shelf);
        } else {
          console.log("failure");
        }
      } else {
        console.log("removing from", shelf);
        if (await removeFromShelf(shelf, props.book.id, userId)) {
          console.log("removed");
          setOnShelf(undefined);
        } else {
          console.log("failed removing");
        }
      }
    },
    [props.book.id, onShelf]
  );

  const tbrClick = useCallback(() => shelfClick("TBR"), [shelfClick]);
  const readingClick = useCallback(() => {
    shelfClick("READING");
  },
    [shelfClick]
  );
  const readClick = useCallback(() => {
    shelfClick("READ");
  },
    [shelfClick]
  );
  const dnfClick = useCallback(() => shelfClick("DNF"), [shelfClick]);

  return (
    <>
      <img
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
          <Button icon={<IconBookmark />} onClick={tbrClick} type={onShelf === "TBR" ? "primary" : undefined} />
        </Tooltip>

        <div className={styles.shelfButtons}>
          <Tooltip title="Reading">
            <Button icon={<IconBook />} onClick={readingClick} type={onShelf === "READING" ? "primary" : undefined} />
          </Tooltip>
          {onShelf === "READING" &&
            <Formats formatsChosen={formatsChosen} bookId={props.book.id} setFormatsChosen={setFormatChosen} />
          }
        </div>

        <div className={styles.shelfButtons}>
          <Tooltip title="Read">
            <Button icon={<IconBook2 />} onClick={readClick} type={onShelf === "READ" ? "primary" : undefined} />
          </Tooltip>
          {onShelf === "READ" &&
            <Formats formatsChosen={formatsChosen} bookId={props.book.id} setFormatsChosen={setFormatChosen} />
          }
        </div>

        <Tooltip title="DNF">
          <Button icon={<IconVocabularyOff />} onClick={dnfClick} type={onShelf === "DNF" ? "primary" : undefined} />
        </Tooltip>

        <Tooltip title="Tag">
          <Button icon={<IconTag />} />
        </Tooltip>
      </div>
    </>
  )
};

const Formats = (props: { formatsChosen: boolean[], bookId: string, setFormatsChosen: (f: boolean[]) => void }) => {
  const [timer, setTimer] = useState<number>();

  const onClick = useCallback(
    (format: Format) => {
      const formats = [...(props.formatsChosen)];
      formats[format] = !formats[format];
      props.setFormatsChosen(formats);
      if (timer) {
        window.clearTimeout(timer);
      }
      setTimer(window.setTimeout(() => {
        const formatArray: Format[] = [];
        formats.forEach((isOn, index) => isOn && formatArray.push(index));
        editFormats(props.bookId, userId, formatArray);
      }, 500));
    },
    [props, timer]
  );

  const onPhysical = useCallback(() => onClick(Format.Physical), [onClick]);
  const onEbook = useCallback(() => onClick(Format.EBook), [onClick]);
  const onAudiobook = useCallback(() => onClick(Format.Audiobook), [onClick]);

  return (
    <div className={styles.formats}>
      <Tooltip title="Physical">
        <Button
          onClick={onPhysical}
          icon={<IconBooks size={18} />}
          shape="circle"
          size="small"
          variant={props.formatsChosen[Format.Physical] === true ? "solid" : "filled"}
          color="pink"
        />
      </Tooltip>
      <Tooltip title="EBook">
        <Button
          onClick={onEbook}
          icon={<IconDeviceTabletBolt size={18} />}
          shape="circle"
          size="small"
          variant={props.formatsChosen[Format.EBook] === true ? "solid" : "filled"}
          color="cyan"
        />
      </Tooltip>
      <Tooltip title="Audiobook">
        <Button
          onClick={onAudiobook}
          icon={<IconHeadphones size={18} />}
          shape="circle"
          size="small"
          variant={props.formatsChosen[Format.Audiobook] === true ? "solid" : "filled"}
          color="purple"
        />
      </Tooltip>
    </div>
  )
};
