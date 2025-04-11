"use client"

import { LoadingOutlined } from '@ant-design/icons';
import { IconBook, IconBook2, IconBookmark, IconPlus, IconTag, IconVocabularyOff } from "@tabler/icons-react";
import { Button, ConfigProvider, Dropdown, Input, MenuProps, Spin, Tooltip } from 'antd';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { KeyboardEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Formats } from './components/FormatButtons';
import Header from './components/Header';
import { LabelsModal } from './components/LabelsModal';
import { useIsMobile } from './hooks';
import { addToShelf, existsOnShelf, firstLookup, removeFromShelf } from "./lib/data";
import { Format, Shelf, userId } from './lib/helper';
import styles from "./page.module.css";

dayjs.extend(customParseFormat);

const googleURLForTitle = "https://www.googleapis.com/books/v1/volumes?maxResults=20&printType=books&q=";
const dateFormat = 'YYYY-MM-DD';

export default function Home() {
  const [books, setBooks] = useState<Book[]>([]);
  const [existingShelves, setExistingShelves] = useState<Map<string, firstLookup>>();
  const [existingShelfLoading, setExistingShelfLoading] = useState(false);

  const updateId = useCallback(
    (id: number, bookId: string) => {
      const newExistingShelves = new Map(existingShelves);
      newExistingShelves.set(bookId, { ...newExistingShelves.get(bookId) as firstLookup, id });
      setExistingShelves(newExistingShelves);
    },
    [existingShelves]
  )

  const onEnter = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
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
    },
    []
  );

  return (
    <ConfigProvider theme={{ components: { Rate: { starColor: "#f45f67" } } }}>
      <div className={styles.page}>
        <Header />
        <Input placeholder="search for book, use quotes for exact match, intitle:, inauthor:" onPressEnter={onEnter} />
        {existingShelfLoading && <Spin indicator={<LoadingOutlined spin />} size="large" className="pageLoading" />}
        {!existingShelfLoading &&
          <div className={styles.bookResults}>
            {books.map(
              (book) => {
                const firstState = existingShelves?.get(book.id);
                return <BookRow book={book} key={book.id} firstState={firstState as firstLookup} updateId={updateId} />
              }
            )}
          </div>
        }
      </div>
    </ConfigProvider>
  );
}

const getIconSize = (isMobile: boolean) => isMobile ? 18 : 24;

