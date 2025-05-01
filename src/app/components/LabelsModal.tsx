"use client"

import { useAuth } from "@clerk/nextjs";
import { IconCarambolaFilled, IconFlameFilled } from "@tabler/icons-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Checkbox, DatePicker, GetProp, Input, InputNumber, Rate, Select } from "antd";
import Modal from "antd/es/modal/Modal";
import { DefaultOptionType } from "antd/es/select";
import dayjs, { Dayjs } from 'dayjs';
import { JSX, useCallback, useEffect, useMemo } from "react";
import { useIsMobile } from "../hooks/useWindowDimension";
import { addLabel, BookData, getAllBooks, getLabels, updateBook } from "../lib/data";
import { dateFormat, Format, Shelf } from "../lib/helper";
import pageStyles from "../page.module.css";
import styles from "../styles/labels.module.css";
import BookShelves from "./BookShelves";
import { Formats } from "./FormatButtons";
import { useGetBooks } from "../hooks/useGetBooks";

interface LabelsModalProps {
    isOpen: boolean;
    closeModal(): void;
    onShelf: Shelf | undefined;
    book: Book;
    setFormatsChosen: (f: boolean[]) => void;
    formatsChosen: boolean[];
    shelfClick(shelf: Shelf): void;
}

const { RangePicker } = DatePicker;

