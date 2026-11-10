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
          className="fixed inset-0 bg-slate-900/40"
          onClick={cancelDelete}
        />
        <div role="dialog" aria-modal="true" className="relative bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden">
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
              <span className="mono font-semibold text-[var(--income)]">
                Rp {incomeToDelete.amount.toLocaleString("id-ID")}
              </span>
            </p>
            <p className="text-xs text-red-500 mt-2">
              Tindakan ini tidak dapat dibatalkan.
            </p>
          </div>

          <div className="px-6 pb-6 flex gap-3">
            <button
              onClick={cancelDelete}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={confirmDelete}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors"
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
      <div className="w-14 h-14 bg-[var(--brand-tint)] rounded-lg flex items-center justify-center mb-4">
        <TrendingUp size={26} className="text-[var(--income)]" />
      </div>
      <p className="text-sm font-medium text-gray-700 mb-1">
        Belum ada data pemasukan
      </p>
      <p className="text-xs text-slate-500">
        Tambahkan pemasukan pertama Anda di atas
      </p>
    </div>
  );

  return (
    <>
      <div className="form-card">
        <div className="form-card__head">
          <div className="flex items-center gap-3">
            <div className="form-icon form-icon--income">
              <TrendingUp size={16} />
            </div>
            <div>
              <h2 className="form-title">
                Daftar Pemasukan
              </h2>
              <p className="form-sub">
                {incomes.length} entri tercatat
              </p>
            </div>
          </div>
          {totalPages > 1 && (
            <span className="text-xs text-slate-500">
              Hal. {currentPage}/{totalPages}
            </span>
          )}
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block">
          {currentData.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="bg-[var(--surface-2)]">
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
                      className={`py-2.5 px-5 text-xs font-semibold text-slate-500 ${h === "Jumlah" || h === "Sisa Saldo" || h === "Aksi" ? "text-right" : "text-left"}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentData.map((income) => (
                  <tr
                    key={income._id}
                    className="hover:bg-[var(--surface-2)] transition-colors group"
                  >
                    <td className="py-3.5 px-5">
                      <span
                        className="text-sm font-medium text-gray-800 max-w-[130px] truncate block"
                        title={income.name}
                      >
                        {income.name}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap text-right">
                      <span className="mono text-sm font-semibold text-[var(--income)]">
                        Rp {income.amount.toLocaleString("id-ID")}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <span className="px-2 py-0.5 text-xs font-medium rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100">
                        {income.source}
                      </span>
                    </td>
                    <td className="py-3.5 px-5">
                      <span
                        className="text-sm text-slate-500 max-w-[150px] truncate block"
                        title={income.notes || "-"}
                      >
                        {income.notes || (
                          <span className="text-gray-300">—</span>
                        )}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap text-right">
                      <span className="mono text-sm font-semibold text-[var(--text-1)]">
                        Rp {income.remainingAmount?.toLocaleString("id-ID") ?? "0"}
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
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEdit(income)}
                          aria-label="Edit"
                          className="row-action"
                          title="Edit"
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(income)}
                          aria-label="Hapus"
                          className="row-action row-action--danger"
                          title="Hapus"
                        >
                          <Trash2 size={15} />
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
        <div className="md:hidden divide-y divide-slate-100">
          {currentData.length > 0 ? (
            currentData.map((income) => (
              <div
                key={income._id}
                className="p-4 hover:bg-[var(--surface-2)] transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      {income.name}
                    </p>
                    <p className="form-sub">
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
                      aria-label="Edit"
                      className="row-action"
                    >
                      <Edit size={15} />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(income)}
                      aria-label="Hapus"
                      className="row-action row-action--danger"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">Jumlah</p>
                    <p className="mono text-sm font-semibold text-[var(--income)]">
                      Rp {income.amount.toLocaleString("id-ID")}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">Sisa Saldo</p>
                    <p className="mono text-sm font-semibold text-[var(--text-1)]">
                      Rp {income.remainingAmount?.toLocaleString("id-ID") ?? "0"}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-slate-500 mb-1">Sumber</p>
                    <span className="px-2 py-0.5 text-xs font-medium rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100">
                      {income.source}
                    </span>
                  </div>
                  {income.notes && (
                    <div className="col-span-2">
                      <p className="text-xs text-slate-500 mb-0.5">Catatan</p>
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
          <div className="form-card__foot">
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
                        ? "bg-[var(--brand)] text-white"
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
