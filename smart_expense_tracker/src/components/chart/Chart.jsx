import { useState, useEffect, useCallback } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ChevronLeft, ChevronRight } from "lucide-react";
import expenses from "../../dummy/expenses";

function Chart() {
    const [viewMode, setViewMode] = useState("daily");
    const [currentDate, setCurrentDate] = useState(new Date());
    const [chartData, setChartData] = useState([]);

    // Format date for display
    const formatDisplayDate = () => {
        if (viewMode === 'daily' || viewMode === 'weekly') {
            return currentDate.toLocaleDateString("id-ID", { month: 'long', year: 'numeric' })
        } else {
            return currentDate.getFullYear().toString()
        }
    };

    // Navigate to previous period
    const goToPrevious = () => {
        const newDate = new Date(currentDate)
        if (viewMode === 'daily' || viewMode === 'weekly') {
            newDate.setMonth(newDate.getMonth() - 1)
        } else {
            newDate.setFullYear(newDate.getFullYear() - 1)
        }
        setCurrentDate(newDate)
    };

    // Navigate to next period
    const goToNext = () => {
        const newDate = new Date(currentDate)
        if (viewMode === 'daily' || viewMode === 'weekly') {
            newDate.setMonth(newDate.getMonth() + 1)
        } else {
            newDate.setFullYear(newDate.getFullYear() + 1)
        }
        setCurrentDate(newDate)
    };

    const prepareChartData = useCallback(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        if (viewMode === "daily") {
            // Daily view - show expenses for each day of the current month
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const dailyData = [];

            // Initialize data for each day in the month
            for (let day = 1; day <= daysInMonth; day++) {
                dailyData.push({
                    date: `${day}`,
                    amount: 0
                });
            }

            // Sum expenses for each day
            expenses.forEach(expense => {
                const expenseDate = new Date(expense.date);
                if (expenseDate.getMonth() === month && expenseDate.getFullYear() === year) {
                    const day = expenseDate.getDate();
                    dailyData[day - 1].amount += expense.amount;
                }
            });

            setChartData(dailyData);
        } else if (viewMode === "weekly") {
            // Weekly view - group by weeks in the current month
            const weeksData = [
                { week: "Minggu 1", amount: 0 },
                { week: "Minggu 2", amount: 0 },
                { week: "Minggu 3", amount: 0 },
                { week: "Minggu 4", amount: 0 }
            ];

            expenses.forEach(expense => {
                const expenseDate = new Date(expense.date);
                if (expenseDate.getMonth() === month && expenseDate.getFullYear() === year) {
                    const day = expenseDate.getDate();
                    // Simple week determination based on day of month
                    let weekIndex = Math.floor((day - 1) / 7);
                    // Cap at 3 for days after 28th
                    if (weekIndex > 3) weekIndex = 3;
                    weeksData[weekIndex].amount += expense.amount;
                }
            });

            setChartData(weeksData);
        } else {
            // Monthly view - show expenses for each month of the current year
            const monthlyData = [];
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

            // Initialize data for each month in the year
            for (let i = 0; i < 12; i++) {
                monthlyData.push({
                    month: monthNames[i],
                    amount: 0
                });
            }

            // Sum expenses for each month
            expenses.forEach(expense => {
                const expenseDate = new Date(expense.date);
                if (expenseDate.getFullYear() === year) {
                    monthlyData[expenseDate.getMonth()].amount += expense.amount;
                }
            });

            setChartData(monthlyData);
        }
    }, [viewMode, currentDate]);

    const handleViewModeChange = (e) => {
        setViewMode(e.target.value);
    };

    // Configure x-axis data key based on view mode
    const getXAxisDataKey = () => {
        if (viewMode === "daily") return "date";
        if (viewMode === "weekly") return "week";
        return "month";
    };

    useEffect(() => {
        prepareChartData();
    }, [prepareChartData]);

    return (
        <>
            <div className="lg:col-span-1">
                <div className="flex items-center justify-between px-4 pt-4 bg-white shadow-md rounded-t-lg">
                    <h1 className="text-xl font-semibold">Grafik Pengeluaran</h1>
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

                <div className="bg-white px-4 shadow-md">
                    <div className="flex justify-between items-center mb-4">
                        <button
                            onClick={goToPrevious}
                            className="p-2 rounded-full hover:bg-gray-100"
                        >
                            <ChevronLeft size={20} />
                        </button>

                        <h2 className="font-medium text-lg">{formatDisplayDate()}</h2>

                        <button
                            onClick={goToNext}
                            className="p-2 rounded-full hover:bg-gray-100"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                                data={chartData}
                                margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey={getXAxisDataKey()} />
                                <YAxis
                                    tickFormatter={(value) => `Rp ${(value / 1000).toLocaleString("id-ID")}k`}

                                />
                                {/* Untuk menampilkan informasi ketika cursor kearah titik chart */}
                                <Tooltip
                                    formatter={(value) => [`Rp ${value.toLocaleString()}`, "Pengeluaran"]}
                                    labelFormatter={(label) => {
                                        if (viewMode === "daily") return `Tanggal ${label}`;
                                        return label;
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="amount"
                                    stroke="#8884d8"
                                    activeDot={{ r: 8 }}
                                    name="Pengeluaran"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </>
    );
}

export default Chart;