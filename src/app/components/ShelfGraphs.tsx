import dayjs from 'dayjs';
import { Bar, BarChart, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BookData } from '../lib/data';
import { Dosis } from 'next/font/google'
import { Fragment, useCallback, useState } from 'react';
import { BarRectangleItem } from 'recharts/types/cartesian/Bar';
import { Format } from '../lib/helper';
import { PieLabelProps } from 'recharts/types/polar/Pie';
import { Divider } from 'antd';

const dosis = Dosis({
    subsets: ["latin"],
});

const columnWidth = 180;
const columnGap = 48;

const diverseColors = ['#eb2f96', 'lightgray'];
const bipocColors = ['#13c2c2', 'lightgray'];
const lgbtqiaColors = ['#722ed1', 'lightgray'];
const formatColors = ['#eb2f96', '#13c2c2', '#722ed1'];

interface ShelfGraphsProps {
    books: (Book | BookError | undefined)[];
    bookData: BookData[];
    onFilterClick?: (filterType: string, value?: string | boolean | number) => void;
}

const ShelfGraphs = (props: ShelfGraphsProps) => {

    const monthDataMap = new Map<string, number>();
    const formatDataMap = new Map<Format, number>();
    const sourcesMap = new Map<string, number>();
    const arcSourcesMap = new Map<string, number>();
    const diverseLabels = new Map<string, number>();
    let maxDiverseLabel = 0;
    props.bookData.map((book) => {
        // Use enddate (finished date) as the basis for month filtering/aggregation
        if (book.enddate) {
            const month = dayjs(book.enddate).format("MMMM");
            monthDataMap.set(month, (monthDataMap.get(month) || 0) + 1);
        }

        book.formats?.forEach((format) => {
            formatDataMap.set(format, (formatDataMap.get(format) || 0) + 1);
        });

        book.sources?.forEach((source) => {
            sourcesMap.set(source, (sourcesMap.get(source) || 0) + 1);
        });

        book.arc?.forEach((source) => {
            arcSourcesMap.set(source, (arcSourcesMap.get(source) || 0) + 1);
        });

        book.diversity?.forEach((label) => {
            const labelCount = diverseLabels.get(label) || 0;
            diverseLabels.set(label, (labelCount || 0) + 1);
            if (labelCount >= maxDiverseLabel) {
                maxDiverseLabel = labelCount + 1;
            }
        });
    });
    const monthData: ({ name: string, value: number })[] = Array.from(monthDataMap, ([name, value]) => ({ name, value }));
    const formatData: { name: string, value: number }[] = Array.from(formatDataMap, ([name, value]) => ({ name: (Format[name]), value }));
    const sourcesData: { name: string, value: number }[] = Array.from(sourcesMap, ([name, value]) => ({ name, value }));
    const arcSourcesData: { name: string, value: number }[] = Array.from(arcSourcesMap, ([name, value]) => ({ name, value }));
    const diverseLabelsData: { name: string, value: number }[] = Array.from(diverseLabels, ([name, value]) => ({ name, value }));
    diverseLabelsData.sort((a, b) => b.value - a.value);

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


    const owned = props.bookData.filter((book) => book.owned).length;
    const notOwned = props.bookData.length - owned;
    const ownedData = [
        { name: 'Owned books', value: owned },
        { name: 'Not owned', value: notOwned }
    ];

    const reviewed = props.bookData.filter((book) => book.arcreviewed).length;
    const notReviewed = (sourcesMap?.get("arc") || 0) - reviewed;
    const reviewedData = [
        { name: 'Reviewed books', value: reviewed },
        { name: 'Not reviewed', value: notReviewed }
    ];

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: columnGap, marginTop: 24, flexWrap: 'wrap' }}>
            <BarChartView
                title="Books by Month Read"
                data={monthData}
                columns={3}
                onClick={(monthName) => {
                    if (!monthName) return;
                    const monthIndex = dayjs(monthName, 'MMMM').month();
                    const monthCode = String(monthIndex + 1).padStart(2, '0');
                    props.onFilterClick?.('month', monthCode);
                }}
            />
            <BinaryPie
                data={ownedData}
                colors={diverseColors}
                mainCount={owned}
                total={props.bookData.length}
                title='Owned Books'
                onClick={() => props.onFilterClick?.('owned', true)}
            />
            <BinaryPie
                data={reviewedData}
                colors={bipocColors}
                mainCount={reviewed}
                total={props.bookData.length}
                title='Reviewed Books'
                onClick={() => props.onFilterClick?.('arcreviewed', true)}
            />
            <div style={{ position: 'relative', cursor: 'pointer' }}>
                <h4 style={{ marginBottom: 36, textAlign: "center" }}>Format Breakdown</h4>
                <PieChart
                    width={columnWidth}
                    height={230}
                >
                    <Pie
                        dataKey="value"
                        isAnimationActive={false}
                        data={formatData}
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        innerRadius={0}
                        labelLine={false}
                        cornerRadius={0}
                        paddingAngle={0}
                        fill={formatColors[0]}
                        label={renderCustomLabel}
                        onClick={(data) => {
                            const formatName = data.name as string;
                            const formatValue = Format[formatName as keyof typeof Format];
                            props.onFilterClick?.('formats', formatValue);
                        }}
                    >
                        {formatData.map((entry, index) => (
                            <Cell 
                                key={`cell-${entry.name}`} 
                                fill={formatColors[index]}
                                style={{ cursor: 'pointer' }}
                            />
                        ))}
                        <Tooltip
                            formatter={(value, name) => [value, name]}
                        />
                        <Legend wrapperStyle={{ display: "flex", bottom: -10 }} />
                    </Pie>
                </PieChart>
            </div>
            <BarChartView
                title="Books by Source"
                data={sourcesData}
                columns={2}
                onClick={(source) => props.onFilterClick?.('sources', source)}
            />
            <BarChartView
                title="Books by ARC Source"
                data={arcSourcesData}
                columns={2}
                onClick={(arcSource) => props.onFilterClick?.('arc', arcSource)}
            />
            <Divider>Diversity</Divider>
            <BinaryPie
                data={diverseData}
                colors={diverseColors}
                mainCount={diverse}
                total={props.bookData.length}
                title='Diverse Books'
                onClick={() => props.onFilterClick?.('diverse', true)}
            />
            <BinaryPie
                data={bipocData}
                colors={bipocColors}
                mainCount={bipoc}
                total={props.bookData.length}
                title='BIPOC Books'
                onClick={() => props.onFilterClick?.('bipoc', true)}
            />
            <BinaryPie
                data={lgbtqiaData}
                colors={lgbtqiaColors}
                mainCount={lgbtqia}
                total={props.bookData.length}
                title='LGBTQIA+ Books'
                onClick={() => props.onFilterClick?.('lgbt', true)}
            />
            <div style={{ width: columnWidth * 2 + columnGap, gap: 2, display: "grid", gridTemplateColumns: "max-content auto" }}>
                {diverseLabelsData.map((label) => (
                    <Fragment key={label.name}>
                        <div>{label.name}</div>
                        <div>
                            <div
                                style={{
                                    backgroundColor: diverseColors[0],
                                    width: `${label.value / maxDiverseLabel * 100}%`,
                                    height: "100%",
                                    color: "white",
                                    borderRadius: 5,
                                    overflow: "hidden",
                                    paddingLeft: 5,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                }}
                                onClick={() => props.onFilterClick?.('diversity', label.name)}
                            >
                                {label.value}
                            </div>
                        </div>
                    </Fragment>
                ))}
            </div>
        </div>
    );
};