const BookRow = (props: { book: Book, firstState: firstLookup, updateId: (id: number, bookId: string) => void }) => {
  const bookInfo = props.book.volumeInfo;
  const [onShelf, setOnShelf] = useState<Shelf | undefined>(props.firstState?.shelf);
  const [formatsChosen, setFormatChosen] = useState<boolean[]>([false, false, false]);
  const [modalOpen, openModal] = useState(false);
  const isMobile = useIsMobile();
  const iconSize = useMemo(() => getIconSize(isMobile), [isMobile]);
  const buttonSize = useMemo(() => isMobile ? "small" : "middle", [isMobile])

  useEffect(
    () => {
      if (props.firstState?.formats) {
        const formats = [...formatsChosen];
        props.firstState?.formats.map(
          (format: Format) => {
            formats[format] = true;
          }
        );

        setFormatChosen(formats);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [props.firstState?.formats]
  );

  useEffect(
    () => {
      if (props.firstState?.shelf) {
        console.log("inshelf: ", props.firstState?.shelf);
        setOnShelf(props.firstState?.shelf);
      }
    },
    [props.firstState?.shelf]
  )

  const shelfClick = useCallback(
    async (shelf: Shelf) => {
      if (onShelf !== shelf) {
        if (onShelf) {
          console.log("removing from existing", onShelf);
          await removeFromShelf(onShelf, props.firstState?.id, userId);
        }
        console.log("adding to", shelf, props.firstState?.id);
        const response = await addToShelf(
          shelf,
          props.firstState?.id,
          props.book?.id,
          userId,
          shelf === Shelf.READING ? dayjs().format(dateFormat) : undefined,
          shelf === Shelf.READ ? dayjs().format(dateFormat) : undefined,
        );
        if (response) {
          console.log("success", props.firstState?.id, response);
          if (!props.firstState?.id) {
            props.updateId(response, props.book?.id);
          }
          setOnShelf(shelf);
        } else {
          console.log("failure");
        }
      } else {
        console.log("removing from", shelf);
        if (await removeFromShelf(shelf, props.firstState?.id, userId)) {
          console.log("removed");
          setOnShelf(undefined);
        } else {
          console.log("failed removing");
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [props.firstState?.id, onShelf, props.book.id, props.updateId]
  );

  const tbrClick = useCallback(() => shelfClick(Shelf.TBR), [shelfClick]);
  const readingClick = useCallback(() => { shelfClick(Shelf.READING); }, [shelfClick]);
  const readClick = useCallback(() => { shelfClick(Shelf.READ); }, [shelfClick]);
  const dnfClick = useCallback(() => shelfClick(Shelf.DNF), [shelfClick]);

  const tagClick = useCallback(() => openModal(true), []);
  const closeModal = useCallback(() => openModal(false), []);

  const FormatsComponent = (
    <Formats
      formatsChosen={formatsChosen}
      bookId={props.book.id}
      setFormatsChosen={setFormatChosen}
      className={styles.formats}
      iconSize={18} />
  );

  const menuOptions: MenuProps['items'] = useMemo(
    () => [
      {
        label: "TBR",
        icon: <IconBookmark />,
        key: Shelf.TBR,
        onClick: tbrClick
      },
      {
        label: "Reading",
        icon: <IconBook />,
        key: Shelf.READING,
        onClick: readingClick,
      },
      {
        label: "Read",
        icon: <IconBook2 />,
        key: Shelf.READ,
        onClick: readClick
      },
      {
        label: "DNF",
        icon: <IconVocabularyOff />,
        key: Shelf.DNF,
        onClick: dnfClick
      },
      {
        label: "Tag",
        icon: <IconTag />,
        key: "Tag",
        onClick: tagClick
      },
    ],
    [tbrClick, readingClick, readClick, dnfClick, tagClick]
  );

  const menuProps: MenuProps = useMemo(
    () => ({
      items: menuOptions,
      selectedKeys: [onShelf as string]
    }),
    [menuOptions,onShelf]
  );

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
        {isMobile && (
          <Dropdown menu={menuProps} >
            {getMenuIcon(onShelf)}
          </Dropdown>
        )}
        {!isMobile && (
          <>
            <Tooltip title="TBR">
              <Button icon={<IconBookmark size={iconSize} />} onClick={tbrClick} type={onShelf === Shelf.TBR ? "primary" : undefined} size={buttonSize} />
            </Tooltip>

            <div className={styles.shelfButtons}>
              <Tooltip title="Reading">
                <Button icon={<IconBook size={iconSize} />} onClick={readingClick} type={onShelf === Shelf.READING ? "primary" : undefined} size={buttonSize} />
              </Tooltip>
              {onShelf === Shelf.READING && FormatsComponent}
            </div>

            <div className={styles.shelfButtons}>
              <Tooltip title="Read">
                <Button icon={<IconBook2 size={iconSize} />} onClick={readClick} type={onShelf === Shelf.READ ? "primary" : undefined} size={buttonSize} />
              </Tooltip>
              {onShelf === Shelf.READ && FormatsComponent}
            </div>

            <Tooltip title="DNF">
              <Button icon={<IconVocabularyOff size={iconSize} />} onClick={dnfClick} type={onShelf === Shelf.DNF ? "primary" : undefined} size={buttonSize} />
            </Tooltip>

            <Tooltip title="Tag">
              <Button icon={<IconTag size={iconSize} />} size={buttonSize} onClick={tagClick} />
            </Tooltip>
          </>
        )}
      </div >
      {modalOpen &&
        <LabelsModal
          key={props.book.id}
          isOpen={modalOpen}
          closeModal={closeModal}
          onShelf={onShelf}
          book={props.book}
          bookState={props.firstState}
          formatsChosen={formatsChosen}
          setFormatsChosen={setFormatChosen}
        />
      }
    </>
  )
};

const getMenuIcon = (onShelf: Shelf | undefined) => {
  switch (onShelf) {
    case Shelf.TBR:
      return <IconBookmark className={styles.onShelfIcon}/>
    case Shelf.READING: 
      return <IconBook className={styles.onShelfIcon}/>
    case Shelf.READ:
      return <IconBook2 className={styles.onShelfIcon}/>
    case Shelf.DNF: 
      return <IconVocabularyOff className={styles.onShelfIcon}/>
    default:
      return <IconPlus />
  }
}
