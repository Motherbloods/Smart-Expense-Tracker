import { useState } from "react";
import Card from "../components/card/Card";
import CategoryBreakdown from "../components/categoryBreakdown/CategoryBreakdown";
import Chart from "../components/chart/Chart";
import ExpenseForm from "../features/expenses/ExpenseForm";
import ExpenseList from "../features/expenses/ExpenseList";
import BudgetModal from "../components/budgetModal/BudgetModal";
import expensesData from "../dummy/expenses";
import useLocalStorage from "../hooks/useLocalStorage";

function Dashboard() {
    const [showBudgetModal, setShowBudgetModal] = useState(false);
    const [monthlyBudget, setMonthlyBudget] = useLocalStorage("monthlyBudget", 0);
    const [expenses, setExpenses] = useLocalStorage("expenses", expensesData);
    const [expenseEdit, setExpenseEdit] = useState(null);
    console.log('ads', expenseEdit)

    const totalExpenses = expenses.reduce(
        (sum, expense) => sum + Number(expense.amount),
        0
    );
    const remainingBudget =
        monthlyBudget - totalExpenses > 0 ? monthlyBudget - totalExpenses : 0;
    const onAddExpense = (newExpense) => {
        setExpenses((prev) => [...prev, newExpense]);
    };

    const handleUpdateExpense = (updatedExpense) => {
        setExpenses((prev) =>
            prev.map((expense) =>
                expense.id === updatedExpense.id ? updatedExpense : expense
            )
        );
    };

    const onDeleteExpense = (id) => {
        setExpenses((prev) => prev.filter((expense) => expense.id !== id));
    };

    const handleEditExpense = (expense) => {
        setExpenseEdit(expense);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
            <div className="flex justify-between items-center">
                <h2 className="text-4xl font-bold text-blue-500">Expense Tracker</h2>
                <button
                    onClick={() => setShowBudgetModal(true)}
                    className="px-6 py-3 bg-blue-500 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-opacity-50 cursor-pointer text-white text-sm rounded-lg font-semibold transition-colors duration-300 ease-in-out "
                >
                    Set Budget Bulanan
                </button>
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
                    setShowBudgetModal={setShowBudgetModal}
                    setMonthlyBudget={setMonthlyBudget}
                    monthlyBudget={monthlyBudget}
                />
            )}
        </div>
    );
}

export default Dashboard;
