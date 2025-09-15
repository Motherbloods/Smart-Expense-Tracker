import { useCallback, useEffect, useState } from "react";
import Card from "../components/card/Card";
import CategoryBreakdown from "../components/categoryBreakdown/CategoryBreakdown";
import Chart from "../components/chart/Chart";
import ExpenseForm from "../features/expenses/ExpenseForm";
import ExpenseList from "../features/expenses/ExpenseList";
import IncomeForm from "../features/income/IncomeForm"; // Import komponen baru
import IncomeList from "../features/income/IncomeList"; // Import komponen baru
import BudgetModal from "../components/budgetModal/BudgetModal";
import { createExpense, deleteExpense, editExpense, getExpenses } from "../api/expenseService";
import { createIncome, deleteIncome, editIncome, getIncomes } from "../api/incomeService"; // Import API untuk income
import { getUserData } from "../api/loginService";
import Pusher from 'pusher-js';
import { toast } from "react-toastify";

function Dashboard() {
    const [showBudgetModal, setShowBudgetModal] = useState(false);
    const [monthlyBudget, setMonthlyBudget] = useState(0);
    const [originalMonthlyBudget, setOriginalMonthlyBudget] = useState(0);
    const [expenses, setExpenses] = useState([]);
    const [incomes, setIncomes] = useState([]); // State untuk incomes
    const [expenseEdit, setExpenseEdit] = useState(null);
    const [incomeEdit, setIncomeEdit] = useState(null); // State untuk edit income
    const [isLoading, setIsLoading] = useState(false);
    const [isExpense, setIsExpense] = useState(true); // State untuk toggle mode
    const [lastRefreshTime, setLastRefreshTime] = useState(Date.now());
    const telegramId = localStorage.getItem("telegramId");

    // Kalkulasi untuk expenses
    const totalExpenses = expenses.reduce(
        (sum, expense) => sum + Number(expense.amount),
        0
    );

    // Kalkulasi untuk incomes
    const totalIncomes = incomes.reduce(
        (sum, income) => sum + Number(income.amount),
        0
    );
    const netIncome = totalIncomes - totalExpenses;

    // Expense handlers
    const onAddExpense = async (newExpense) => {
        try {
            setIsLoading(true);
            const response = await createExpense(newExpense);

            if (response.data && response.data.data) {
                setExpenses((prev) => [response.data.data, ...prev]);
            } else {
                throw new Error("Invalid response format from server");
            }
        } catch (error) {
            console.error("Error adding expense:", error);
            alert("Gagal menambahkan pengeluaran. Silakan coba lagi.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateExpense = async (updatedExpense) => {
        console.log(updatedExpense)
        try {
            setIsLoading(true);
            const { id, ...expenseData } = updatedExpense;
            const response = await editExpense(expenseData, id);

            if (response.data && response.data.data) {
                setExpenses((prev) =>
                    prev.map((expense) =>
                        expense._id === id ? response.data.data : expense
                    )
                );
            } else {
                throw new Error("Invalid response format from server");
            }
        } catch (error) {
            console.error("Error updating expense:", error);
            alert("Gagal memperbarui pengeluaran. Silakan coba lagi.");
        } finally {
            setIsLoading(false);
        }
    };

    const onDeleteExpense = async (id) => {
        try {
            setIsLoading(true);
            await deleteExpense(id);
            setExpenses((prev) => prev.filter((expense) => expense._id !== id));
        } catch (error) {
            console.error("Error deleting expense:", error);
            alert("Gagal menghapus pengeluaran. Silakan coba lagi.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditExpense = (expense) => {
        setExpenseEdit(expense);
    };

    // Income handlers
    const onAddIncome = async (newIncome) => {
        try {
            setIsLoading(true);
            const response = await createIncome(newIncome);

            if (response.data && response.data.data) {
                setIncomes((prev) => [response.data.data, ...prev]);
            } else {
                throw new Error("Invalid response format from server");
            }
        } catch (error) {
            console.error("Error adding income:", error);
            alert("Gagal menambahkan pemasukan. Silakan coba lagi.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateIncome = async (updatedIncome) => {
        try {
            setIsLoading(true);
            const { id, ...incomeData } = updatedIncome;
            const response = await editIncome(incomeData, id);

            if (response.data && response.data.data) {
                setIncomes((prev) =>
                    prev.map((income) =>
                        income._id === id ? response.data.data : income
                    )
                );
            } else {
                throw new Error("Invalid response format from server");
            }
        } catch (error) {
            console.error("Error updating income:", error);
            alert("Gagal memperbarui pemasukan. Silakan coba lagi.");
        } finally {
            setIsLoading(false);
        }
    };

    const onDeleteIncome = async (id) => {
        try {
            setIsLoading(true);
            const response = await deleteIncome(id);

            if (response.data && response.data.success) {
                setIncomes((prev) => prev.filter((income) => income._id !== id));
                toast.success("Pemasukan berhasil dihapus");
            }
        } catch (error) {
            console.error("Error deleting income:", error);
            if (error.response?.data?.message) {
                toast.error(error.response.data.message);
            } else {
                toast.error("Gagal menghapus pemasukan. Silakan coba lagi.");
            }
        } finally {
            setIsLoading(false);
        }
    };



    const handleEditIncome = (income) => {
        setIncomeEdit(income);
    };

    // Toggle handlers
    const handleToggleToExpense = () => {
        setIsExpense(true);
        setExpenseEdit(null);
        setIncomeEdit(null);
    };

    const handleToggleToIncome = () => {
        setIsExpense(false);
        setExpenseEdit(null);
        setIncomeEdit(null);
    };

    const fetchData = useCallback(async () => {
        if (isLoading) return;

        try {
            setIsLoading(true);

            // Fetch expenses dan incomes
            const [expenseResponse, incomeResponse, userResponse] = await Promise.all([
                getExpenses(),
                getIncomes(),
                getUserData(telegramId)
            ]);

            setExpenses(expenseResponse.data.data);
            setIncomes(incomeResponse.data.data);
            setMonthlyBudget(userResponse.data.data.budgetMontly);

            setLastRefreshTime(Date.now());
        } catch (error) {
            console.error("Error fetching data", error);
        } finally {
            setIsLoading(false);
        }
    }, [telegramId]);

    // Fetch data on component mount
    useEffect(() => {
        if (telegramId) {
            fetchData();
        }
    }, [telegramId, fetchData]);

    // Refresh data when app visibility changes
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                const timeSinceLastRefresh = Date.now() - lastRefreshTime;
                if (timeSinceLastRefresh > 5 * 60 * 1000) {
                    console.log('App became visible after period of inactivity, refreshing data...');
                    fetchData();
                }
            }
        };

        const handleFocus = () => {
            const timeSinceLastRefresh = Date.now() - lastRefreshTime;
            if (timeSinceLastRefresh > 5 * 60 * 1000) {
                console.log('Window focused after period of inactivity, refreshing data...');
                fetchData();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleFocus);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
        };
    }, [lastRefreshTime, fetchData]);

    useEffect(() => {
        const pusher = new Pusher(import.meta.env.VITE_PUSHER_KEY, {
            cluster: import.meta.env.VITE_PUSHER_CLUSTER,
        });

        const channel = pusher.subscribe(import.meta.env.VITE_PUSHER_SUBSCRIBE);

        // Handler untuk expense
        channel.bind(import.meta.env.VITE_PUSHER_BIND, (data) => {
            if (data && data.expense && data.telegramId === telegramId) {
                const newExpense = {
                    _id: data.expense._id || `temp-${Date.now()}`,
                    name: data.expense.name,
                    amount: data.expense.amount,
                    category: data.expense.category,
                    date: data.expense.date,
                    telegramId: data.telegramId
                };

                setExpenses(prev => {
                    const exists = prev.some(exp => exp._id === newExpense._id);
                    if (!exists) {
                        return [newExpense, ...prev];
                    }
                    return prev;
                });
            }
        });

        // Handler untuk income (jika ada pusher untuk income)
        channel.bind('income-added', (data) => {
            if (data && data.income && data.telegramId === telegramId) {
                const newIncome = {
                    _id: data.income._id || `temp-${Date.now()}`,
                    name: data.income.name,
                    amount: data.income.amount,
                    source: data.income.source,
                    notes: data.income.notes,
                    date: data.income.date,
                    telegramId: data.telegramId
                };

                setIncomes(prev => {
                    const exists = prev.some(inc => inc._id === newIncome._id);
                    if (!exists) {
                        return [newIncome, ...prev];
                    }
                    return prev;
                });
            }
        });

        return () => {
            channel.unbind_all();
            channel.unsubscribe();
        };
    }, [telegramId]);

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
            <div className="flex justify-between items-center">
                <h2 className="text-4xl font-bold text-blue-500">Expense Tracker</h2>
                <div className="flex gap-2">
                    <button
                        onClick={fetchData}
                        className="px-4 py-2 bg-green-500 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-opacity-50 cursor-pointer text-white text-sm rounded-lg font-semibold transition-colors duration-300 ease-in-out"
                        disabled={isLoading}
                    >
                        {isLoading ? "Loading..." : "Refresh Data"}
                    </button>
                    <button
                        onClick={() => { setOriginalMonthlyBudget(monthlyBudget); setShowBudgetModal(true) }}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-opacity-50 cursor-pointer text-white text-sm rounded-lg font-semibold transition-colors duration-300 ease-in-out"
                    >
                        Set Budget Bulanan
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
                <Card
                    title={"Budget Bulanan"}
                    value={`Rp ${monthlyBudget.toLocaleString("id-ID")}`}
                    textColor={"text-blue-500"}
                />
                <Card
                    title={"Total Pemasukan"}
                    value={`Rp ${totalIncomes.toLocaleString("id-ID")}`}
                    textColor={"text-green-500"}
                />
                <Card
                    title={"Total Pengeluaran"}
                    value={`Rp ${totalExpenses.toLocaleString("id-ID")}`}
                    textColor={"text-red-500"}
                />
            </div>

            {/* Toggle Buttons */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={handleToggleToExpense}
                    className={`px-6 py-2 rounded-lg font-semibold transition-colors duration-300 ${isExpense
                        ? "bg-red-500 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                >
                    Pengeluaran
                </button>
                <button
                    onClick={handleToggleToIncome}
                    className={`px-6 py-2 rounded-lg font-semibold transition-colors duration-300 ${!isExpense
                        ? "bg-green-500 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                >
                    Pemasukan
                </button>
            </div>

            {/* Conditional Rendering Based on Toggle */}
            {isExpense ? (
                <>
                    <ExpenseForm
                        onAddExpense={onAddExpense}
                        expensesData={expenses}
                        onUpdateExpense={handleUpdateExpense}
                        expenseEdit={expenseEdit}
                        setExpenseEdit={setExpenseEdit}
                        isLoading={isLoading}
                    />
                    <ExpenseList
                        expenses={expenses}
                        onDeleteExpense={onDeleteExpense}
                        handleEditExpense={handleEditExpense}
                    />
                </>
            ) : (
                <>
                    <IncomeForm
                        onAddIncome={onAddIncome}
                        incomesData={incomes}
                        onUpdateIncome={handleUpdateIncome}
                        incomeEdit={incomeEdit}
                        setIncomeEdit={setIncomeEdit}
                        isLoading={isLoading}
                    />
                    <IncomeList
                        incomes={incomes}
                        onDeleteIncome={onDeleteIncome}
                        handleEditIncome={handleEditIncome}
                    />
                </>
            )}
            {/* Chart and Category Breakdown - Show for expenses only */}
            {isExpense && (
                <>
                    <Chart expenses={expenses} />
                    <CategoryBreakdown expenses={expenses} />
                </>
            )}
            {showBudgetModal && (
                <BudgetModal
                    telegramId={telegramId}
                    setShowBudgetModal={setShowBudgetModal}
                    setMonthlyBudget={setMonthlyBudget}
                    monthlyBudget={monthlyBudget}
                    originalMonthlyBudget={originalMonthlyBudget}
                />
            )}
        </div>
    );
}

export default Dashboard;