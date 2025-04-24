import Card from "../components/card/Card";
import CategoryBreakdown from "../components/categoryBreakdown/CategoryBreakdown";
import Chart from "../components/chart/Chart";
import ExpenseForm from "../features/expenses/ExpenseForm";
import ExpenseList from "../features/expenses/ExpenseList";
function Dashboard() {
    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
            <div className="flex justify-between items-center">
                <h2 className="text-4xl font-bold text-blue-500">Expense Tracker</h2>
                <button className="px-6 py-3 bg-blue-500 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-opacity-50 cursor-pointer text-white text-sm rounded-lg font-semibold transition-colors duration-300 ease-in-out ">
                    Set Budget Bulanan
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
                <Card
                    title={"Budget Bulanan"}
                    value={"Rp. 2.000.000"}
                    textColor={"text-blue-500"}
                />
                <Card
                    title={"Total Pengeluaran"}
                    value={"Rp. 2.000.000"}
                    textColor={"text-blue-500"}
                />
                <Card
                    title={"Sisa Budget"}
                    value={"Rp. 2.000.000"}
                    textColor={"text-blue-500"}
                />
            </div>
            <ExpenseForm />
            <ExpenseList />
            <Chart />
            <CategoryBreakdown />
        </div>
    );
}

export default Dashboard;
