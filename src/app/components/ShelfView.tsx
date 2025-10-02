"use client"

import { LoadingOutlined } from '@ant-design/icons';
import { IconChartPie2, IconEdit, IconLayoutGrid, IconListDetails, IconTrash } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Segmented, Select, Spin } from "antd";
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { getShelf } from '../clientqueries/getShelf';
import { useBooks } from '../hooks/useBooks';
import { useGetBooks } from '../hooks/useGetBooks';
import { BookData, BookFilter, BooleanFilter, ListInfo } from "../lib/data";
import { deleteList } from '../lib/lists';
import styles from "../page.module.css";
import { BookRow } from "./BookRow";
import Header from "./Header";
import ShelfGraphs from './ShelfGraphs';
import { Shelf } from '../lib/helper';

enum ShowAs {
    list = "list",
    grid = "grid",
    graph = "graph"
}

export default function ShelfView(props: { filter: BookFilter, title: string, listId?: number }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [showAs, setShowAs] = useState(() => {
        const showAsParam = searchParams?.get("view");
        if (showAsParam) {
            return ShowAs[showAsParam as keyof typeof ShowAs] || ShowAs.list;
        }
        return ShowAs.list
    });
    const { data } = useGetBooks();
    const [filter, setFilter] = useState<BookFilter>(() => {
        const initialFilter = { ...props.filter };
        if (searchParams) {
            const year = searchParams.get("enddate");
            const sort = searchParams.get("sort");
            if (year) {
                initialFilter.enddate = {
                    operator: "><",
                    data: [`${year}-01-01`, `${year}-12-31`]
                };
            }
            if (sort) {
                const [data, operator] = sort.split("-");
                if (data && operator) {
                    initialFilter.sort = {
                        operator: operator as "asc" | "desc",
                        data: data as keyof BookData
                    };
                }
            }
            if (searchParams.has("include")) {
                const include = searchParams.get("include")?.split(",") || [];
                booleanOptions.forEach((option) => {
                    if (option.value === "arc") {
                        if (include.includes(option.value)) {
                            if (initialFilter.sources) {
                                initialFilter.sources.push("arc");
                            } else {
                                initialFilter.sources = ["arc"];
                            }
                        }
                        return;
                    }
                    if (include.includes(option.value)) {
                        initialFilter[option.value] = { operator: "=" };
                    }
                });
            }
        }
        return initialFilter;
    });

    const filteredBooks = useMemo(() => data ? getShelf(data, filter) : undefined, [data, filter]);
    const { data: books } = useBooks(filteredBooks?.map((book) => book.bookid) || []);
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: (id: number) => deleteList(id),
        onSuccess: (response, id) => {
            const lists: ListInfo[] = [...(queryClient.getQueryData(["lists"]) as ListInfo[] || [])];
            queryClient.setQueryData(["lists"], lists.filter((list) => list.id !== id));
            router.push("/lists");
        }
    })

    const onDeleteList = useCallback(
        () => {
            mutation.mutate(props.listId as number);
        },
        [mutation, props.listId]
    );

    const listStyleChange = useCallback(
        (value: string) => {
            const params = new URLSearchParams(searchParams?.toString());
            params.set("view", value);
            router.replace(`${pathname}?${params.toString()}`, { scroll: true });
            setShowAs(ShowAs[value as keyof typeof ShowAs]);
        },
        [pathname, searchParams, router]
    );

    const setSort = useCallback(
        (sort: string) => {
            const [data, operator] = sort?.split("-");

            const params = new URLSearchParams(searchParams?.toString());
            if (data && operator) {
                params.set("sort", sort);
            } else {
                params.delete("sort");
            }
            router.replace(`${pathname}?${params.toString()}`, { scroll: true });

            setFilter((prev) => ({
                ...prev,
                sort: sort && operator ? {
                    operator: operator as "asc" | "desc",
                    data: data as keyof BookData
                } : undefined
            }));
        },
        [searchParams, pathname, router]
    );

    const setYear = useCallback(
        (year: string) => {
            const params = new URLSearchParams(searchParams?.toString());

            if (year) {
                params.set("enddate", year);
            } else {
                params.delete("enddate");
            }

            router.replace(`${pathname}?${params.toString()}`, { scroll: true });
            setFilter((prev) => ({
                ...prev,
                enddate: {
                    operator: "><",
                    data: [`${year}-01-01`, `${year}-12-31`]
                }
            }));
        },
        [searchParams, pathname, router]
    );

    const setInclude = useCallback(
        (include: string[]) => {
            const params = new URLSearchParams(searchParams?.toString());
            if (include) {
                params.set("include", include.join(","));
            } else {
                params.delete("include");
            }
            router.replace(`${pathname}?${params.toString()}`, { scroll: true });
            setFilter((prev) => {
                const newFilter: BookFilter = { ...prev };
                booleanOptions.forEach((option) => {
                    if (option.value === "arc") {
                        if (include.includes(option.value)) {
                            if (newFilter.sources && !newFilter.sources.includes("arc")) {
                                newFilter.sources.push("arc");
                            } else if(!newFilter.sources) {
                                newFilter.sources = ["arc"];
                            }
                        } else {
                            if (newFilter.sources) {
                                newFilter.sources = newFilter.sources.filter((source) => source !== "arc");
                            } if(!newFilter.sources || newFilter.sources.length === 0) {
                                delete newFilter.sources;
                            }
                        }
                        return;
                    }
                    if (include.includes(option.value)) {
                        newFilter[option.value] = { operator: "=" };
                    } else {
                        if (newFilter[option.value]) {
                            delete newFilter[option.value];
                        }
                    }
                });

                return newFilter;
            });
        },
        [searchParams, pathname, router]
    );

    const endYearDropdown = useMemo(() => {
        const years = new Set<string>();
        data?.forEach((book) => {
            if (book.enddate) {
                const enddate = new Date(book.enddate).getFullYear();
                years.add(enddate.toString());
            }
        });
        const array = Array.from(years).sort((a, b) => parseInt(b) - parseInt(a)).map((year) => ({ value: year, label: year }));
        array.unshift({ value: "", label: "All time" });
        return array;
    },
        [data]
    );

    const selectedBooleanOptions = useMemo(() => {
        const selected: string[] = [];
        if (filter.diverse) selected.push("diverse");
        if (filter.bipoc) selected.push("bipoc");
        if (filter.lgbt) selected.push("lgbt");
        if (Array.isArray(filter.sources) && filter.sources.indexOf("arc") > -1) selected.push("arc");
        if (filter.owned) selected.push("owned");
        if (filter.wanttobuy) selected.push("wanttobuy");
        return selected;
    }, [filter]);


    if (filteredBooks?.length !== books?.length) {
        return null;
    }

    return (
        <div className={`${styles.page} ${showAs === ShowAs.list ? "" : styles.gridPage}`}>
            <Header />
            <h3 className={`${styles.todoTitle} ${showAs === ShowAs.list ? "" : styles.todoTitleGrid}`}>
                <span>{props.title}{filteredBooks ? ` (${filteredBooks.length})` : ""}:</span>
                <Segmented
                    size="middle"
                    shape="round"
                    options={ListStyleOptions}
                    onChange={listStyleChange}
                    className={styles.listToggle}
                    value={showAs}
                />
                {props.listId &&
                    <div className={styles.listEditButtons}>
                        <Button type="default" icon={<Link href={`/lists/${props.listId}/edit`}><IconEdit /></Link>} />
                        <Button type="default" icon={<IconTrash />} onClick={onDeleteList} />
                    </div>
                }
            </h3>
            <div className={styles.filterBar}>
                <Select
                    placeholder="Sort"
                    onChange={setSort}
                    options={sortOptions}
                    value={filter.sort ? `${filter.sort?.data}-${filter.sort?.operator}` : props.filter.shelf?.length === 1 ? defaultSort[props.filter.shelf[0]] : undefined}
                    style={{ width: 200 }}
                />
                <Select
                    placeholder="Year finished"
                    onChange={setYear}
                    options={endYearDropdown}
                    value={filter.enddate?.data?.[0]?.split("-")[0] || ""}
                    style={{ width: 200 }}
                />
                <Select
                    placeholder="Include these"
                    onChange={setInclude}
                    options={booleanOptions}
                    value={selectedBooleanOptions}
                    mode="multiple"
                    allowClear
                    style={{ width: 200 }}
                />
            </div>
            {!books && <Spin indicator={<LoadingOutlined spin />} size="large" className="pageLoading" />}
            {filteredBooks?.length === 0 && <div>No books were found matching this list</div>}
            {books && showAs !== ShowAs.graph &&
                <div className={`${styles.bookResults} ${showAs === ShowAs.list ? "" : styles.bookResultsGrid}`}>
                    {books.map(
                        (book, index) => {
                            return (
                                <BookRow
                                    book={book as Book}
                                    key={(book as Book).id}
                                    bookData={filteredBooks?.[index] as BookData}
                                    grid={showAs === ShowAs.grid}
                                    showLabels={filteredBooks?.[index].arcoptional ? ["Optional"] : undefined}
                                />
                            )
                        }
                    )}
                </div>
            }
            {books && filteredBooks && showAs === ShowAs.graph &&
                <ShelfGraphs books={books} bookData={filteredBooks} />
            }
        </div>
    )
}

