import expenses from "../../dummy/expenses";
import { Edit, Trash2 } from 'lucide-react'

function ExpenseList() {
    return (
        <>
            <div className="p-4 bg-white shadow-md mt-4 rounded-t-lg ">
                <h1 className="text-xl font-semibold">Daftar Pengeluaran</h1>
            </div>
            <div>
                <table className="min-w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jumlah</th>
                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kategori</th>
                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {expenses.length > 0 ? (
                            expenses.sort((a, b) => new Date(b.date) - new Date(a.date)).map(expense => (
                                <tr key={expense.id}>
                                    <td className="py-3 px-4 whitespace-nowrap">{expense.name}</td>
                                    <td className="py-3 px-4 whitespace-nowrap">Rp {expense.amount.toLocaleString()}</td>
                                    <td className="py-3 px-4 whitespace-nowrap">
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                            {expense.category}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 whitespace-nowrap">{expense.date}</td>
                                    <td className="py-3 px-4 whitespace-nowrap flex">
                                        <button

                                            className="text-indigo-600 hover:text-indigo-900 mr-2 cursor-pointer"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button

                                            className="text-red-600 hover:text-red-900 cursor-pointer"
                                        >
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
            </div>
        </>
    );
}

export default ExpenseList;
