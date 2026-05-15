import { useState, useCallback } from "react";
import {
  Edit,
  Trash2,
  AlertTriangle,
  X,
  Eye,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

function ExpenseList({ expenses = [], onDeleteExpense, handleEditExpense }) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const totalPages = Math.max(1, Math.ceil(expenses.length / itemsPerPage));
  const startIdx = (currentPage - 1) * itemsPerPage;
  const currentData = expenses.slice(startIdx, startIdx + itemsPerPage);

  const handleEdit = useCallback(
    (expense) => {
      handleEditExpense(expense);
      window.scrollTo({ top: 600, behavior: "smooth" });
    },
    [handleEditExpense],
  );

  const handleViewDetail = useCallback((expense) => {
    setSelectedExpense(expense);
    setShowDetailModal(true);
  }, []);

  const handleDeleteClick = useCallback((expense) => {
    setExpenseToDelete(expense);
    setShowDeleteModal(true);
  }, []);

  const confirmDelete = useCallback(() => {
    if (expenseToDelete) onDeleteExpense(expenseToDelete._id);
    setShowDeleteModal(false);
    setExpenseToDelete(null);
  }, [expenseToDelete, onDeleteExpense]);

  const cancelDelete = useCallback(() => {
    setShowDeleteModal(false);
    setExpenseToDelete(null);
  }, []);

  const closeDetailModal = useCallback(() => {
    setShowDetailModal(false);
    setSelectedExpense(null);
  }, []);

  const getSourceIncomeName = (expense) => {
    if (expense.sourceIncomeName) return expense.sourceIncomeName;
    if (expense.incomeId && typeof expense.incomeId === "object")
      return expense.incomeId.name || "Tidak ada sumber";
    if (expense.incomeId && typeof expense.incomeId === "string")
      return "Income ID: " + expense.incomeId.substring(0, 8) + "...";
    return "Tidak ada sumber";
  };

  const getConfidenceDisplay = (confidence) => {
    const conf =
      confidence !== undefined && confidence !== null ? confidence : 1;
    return (conf * 100).toFixed(1);
  };

  const getConfidenceBadgeColor = (confidence) => {
    const conf =
      confidence !== undefined && confidence !== null ? confidence : 1;
    if (conf >= 0.9) return "bg-emerald-50 text-emerald-700 border-emerald-100";
    if (conf >= 0.8) return "bg-blue-50 text-blue-700 border-blue-100";
    if (conf >= 0.7) return "bg-amber-50 text-amber-700 border-amber-100";
    return "bg-red-50 text-red-700 border-red-100";
  };

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
        <TrendingDown size={28} className="text-blue-400" />
      </div>
      <p className="text-sm font-medium text-gray-700 mb-1">
        Belum ada data pengeluaran
      </p>
      <p className="text-xs text-gray-400">
        Tambahkan pengeluaran pertama Anda di atas
      </p>
    </div>
  );

  const DeleteConfirmationModal = () => {
    if (!showDeleteModal || !expenseToDelete) return null;
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
              Hapus Pengeluaran?
            </h3>
            <p className="text-sm text-gray-500">
              Anda akan menghapus{" "}
              <span className="font-medium text-gray-800">
                "{expenseToDelete.name}"
              </span>{" "}
              senilai{" "}
              <span className="font-semibold text-blue-600">
                Rp {expenseToDelete.amount.toLocaleString()}
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

  const DetailModal = () => {
    if (!showDetailModal || !selectedExpense) return null;
    const conf =
      selectedExpense.confidence !== undefined &&
      selectedExpense.confidence !== null
        ? selectedExpense.confidence
        : 1;
    const confPct = (conf * 100).toFixed(1);
    const confWidth = Math.min(100, parseFloat(confPct));

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm"
          onClick={closeDetailModal}
        />
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">
              Detail Pengeluaran
            </h3>
            <button
              onClick={closeDetailModal}
              className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <X size={14} className="text-gray-500" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <p className="text-xs text-gray-400 mb-1 uppercase font-semibold tracking-wide">
                Nama
              </p>
              <p className="text-sm font-semibold text-gray-900">
                {selectedExpense.name}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400 mb-1 uppercase font-semibold tracking-wide">
                  Jumlah
                </p>
                <p className="text-sm font-bold text-blue-600">
                  Rp {selectedExpense.amount.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1 uppercase font-semibold tracking-wide">
                  Tanggal
                </p>
                <p className="text-sm text-gray-700">
                  {new Date(selectedExpense.date).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400 mb-2 uppercase font-semibold tracking-wide">
                  Kategori
                </p>
                <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                  {selectedExpense.category}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-2 uppercase font-semibold tracking-wide">
                  Sumber
                </p>
                <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                  {getSourceIncomeName(selectedExpense)}
                </span>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">
                  Confidence
                </p>
                <span
                  className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${getConfidenceBadgeColor(selectedExpense.confidence)}`}
                >
                  {confPct}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all ${conf >= 0.9 ? "bg-emerald-500" : conf >= 0.8 ? "bg-blue-500" : conf >= 0.7 ? "bg-amber-500" : "bg-red-500"}`}
                  style={{ width: `${confWidth}%` }}
                />
              </div>
            </div>
          </div>

          <div className="px-6 pb-6">
            <button
              onClick={closeDetailModal}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
              <TrendingDown size={16} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                Daftar Pengeluaran
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {expenses.length} entri tercatat
              </p>
            </div>
          </div>
          {totalPages > 1 && (
            <span className="text-xs text-gray-400">
              Hal. {currentPage}/{totalPages}
            </span>
          )}
        </div>

        <div className="hidden md:block">
          {currentData.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/70">
                  {[
                    "Nama",
                    "Jumlah",
                    "Kategori",
                    "Sumber",
                    "Tanggal",
                    "Aksi",
                  ].map((h) => (
                    <th
                      key={h}
                      className="py-3 px-5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {currentData.map((expense) => (
                  <tr
                    key={expense._id}
                    className="hover:bg-gray-50/50 transition-colors group"
                  >
                    <td className="py-3.5 px-5">
                      <span
                        className="text-sm font-medium text-gray-800 max-w-[140px] truncate block"
                        title={expense.name}
                      >
                        {expense.name}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <span className="text-sm font-semibold text-blue-600">
                        Rp {expense.amount.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                        {expense.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                        {getSourceIncomeName(expense)}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <span className="text-sm text-gray-500">
                        {new Date(expense.date).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleViewDetail(expense)}
                          className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                          title="Detail"
                        >
                          <Eye size={13} className="text-gray-600" />
                        </button>
                        <button
                          onClick={() => handleEdit(expense)}
                          className="w-7 h-7 rounded-lg bg-indigo-50 hover:bg-indigo-100 flex items-center justify-center transition-colors"
                          title="Edit"
                        >
                          <Edit size={13} className="text-indigo-600" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(expense)}
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

        <div className="md:hidden divide-y divide-gray-50">
          {currentData.length > 0 ? (
            currentData.map((expense) => (
              <div
                key={expense._id}
                className="p-4 hover:bg-gray-50/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      {expense.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(expense.date).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleViewDetail(expense)}
                      className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                    >
                      <Eye size={13} className="text-gray-600" />
                    </button>
                    <button
                      onClick={() => handleEdit(expense)}
                      className="w-7 h-7 rounded-lg bg-indigo-50 hover:bg-indigo-100 flex items-center justify-center"
                    >
                      <Edit size={13} className="text-indigo-600" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(expense)}
                      className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center"
                    >
                      <Trash2 size={13} className="text-red-500" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Jumlah</p>
                    <p className="text-sm font-semibold text-blue-600">
                      Rp {expense.amount.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Confidence</p>
                    <span
                      className={`px-2.5 py-1 text-xs font-medium rounded-full border ${getConfidenceBadgeColor(expense.confidence)}`}
                    >
                      {getConfidenceDisplay(expense.confidence)}%
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Kategori</p>
                    <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                      {expense.category}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Sumber</p>
                    <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                      {getSourceIncomeName(expense)}
                    </span>
                  </div>
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
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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
                    onClick={() => setCurrentPage(page)}
                    className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${page === currentPage ? "bg-blue-500 text-white" : "text-gray-500 hover:bg-gray-100"}`}
                  >
                    {page}
                  </button>
                ),
              )}
            </div>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Berikutnya <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      <DeleteConfirmationModal />
      <DetailModal />
    </>
  );
}

export default ExpenseList;