const ListStyleOptions = [
    { value: ShowAs.list, icon: <IconListDetails /> },
    { value: ShowAs.grid, icon: <IconLayoutGrid /> },
    { value: ShowAs.graph, icon: <IconChartPie2 /> }
];

const sortOptions = [
    // { value: { operator: "asc", data: "title" }, label: "Title A-Z" },
    // { value: { operator: "desc", data: "title" }, label: "Title Z-A" },
    { value: "enddate-asc", label: "Earliest finished" },
    { value: "enddate-desc", label: "Latest finished" },
    { value: "releasedate-asc", label: "Earliest release" },
    { value: "releasedate-desc", label: "Latest release" },
    { value: "startdate-asc", label: "Earliest started" },
    { value: "startdate-desc", label: "Latest started" }
];

const booleanOptions: { value: keyof BooleanFilter | "arc", label: string }[] = [
    { value: "diverse", label: "Diverse" },
    { value: "bipoc", label: "BIPOC" },
    { value: "lgbt", label: "LGBTQIA" },
    { value: "arc", label: "ARC" },
    { value: "owned", label: "Owned" },
    { value: "wanttobuy", label: "Want to buy" }
];

const defaultSort: Record<Shelf, string> = {
    [Shelf.TBR]: "releasedate-desc",
    [Shelf.READ]: "enddate-desc",
    [Shelf.READING]: "startdate-asc",
    [Shelf.DNF]: "releasedate-desc"
}