export const LabelsModal = (props: LabelsModalProps): JSX.Element => {
    const { userId } = useAuth();
    const isMobile = useIsMobile();
    const queryClient = useQueryClient();
    const data = useGetBooks();
    const bookData = useMemo(() => data?.find((book) => book.bookid === props.book.id), [data, props.book.id]);

    useEffect(() => console.log("book", bookData), [bookData, data]);

    const { data: labels } = useQuery({
        queryKey: ["getLabels", userId],
        queryFn: () => getLabels(userId as string),
        enabled: !!userId
    });

    const setBookData = useCallback(
        (book: BookData) => {
            console.log("huh", book);
            queryClient.setQueryData(["allBooks", userId], (old: BookData[]) =>
                old.map(oldBook => oldBook.id === book.id ? book : oldBook)
            )
        },
        [queryClient, userId]
    );

    const formatsChosen = useMemo(
        () => {
            const formatsBooleanArray = [false, false, false, false];
            if (bookData?.formats) {
                bookData.formats.map((format) => formatsBooleanArray[format] = true);
            }

            return formatsBooleanArray;
        },
        [bookData?.formats]
    )

    const sourceOptions = useMemo(
        () => {
            if (labels?.sources) {
                const options = [...sourceOptionsDefault];
                labels.sources.forEach(
                    (key: string) => {
                        const option = options.find((val) => val.value === key);
                        if (!option) {
                            options.push({ value: key, label: key });
                        }
                    }
                );
                return options;
            }

            return sourceOptionsDefault;
        },
        [labels?.sources]
    );

    const arcOptions = useMemo(
        () => {
            if (labels?.arc) {
                const options: DefaultOptionType[] = [];
                labels.arc.forEach(
                    (key: string) => {
                        options.push({ value: key, label: key });
                    }
                )

                return options;
            }

            return [];
        },
        [labels?.arc]
    );

    const diversityOptions = useMemo(
        () => {
            if (labels?.diversity) {
                const options = [...diversityOptionsDefault];
                labels.diversity.forEach(
                    (key: string) => {
                        const option = options.find((val) => val.value === key);
                        if (!option) {
                            options.push({ value: key, label: key });
                        }
                    }
                )
                return options;
            }

            return diversityOptionsDefault;
        },
        [labels?.diversity]
    );

    const labelsOptions = useMemo(
        () => {
            if (labels?.labels) {
                const options: DefaultOptionType[] = [];
                labels.labels.forEach(
                    (key: string) => {
                        options.push({ value: key, label: key });
                    }
                )

                return options;
            }

            return [];
        },
        [labels?.labels]
    );


    const onSave = useCallback(
        () => {
            if (bookData) {
                console.log("saving");
                console.log(bookData);
                updateBook(bookData)
                props.closeModal();
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [bookData]
    );

    const onChange = useCallback((info: Dayjs) => bookData ? setBookData({ ...bookData, startdate: (info.format(dateFormat)) }) : null, [bookData, setBookData]);
    const onRangeChange = useCallback(
        (dates: [Dayjs | null, Dayjs | null] | null) => (
            bookData ? setBookData({ ...bookData, startdate: (dates?.[0]?.format(dateFormat)), enddate: (dates?.[1]?.format(dateFormat)) }) : null
        ),
        [bookData, setBookData]
    );

    const onReleaseDateChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            if (bookData) {
                const releasedate = e.target.value;
                setBookData({ ...bookData, releasedate });
            }
        },
        [bookData, setBookData]
    );

    const setFormatsChosen = useCallback(
        (formatsChosen: boolean[]) => {
            if (bookData) {
                const formats: Format[] = [];
                formatsChosen.forEach((format: boolean, index: number) => format ? formats.push(index) : null);
                console.log("changing formats", formats);
                setBookData({ ...bookData, formats });
            }
        },
        [bookData, setBookData]
    );
    const onRating = useCallback(
        (value: 0 | 5 | null) => {
            if (bookData) {
                console.log("changing rating", value);
                setBookData({ ...bookData, rating: value || null });
            }
        },
        [bookData, setBookData]
    );
    const onSpice = useCallback(
        (value: number) => {
            if (bookData) {
                setBookData({ ...bookData, spice: value });
            }
        },
        [bookData, setBookData]
    );
    const onSourceChange = useCallback(
        (sources: string[]) => {
            if (bookData) {
                console.log("sources", sources);
                setBookData({ ...bookData, sources });
                sources.forEach(
                    (label) => {
                        if (!sourceOptions.some((option) => option.label === label)) {
                            addLabel(userId as string, label, "sources");
                        }
                    }
                )
            }
        },
        [bookData, sourceOptions, userId, setBookData]
    );
    const isOptionalClick: GetProp<typeof Checkbox, 'onChange'> = useCallback((e) => bookData && setBookData({ ...bookData, arcoptional: e.target.checked }), [bookData, setBookData]);
    const isReviewedClick: GetProp<typeof Checkbox, 'onChange'> = useCallback((e) => bookData && setBookData({ ...bookData, arcreviewed: e.target.checked }), [bookData, setBookData]);
    const onArcChange = useCallback(
        (arc: string[]) => {
            if (bookData) {
                setBookData({ ...bookData, arc });
                arc.forEach(
                    (label) => {
                        if (!arcOptions.some((option) => option.label === label)) {
                            addLabel(userId as string, label, "arc");
                        }
                    }
                )
            }
        },
        [bookData, arcOptions, userId, setBookData]
    );

    const isDiverseClick: GetProp<typeof Checkbox, 'onChange'> = useCallback((e) => bookData && setBookData({ ...bookData, diverse: e.target.checked }), [bookData, setBookData]);
    const isBipocClick: GetProp<typeof Checkbox, 'onChange'> = useCallback((e) => bookData && setBookData({ ...bookData, bipoc: e.target.checked, diverse: bookData.diverse || e.target.checked }), [bookData, setBookData]);
    const isLgbtClick: GetProp<typeof Checkbox, 'onChange'> = useCallback((e) => bookData && setBookData({ ...bookData, lgbt: e.target.checked, diverse: bookData.diverse || e.target.checked }), [bookData, setBookData]);

    const onDiversityChange = useCallback(
        (diversity: string[]) => {
            if (bookData) {
                setBookData({ ...bookData, diversity });
                diversity.forEach(
                    (label) => {
                        if (!diversityOptions.some((option) => option.label === label)) {
                            addLabel(userId as string, label, "diversity");
                        }
                    }
                )
            }
        },
        [bookData, diversityOptions, userId, setBookData]
    );

    const isOwnedClick: GetProp<typeof Checkbox, 'onChange'> = useCallback(
        (e) => bookData && setBookData({ ...bookData, owned: e.target.checked, wanttobuy: false }),
        [bookData, setBookData]
    );
    const wantToBuyClick: GetProp<typeof Checkbox, 'onChange'> = useCallback(
        (e) => bookData && setBookData({ ...bookData, owned: false, wanttobuy: e.target.checked, boughtyear: null }),
        [bookData, setBookData]
    );

    const boughtYearChange = useCallback(
        (date: Dayjs, yearString: string | string[]) => {
            if (bookData && typeof yearString === "string") {
                setBookData({ ...bookData, boughtyear: yearString ? parseInt(yearString) : null });
            }
        },
        [bookData, setBookData]
    );

    const onLabelsChange = useCallback(
        (labels: string[]) => {
            if (bookData) {
                setBookData({ ...bookData, labels });
                console.log(labels);
                console.log(labelsOptions);
                labels.forEach(
                    (label) => {
                        console.log(label);
                        if (!labelsOptions.some((option) => option.label === label)) {
                            console.log(userId, label, "labels");
                            addLabel(userId as string, label, "labels");
                        }
                    }
                )
            }
        },
        [bookData, labelsOptions, userId, setBookData]
    );

    console.log(bookData?.sources);

    return (
        <Modal
            open={props.isOpen}
            title={`${props.book.volumeInfo.title} by ${props.book.volumeInfo.authors.join(", ")}`}
            onCancel={props.closeModal}
            className={styles.modal}
            footer={
                [
                    <Button key="cancel" onClick={props.closeModal}>Cancel</Button>,
                    <Button key="save" onClick={onSave} type="primary">Save</Button>
                ]}
        >
            {bookData ?
                (<>
                    {
                        <div className={pageStyles.buttons}>
                            <BookShelves
                                iconSize={24}
                                shelfClick={props.shelfClick}
                                buttonSize="large"
                                onShelf={props.onShelf ? [props.onShelf] : undefined}
                            />
                        </div>
                    }
                    {props.onShelf === Shelf.READING &&
                        <div className={`${styles.dateSelector} ${styles.selection}`}>
                            <span className={styles.title}>Started reading:</span>
                            <DatePicker defaultValue={dayjs(bookData?.startdate)} onChange={onChange} />
                        </div>
                    }
                    {bookData && props.onShelf === Shelf.READ &&
                        <div className={`${styles.dateSelector} ${styles.selection}`}>
                            <span className={styles.title}>Dates read:</span>
                            <RangePicker
                                onChange={onRangeChange}
                                allowEmpty={[true, true]}
                                defaultValue={[
                                    bookData?.startdate ? dayjs(new Date(bookData?.startdate)) : undefined,
                                    bookData?.enddate ? dayjs(new Date(bookData?.enddate)) : undefined]
                                } />
                        </div>
                    }
                    <div className={styles.selection}>
                        <span className={styles.title}>Release date:</span>
                        <Input defaultValue={bookData.releasedate ? dayjs(bookData.releasedate).format("YYYY-MM-DD") : props.book.volumeInfo.publishedDate} onChange={onReleaseDateChange} />
                    </div>
                    <div className={styles.doubleWide}>
                        <div className={styles.selection}>
                            <span className={styles.title}>Format:</span>
                            <Formats
                                formatsChosen={formatsChosen}
                                bookId={props.book.id}
                                setFormatsChosen={setFormatsChosen}
                                className={styles.formatButtons}
                                shape="default"
                                size="large"
                            />
                        </div>

                        <div className={`${styles.selection} ${styles.stacked}`}>
                            <Checkbox onChange={isOwnedClick} checked={bookData.owned}>
                                <div>
                                    <span>Owned?</span>
                                    {
                                        bookData.owned &&
                                        <DatePicker
                                            picker="year"
                                            onChange={boughtYearChange}
                                            placeholder="Year"
                                            className={styles.boughtDate}
                                            defaultValue={bookData.boughtyear ? dayjs(new Date((bookData.boughtyear + 1) + "")) : undefined}
                                        />
                                    }
                                </div>
                            </Checkbox>
                            <Checkbox onChange={wantToBuyClick} checked={bookData.wanttobuy}>
                                Want to buy?
                            </Checkbox>
                        </div>
                    </div>
                    <div className={styles.doubleWide}>
                        <div className={`${styles.rating} ${styles.selection}`}>
                            <span className={styles.title}>Rating:</span>
                            <InputNumber min={0} max={5} onChange={onRating} defaultValue={bookData?.rating as 0 | 5} width={70} />
                            <span className={styles.mediumText}>/5</span>
                            <IconCarambolaFilled color="orange" />
                        </div>
                        <div className={styles.selection}>
                            <span className={styles.title}>Spice:</span>
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any*/}
                            <Rate character={<IconFlameFilled size={isMobile ? 24 : 30} />} allowHalf allowClear onChange={onSpice} defaultValue={parseFloat((bookData?.spice as any) as string)} />

                        </div>
                    </div>
                    <div className={styles.selection}>
                        <span className={styles.title}>Source:</span>
                        <Select
                            mode="tags"
                            style={{ width: '100%' }}
                            placeholder="Select or enter"
                            onChange={onSourceChange}
                            options={sourceOptions}
                            defaultValue={bookData?.sources}
                        />
                    </div>
                    {bookData.sources && bookData.sources.indexOf("arc") > -1 && (
                        <div className={`${styles.selection} ${styles.diversityRows}`}>
                            <span className={styles.title}>Arc:</span>
                            <div className={styles.stacked}>
                                <Checkbox onChange={isOptionalClick} defaultChecked={bookData.arcoptional}>Optional?</Checkbox>
                                <Checkbox onChange={isReviewedClick} defaultChecked={bookData.arcreviewed}>Reviewed?</Checkbox>
                            </div>
                            <Select
                                mode="tags"
                                style={{ width: '100%' }}
                                placeholder="Enter ARC source"
                                onChange={onArcChange}
                                options={arcOptions}
                                defaultValue={bookData?.arc}
                            />

                        </div>
                    )}
                    <div className={`${styles.selection} ${styles.diversityRows}`}>
                        <span className={styles.title}>Diversity:</span>
                        <div className={styles.stacked}>
                            <Checkbox onChange={isDiverseClick} checked={bookData.diverse}>Diverse?</Checkbox>
                            <Checkbox onChange={isBipocClick} checked={bookData.bipoc}>BIPOC?</Checkbox>
                            <Checkbox onChange={isLgbtClick} checked={bookData.lgbt}>LGBTQIA+?</Checkbox>
                        </div>
                        <Select
                            mode="tags"
                            style={{ width: '100%' }}
                            placeholder="Enter diversity labels"
                            onChange={onDiversityChange}
                            disabled={!bookData?.diverse}
                            options={diversityOptions}
                            defaultValue={bookData?.diversity}
                        />
                    </div>
                    <div className={styles.selection}>
                        <span className={styles.title}>Other labels:</span>
                        <Select
                            mode="tags"
                            style={{ width: '100%' }}
                            placeholder="Enter anything else to track"
                            onChange={onLabelsChange}
                            options={labelsOptions}
                            defaultValue={bookData.labels}
                        />
                    </div>
                </>) : null
            }

        </Modal>
    )
};

