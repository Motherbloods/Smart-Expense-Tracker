import { useState } from "react";
import usePagination from "../../hooks/usePagination.js";
import {
  Edit,
  Trash2,
  AlertTriangle,
  X,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

function IncomeList({ incomes, onDeleteIncome, handleEditIncome }) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [incomeToDelete, setIncomeToDelete] = useState(null);

  const { currentPage, totalPages, currentData, changePage } = usePagination(
    incomes,
    10,
    (a, b) => new Date(b.date) - new Date(a.date),
  );

  const handleEdit = (income) => {
    handleEditIncome(income);
    window.scrollTo({ top: 600, behavior: "smooth" });
  };

  const handleDeleteClick = (income) => {
    setIncomeToDelete(income);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (incomeToDelete) onDeleteIncome(incomeToDelete._id);
    setShowDeleteModal(false);
    setIncomeToDelete(null);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setIncomeToDelete(null);
  };

  const DeleteConfirmationModal = () => {
    if (!showDeleteModal || !incomeToDelete) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm"
          onClick={cancelDelete}
        />
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
          <button
            onClick={cancelDelete}
            className="absolute top-4 right-4 w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <X size={14} className="text-gray-500" />
          </button>

          <div className="p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={22} className="text-red-500" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-2">
              Hapus Pemasukan?
            </h3>
            <p className="text-sm text-gray-500">
              Anda akan menghapus{" "}
              <span className="font-medium text-gray-800">
                "{incomeToDelete.name}"
              </span>{" "}
              senilai{" "}
              <span className="font-semibold text-emerald-600">
                Rp {incomeToDelete.amount.toLocaleString()}
              </span>
            </p>
            <p className="text-xs text-red-500 mt-2">
              Tindakan ini tidak dapat dibatalkan.
            </p>
          </div>

          <div className="px-6 pb-6 flex gap-3">
            <button
              onClick={cancelDelete}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={confirmDelete}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors"
            >
              Ya, Hapus
            </button>
          </div>
        </div>
      </div>
    );
  };

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4">
        <TrendingUp size={28} className="text-emerald-400" />
      </div>
      <p className="text-sm font-medium text-gray-700 mb-1">
        Belum ada data pemasukan
      </p>
      <p className="text-xs text-gray-400">
        Tambahkan pemasukan pertama Anda di atas
      </p>
    </div>
  );

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center">
              <TrendingUp size={16} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                Daftar Pemasukan
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {incomes.length} entri tercatat
              </p>
            </div>
          </div>
          {totalPages > 1 && (
            <span className="text-xs text-gray-400">
              Hal. {currentPage}/{totalPages}
            </span>
          )}
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block">
          {currentData.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/70">
                  {[
                    "Nama",
                    "Jumlah",
                    "Sumber",
                    "Catatan",
                    "Sisa Saldo",
                    "Tanggal",
                    "Aksi",
                  ].map((h) => (
                    <th
                      key={h}
                      className="py-3 px-5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider first:rounded-tl-none last:rounded-tr-none"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {currentData.map((income) => (
                  <tr
                    key={income._id}
                    className="hover:bg-gray-50/50 transition-colors group"
                  >
                    <td className="py-3.5 px-5">
                      <span
                        className="text-sm font-medium text-gray-800 max-w-[130px] truncate block"
                        title={income.name}
                      >
                        {income.name}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <span className="text-sm font-semibold text-emerald-600">
                        Rp {income.amount.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                        {income.source}
                      </span>
                    </td>
                    <td className="py-3.5 px-5">
                      <span
                        className="text-sm text-gray-400 max-w-[150px] truncate block"
                        title={income.notes || "-"}
                      >
                        {income.notes || (
                          <span className="text-gray-300">—</span>
                        )}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <span className="text-sm font-semibold text-blue-500">
                        Rp {income.remainingAmount?.toLocaleString() ?? "0"}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <span className="text-sm text-gray-500">
                        {new Date(income.date).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(income)}
                          className="w-7 h-7 rounded-lg bg-indigo-50 hover:bg-indigo-100 flex items-center justify-center transition-colors"
                          title="Edit"
                        >
                          <Edit size={13} className="text-indigo-600" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(income)}
                          className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors"
                          title="Hapus"
                        >
                          <Trash2 size={13} className="text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState />
          )}
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-gray-50">
          {currentData.length > 0 ? (
            currentData.map((income) => (
              <div
                key={income._id}
                className="p-4 hover:bg-gray-50/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      {income.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(income.date).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleEdit(income)}
                      className="w-7 h-7 rounded-lg bg-indigo-50 hover:bg-indigo-100 flex items-center justify-center"
                    >
                      <Edit size={13} className="text-indigo-600" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(income)}
                      className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center"
                    >
                      <Trash2 size={13} className="text-red-500" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Jumlah</p>
                    <p className="text-sm font-semibold text-emerald-600">
                      Rp {income.amount.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Sisa Saldo</p>
                    <p className="text-sm font-semibold text-blue-500">
                      Rp {income.remainingAmount?.toLocaleString() ?? "0"}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-400 mb-1">Sumber</p>
                    <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                      {income.source}
                    </span>
                  </div>
                  {income.notes && (
                    <div className="col-span-2">
                      <p className="text-xs text-gray-400 mb-0.5">Catatan</p>
                      <p className="text-sm text-gray-600">{income.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <EmptyState />
          )}
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <button
              onClick={() => changePage(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={14} /> Sebelumnya
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => changePage(page)}
                    className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${
                      page === currentPage
                        ? "bg-emerald-500 text-white"
                        : "text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    {page}
                  </button>
                ),
              )}
            </div>
            <button
              onClick={() => changePage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Berikutnya <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      <DeleteConfirmationModal />
    </>
  );
}

export default IncomeList;
