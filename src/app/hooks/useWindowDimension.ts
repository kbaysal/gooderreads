import { useEffect, useState } from "react";
import { mobileThreshold } from "../lib/helper";

export function useWindowDimensions(): { width: number; height: number} {
    const [width, setWidth] = useState(window.innerWidth);
    const [height, setHeight] = useState(window.innerHeight);
    useEffect(
        () => {
            const onResize = (): void => {
                setWidth(window.innerWidth);
                setHeight(window.innerHeight);
            };
            window.addEventListener("resize", onResize);
            return (): void => {
                window.removeEventListener("resize", onResize);
            };
        },
        []
    );

    return { width, height };
}

export function useIsMobile(): boolean {
    const { width } = useWindowDimensions();
    return width <= mobileThreshold;
}
