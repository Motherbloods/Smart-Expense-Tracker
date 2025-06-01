import { useMemo } from "react";
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    ResponsiveContainer
} from "recharts";

const COLORS = [
    "#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A28CF4",
    "#FF6492", "#FFA07A", "#90EE90", "#FFB6C1", "#B0C4DE"
];

function CategoryBreakdown({ expenses }) {
    const { categoryData, totalAmount } = useMemo(() => {
        const totals = {};
        let sum = 0;

        expenses.forEach((expense) => {
            const category = expense.category || "Tidak Diketahui";
            if (!totals[category]) {
                totals[category] = 0;
            }
            totals[category] += expense.amount;
            sum += expense.amount;
        });

        const data = Object.entries(totals).map(([category, amount]) => ({
            name: category,
            value: amount,
            percent: amount / sum,
        }));

        return { categoryData: data, totalAmount: sum };
    }, [expenses]);

    return (
        <div className="lg:col-span-1">
            <div className="bg-white p-4 mt-4 rounded-xl shadow-lg">
                <h1 className="text-xl font-semibold mb-4">Breakdown Kategori</h1>

                {categoryData.length > 0 ? (
                    <>
                        <div className="text-center text-sm text-gray-600 mb-2">
                            Total Pengeluaran: <strong>Rp {totalAmount.toLocaleString("id-ID")}</strong>
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    fill="#8884d8"
                                    label={({ name, value, percent }) =>
                                        `${name}: Rp ${value.toLocaleString("id-ID")} (${(percent * 100).toFixed(0)}%)`
                                    }
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={COLORS[index % COLORS.length]}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value, name) =>
                                        [`Rp ${value.toLocaleString("id-ID")}`, name]
                                    }
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </>
                ) : (
                    <p className="text-sm text-center text-gray-500">
                        Belum ada data kategori
                    </p>
                )}
            </div>
        </div>
    );
}

export default CategoryBreakdown;
