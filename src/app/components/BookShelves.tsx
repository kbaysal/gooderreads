import { IconBookmark, IconBook, IconBook2, IconVocabularyOff, IconTag, IconPlus } from "@tabler/icons-react";
import { Button, Dropdown, MenuProps, Tooltip } from "antd";
import { Shelf } from "../lib/helper";
import { JSX, memo, useCallback, useEffect, useMemo, useRef } from "react";
import styles from "../page.module.css";
import { SizeType } from "antd/es/config-provider/SizeContext";

interface BookShelvesProps {
    iconSize: number;
    shelfClick: (shelf: Shelf) => void;
    buttonSize: SizeType;
    minimized?: boolean;
    onShelf?: Shelf[];
    FormatsComponent?: JSX.Element;
    tagClick?: () => void
}

function BookShelves(props: BookShelvesProps) {
    const { iconSize, shelfClick, onShelf, buttonSize, FormatsComponent, tagClick, minimized } = props;

    const tbrClick = useCallback(() => shelfClick(Shelf.TBR), [shelfClick]);
    const readingClick = useCallback(() => { shelfClick(Shelf.READING); }, [shelfClick]);
    const readClick = useCallback(() => { shelfClick(Shelf.READ); }, [shelfClick]);
    const dnfClick = useCallback(() => shelfClick(Shelf.DNF), [shelfClick]);
    //const onShelfRef = useRef<Shelf[]>([]);
    //const shelfClickRef = useRef();

    // useEffect(
    //     () => {
    //         console.log("onShelfRef", onShelfRef.current == onShelf);
    //         onShelfRef.current = onShelf as Shelf[];
    //         console.log("shelfClickRef", shelfClickRef.current == shelfClickRef);
    //         shelfClickRef.current = shelfClickRef;
    //     }
    // )

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
            selectedKeys: onShelf
        }),
        [menuOptions, onShelf]
    );

    return (
        <>
            {minimized && onShelf && (
                <Dropdown menu={menuProps} >
                    {getMenuIcon(onShelf?.[0])}
                </Dropdown>
            )}
            {!minimized &&
                <>
                    <Tooltip title="TBR">
                        <Button icon={<IconBookmark size={iconSize} />} onClick={tbrClick} type={onShelf && onShelf.indexOf(Shelf.TBR) > -1 ? "primary" : undefined} size={buttonSize} />
                    </Tooltip>

                    <div className={styles.shelfButtons}>
                        <Tooltip title="Reading">
                            <Button icon={<IconBook size={iconSize} />} onClick={readingClick} type={onShelf && onShelf.indexOf(Shelf.READING) > -1 ? "primary" : undefined} size={buttonSize} />
                        </Tooltip>
                        {onShelf && onShelf.indexOf(Shelf.READING) > -1 && FormatsComponent}
                    </div>

                    <div className={styles.shelfButtons}>
                        <Tooltip title="Read">
                            <Button icon={<IconBook2 size={iconSize} />} onClick={readClick} type={onShelf && onShelf.indexOf(Shelf.READ) > -1 ? "primary" : undefined} size={buttonSize} />
                        </Tooltip>
                        {onShelf && onShelf.indexOf(Shelf.READ) > -1 && FormatsComponent}
                    </div>

                    <Tooltip title="DNF">
                        <Button icon={<IconVocabularyOff size={iconSize} />} onClick={dnfClick} type={onShelf && onShelf.indexOf(Shelf.DNF) > -1 ? "primary" : undefined} size={buttonSize} />
                    </Tooltip>

                    {tagClick && <Tooltip title="Tag">
                        <Button icon={<IconTag size={iconSize} />} size={buttonSize} onClick={tagClick} />
                    </Tooltip>}
                </>
            }
        </>
    )
}

const getMenuIcon = (onShelf: Shelf | undefined) => {
    switch (onShelf) {
        case Shelf.TBR:
            return <IconBookmark className={styles.onShelfIcon} />
        case Shelf.READING:
            return <IconBook className={styles.onShelfIcon} />
        case Shelf.READ:
            return <IconBook2 className={styles.onShelfIcon} />
        case Shelf.DNF:
            return <IconVocabularyOff className={styles.onShelfIcon} />
        default:
            return <IconPlus />
    }
}

export default memo(BookShelves);
