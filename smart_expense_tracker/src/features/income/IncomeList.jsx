import usePagination from "../../hooks/usePagination.js"
import { Edit, Trash2 } from "lucide-react";

function IncomeList({ incomes, onDeleteIncome, handleEditIncome }) {
    const { currentPage, totalPages, currentData, changePage } = usePagination(
        incomes,
        10,
        (a, b) => new Date(b.date) - new Date(a.date)
    );

    const handleEdit = (income) => {
        handleEditIncome(income)
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    return (
        <>
            <div className="p-4 bg-white shadow-md mt-4 rounded-t-lg">
                <h1 className="text-xl font-semibold">Daftar Pemasukan</h1>
            </div>

            {/* Tampilan desktop table */}
            <div className="hidden md:block">
                <table className="min-w-full table-fixed">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">
                                Nama
                            </th>
                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                                Jumlah
                            </th>
                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                                Sumber
                            </th>
                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                                Catatan
                            </th>
                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                                Sisa Saldo
                            </th>
                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                                Tanggal
                            </th>
                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/8">
                                Aksi
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {currentData.length > 0 ? (
                            currentData
                                .map((income) => (
                                    <tr key={income._id}>
                                        <td className="py-3 px-4">
                                            <div className="max-w-xs truncate" title={income.name}>
                                                {income.name}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 whitespace-nowrap">
                                            <span className="text-green-600 font-semibold">
                                                Rp {income.amount.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 whitespace-nowrap">
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                {income.source}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="max-w-xs truncate text-gray-600" title={income.notes || '-'}>
                                                {income.notes || '-'}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 whitespace-nowrap">
                                            <span className="text-blue-600 font-semibold">
                                                Rp {income.remainingAmount?.toLocaleString() ?? "0"}
                                            </span>
                                        </td>

                                        <td className="py-3 px-4 whitespace-nowrap">
                                            {new Date(income.date).toLocaleDateString("id-ID", {
                                                day: "numeric",
                                                month: "long",
                                                year: "numeric",
                                            })}
                                        </td>
                                        <td className="py-3 px-4 whitespace-nowrap flex">
                                            <button onClick={() => handleEdit(income)} className="text-indigo-600 hover:text-indigo-900 mr-2 cursor-pointer">
                                                <Edit size={18} />
                                            </button>
                                            <button onClick={() => onDeleteIncome(income._id)} className="text-red-600 hover:text-red-900 cursor-pointer">
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="py-4 px-4 text-center text-gray-500">
                                    Belum ada data pemasukan
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Tampilan mobile card */}
            <div className="md:hidden">
                {currentData.length > 0 ? (
                    currentData.map((income) => (
                        <div key={income._id} className="bg-white p-4 mb-2 rounded-md shadow-sm border border-gray-200">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-medium text-gray-900">{income.name}</h3>
                                <div className="flex space-x-2">
                                    <button onClick={() => handleEdit(income)} className="text-indigo-600 hover:text-indigo-900">
                                        <Edit size={16} />
                                    </button>
                                    <button onClick={() => onDeleteIncome(income._id)} className="text-red-600 hover:text-red-900">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                    <p className="text-gray-500">Jumlah:</p>
                                    <p className="font-medium text-green-600">Rp {income.amount.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Sumber:</p>
                                    <span className="px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full bg-green-100 text-green-800">
                                        {income.source}
                                    </span>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-gray-500">Tanggal:</p>
                                    <p>{new Date(income.date).toLocaleDateString("id-ID", {
                                        day: "numeric",
                                        month: "long",
                                        year: "numeric"
                                    })}</p>
                                </div>
                                {income.notes && (
                                    <div className="col-span-2">
                                        <p className="text-gray-500">Catatan:</p>
                                        <p className="text-gray-700">{income.notes}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="py-4 px-4 text-center text-gray-500 bg-white">
                        Belum ada data pemasukan
                    </div>
                )}
            </div>

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
                    className="px-4 py-2 cursor-pointer text-sm text-gray-500 border border-gray-300 rounded-md hover:bg-gray-100 ml-4"
                >
                    Next
                </button>
            </div>
        </>
    );
}

export default IncomeList;