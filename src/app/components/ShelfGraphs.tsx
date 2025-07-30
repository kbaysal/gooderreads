import dayjs from 'dayjs';
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BookData } from '../lib/data';
import { Dosis } from 'next/font/google'
import { useCallback, useState } from 'react';
import { BarRectangleItem } from 'recharts/types/cartesian/Bar';

const dosis = Dosis({
    subsets: ["latin"],
});

const diverseColors = ['#eb2f96', 'lightgray'];
const bipocColors = ['#13c2c2', 'lightgray'];
const lgbtqiaColors = ['#722ed1', 'lightgray'];
const ShelfGraphs = (props: { books: (Book | BookError | undefined)[], bookData: BookData[] }) => {

    const monthDataMap = new Map<string, number>();
    props.bookData.map((book) => {
        const month = book.releasedate ? dayjs(book.enddate).format("MMMM") : undefined;
        if (month !== undefined) {
            monthDataMap.set(month, (monthDataMap.get(month.toString()) || 0) + 1);
        }
    });
    const monthData: ({ name: string, value: number })[] = Array.from(monthDataMap, ([name, value]) => ({ name, value }));
    monthData.sort((a, b) => {
        const monthA = dayjs(a.name, "MMMM").month();
        const monthB = dayjs(b.name, "MMMM").month();
        return monthA - monthB;
    });

    const diverse = props.bookData.filter((book) => book.diverse).length;
    const notDiverse = props.bookData.length - diverse;
    const diverseData = [
        { name: 'Diverse', value: diverse },
        { name: 'Not Diverse', value: notDiverse }
    ];

    const bipoc = props.bookData.filter((book) => book.bipoc).length;
    const notBipoc = props.bookData.length - bipoc;
    const bipocData = [
        { name: 'BIPOC', value: bipoc },
        { name: 'Not BIPOC', value: notBipoc }
    ];

    const lgbtqia = props.bookData.filter((book) => book.lgbt).length;
    const notLgbtqia = props.bookData.length - lgbtqia;
    const lgbtqiaData = [
        { name: 'LGBTQIA', value: lgbtqia },
        { name: 'Not LGBTQIA', value: notLgbtqia }
    ];
    const [hoveredIndex, setHoveredIndex] = useState(-1);
    const handleMouseEnter = useCallback(
        (data: BarRectangleItem, index: number) => {
            setHoveredIndex(index);
        },
        []
    );

    const handleMouseLeave = useCallback(
        () => {
            setHoveredIndex(-1);
        },
        []
    );

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 48, marginTop: 24, flexWrap: 'wrap' }}>
            <div>
                <h4 style={{ marginBottom: 36, textAlign: "center" }}>Books by Month Read</h4>
                <BarChart
                    width={408}
                    height={300}
                    data={monthData}
                >
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip cursor={{ fill: 'transparent' }} formatter={(value) => [value, 'Books']} />
                    <Bar
                        dataKey="value"
                        fill="#8884d8"
                        radius={[20, 20, 0, 0]}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                    >
                        {monthData.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={hoveredIndex === index ? '#5551a1ff' : '#8884d8'} // Red on hover, blue default
                            />
                        ))}
                    </Bar>
                </BarChart>
            </div>
            <BinaryPie
                data={diverseData}
                colors={diverseColors}
                mainCount={diverse}
                total={props.bookData.length}
                title='Diverse Books'
            />
            <BinaryPie
                data={bipocData}
                colors={bipocColors}
                mainCount={bipoc}
                total={props.bookData.length}
                title='BIPOC Books'
            />
            <BinaryPie
                data={lgbtqiaData}
                colors={lgbtqiaColors}
                mainCount={lgbtqia}
                total={props.bookData.length}
                title='LGBTQIA+ Books'
            />
        </div>
    );
};

export default ShelfGraphs;

const BinaryPie = (props: { data: { name: string, value: number }[], colors: string[], mainCount: number, total: number, title: string }) => (
    <div style={{ position: 'relative' }}>
        <h4 style={{ marginBottom: 36, textAlign: "center" }}>{props.title}</h4>
        <div style={{ position: "relative" }}>
            <ResponsiveContainer width={180} height={180}>
                <PieChart>
                    <Pie
                        dataKey="value"
                        isAnimationActive={false}
                        data={props.data}
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        innerRadius={55}
                        labelLine={false}
                        cornerRadius={100}
                        paddingAngle={3}
                        fill="#8884d8"
                    >
                        {props.data.map((entry, index) => (
                            <Cell key={`cell-${entry.name}`} fill={props.colors[index]} />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "white",
                            color: props.colors[0],
                            border: "1px solid #ccc",
                            borderRadius: "4px"
                        }}
                        formatter={(value, name) => [value, name]}
                    />
                </PieChart>
            </ResponsiveContainer>
            <div
                className={dosis.className}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    fontSize: '30px',
                    fontWeight: 500,
                    fontFamily: '"Dosis", sans-serif'
                }}
            >
                {Math.round(props.mainCount / props.total * 100)}%
            </div>
        </div>
    </div>
);