export default ShelfGraphs;

const BarChartView = (props: { 
    title: string, 
    data: { name: string, value: number }[], 
    columns: number,
    onClick?: (name: string) => void
}) => {

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

    // Removed chart-level onClick; using per-Cell onClick for precise payload

    return (
        <div>
            <h4 style={{ marginTop: 12, textAlign: "center" }}>{props.title}</h4>
            <BarChart
                width={props.columns * columnWidth + (props.columns - 1) * columnGap}
                height={300}
                data={props.data}
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
                    {props.data.map((entry, index) => (
                        <Cell
                            key={`cell-${index}`}
                            fill={hoveredIndex === index ? '#5551a1ff' : '#8884d8'}
                            style={{ cursor: props.onClick ? 'pointer' : 'default' }}
                            onClick={() => props.onClick && props.onClick(entry.name)}
                        />
                    ))}
                </Bar>
            </BarChart>
        </div>
    )
};

const BinaryPie = (props: { 
    data: { name: string, value: number }[], 
    colors: string[], 
    mainCount: number, 
    total: number, 
    title: string,
    onClick?: () => void 
}) => (
    <div style={{ position: 'relative', cursor: props.onClick ? 'pointer' : 'default' }} onClick={props.onClick}>
        <h4 style={{ marginBottom: 36, textAlign: "center" }}>{props.title}</h4>
        <div style={{ position: "relative" }}>
            <ResponsiveContainer width={columnWidth} height={columnWidth}>
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
            <h4 style={{ marginTop: 12, textAlign: "center", position: "absolute", width: "100%", fontSize: 14 }}>Total: {props.mainCount}</h4>
        </div>
    </div>
);

const RADIAN = Math.PI / 180;
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: PieLabelProps) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-(midAngle ?? 0) * RADIAN);
    const y = cy + radius * Math.sin(-(midAngle ?? 0) * RADIAN);

    return (
        <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
            {`${((percent ?? 1) * 100).toFixed(0)}%`}
        </text>
    );
};
