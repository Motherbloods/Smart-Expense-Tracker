import { useCallback, useEffect, useState } from "react";
import Card from "../components/card/Card";
import CategoryBreakdown from "../components/categoryBreakdown/CategoryBreakdown";
import Chart from "../components/chart/Chart";
import ExpenseForm from "../features/expenses/ExpenseForm";
import ExpenseList from "../features/expenses/ExpenseList";
import BudgetModal from "../components/budgetModal/BudgetModal";
import { createExpense, deleteExpense, editExpense, getExpenses } from "../api/expenseService";
import { getUserData } from "../api/loginService";
import Pusher from 'pusher-js';

function Dashboard() {
    const [showBudgetModal, setShowBudgetModal] = useState(false);
    const [monthlyBudget, setMonthlyBudget] = useState(0);
    const [originalMonthlyBudget, setOriginalMonthlyBudget] = useState(0);
    const [expenses, setExpenses] = useState([]);
    const [expenseEdit, setExpenseEdit] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [lastRefreshTime, setLastRefreshTime] = useState(Date.now());
    const telegramId = localStorage.getItem("telegramId");

    const totalExpenses = expenses.reduce(
        (sum, expense) => sum + Number(expense.amount),
        0
    );
    const remainingBudget =
        monthlyBudget - totalExpenses > 0 ? monthlyBudget - totalExpenses : 0;

    const onAddExpense = async (newExpense) => {
        try {
            setIsLoading(true);
            const response = await createExpense(newExpense);

            if (response.data && response.data.data) {
                // Use the returned expense from the API which should include the ID
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

    const fetchData = useCallback(async () => {
        if (isLoading) return;

        try {
            setIsLoading(true);
            const expenseResponse = await getExpenses();
            setExpenses(expenseResponse.data.data);

            const userResponse = await getUserData(telegramId);
            setMonthlyBudget(userResponse.data.data.budgetMontly);

            setLastRefreshTime(Date.now());
        } catch (error) {
            console.error("Error fetching data", error);
        } finally {
            setIsLoading(false);
        }
    }, [telegramId]); // Tambahkan semua dependency yang dipakai di dalam fetchData


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
                // Refresh if more than 5 minutes have passed since last refresh
                const timeSinceLastRefresh = Date.now() - lastRefreshTime;
                if (timeSinceLastRefresh > 5 * 60 * 1000) {
                    console.log('App became visible after period of inactivity, refreshing data...');
                    fetchData();
                }
            }
        };

        // Add visibility change listener
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Also refresh data when window is focused again
        const handleFocus = () => {
            const timeSinceLastRefresh = Date.now() - lastRefreshTime;
            if (timeSinceLastRefresh > 5 * 60 * 1000) {
                console.log('Window focused after period of inactivity, refreshing data...');
                fetchData();
            }
        };

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

        channel.bind(import.meta.env.VITE_PUSHER_BIND, (data) => {
            if (data && data.expense && data.telegramId === telegramId) {
                console.log('Expense data:', data.expense);
                const newExpense = {
                    _id: data.expense._id || `temp-${Date.now()}`,
                    name: data.expense.name,
                    amount: data.expense.amount,
                    category: data.expense.category,
                    date: data.expense.date,
                    telegramId: data.telegramId
                };

                // Avoid duplicate entries by checking if expense with same ID already exists
                setExpenses(prev => {
                    // Check if expense already exists in the array
                    const exists = prev.some(exp => exp._id === newExpense._id);
                    if (!exists) {
                        return [newExpense, ...prev];
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
                    title={"Total Pengeluaran"}
                    value={`Rp ${totalExpenses.toLocaleString("id-ID")}`}
                    textColor={"text-blue-500"}
                />
                <Card
                    title={"Sisa Budget"}
                    value={`Rp ${remainingBudget.toLocaleString("id-ID")}`}
                    textColor={"text-blue-500"}
                />
            </div>
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
            <Chart expenses={expenses} />
            <CategoryBreakdown expenses={expenses} />
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