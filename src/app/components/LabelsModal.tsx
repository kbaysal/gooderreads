"use client"

import { IconCarambolaFilled, IconFlameFilled } from "@tabler/icons-react";
import { Button, Checkbox, DatePicker, InputNumber, Rate, Select } from "antd";
import Modal from "antd/es/modal/Modal";
import dayjs, { Dayjs } from 'dayjs';
import { JSX, useCallback, useEffect, useState } from "react";
import { BookData, firstLookup, getAllBookInfo } from "../lib/data";
import { Shelf } from "../lib/helper";
import styles from "../styles/labels.module.css";
import { Formats } from "./FormatButtons";

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
    const [serverResponse, setServerResponse] = useState<BookData>();
    const [isDiverse, setIsDiverse] = useState(false);

    useEffect(
        () => {
            console.log("trying to load all data for:", props.bookState?.id)
            if (props.bookState?.id) {
                getAllBookInfo(props.bookState.id).then((response) => {
                    setServerResponse(response?.[0]);
                    console.log("server response");
                    console.log(response?.[0]);
                });
            }
        },
        [props.bookState?.id]
    )

    const onSave = useCallback(
        () => {
            console.log("saving");
            props.closeModal();
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );

    const onChange = useCallback((info: Dayjs, dateString: string | string[]) => console.log(info, dateString), []);
    const onRangeChange = useCallback((dates: [Dayjs | null, Dayjs | null] | null, dateStrings: [string, string]) => console.log(dates, dateStrings), []);

    console.log("props.onshelf", props.onShelf);

    const isDiverseClick = useCallback(() => setIsDiverse(!isDiverse), [isDiverse]);

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
            {serverResponse && props.onShelf === Shelf.READING &&
                <div className={styles.dateSelector}>
                    Date you started reading:
                    <DatePicker defaultValue={dayjs(serverResponse?.startdate)} onChange={onChange} />
                </div>
            }
            {serverResponse && props.onShelf === Shelf.READ &&
                <div className={styles.dateSelector}>
                    Dates you read:
                    <RangePicker
                        onChange={onRangeChange}
                        allowEmpty={[true, true]}
                        defaultValue={[
                            serverResponse?.startdate ? dayjs(new Date(serverResponse?.startdate)) : undefined,
                            serverResponse?.enddate ? dayjs(new Date(serverResponse?.enddate)) : undefined]
                        } />
                </div>
            }
            <div>
                Format:
                <Formats
                    formatsChosen={props.formatsChosen}
                    bookId={props.book.id}
                    setFormatsChosen={props.setFormatsChosen}
                    className={styles.formatButtons}
                    shape="default"
                    size="large"
                />
            </div>
            <div className={styles.rating}>
                Rating:
                <InputNumber min={0} max={5} onChange={() => console.log("input")} />
                <span className={styles.mediumText}>/5</span>
                <IconCarambolaFilled color="orange" />
            </div>
            <div>
                Spice level:
                <Rate character={<IconFlameFilled size={30} />} allowHalf allowClear />
            </div>
            <div>
                Source:
                <Select
                    mode="tags"
                    style={{ width: '100%' }}
                    placeholder="Select or enter"
                    onChange={(value) => console.log(value)}
                    options={sourceOptions}
                />
            </div>
            <div>
                ARC:
                <Select
                    mode="tags"
                    style={{ width: '100%' }}
                    placeholder="Select or enter"
                    onChange={(value) => console.log(value)}
                    options={sourceOptions}
                />
            </div>
            <div>
                Diversity:
                <div className="styles.diversityCheckboxes">
                    <Checkbox onClick={isDiverseClick}>Diverse?</Checkbox>
                    <Checkbox>BIPOC?</Checkbox>
                    <Checkbox>LGBTQIA+?</Checkbox>
                </div>
                <Select
                    mode="tags"
                    style={{ width: '100%' }}
                    placeholder="Enter diversity labels"
                    onChange={(value) => console.log(value)}
                    disabled={!isDiverse}
                    options={diversityOptions}
                />
            </div>
            <div>
                Bought?
                <DatePicker picker="month" />
            </div>
            <div>
                Other labels:
                <Select
                    mode="tags"
                    style={{ width: '100%' }}
                    placeholder="Enter anything else to track"
                    onChange={(value) => console.log(value)}
                />
            </div>
        </Modal>
    )
};

const sourceOptions = [
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
const diversityOptions = diversityLabels.map((label) => ({ value: label, label }));
