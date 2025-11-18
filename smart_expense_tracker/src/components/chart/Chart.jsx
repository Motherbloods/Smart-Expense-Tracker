import { useState, useEffect, useCallback } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

function Chart({ expenses = [], incomes = [] }) {
    const [viewMode, setViewMode] = useState("daily");
    const [chartData, setChartData] = useState([]);

    const prepareChartData = useCallback(() => {
        if ((!expenses || expenses.length === 0) && (!incomes || incomes.length === 0)) {
            setChartData([]);
            return;
        }

        // Get the month and year from the filtered data (prioritize expenses, then incomes)
        const allTransactions = [...(expenses || []), ...(incomes || [])];
        if (allTransactions.length === 0) {
            setChartData([]);
            return;
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

            setChartData(dailyData);
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

            setChartData(weeksData);
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

            setChartData(monthlyData);
        }
    }, [viewMode, expenses, incomes]);

    const handleViewModeChange = (e) => {
        setViewMode(e.target.value);
    };

    // Configure x-axis data key based on view mode
    const getXAxisDataKey = () => {
        if (viewMode === "daily") return "date";
        if (viewMode === "weekly") return "week";
        return "month";
    };

    // Get chart title based on view mode
    const getChartTitle = () => {
        if (viewMode === "daily") return "Grafik Harian";
        if (viewMode === "weekly") return "Grafik Mingguan";
        return "Grafik Bulanan";
    };

    useEffect(() => {
        prepareChartData();
    }, [prepareChartData]);

    return (
        <>
            <div className="lg:col-span-1">
                <div className="flex items-center justify-between px-4 pt-4 bg-white shadow-md rounded-t-lg">
                    <h1 className="text-lg font-semibold">{getChartTitle()}</h1>
                    <div className="relative">
                        <select
                            value={viewMode}
                            onChange={handleViewModeChange}
                            className="block appearance-none w-full bg-white border border-gray-300 hover:border-gray-400 px-4 py-2 pr-10 rounded shadow leading-tight focus:outline-none focus:shadow-outline"
                        >
                            <option value="daily">Per Hari</option>
                            <option value="weekly">Per Minggu</option>
                            <option value="monthly">Per Bulan</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-600">
                            <svg
                                className="w-4 h-4"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-white px-4 pb-4 shadow-md rounded-b-lg">
                    <div className="h-64 pt-4">
                        {chartData && chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                    data={chartData}
                                    margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey={getXAxisDataKey()}
                                        angle={viewMode === "monthly" ? -45 : 0}
                                        textAnchor={viewMode === "monthly" ? "end" : "middle"}
                                        height={viewMode === "monthly" ? 80 : 60}
                                    />
                                    <YAxis
                                        tickFormatter={(value) => `Rp ${(value / 1000).toLocaleString("id-ID")}k`}
                                    />
                                    <Tooltip
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
                                    {/* Income Line */}
                                    <Line
                                        type="monotone"
                                        dataKey="incomes"
                                        stroke="#22c55e"
                                        strokeWidth={2}
                                        activeDot={{ r: 6, fill: "#22c55e" }}
                                        dot={{ fill: "#22c55e", strokeWidth: 2, r: 4 }}
                                        name="incomes"
                                    />
                                    {/* Expense Line */}
                                    <Line
                                        type="monotone"
                                        dataKey="expenses"
                                        stroke="#ef4444"
                                        strokeWidth={2}
                                        activeDot={{ r: 6, fill: "#ef4444" }}
                                        dot={{ fill: "#ef4444", strokeWidth: 2, r: 4 }}
                                        name="expenses"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-500">
                                <div className="text-center">
                                    <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                    <p className="text-lg font-medium">Tidak ada data transaksi</p>
                                    <p className="text-sm">untuk periode yang dipilih</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Legend */}
                    <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-0.5 bg-green-500 rounded"></div>
                            <span className="text-sm text-gray-600">Pemasukan</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-0.5 bg-red-500 rounded"></div>
                            <span className="text-sm text-gray-600">Pengeluaran</span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default Chart;