"use client"

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Checkbox, DatePicker, GetProp, Input, Select } from "antd";
import { DefaultOptionType } from "antd/es/select";
import dayjs, { Dayjs } from "dayjs";
import { useRouter } from "next/navigation";
import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import BookShelves from "../components/BookShelves";
import { Formats } from "../components/FormatButtons";
import Header from "../components/Header";
import { BookFilter, FilterWithOperator, ListInfo } from "../lib/data";
import { Format, Shelf } from "../lib/helper";
import { createList, editList } from "../lib/lists";
import styles from "../page.module.css";
import labelStyles from "../styles/labels.module.css";
import listStyles from "../styles/list.module.css";

interface EditListProps {
    name: string;
    filter: BookFilter;
    id: number;
}

export default function CreateList(props: EditListProps | Record<string, never> = {}) {
    const [listName, setListName] = useState<string | undefined>();
    const [filter, setFilter] = useState<BookFilter>({});
    const { userId } = useAuth();
    const queryClient = useQueryClient();
    const router = useRouter();
    const mutation = useMutation({
        mutationFn: (vars: Omit<ListInfo, "id">) =>
            (props as EditListProps).id ?
                editList((props as EditListProps).id, vars.name, vars.filters).then(() => (props as EditListProps).id) :
                createList(vars.userid, vars.name, vars.filters),
        onSuccess: (id, vars) => {
            const lists: ListInfo[] = queryClient.getQueryData(["lists"]) || [];
            const index = lists.findIndex((list) => list.id === id);
            const newLists = [...lists];
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
        () => {
            if ((props as EditListProps).name) {
                setListName((props as EditListProps).name)
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [(props as EditListProps).name]
    );

    useEffect(
        () => {
            if ((props as EditListProps).filter) {
                setFilter((props as EditListProps).filter)
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

    const isOwnedClick: GetProp<typeof Checkbox, 'onChange'> = useCallback((e) => setFilter({ ...filter, owned: {operator: e.target.checked ? "=" :  "<>"} }), [filter]);
    const wantToBuyClick: GetProp<typeof Checkbox, 'onChange'> = useCallback((e) => setFilter({ ...filter, wanttobuy: {operator: e.target.checked ? "=" :  "<>"} }), [filter]);
    const acquiredClick: GetProp<typeof Checkbox, 'onChange'> = useCallback((e) => {
        setFilter({ ...filter, boughtyear: e.target.checked ? (filter.boughtyear || {}) : undefined });
    }, [filter]);
    const onAcquiredDateChange = useCallback((date: Dayjs, yearString: string | string[]) => {
        const boughtyear = (filter.boughtyear || {});
        boughtyear.data = parseInt(yearString as string);
        setFilter({ ...filter, boughtyear });
    }, [filter])
    const onAcquiredOperatorChange = useCallback((val: FilterWithOperator<number>["operator"]) => {
        const boughtyear = (filter.boughtyear || {});
        boughtyear.operator = val;
        setFilter({ ...filter, boughtyear });
    }, [filter])

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
            <div className={listStyles.listEditFooter}>
                <Button type="primary" onClick={onSave} disabled={!listName}>Save</Button>
                <Button type="default" >Cancel</Button>
            </div>
        </div>
    )
}

const dateOperators: DefaultOptionType[] = [
    { label: "Before", value: "<" },
    { label: "After", value: ">" },
    { label: "On", value: "=" }
]
