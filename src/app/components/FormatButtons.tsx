"use client"

import { IconBooks, IconDeviceTabletBolt, IconHeadphones } from "@tabler/icons-react";
import { Button, Tooltip } from "antd";
import { SizeType } from "antd/es/config-provider/SizeContext";
import { useCallback, useState } from "react";
import { editFormats } from "../lib/data";
import { Format, userId } from "../lib/helper";

type ShapeType = "circle" | "default" | "round" | undefined;

export interface FormatButtonsProps {
    onPhysical: () => void;
    onEbook: () => void;
    onAudiobook: () => void;
    formatsChosen: boolean[];
    size: SizeType;
    shape: ShapeType;
    iconSize?: number;
}

export const FormatButtons = (props: FormatButtonsProps) => (
    <>
        <Tooltip title="Physical">
            <Button
                onClick={props.onPhysical}
                icon={<IconBooks size={props.iconSize} />}
                shape={props.shape}
                size={props.size}
                variant={props.formatsChosen[Format.Physical] ? "solid" : "filled"}
                color="pink"
            />
        </Tooltip>
        <Tooltip title="eBook">
            <Button
                onClick={props.onEbook}
                icon={<IconDeviceTabletBolt size={props.iconSize} />}
                shape={props.shape}
                size={props.size}
                variant={props.formatsChosen[Format.EBook] ? "solid" : "filled"}
                color="cyan"
            />
        </Tooltip>
        <Tooltip title="Audiobook">
            <Button
                onClick={props.onAudiobook}
                icon={<IconHeadphones size={props.iconSize} />}
                shape={props.shape}
                size={props.size}
                variant={props.formatsChosen[Format.Audiobook] ? "solid" : "filled"}
                color="purple"
            />
        </Tooltip>
    </>
);

interface FormatsProps {
    formatsChosen: boolean[];
    bookId: string;
    setFormatsChosen: (f: boolean[]) => void;
    className?: string;
    size?: SizeType;
    shape?: ShapeType;
    iconSize?: number;
}

export const Formats = (props: FormatsProps) => {
    const [timer, setTimer] = useState<number>();

    const onClick = useCallback(
        (format: Format) => {
            const formats = [...(props.formatsChosen)];
            formats[format] = !formats[format];
            props.setFormatsChosen(formats);
            if (timer) {
                window.clearTimeout(timer);
            }
            setTimer(window.setTimeout(() => {
                const formatArray: Format[] = [];
                formats.forEach((isOn, index) => isOn && formatArray.push(index));
                editFormats(props.bookId, userId, formatArray);
            }, 500));
        },
        [props, timer]
    );

    const onPhysical = useCallback(() => onClick(Format.Physical), [onClick]);
    const onEbook = useCallback(() => onClick(Format.EBook), [onClick]);
    const onAudiobook = useCallback(() => onClick(Format.Audiobook), [onClick]);

    return (
        <div className={props.className}>
            <FormatButtons
                onPhysical={onPhysical}
                onEbook={onEbook}
                onAudiobook={onAudiobook}
                formatsChosen={props.formatsChosen}
                size={props.size || "small"}
                shape={props.shape || "circle"}
                iconSize={props.iconSize}
            />
        </div>
    )
};
