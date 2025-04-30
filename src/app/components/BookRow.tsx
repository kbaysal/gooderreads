"use client"

import { useAuth } from "@clerk/nextjs";
import { IconInfoHexagon } from "@tabler/icons-react";
import { Popover, Tag } from "antd";
import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useIsMobile } from "../hooks/useWindowDimension";
import { addToShelf, firstLookup, removeFromShelf } from "../lib/data";
import { dateFormat, Format, Shelf } from "../lib/helper";
import styles from "../page.module.css";
import BookShelves from "./BookShelves";
import { Formats } from "./FormatButtons";
import { LabelsModal } from "./LabelsModal";

const getIconSize = (isMobile: boolean) => isMobile ? 18 : 24;

interface BookRowProps {
    book: Book;
    firstState: firstLookup;
    updateId?: (id: number, bookId: string) => void;
    showLabels?: string[];
    grid?: boolean;
    onRemove?(bookId: number): void;
}

const popoverStyles = {
    body: {
        padding: "16px 24px",
        maxWidth: 500,
        maxHeight: 350,
        overflow: "auto"
    }
}

export const BookRow = (props: BookRowProps) => {
    const bookInfo = props.book.volumeInfo;
    const [onShelf, setOnShelf] = useState<Shelf | undefined>(props.firstState?.shelf);
    const [formatsChosen, setFormatChosen] = useState<boolean[]>([false, false, false]);
    const [modalOpen, openModal] = useState(false);
    const isMobile = useIsMobile();
    const iconSize = useMemo(() => getIconSize(isMobile), [isMobile]);
    const buttonSize = useMemo(() => isMobile ? "small" : "middle", [isMobile]);
    const { userId } = useAuth();

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
                    await removeFromShelf(onShelf, props.firstState?.id, userId as string);
                }
                console.log("adding to", shelf, props.firstState?.id);
                const response = await addToShelf(
                    shelf,
                    props.firstState?.id,
                    props.book?.id,
                    userId as string,
                    bookInfo.title,
                    bookInfo.authors.join(", "),
                    bookInfo.imageLinks?.smallThumbnail ?? bookInfo.imageLinks?.thumbnail,
                    bookInfo.pageCount,
                    bookInfo.publisher,
                    bookInfo.publishedDate,
                    shelf === Shelf.READING ? dayjs().format(dateFormat) : undefined,
                    shelf === Shelf.READ ? dayjs().format(dateFormat) : undefined,
                );
                if (response) {
                    console.log("success", props.firstState?.id, response);
                    if (!props.firstState?.id) {
                        props.updateId?.(response, props.book?.id);
                    }
                    setOnShelf(shelf);
                } else {
                    console.log("failure");
                }
            } else {
                console.log("removing from", shelf);
                if (await removeFromShelf(shelf, props.firstState?.id, userId as string)) {
                    props.onRemove?.(props.firstState?.id);
                    console.log("removed");
                    setOnShelf(undefined);
                } else {
                    console.log("failed removing");
                }
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [props.firstState?.id, onShelf, props.book.id, props.updateId, userId]
    );

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

    return (
        <>
            {/* eslint-disable-next-line @next/next/no-img-element*/}
            <img
                className={styles.bookImg} src={bookInfo.imageLinks?.smallThumbnail ?? bookInfo.imageLinks?.thumbnail}
                alt={`Thumbnail for ${bookInfo.title} by ${bookInfo.authors?.join(", ")}`}
                onClick={props.grid ? tagClick : undefined}
            />
            <div className={styles.bookInfo}>
                <div className={styles.bookTitle}>
                    {bookInfo.title}
                    <Popover
                        content={<div dangerouslySetInnerHTML={{ __html: bookInfo.description }}></div>}
                        placement="right"
                        styles={popoverStyles}
                    >
                        <IconInfoHexagon size={16} color="lightgray" />
                    </Popover>
                </div>
                <div className={styles.author}>{bookInfo.authors?.join(", ")}</div>
                <div className={styles.tags}>
                    {props.showLabels?.map(label => <Tag bordered={false} color="geekblue" key={label} closable>{label}</Tag>)}
                </div>
                <div className={styles.metadata}>
                    {bookInfo.pageCount && <span>{bookInfo.pageCount}p</span>}
                    <span>{props.firstState?.releasedate ? dayjs(props.firstState.releasedate).add(1, "day").format(dateFormat) : bookInfo.publishedDate}</span>
                    <span className={styles.publisher}>{bookInfo.publisher}</span>
                    <span>{props.book.saleInfo.country}</span>
                </div>
            </div>
            <div className={styles.buttons}>
                <BookShelves
                    iconSize={iconSize}
                    shelfClick={shelfClick}
                    buttonSize={buttonSize}
                    minimized={isMobile}
                    onShelf={onShelf ? [onShelf] : []}
                    FormatsComponent={FormatsComponent}
                    tagClick={tagClick}
                />
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
                    shelfClick={shelfClick}
                />
            }
        </>
    )
};
