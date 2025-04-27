import { updateMonthlyBudget } from "../../api/loginService";

function BudgetModal({ telegramId, setShowBudgetModal, setMonthlyBudget, monthlyBudget }) {
    const handleBudgetChange = (e) => {
        const numericValue = e.target.value.replace(/\D/g, '');
        setMonthlyBudget(numericValue ? parseInt(numericValue) : 0);
    };

    const handleSaveBudget = async () => {
        try {
            await updateMonthlyBudget(monthlyBudget, telegramId);
            setShowBudgetModal(false);
            alert("Budget updated successfully!");
        } catch (e) {
            console.error("Error saving budget", e);
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
                <h2 className="text-xl font-semibold mb-4">Set Budget Bulanan</h2>
                <div className="mb-4">
                    <label>Jumlah Budget (Rp)</label>
                    <input
                        type="text"
                        value={monthlyBudget.toLocaleString('id-ID')}
                        onChange={handleBudgetChange}
                        placeholder="0"
                        className="w-full p-2 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                <div className="flex justify-end space-x-2">
                    <button
                        onClick={() => setShowBudgetModal(false)}
                        className="py-2 px-4 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 cursor-pointer"
                    >
                        Batal
                    </button>
                    <button
                        onClick={handleSaveBudget}
                        className="py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 cursor-pointer"
                    >
                        Simpan
                    </button>
                </div>
            </div>
        </div>
    );
}

export default BudgetModal;