const sourceOptionsDefault = [
    { value: "library", label: "library" },
    { value: "arc", label: "ARC" },
    { value: "shelves", label: "shelves" },
];

const diversityLabels = ["lesbian", "gay", "bi/pan", "trans", "nonbinary", "queer", "intersex", "asexual", "aromantic", "pansexual",
    "Black", "Latine", "Indigenous", "AAPI", "Asian", "African", "MENA",
    "Neuro divergent", "Physical disability", "Mental health", "Chronic illness/pain",
    "Fat", "Jewish", "Muslim", "Immigrant", "Elderly",
    "Feminism", "Climate Change", "Wealth Gap", "Translated", "Indie published"
];
const diversityOptionsDefault = diversityLabels.map((label) => ({ value: label, label }));


// const [isDiverse, setIsDiverse] = useState(false);
// const [isBipoc, setIsBipoc] = useState(false);
// const [isLgbt, setIsLgbt] = useState(false);
// const [rating, setRating] = useState<number>();
// const [formats, setFormats] = useState<Format[]>();
// const [spice, setSpice] = useState<number>();
// const [sources, setSources] = useState<string[]>([]);
// const [arc, setArc] = useState<string[]>([]);
// const [diversity, setDiversity] = useState<string[]>([]);
// const [owned, setOwned] = useState<number>();
// const [labels, setLabels] = useState<string[]>([]);



// setIsBipoc(!!bookData.bipoc);
// setIsDiverse(!!bookData.diverse);
// setIsLgbt(!!bookData.lgbt);
// setRating(bookData.rating);
// setFormats(bookData.formats || []);
// setSpice(bookData.spice);
// setSources(bookData.sources || []);
// setArc(bookData.arc || []);
// setDiver
// setOwned(bookData.owned, )
