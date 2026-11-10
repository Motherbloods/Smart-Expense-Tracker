import { useState, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

function Chart({ expenses = [], incomes = [] }) {
    const [viewMode, setViewMode] = useState("daily");

    // ✅ OPTIMASI: Gunakan useMemo untuk prepare chart data
    // Data hanya di-process ulang ketika dependencies berubah
    const chartData = useMemo(() => {
        if ((!expenses || expenses.length === 0) && (!incomes || incomes.length === 0)) {
            return [];
        }

        // Get the month and year from the filtered data (prioritize expenses, then incomes)
        const allTransactions = [...(expenses || []), ...(incomes || [])];
        if (allTransactions.length === 0) {
            return [];
        }

        const firstTransaction = allTransactions[0];
        const transactionDate = new Date(firstTransaction.date);
        const year = transactionDate.getFullYear();
        const month = transactionDate.getMonth();

        if (viewMode === "daily") {
            // Daily view - show expenses and incomes for each day of the current month
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const dailyData = [];

            // Initialize data for each day in the month
            for (let day = 1; day <= daysInMonth; day++) {
                dailyData.push({
                    date: `${day}`,
                    expenses: 0,
                    incomes: 0
                });
            }

            // Sum expenses for each day
            expenses.forEach(expense => {
                const expenseDate = new Date(expense.date);
                const day = expenseDate.getDate();
                if (day >= 1 && day <= daysInMonth) {
                    dailyData[day - 1].expenses += expense.amount;
                }
            });

            // Sum incomes for each day
            incomes.forEach(income => {
                const incomeDate = new Date(income.date);
                const day = incomeDate.getDate();
                if (day >= 1 && day <= daysInMonth) {
                    dailyData[day - 1].incomes += income.amount;
                }
            });

            return dailyData;
        } else if (viewMode === "weekly") {
            // Weekly view - group by weeks in the current month (only 4 weeks)
            const weeksData = [
                { week: "Minggu 1", expenses: 0, incomes: 0 },
                { week: "Minggu 2", expenses: 0, incomes: 0 },
                { week: "Minggu 3", expenses: 0, incomes: 0 },
                { week: "Minggu 4", expenses: 0, incomes: 0 }
            ];

            expenses.forEach(expense => {
                const expenseDate = new Date(expense.date);
                const day = expenseDate.getDate();
                let weekIndex = Math.floor((day - 1) / 7);
                if (weekIndex > 3) weekIndex = 3; // Cap at week 4 (index 3)
                weeksData[weekIndex].expenses += expense.amount;
            });

            incomes.forEach(income => {
                const incomeDate = new Date(income.date);
                const day = incomeDate.getDate();
                let weekIndex = Math.floor((day - 1) / 7);
                if (weekIndex > 3) weekIndex = 3; // Cap at week 4 (index 3)
                weeksData[weekIndex].incomes += income.amount;
            });

            return weeksData;
        } else {
            // Monthly view - show all months (January-December) for the current year
            const monthNames = [
                'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
            ];

            // Initialize data for all 12 months
            const monthlyData = monthNames.map((monthName, index) => ({
                month: monthName,
                expenses: 0,
                incomes: 0,
                monthIndex: index
            }));

            // Process expenses
            expenses.forEach(expense => {
                const expenseDate = new Date(expense.date);
                const expenseYear = expenseDate.getFullYear();
                const monthIndex = expenseDate.getMonth();

                // Only include expenses from the same year
                if (expenseYear === year) {
                    monthlyData[monthIndex].expenses += expense.amount;
                }
            });

            // Process incomes
            incomes.forEach(income => {
                const incomeDate = new Date(income.date);
                const incomeYear = incomeDate.getFullYear();
                const monthIndex = incomeDate.getMonth();

                // Only include incomes from the same year
                if (incomeYear === year) {
                    monthlyData[monthIndex].incomes += income.amount;
                }
            });

            return monthlyData;
        }
    }, [viewMode, expenses, incomes]); // Hanya re-compute saat ini berubah

    const getXAxisDataKey = () => {
        if (viewMode === "daily") return "date";
        if (viewMode === "weekly") return "week";
        return "month";
    };

    const formatAxisValue = (value) => {
        if (value >= 1000000) {
            return `${(value / 1000000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} jt`;
        }
        if (value >= 1000) {
            return `${(value / 1000).toLocaleString("id-ID", { maximumFractionDigits: 0 })} rb`;
        }
        return value.toLocaleString("id-ID");
    };

    const viewOptions = [
        { value: "daily", label: "Harian" },
        { value: "weekly", label: "Mingguan" },
        { value: "monthly", label: "Bulanan" },
    ];

    const axisTick = { fontSize: 12, fill: "#64748b" };

    return (
        <div>
            <div className="chart-toolbar">
                <div className="chart-legend">
                    <span className="chart-legend__item">
                        <span className="chart-legend__dot" style={{ background: "var(--income)" }} />
                        Pemasukan
                    </span>
                    <span className="chart-legend__item">
                        <span className="chart-legend__dot" style={{ background: "var(--expense)" }} />
                        Pengeluaran
                    </span>
                </div>
                <div className="seg" role="group" aria-label="Rentang grafik">
                    {viewOptions.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => setViewMode(option.value)}
                            aria-pressed={viewMode === option.value}
                            className={viewMode === option.value ? "is-active" : ""}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="h-64">
                {chartData && chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={chartData}
                            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                        >
                            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                            <XAxis
                                dataKey={getXAxisDataKey()}
                                tick={axisTick}
                                tickLine={false}
                                axisLine={{ stroke: "#e2e8f0" }}
                                tickFormatter={(value) => (viewMode === "monthly" ? String(value).slice(0, 3) : value)}
                                interval={viewMode === "daily" ? 2 : 0}
                                tickMargin={8}
                            />
                            <YAxis
                                tick={axisTick}
                                tickLine={false}
                                axisLine={false}
                                width={52}
                                tickFormatter={formatAxisValue}
                            />
                            <Tooltip
                                cursor={{ stroke: "#cbd5e1" }}
                                contentStyle={{
                                    borderRadius: 8,
                                    border: "1px solid #e2e8f0",
                                    boxShadow: "none",
                                    fontSize: 13,
                                }}
                                formatter={(value, name) => [
                                    `Rp ${value.toLocaleString("id-ID")}`,
                                    name === "expenses" ? "Pengeluaran" : "Pemasukan"
                                ]}
                                labelFormatter={(label) => {
                                    if (viewMode === "daily") return `Tanggal ${label}`;
                                    if (viewMode === "weekly") return label;
                                    return `Bulan: ${label}`;
                                }}
                            />
                            <Line
                                type="monotone"
                                dataKey="incomes"
                                stroke="#047857"
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 4, fill: "#047857", stroke: "#fff", strokeWidth: 2 }}
                                name="incomes"
                            />
                            <Line
                                type="monotone"
                                dataKey="expenses"
                                stroke="#dc2626"
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 4, fill: "#dc2626", stroke: "#fff", strokeWidth: 2 }}
                                name="expenses"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex h-full items-center justify-center text-center">
                        <div>
                            <p className="text-sm font-semibold text-slate-600">Tidak ada data transaksi</p>
                            <p className="text-sm text-slate-500">untuk periode yang dipilih</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Chart;
