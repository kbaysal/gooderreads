import dayjs from 'dayjs';
import { Bar, BarChart, Cell, Pie, PieChart, Tooltip, XAxis, YAxis } from 'recharts';
import { BookData } from '../lib/data';
import { PieLabelProps } from 'recharts/types/polar/Pie';

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

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 48, marginTop: 24, flexWrap: 'wrap' }}>
            <div>
                <h4 style={{ marginBottom: 36, textAlign: "center" }}>Books by Release Month</h4>
                <BarChart width={300} height={300} data={monthData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
            </div>
            <div>
                <h4 style={{ marginBottom: 36, textAlign: "center" }}>Diverse</h4>
                <PieChart width={300} height={300}>
                    <Pie
                        dataKey="value"
                        isAnimationActive={false}
                        data={diverseData}
                        cx="50%"
                        cy="50%"
                        outerRadius={130}
                        label={renderCustomizedLabel}
                        fill="pink"
                        labelLine={false}
                    >
                        {diverseData.map((entry, index) => (
                            <Cell key={`cell-${entry.name}`} fill={diverseColors[index]}/>
                        ))}
                    </Pie>
                    <Tooltip />
                </PieChart>
            </div>
            <div>
                <h4 style={{ marginBottom: 36, textAlign: "center" }}>BIPOC</h4>
                <PieChart width={300} height={300}>
                    <Pie
                        dataKey="value"
                        isAnimationActive={false}
                        data={bipocData}
                        cx="50%"
                        cy="50%"
                        outerRadius={130}
                        label={renderCustomizedLabel}
                        fill="pink"
                        labelLine={false}
                    >
                        {lgbtqiaData.map((entry, index) => (
                            <Cell key={`cell-${entry.name}`} fill={bipocColors[index]}/>
                        ))}
                    </Pie>
                    <Tooltip />
                </PieChart>
            </div>
            <div>
                <h4 style={{ marginBottom: 36, textAlign: "center" }}>LGBTQIA</h4>
                <PieChart width={300} height={300}>
                    <Pie
                        dataKey="value"
                        isAnimationActive={false}
                        data={lgbtqiaData}
                        cx="50%"
                        cy="50%"
                        outerRadius={130}
                        label={renderCustomizedLabel}
                        fill="pink"
                        labelLine={false}
                    >
                        {diverseData.map((entry, index) => (
                            <Cell key={`cell-${entry.name}`} fill={lgbtqiaColors[index]}/>
                        ))}
                    </Pie>
                    <Tooltip />
                </PieChart>
            </div>
        </div>
    );
};

export default ShelfGraphs;

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: PieLabelProps) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-(midAngle ?? 0) * RADIAN);
    const y = cy + radius * Math.sin(-(midAngle ?? 0) * RADIAN);

    return (
        <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
            {`${((percent ?? 1) * 100).toFixed(0)}%`}
        </text>
    );
};