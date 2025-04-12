"use client"

import { IconCarambolaFilled, IconFlameFilled } from "@tabler/icons-react";
import { Button, Checkbox, DatePicker, GetProp, InputNumber, Rate, Select } from "antd";
import Modal from "antd/es/modal/Modal";
import dayjs, { Dayjs } from 'dayjs';
import { JSX, useCallback, useEffect, useMemo, useState } from "react";
import { addLabel, BookData, firstLookup, getAllBookInfo, getLabels, LabelFields, updateBook } from "../lib/data";
import { Format, Shelf, userId } from "../lib/helper";
import styles from "../styles/labels.module.css";
import { Formats } from "./FormatButtons";
import { DefaultOptionType } from "antd/es/select";

interface LabelsModalProps {
    isOpen: boolean;
    closeModal(): void;
    onShelf: Shelf | undefined;
    book: Book;
    bookState: firstLookup;
    setFormatsChosen: (f: boolean[]) => void;
    formatsChosen: boolean[];
}

const { RangePicker } = DatePicker;

export const LabelsModal = (props: LabelsModalProps): JSX.Element => {
    const [bookData, setBookData] = useState<BookData>();
    const [labels, setLabels] = useState<LabelFields>();

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

    useEffect(
        () => {
            if (props.bookState?.id) {
                getAllBookInfo(props.bookState.id).then((response) => {
                    console.log("response", response?.[0]);
                    setBookData(response?.[0]);
                });
                getLabels(userId).then((response) => {
                    setLabels(response?.[0]);
                })
            }
        },
        [props.bookState?.id]
    )

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

    const onChange = useCallback((info: Dayjs) => bookData ? setBookData({ ...bookData, startdate: (info.toDate()) }) : null, [bookData]);
    const onRangeChange = useCallback(
        (dates: [Dayjs | null, Dayjs | null] | null) => (
            bookData ? setBookData({ ...bookData, startdate: (dates?.[0]?.toDate()), enddate: (dates?.[0]?.toDate()) }) : null
        ),
        [bookData]
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
        [bookData]
    );
    const onRating = useCallback(
        (value: 0 | 5 | null) => {
            if (bookData) {
                console.log("changing rating", value);
                setBookData({ ...bookData, rating: value || undefined });
            }
        },
        [bookData]
    );
    const onSpice = useCallback(
        (value: number) => {
            if (bookData) {
                console.log("changing spice", value);
                setBookData({ ...bookData, spice: value || undefined });
            }
        },
        [bookData]
    );
    const onSourceChange = useCallback(
        (sources: string[]) => {
            if (bookData) {
                setBookData({ ...bookData, sources });
                sources.forEach(
                    (label) => {
                        if (!sourceOptions.some((option) => option.label === label)) {
                            addLabel(userId, label, "sources");
                        }
                    }
                )
            }
        },
        [bookData, sourceOptions]
    );
    const onArcChange = useCallback(
        (arc: string[]) => {
            if (bookData) {
                setBookData({ ...bookData, arc });
                arc.forEach(
                    (label) => {
                        if (!arcOptions.some((option) => option.label === label)) {
                            addLabel(userId, label, "arc");
                        }
                    }
                )
            }
        },
        [bookData, arcOptions]
    );

    const isDiverseClick: GetProp<typeof Checkbox, 'onChange'> = useCallback((e) => bookData && setBookData({ ...bookData, diverse: e.target.checked }), [bookData]);
    const isBipocClick: GetProp<typeof Checkbox, 'onChange'> = useCallback((e) => bookData && setBookData({ ...bookData, bipoc: e.target.checked }), [bookData]);
    const isLgbtClick: GetProp<typeof Checkbox, 'onChange'> = useCallback((e) => bookData && setBookData({ ...bookData, lgbt: e.target.checked }), [bookData]);

    const onDiversityChange = useCallback(
        (diversity: string[]) => {
            if (bookData) {
                setBookData({ ...bookData, diversity });
                diversity.forEach(
                    (label) => {
                        if (!diversityOptions.some((option) => option.label === label)) {
                            addLabel(userId, label, "diversity");
                        }
                    }
                )
            }
        },
        [bookData, diversityOptions]
    );

    const ownedChange = useCallback(
        (date: Dayjs, yearString: string | string[]) => {
            if (bookData && typeof yearString === "string") {
                setBookData({ ...bookData, owned: yearString ? parseInt(yearString) : undefined });
            }
        },
        [bookData]
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
                            addLabel(userId, label, "labels");
                        }
                    }
                )
            }
        },
        [bookData, labelsOptions]
    );

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
                    {props.onShelf === Shelf.READING &&
                        <div className={`${styles.dateSelector} ${styles.selection}`}>
                            Started reading:
                            <DatePicker defaultValue={dayjs(bookData?.startdate)} onChange={onChange} />
                        </div>
                    }
                    {bookData && props.onShelf === Shelf.READ &&
                        <div className={`${styles.dateSelector} ${styles.selection}`}>
                            Dates read:
                            <RangePicker
                                onChange={onRangeChange}
                                allowEmpty={[true, true]}
                                defaultValue={[
                                    bookData?.startdate ? dayjs(new Date(bookData?.startdate)) : undefined,
                                    bookData?.enddate ? dayjs(new Date(bookData?.enddate)) : undefined]
                                } />
                        </div>
                    }
                    <div className={styles.doubleWide}>
                        <div className={styles.selection}>
                            Format:
                            <Formats
                                formatsChosen={formatsChosen}
                                bookId={props.book.id}
                                setFormatsChosen={setFormatsChosen}
                                className={styles.formatButtons}
                                shape="default"
                                size="large"
                            />
                        </div>

                        <div className={styles.selection}>
                            Bought?
                            <DatePicker picker="year" onChange={ownedChange} defaultValue={bookData.owned ? dayjs(new Date((bookData.owned + 1) + "")) : undefined} />
                        </div>
                    </div>
                    <div className={styles.doubleWide}>
                        <div className={`${styles.rating} ${styles.selection}`}>
                            Rating:
                            <InputNumber min={0} max={5} onChange={onRating} defaultValue={bookData?.rating as 0 | 5} width={70} />
                            <span className={styles.mediumText}>/5</span>
                            <IconCarambolaFilled color="orange" />
                        </div>
                        <div className={styles.selection}>
                            Spice level:
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any*/}
                            <Rate character={<IconFlameFilled size={30} />} allowHalf allowClear onChange={onSpice} defaultValue={parseFloat((bookData?.spice as any) as string)} />

                        </div>
                    </div>
                    <div className={styles.selection}>
                        Source:
                        <Select
                            mode="tags"
                            style={{ width: '100%' }}
                            placeholder="Select or enter"
                            onChange={onSourceChange}
                            options={sourceOptions}
                            defaultValue={bookData?.sources}
                        />
                    </div>
                    <div className={styles.selection}>
                        ARC:
                        <Select
                            mode="tags"
                            style={{ width: '100%' }}
                            placeholder="Select or enter"
                            onChange={onArcChange}
                            options={arcOptions}
                            defaultValue={bookData?.arc}
                        />
                    </div>
                    <div className={`${styles.selection} ${styles.diversityRows}`}>
                        Diversity:
                        <div className="styles.diversityCheckboxes">
                            <Checkbox onChange={isDiverseClick} defaultChecked={bookData.diverse}>Diverse?</Checkbox>
                            <Checkbox onChange={isBipocClick} defaultChecked={bookData.bipoc}>BIPOC?</Checkbox>
                            <Checkbox onChange={isLgbtClick} defaultChecked={bookData.lgbt}>LGBTQIA+?</Checkbox>
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
                        Other labels:
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
