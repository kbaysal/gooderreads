"use client"

import { useAuth } from "@clerk/nextjs";
import { IconInfoHexagon } from "@tabler/icons-react";
import { Popover, Tag } from "antd";
import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useIsMobile } from "../hooks/useWindowDimension";
import { addToShelf, BookData, removeFromShelf } from "../lib/data";
import { dateFormat, Format, Shelf } from "../lib/helper";
import styles from "../page.module.css";
import BookShelves from "./BookShelves";
import { Formats } from "./FormatButtons";
import { LabelsModal } from "./LabelsModal";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const getIconSize = (isMobile: boolean) => isMobile ? 18 : 24;

interface BookRowProps {
    book: Book;
    bookData: BookData;
    updateId?: (id: number, bookId: string) => void;
    showLabels?: string[];
    grid?: boolean;
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
    const onShelf = props.bookData?.shelf;
    const [formatsChosen, setFormatChosen] = useState<boolean[]>([false, false, false]);
    const [modalOpen, openModal] = useState(false);
    const isMobile = useIsMobile();
    const iconSize = useMemo(() => getIconSize(isMobile), [isMobile]);
    const buttonSize = useMemo(() => isMobile ? "small" : "middle", [isMobile]);
    const { userId } = useAuth();
    const queryClient = useQueryClient();
    const removeFromShelfMutation = useMutation({
        mutationFn: (shelf: Shelf) => removeFromShelf(shelf, props.bookData.id, userId as string),
        onSuccess: () => {
            console.log("removed, shelf undefined")
            queryClient.setQueryData(["allBooks", userId], (old: BookData[]) =>
                old.map(oldBook => oldBook.id === props.bookData.id ? { ...oldBook, shelf: undefined } : oldBook)
            )
        }
    });
    const addToShelfMutation = useMutation({
        mutationFn: (shelf: Shelf) => addToShelf(
            shelf,
            props.bookData?.id,
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
        ),
        onSuccess: (response, shelf) => {
            console.log("what");
            queryClient.setQueryData(["allBooks", userId], (old: BookData[]) => {
                let found = false;
                console.log("successsss", response, shelf)
                const newResults = old.map(oldBook => {
                    console.log("mapping");
                    if (oldBook.id === props.bookData?.id) {
                        found = true;
                        console.log("found", { ...oldBook, shelf });
                        return { ...oldBook, shelf };
                    }
                    return oldBook;
                });
                console.log("found", found);
                if (!found) {
                    const newBook: BookData = {
                        id: response as number,
                        userid: userId as string,
                        bookid: props.book.id,
                        shelf,
                        releasedate: bookInfo.publishedDate,
                        startdate: shelf === Shelf.READING ? dayjs().format(dateFormat) : undefined,
                        enddate: shelf === Shelf.READ ? dayjs().format(dateFormat) : undefined
                    };
                    console.log("not found", newBook);
                    props.updateId?.(response as number, props.book?.id);
                    return [...old, newBook];
                }

                return newResults;
            }

            )
        }
    });

    useEffect(
        () => {
            if (props.bookData?.formats) {
                const formats = [...formatsChosen];
                props.bookData?.formats.map(
                    (format: Format) => {
                        formats[format] = true;
                    }
                );

                setFormatChosen(formats);
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [props.bookData?.formats]
    );

    const shelfClick = useCallback(
        async (shelf: Shelf) => {
            if (onShelf !== shelf) {
                if (onShelf) {
                    console.log("removing from existing", onShelf);
                    removeFromShelfMutation.mutate(onShelf);
                }
                console.log("adding to", shelf, props.bookData?.id);
                addToShelfMutation.mutate(shelf);
            } else {
                console.log("removing from", shelf);
                removeFromShelfMutation.mutate(shelf);
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [props.bookData?.id, onShelf, props.book.id, props.updateId, userId]
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
            <div className={styles.displayForGrid}>
                {/* eslint-disable-next-line @next/next/no-img-element*/}
                <img
                    className={styles.bookImg} src={bookInfo.imageLinks?.smallThumbnail ?? bookInfo.imageLinks?.thumbnail}
                    alt={`Thumbnail for ${bookInfo.title} by ${bookInfo.authors?.join(", ")}`}
                    onClick={props.grid ? tagClick : undefined}
                />
                {props.grid && (
                    <>
                        <span>
                            {props.bookData?.releasedate ? dayjs(props.bookData.releasedate).add(1, "day").format(dateFormat) : bookInfo.publishedDate}
                        </span>
                        <div className={styles.tags}>
                            {props.showLabels?.map(label => <Tag bordered={false} color="geekblue" key={label} closable>{label}</Tag>)}
                        </div>
                    </>
                )}
            </div>
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
                    <span>{props.bookData?.releasedate ? dayjs(props.bookData.releasedate).add(1, "day").format(dateFormat) : bookInfo.publishedDate}</span>
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
                    formatsChosen={formatsChosen}
                    setFormatsChosen={setFormatChosen}
                    shelfClick={shelfClick}
                />
            }
        </>
    )
};
