import { useState } from "react";
import expenses from "../../dummy/expenses";
import { Edit, Trash2 } from "lucide-react";

function ExpenseList() {
    const itemsPerPage = 10;
    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = Math.ceil(expenses.length / itemsPerPage);

    const currentData = expenses.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const changePage = (page) => {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
    };

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
                                .sort((a, b) => new Date(b.date) - new Date(a.date))
                                .map((expense) => (
                                    <tr key={expense.id}>
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
                                            {expense.date}
                                        </td>
                                        <td className="py-3 px-4 whitespace-nowrap flex">
                                            <button className="text-indigo-600 hover:text-indigo-900 mr-2 cursor-pointer">
                                                <Edit size={18} />
                                            </button>
                                            <button className="text-red-600 hover:text-red-900 cursor-pointer">
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
