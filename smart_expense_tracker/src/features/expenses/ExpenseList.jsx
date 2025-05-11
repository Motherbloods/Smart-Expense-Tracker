import usePagination from "../../hooks/usePagination.js"
import { Edit, Trash2 } from "lucide-react";

function ExpenseList({ expenses, onDeleteExpense, handleEditExpense }) {
    const { currentPage, totalPages, currentData, changePage } = usePagination(
        expenses,
        10,
        (a, b) => new Date(b.date) - new Date(a.date)
    );

    const handleEdit = (expense) => {
        handleEditExpense(expense)
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    return (
        <>
            <div className="p-4 bg-white shadow-md mt-4 rounded-t-lg ">
                <h1 className="text-xl font-semibold">Daftar Pengeluaran</h1>
            </div>
            <div>
                <table className="min-w-full table-fixed">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                                Nama
                            </th>
                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                                Jumlah
                            </th>
                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                                Kategori
                            </th>
                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">
                                Tanggal
                            </th>
                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                                Aksi
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {currentData.length > 0 ? (
                            currentData
                                .map((expense) => (
                                    <tr key={expense._id}>
                                        <td className="py-3 px-4 whitespace-nowrap">
                                            {expense.name}
                                        </td>
                                        <td className="py-3 px-4 whitespace-nowrap">
                                            Rp {expense.amount.toLocaleString()}
                                        </td>
                                        <td className="py-3 px-4 whitespace-nowrap">
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                {expense.category}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 whitespace-nowrap">
                                            {new Date(expense.date).toLocaleDateString("id-ID", {
                                                day: "numeric",
                                                month: "long",
                                                year: "numeric",
                                            })}
                                        </td>
                                        <td className="py-3 px-4 whitespace-nowrap flex">
                                            <button onClick={() => handleEdit(expense)} className="text-indigo-600 hover:text-indigo-900 mr-2 cursor-pointer">
                                                <Edit size={18} />
                                            </button>
                                            <button onClick={() => onDeleteExpense(expense._id)} className="text-red-600 hover:text-red-900 cursor-pointer">
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="py-4 px-4 text-center text-gray-500">
                                    Belum ada data pengeluaran
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
                <div className="flex justify-center items-center py-4 mx-auto">
                    <button
                        onClick={() => changePage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-4 py-2 cursor-pointer text-sm text-gray-500 border border-gray-300 rounded-md hover:bg-gray-100 mr-4"
                    >
                        Previous
                    </button>
                    <span className="text-sm text-gray-600">
                        Page {currentPage} of {totalPages}
                    </span>

                    <button
                        onClick={() => changePage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 cursor-pointer text-sm text-gray-500 border border-gray-300 rounded-md hover:bg-gray-100"
                    >
                        Next
                    </button>
                </div>
            </div>
        </>
    );
}

export default ExpenseList;
