import { toast } from "react-toastify";
import { updateMonthlyBudget } from "../../api/loginService";

function BudgetModal({ telegramId, setShowBudgetModal, setMonthlyBudget, monthlyBudget, originalMonthlyBudget }) {
    const handleBudgetChange = (e) => {
        const numericValue = e.target.value.replace(/\D/g, '');
        setMonthlyBudget(numericValue ? parseInt(numericValue) : 0);
    };

    const handleCancel = () => {
        setMonthlyBudget(originalMonthlyBudget);
        setShowBudgetModal(false);
    };

    const handleSaveBudget = async () => {
        try {
            await updateMonthlyBudget(monthlyBudget, telegramId);
            setShowBudgetModal(false);
            toast.success("Budget bulanan berhasil diperbarui");
        } catch (e) {
            console.error("Error saving budget", e);
            toast.error("Gagal menyimpan budget. Silakan coba lagi");
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/40" onClick={handleCancel} aria-hidden="true" />
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="budget-title"
                className="relative w-full max-w-md overflow-hidden rounded-xl bg-white shadow-xl"
            >
                <div className="form-card__head">
                    <div>
                        <h2 id="budget-title" className="form-title">Set Budget Bulanan</h2>
                        <p className="form-sub">Batas pengeluaran yang ingin Anda jaga setiap bulan</p>
                    </div>
                </div>
                <div className="form-body">
                    <div>
                        <label htmlFor="budget-amount" className="field-label" style={{ marginBottom: "0.375rem" }}>
                            Jumlah Budget
                        </label>
                        <div className="relative">
                            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500">
                                Rp
                            </span>
                            <input
                                id="budget-amount"
                                type="text"
                                inputMode="numeric"
                                value={monthlyBudget.toLocaleString('id-ID')}
                                onChange={handleBudgetChange}
                                placeholder="0"
                                className="field-input field-input--prefixed mono"
                                autoFocus
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button onClick={handleCancel} className="dash-btn-secondary">
                            Batal
                        </button>
                        <button onClick={handleSaveBudget} className="dash-btn-primary">
                            Simpan
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default BudgetModal;
