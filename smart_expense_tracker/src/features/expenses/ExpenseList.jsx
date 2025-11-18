import { useState } from "react";
import usePagination from "../../hooks/usePagination.js"
import { Edit, Trash2, AlertTriangle, X } from "lucide-react";

function ExpenseList({ expenses, onDeleteExpense, handleEditExpense }) {
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [expenseToDelete, setExpenseToDelete] = useState(null);

    const { currentPage, totalPages, currentData, changePage } = usePagination(
        expenses,
        10,
        (a, b) => new Date(b.date) - new Date(a.date)
    );

    const handleEdit = (expense) => {
        handleEditExpense(expense)
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    const handleDeleteClick = (expense) => {
        setExpenseToDelete(expense);
        setShowDeleteModal(true);
    }

    const confirmDelete = () => {
        if (expenseToDelete) {
            onDeleteExpense(expenseToDelete._id);
        }
        setShowDeleteModal(false);
        setExpenseToDelete(null);
    }

    const cancelDelete = () => {
        setShowDeleteModal(false);
        setExpenseToDelete(null);
    }

    // Delete Confirmation Modal Component
    const DeleteConfirmationModal = () => {
        if (!showDeleteModal || !expenseToDelete) return null;

        return (
            <div className="fixed inset-0 z-50 overflow-y-auto">
                {/* Backdrop */}
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm
             transition-opacity duration-300 ease-in-out 
             animate-fadeIn"
                    onClick={cancelDelete}
                ></div>

                {/* Modal */}
                <div className="flex min-h-full items-center justify-center p-4">
                    <div className="relative transform overflow-hidden rounded-xl bg-white shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md">
                        {/* Close button */}
                        <button
                            onClick={cancelDelete}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X size={20} />
                        </button>

                        {/* Modal content */}
                        <div className="bg-white px-6 pt-6 pb-4">
                            <div className="flex items-center">
                                <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
                                    <AlertTriangle className="h-6 w-6 text-red-600" />
                                </div>
                            </div>

                            <div className="mt-4 text-center">
                                <h3 className="text-lg font-semibold leading-6 text-gray-900">
                                    Hapus Pengeluaran
                                </h3>
                                <div className="mt-3">
                                    <p className="text-sm text-gray-600">
                                        Apakah Anda yakin ingin menghapus pengeluaran{' '}
                                        <span className="font-semibold text-gray-900">
                                            "{expenseToDelete.name}"
                                        </span>{' '}
                                        sebesar{' '}
                                        <span className="font-semibold text-gray-900">
                                            Rp {expenseToDelete.amount.toLocaleString()}
                                        </span>?
                                    </p>
                                    <p className="text-xs text-red-600 mt-2">
                                        Tindakan ini tidak dapat dibatalkan.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="bg-gray-50 px-6 py-4 flex flex-col-reverse sm:flex-row sm:gap-3">
                            <button
                                type="button"
                                className="mt-3 sm:mt-0 inline-flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
                                onClick={cancelDelete}
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                className="inline-flex w-full justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                                onClick={confirmDelete}
                            >
                                Ya, Hapus
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            <div className="p-4 bg-white shadow-md mt-4 rounded-t-lg">
                <h1 className="text-xl font-semibold">Daftar Pengeluaran</h1>
            </div>

            {/* Tampilan desktop table */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Nama
                            </th>
                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Jumlah
                            </th>
                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Kategori
                            </th>
                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Sumber Pemasukan
                            </th>
                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Tanggal
                            </th>
                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Aksi
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {currentData.length > 0 ? (
                            currentData
                                .map((expense) => (
                                    <tr key={expense._id}>
                                        <td className="py-3 px-4">
                                            <div className="max-w-[150px] truncate" title={expense.name}>
                                                {expense.name}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 whitespace-nowrap">
                                            <span className="font-medium">
                                                Rp {expense.amount.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 whitespace-nowrap">
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                {expense.category}
                                            </span>
                                        </td>

                                        <td className="py-3 px-4 whitespace-nowrap">
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                {expense.incomeId ? expense.incomeId.name : 'Tidak ada sumber'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 whitespace-nowrap">
                                            {new Date(expense.date).toLocaleDateString("id-ID", {
                                                day: "numeric",
                                                month: "long",
                                                year: "numeric",
                                            })}
                                        </td>
                                        <td className="py-3 px-4 whitespace-nowrap">
                                            <div className="flex gap-2">
                                                <button onClick={() => handleEdit(expense)} className="text-indigo-600 hover:text-indigo-900 cursor-pointer">
                                                    <Edit size={18} />
                                                </button>
                                                <button onClick={() => handleDeleteClick(expense)} className="text-red-600 hover:text-red-900 cursor-pointer">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="py-4 px-4 text-center text-gray-500">
                                    Belum ada data pengeluaran
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Tampilan mobile card */}
            <div className="md:hidden">
                {currentData.length > 0 ? (
                    currentData.map((expense) => (
                        <div key={expense._id} className="bg-white p-4 mb-2 rounded-md shadow-sm border border-gray-200">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-medium text-gray-900">{expense.name}</h3>
                                <div className="flex space-x-2">
                                    <button onClick={() => handleEdit(expense)} className="text-indigo-600 hover:text-indigo-900">
                                        <Edit size={16} />
                                    </button>
                                    <button onClick={() => handleDeleteClick(expense)} className="text-red-600 hover:text-red-900">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                    <p className="text-gray-500">Jumlah:</p>
                                    <p className="font-medium">Rp {expense.amount.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Kategori:</p>
                                    <span className="px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full bg-blue-100 text-blue-800">
                                        {expense.category}
                                    </span>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-gray-500">Tanggal:</p>
                                    <p>{new Date(expense.date).toLocaleDateString("id-ID", {
                                        day: "numeric",
                                        month: "long",
                                        year: "numeric"
                                    })}</p>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="py-4 px-4 text-center text-gray-500 bg-white">
                        Belum ada data pengeluaran
                    </div>
                )}
            </div>

            <div className="flex justify-center items-center py-4 mx-auto">
                <button
                    onClick={() => changePage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 cursor-pointer text-sm text-gray-500 border border-gray-300 rounded-md hover:bg-gray-100 mr-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Previous
                </button>
                <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                </span>
                <button
                    onClick={() => changePage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 cursor-pointer text-sm text-gray-500 border border-gray-300 rounded-md hover:bg-gray-100 ml-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Next
                </button>
            </div>

            {/* Delete Confirmation Modal */}
            <DeleteConfirmationModal />
        </>
    );
}

export default ExpenseList;