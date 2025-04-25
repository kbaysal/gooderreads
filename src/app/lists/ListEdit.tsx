"use client"

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Checkbox, DatePicker, Dropdown, GetProp, GetRef, Input, MenuProps, Select } from "antd";
import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import BookShelves from "../components/BookShelves";
import Header from "../components/Header";
import { BookFilter, FilterWithOperator, ListInfo } from "../lib/data";
import { Format, Shelf } from "../lib/helper";
import styles from "../page.module.css";
import listStyles from "../styles/list.module.css";
import labelStyles from "../styles/labels.module.css";
import { useRouter } from "next/navigation";
import { createList } from "../lib/lists";
import { FormatButtons, Formats } from "../components/FormatButtons";
import { DefaultOptionType } from "antd/es/select";
import dayjs, { Dayjs } from "dayjs";

interface EditListProps {
    name: string;
    filter: BookFilter;
    id: number;
}

export default function CreateList(props: EditListProps | {}) {
    const [listName, setListName] = useState<string | undefined>();
    const [filter, setFilter] = useState<BookFilter>({});
    const { userId } = useAuth();
    const queryClient = useQueryClient();
    const router = useRouter();
    const mutation = useMutation({
        mutationFn: (vars: Omit<ListInfo, "id">) =>
            (props as EditListProps).id ?
                Promise.resolve((props as EditListProps).id) :
                createList(vars.userid, vars.name, vars.filters),
        onSuccess: (id, vars) => {
            const lists: ListInfo[] = queryClient.getQueryData(["lists"]) || [];
            const index = lists.findIndex((list) => list.id === id);
            let newLists = [...lists];
            const newList: ListInfo = { id: id as number, ...vars };
            if (index > -1) {
                newLists[index] = newList;
            } else {
                newLists.push(newList);
            }
            console.log("success");
            console.log(newLists);
            queryClient.setQueryData(["lists"], newLists);
            router.push(`/lists/${id}`)
        }
    })

    useEffect(
        () => { (props as EditListProps).name && setListName((props as EditListProps).name) },
        [(props as EditListProps).name]
    );

    useEffect(
        () => { (props as EditListProps).filter && setFilter((props as EditListProps).filter) },
        [(props as EditListProps).filter]
    )

    const onNameChange = useCallback(
        (e: ChangeEvent<HTMLInputElement>) => {
            setListName(e.target.value);
        },
        []
    );

    const onShelfClick = useCallback(
        (clickedShelf: Shelf) => {
            const index = (filter?.shelf as Shelf[])?.indexOf(clickedShelf);
            //already on, remove it
            const shelf = filter.shelf ? [...filter.shelf as Shelf[]] : [];
            if (index > -1) {
                shelf.splice(index, 1);
            } else {
                shelf.push(clickedShelf);
            }
            const newFilter = { ...filter, shelf };
            console.log(newFilter);
            setFilter(newFilter);
        },
        [filter]
    );

    const formats = useMemo(
        () => {
            const newFormats = [false, false, false];
            if (filter.formats) {
                (filter.formats as Format[]).forEach(
                    (format) => {
                        console.log("format", format, true);
                        newFormats[format] = true;
                    }
                );
            }

            return newFormats;
        },
        [filter.formats]
    )
    const setFormatsChosen = useCallback(
        (formats: boolean[]) => {
            const formatFilter: Format[] = [];
            formats.forEach(
                (f, i) => f && formatFilter.push(i)
            );
            setFilter({ ...filter, formats: formatFilter });
        },
        [filter]
    )

    const isOwnedClick: GetProp<typeof Checkbox, 'onChange'> = useCallback((e) => setFilter({ ...filter, owned: e.target.checked }), [filter]);
    const wantToBuyClick: GetProp<typeof Checkbox, 'onChange'> = useCallback((e) => setFilter({ ...filter, wanttobuy: e.target.checked }), [filter]);
    const acquiredClick: GetProp<typeof Checkbox, 'onChange'> = useCallback((e) => { 
        setFilter({...filter, boughtyear: e.target.checked ? (filter.boughtyear || {}) : undefined});
    }, [filter]);
    const onAcquiredDateChange = useCallback((date: Dayjs, yearString: string | string[]) => {
        const boughtyear = (filter.boughtyear || {});
        boughtyear.data = parseInt(yearString as string);
        setFilter({...filter, boughtyear});
    },[filter])
    const onAcquiredOperatorChange = useCallback((val: FilterWithOperator<number>["operator"]) => {
        const boughtyear = (filter.boughtyear || {});
        boughtyear.operator = val;
        setFilter({...filter, boughtyear});
    },[filter])

    const onSave = useCallback(
        () => {
            mutation.mutate({ userid: userId as string, name: listName as string, filters: filter });
        },
        [filter, listName, userId, mutation]
    );

    return (
        <div className={styles.page}>
            <Header />
            <Input
                placeholder="Enter list name"
                onChange={onNameChange}
                value={listName}
            />
            <div className={listStyles.oneRow}>
                <div>Shelves:</div>
                <BookShelves
                    iconSize={30}
                    buttonSize="large"
                    onShelf={filter.shelf as Shelf[]}
                    shelfClick={onShelfClick}

                />
                <div>Formats:</div>
                <Formats
                    formatsChosen={formats}
                    setFormatsChosen={setFormatsChosen}
                    className={labelStyles.formatButtons}
                    shape="default"
                    size="large"
                />
                <Checkbox onChange={isOwnedClick} checked={!!filter.owned}>
                    Owned?
                </Checkbox>
                <Checkbox onChange={wantToBuyClick} checked={!!filter.wanttobuy}>
                    Want to buy?
                </Checkbox>
                <div>
                    <Checkbox checked={!!filter.boughtyear} onChange={acquiredClick}>
                        Acquired
                    </Checkbox>
                    <Select
                        options={dateOperators}
                        style={{ width: 120 }}
                        value={filter.boughtyear?.operator}
                        onChange={onAcquiredOperatorChange}
                    />
                    <DatePicker
                        picker="year"
                        onChange={onAcquiredDateChange}
                        placeholder="Year"
                        className={styles.boughtDate}
                        value={filter.boughtyear?.data ? dayjs(new Date((filter.boughtyear.data as number + 1) + "")) : undefined}
                    />
                </div>

            </div>
            <Button type="primary" onClick={onSave} disabled={!listName}>Save</Button>
        </div>
    )
}

const dateOperators: DefaultOptionType[] = [
    { label: "Before", value: "<" },
    { label: "After", value: ">" },
    { label: "On", value: "=" }
]
