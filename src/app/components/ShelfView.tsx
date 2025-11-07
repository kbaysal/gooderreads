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
import { BookRowSkeleton, GraphsSkeleton } from './BookSkeleton';
import Header from "./Header";
import ShelfGraphs from './ShelfGraphs';
import { Format, Shelf } from '../lib/helper';

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
    // Month selected ("01" -> "12") stored separately so we can distinguish month vs full-year filters.
    const initialMonthParam = searchParams?.get("month") || undefined;
    const [selectedMonth, setSelectedMonth] = useState<string | undefined>(initialMonthParam);
    const [filter, setFilter] = useState<BookFilter>(() => {
        const initialFilter = { ...props.filter };
        
        // Helper to apply default sort
        const applyDefaultSort = () => {
            if (props.filter.shelf?.length === 1 && defaultSort[props.filter.shelf[0]]) {
                const defaultSortValue = defaultSort[props.filter.shelf[0]];
                const [data, operator] = defaultSortValue.split("-");
                if (data && operator) {
                    initialFilter.sort = {
                        operator: operator as "asc" | "desc",
                        data: data as keyof BookData
                    };
                }
            }
        };

        if (searchParams) {
            const year = searchParams.get("enddate");
            const sort = searchParams.get("sort");
            const monthParam = searchParams.get("month");
            if (year) {
                // If month is also specified, constrain to that month; else full year
                if (monthParam && /^[0-1][0-9]$/.test(monthParam)) {
                    const mm = monthParam;
                    const lastDay = new Date(parseInt(year), parseInt(mm), 0).getDate();
                    initialFilter.enddate = {
                        operator: "><",
                        data: [`${year}-${mm}-01`, `${year}-${mm}-${String(lastDay).padStart(2, '0')}`]
                    };
                } else {
                    initialFilter.enddate = {
                        operator: "><",
                        data: [`${year}-01-01`, `${year}-12-31`]
                    };
                }
            } else if (monthParam) {
                // Month supplied without year: assume current year
                const assumedYear = new Date().getFullYear();
                const mm = monthParam;
                const lastDay = new Date(assumedYear, parseInt(mm), 0).getDate();
                initialFilter.enddate = {
                    operator: "><",
                    data: [`${assumedYear}-${mm}-01`, `${assumedYear}-${mm}-${String(lastDay).padStart(2, '0')}`]
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
            } else {
                // Apply default sort if no sort parameter is in URL
                applyDefaultSort();
            }
            if (searchParams.has("include")) {
                const include = searchParams.get("include")?.split(",") || [];
                booleanOptions.forEach((option) => {
                    if (include.includes(option.value)) {
                        initialFilter[option.value] = { operator: "=" };
                    }
                });
            }
            // Read array-based filters from URL
            if (searchParams.has("formats")) {
                const formats = searchParams.get("formats")?.split(",").map(f => parseInt(f) as Format) || [];
                initialFilter.formats = formats;
            }
            if (searchParams.has("sources")) {
                const sources = searchParams.get("sources")?.split(",") || [];
                initialFilter.sources = sources;
            }
            if (searchParams.has("arc")) {
                const arc = searchParams.get("arc")?.split(",") || [];
                initialFilter.arc = arc;
            }
            if (searchParams.has("diversity")) {
                const diversity = searchParams.get("diversity")?.split(",") || [];
                initialFilter.diversity = diversity;
            }
        } else {
            // Apply default sort when there are no search params at all
            applyDefaultSort();
        }
        return initialFilter;
    });

    const filteredBooks = useMemo(() => data ? getShelf(data, filter) : undefined, [data, filter]);
    const { data: books, isLoading: isBooksLoading } = useBooks(filteredBooks?.map((book) => book.bookid) || []);
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
            router.replace(`${pathname}?${params.toString()}`, { scroll: false });
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
            router.replace(`${pathname}?${params.toString()}`, { scroll: false });

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
                // If removing year also remove month constraint since month depends on year context.
                if (params.has("month")) params.delete("month");
                setSelectedMonth(undefined);
            }

            router.replace(`${pathname}?${params.toString()}`, { scroll: false });
            setFilter((prev) => ({
                ...prev,
                enddate: year ? {
                    operator: "><",
                    data: selectedMonth ? (() => {
                        const mm = selectedMonth;
                        const lastDay = new Date(parseInt(year), parseInt(mm), 0).getDate();
                        return [`${year}-${mm}-01`, `${year}-${mm}-${String(lastDay).padStart(2, '0')}`];
                    })() : [`${year}-01-01`, `${year}-12-31`]
                } : undefined
            }));
        },
        [searchParams, pathname, router, selectedMonth]
    );

    const setMonth = useCallback(
        (month: string) => {
            const params = new URLSearchParams(searchParams?.toString());
            if (month) {
                params.set("month", month);
                // Ensure we have a year context – if none, infer from current enddate year or default current year
                let year = params.get("enddate");
                if (!year) {
                    const currentYear = new Date().getFullYear().toString();
                    year = currentYear;
                    params.set("enddate", year);
                }
                const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
                router.replace(`${pathname}?${params.toString()}`, { scroll: false });
                setSelectedMonth(month);
                setFilter((prev) => ({
                    ...prev,
                    enddate: {
                        operator: "><",
                        data: [`${year}-${month}-01`, `${year}-${month}-${String(lastDay).padStart(2, '0')}`]
                    }
                }));
            } else {
                // Clearing month: revert to full year range if year set
                if (params.has("month")) params.delete("month");
                const year = params.get("enddate");
                router.replace(`${pathname}?${params.toString()}`, { scroll: false });
                setSelectedMonth(undefined);
                setFilter((prev) => ({
                    ...prev,
                    enddate: year ? {
                        operator: "><",
                        data: [`${year}-01-01`, `${year}-12-31`]
                    } : undefined
                }));
            }
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
            router.replace(`${pathname}?${params.toString()}`, { scroll: false });
            setFilter((prev) => {
                const newFilter: BookFilter = { ...prev };
                booleanOptions.forEach((option) => {
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

    const handleGraphFilterClick = useCallback(
        (filterType: string, value?: string | boolean | number) => {
            const params = new URLSearchParams(searchParams?.toString());
            
            // Switch back to list view when filtering
            params.set("view", ShowAs.list);
            setShowAs(ShowAs.list);

            // Handle boolean filters (owned, diverse, bipoc, lgbt, arcreviewed)
            if (typeof value === 'boolean' || ['owned', 'diverse', 'bipoc', 'lgbt', 'arcreviewed'].includes(filterType)) {
                const currentInclude = params.get("include")?.split(",") || [];
                if (!currentInclude.includes(filterType)) {
                    currentInclude.push(filterType);
                }
                params.set("include", currentInclude.join(","));
            }

            if (filterType === 'month' && typeof value === 'string') {
                // Set month; ensure year context exists
                params.set('month', value);
                let year = params.get('enddate');
                if (!year) {
                    year = new Date().getFullYear().toString();
                    params.set('enddate', year);
                }
                const lastDay = new Date(parseInt(year), parseInt(value), 0).getDate();
                setSelectedMonth(value);
                setFilter(prev => ({
                    ...prev,
                    enddate: {
                        operator: '><',
                        data: [`${year}-${value}-01`, `${year}-${value}-${String(lastDay).padStart(2, '0')}`]
                    }
                }));
                router.replace(`${pathname}?${params.toString()}`, { scroll: false });
                return; // Month handled; exit early
            }

            setFilter((prev) => {
                const newFilter: BookFilter = { ...prev };
                
                // Handle array-based filters (sources, arc, diversity, formats)
                if (filterType === 'sources') {
                    const currentValues = (newFilter.sources as string[]) || [];
                    if (!currentValues.includes(value as string)) {
                        const newSources = [...currentValues, value as string];
                        newFilter.sources = newSources;
                        // Update URL (excluding "arc")
                        const sourcesForUrl = newSources.filter(s => s !== "arc");
                        if (sourcesForUrl.length > 0) {
                            params.set("sources", sourcesForUrl.join(","));
                        }
                    }
                } else if (filterType === 'arc') {
                    const currentValues = (newFilter.arc as string[]) || [];
                    if (!currentValues.includes(value as string)) {
                        const newArc = [...currentValues, value as string];
                        newFilter.arc = newArc;
                        params.set("arc", newArc.join(","));
                    }
                } else if (filterType === 'diversity') {
                    const currentValues = (newFilter.diversity as string[]) || [];
                    if (!currentValues.includes(value as string)) {
                        const newDiversity = [...currentValues, value as string];
                        newFilter.diversity = newDiversity;
                        params.set("diversity", newDiversity.join(","));
                    }
                } else if (filterType === 'formats') {
                    const currentFormats = newFilter.formats || [];
                    if (!currentFormats.includes(value as Format)) {
                        const newFormats = [...currentFormats, value as Format];
                        newFilter.formats = newFormats;
                        params.set("formats", newFormats.join(","));
                    }
                } else {
                    // Handle boolean filters
                    newFilter[filterType as keyof BooleanFilter] = { operator: "=" };
                }
                
                return newFilter;
            });
            
            router.replace(`${pathname}?${params.toString()}`, { scroll: false });
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
        if (filter.owned) selected.push("owned");
        if (filter.wanttobuy) selected.push("wanttobuy");
        return selected;
    }, [filter]);

    const formatOptions = useMemo(() => {
        return Object.entries(Format)
            .filter(([, value]) => typeof value === 'number')
            .map(([key, value]) => ({ value: value as Format, label: key }));
    }, []);

    const sourcesOptions = useMemo(() => {
        const sources = new Set<string>();
        data?.forEach((book) => {
            book.sources?.forEach((source) => sources.add(source));
        });
        return Array.from(sources).map((source) => ({ value: source, label: source }));
    }, [data]);

    const arcOptions = useMemo(() => {
        const arcSources = new Set<string>();
        data?.forEach((book) => {
            book.arc?.forEach((source) => arcSources.add(source));
        });
        return Array.from(arcSources).map((source) => ({ value: source, label: source }));
    }, [data]);

    const diversityOptions = useMemo(() => {
        const diversityLabels = new Set<string>();
        data?.forEach((book) => {
            book.diversity?.forEach((label) => diversityLabels.add(label));
        });
        return Array.from(diversityLabels).sort().map((label) => ({ value: label, label: label }));
    }, [data]);

    const setFormats = useCallback(
        (formats: Format[]) => {
            const params = new URLSearchParams(searchParams?.toString());
            if (formats.length > 0) {
                params.set("formats", formats.join(","));
            } else {
                params.delete("formats");
            }
            router.replace(`${pathname}?${params.toString()}`, { scroll: false });
            
            setFilter((prev) => ({
                ...prev,
                formats: formats.length > 0 ? formats : undefined
            }));
        },
        [searchParams, pathname, router]
    );

    const setSources = useCallback(
        (sources: string[]) => {
            const params = new URLSearchParams(searchParams?.toString());
            
            if (sources.length > 0) {
                params.set("sources", sources.join(","));
            } else {
                params.delete("sources");
            }
            router.replace(`${pathname}?${params.toString()}`, { scroll: false });
            
            setFilter((prev) => ({
                ...prev,
                sources: sources.length > 0 ? sources : undefined
            }));
        },
        [searchParams, pathname, router]
    );

    const setArc = useCallback(
        (arc: string[]) => {
            const params = new URLSearchParams(searchParams?.toString());
            if (arc.length > 0) {
                params.set("arc", arc.join(","));
            } else {
                params.delete("arc");
            }
            router.replace(`${pathname}?${params.toString()}`, { scroll: false });
            
            setFilter((prev) => ({
                ...prev,
                arc: arc.length > 0 ? arc : undefined
            }));
        },
        [searchParams, pathname, router]
    );

    const setDiversity = useCallback(
        (diversity: string[]) => {
            const params = new URLSearchParams(searchParams?.toString());
            if (diversity.length > 0) {
                params.set("diversity", diversity.join(","));
            } else {
                params.delete("diversity");
            }
            router.replace(`${pathname}?${params.toString()}`, { scroll: false });
            
            setFilter((prev) => ({
                ...prev,
                diversity: diversity.length > 0 ? diversity : undefined
            }));
        },
        [searchParams, pathname, router]
    );


    // While Google Books queries still resolving, show skeletons instead of returning null.
    const loadingResolvedMismatch = filteredBooks && books && filteredBooks.length !== books.length;

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
                    placeholder="Month finished"
                    onChange={setMonth}
                    value={selectedMonth || ""}
                    options={[{ value: "", label: "All months" },
                        { value: "01", label: "January" },
                        { value: "02", label: "February" },
                        { value: "03", label: "March" },
                        { value: "04", label: "April" },
                        { value: "05", label: "May" },
                        { value: "06", label: "June" },
                        { value: "07", label: "July" },
                        { value: "08", label: "August" },
                        { value: "09", label: "September" },
                        { value: "10", label: "October" },
                        { value: "11", label: "November" },
                        { value: "12", label: "December" }
                    ]}
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
                <Select
                    placeholder="Formats"
                    onChange={setFormats}
                    options={formatOptions}
                    value={filter.formats || []}
                    mode="multiple"
                    allowClear
                    style={{ width: 200 }}
                />
                <Select
                    placeholder="Sources"
                    onChange={setSources}
                    options={sourcesOptions}
                    value={filter.sources || []}
                    mode="multiple"
                    allowClear
                    style={{ width: 200 }}
                />
                <Select
                    placeholder="ARC Sources"
                    onChange={setArc}
                    options={arcOptions}
                    value={filter.arc || []}
                    mode="multiple"
                    allowClear
                    style={{ width: 200 }}
                />
                <Select
                    placeholder="Diversity Labels"
                    onChange={setDiversity}
                    options={diversityOptions}
                    value={filter.diversity || []}
                    mode="multiple"
                    allowClear
                    style={{ width: 200 }}
                />
            </div>
            {/* Initial fetch spinner (user's own BookData list) */}
            {!data && <Spin indicator={<LoadingOutlined spin />} size="large" className="pageLoading" />}
            {/* Skeletons for books while Google Books details load */}
            {(isBooksLoading || loadingResolvedMismatch) && showAs !== ShowAs.graph && (
                <div className={`${styles.bookResults} ${showAs === ShowAs.list ? '' : styles.bookResultsGrid}`}>
                    {[...Array( showAs === ShowAs.grid ? 12 : 5)].map((_, i) => (
                        <BookRowSkeleton grid={showAs === ShowAs.grid} key={`skeleton-${i}`} />
                    ))}
                </div>
            )}
            {(isBooksLoading || loadingResolvedMismatch) && showAs === ShowAs.graph && <GraphsSkeleton />}
            {filteredBooks?.length === 0 && <div>No books were found matching this list</div>}
            {books && !isBooksLoading && !loadingResolvedMismatch && showAs !== ShowAs.graph &&
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
            {books && filteredBooks && !isBooksLoading && !loadingResolvedMismatch && showAs === ShowAs.graph &&
                <ShelfGraphs books={books} bookData={filteredBooks} onFilterClick={handleGraphFilterClick} />
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

const booleanOptions: { value: keyof BooleanFilter, label: string }[] = [
    { value: "diverse", label: "Diverse" },
    { value: "bipoc", label: "BIPOC" },
    { value: "lgbt", label: "LGBTQIA" },
    { value: "owned", label: "Owned" },
    { value: "wanttobuy", label: "Want to buy" }
];

const defaultSort: Record<Shelf, string> = {
    [Shelf.TBR]: "releasedate-desc",
    [Shelf.READ]: "enddate-desc",
    [Shelf.READING]: "startdate-asc",
    [Shelf.DNF]: "releasedate-desc"
}
