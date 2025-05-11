import { useEffect, useState } from "react";

function ExpenseForm({
    onAddExpense,
    expensesData,
    onUpdateExpense,
    expenseEdit,
    setExpenseEdit,
    isLoading,
}) {
    const [formData, setFormData] = useState({
        name: "",
        amount: "",
        category: "",
        date: new Date().toISOString().split("T")[0],
    });
    const [displayAmount, setDisplayAmount] = useState("");
    const [isCustomCategory, setIsCustomCategory] = useState(false);
    const uniqueCategories = [
        ...new Set(expensesData.map((expense) => expense.category)),
    ];

    useEffect(() => {
        if (expenseEdit) {
            setFormData({
                name: expenseEdit.name,
                amount: expenseEdit.amount,
                category: expenseEdit.category,
                date: expenseEdit.date,
            });

            setDisplayAmount(
                new Intl.NumberFormat("id-ID").format(expenseEdit.amount)
            );
        }
    }, [expenseEdit]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === "amount") {
            const numericValue = value.replace(/\D/g, "");

            setFormData((prev) => ({
                ...prev,
                [name]: numericValue,
            }));

            if (numericValue) {
                const formatted = new Intl.NumberFormat("id-ID").format(numericValue);
                setDisplayAmount(formatted);
            } else {
                setDisplayAmount("");
            }
        } else {
            setFormData((prev) => ({
                ...prev,
                [name]: value,
            }));
        }
    };

    const handleClick = () => {
        if (
            formData.name &&
            formData.amount &&
            formData.category &&
            formData.date
        ) {
            const currentTime = new Date().toTimeString().split(" ")[0]; // jam:menit:detik
            const fullDateTime = new Date(`${formData.date}T${currentTime}`);

            const expenseData = {
                ...formData,
                amount: Number(formData.amount),
                date: fullDateTime,
            };
            if (expenseEdit) {
                onUpdateExpense({ ...expenseData, id: expenseEdit._id });
                setExpenseEdit(null);
            } else {
                onAddExpense(expenseData);
            }

            // Reset form
            setFormData({ name: "", amount: "", category: "", date: "" });
            setDisplayAmount("");
        } else {
            alert("Mohon lengkapi semua field.");
        }
        setIsCustomCategory(false);
    };

    const handleCancel = () => {
        // Clear form and editing state
        setFormData({ name: "", amount: "", category: "", date: "" });
        setDisplayAmount("");
        setExpenseEdit(null);
    };

    return (
        <div className="bg-white shadow-md p-4 rounded-xl space-y-6">
            <div className="flex justify-between space-x-8">
                <div className="flex flex-col w-full">
                    <label
                        htmlFor="name"
                        className="text-base font-semibold text-gray-700"
                    >
                        Nama Pengeluaran
                    </label>
                    <input
                        disabled={isLoading}
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Masukkan nama pengeluaran"
                        className="mt-1 p-2 border border-gray-300 rounded-md bg-white"
                    ></input>
                </div>
                <div className="flex flex-col w-full">
                    <label
                        htmlFor="amount"
                        className="text-base font-semibold text-gray-700"
                    >
                        Jumlah Pengeluaran
                    </label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                            Rp
                        </span>
                        <input
                            type="text"
                            id="amount"
                            name="amount"
                            value={displayAmount}
                            onChange={handleChange}
                            placeholder="0"
                            className="mt-1 p-2 pl-8 border border-gray-300 rounded-md bg-white w-full"
                            disabled={isLoading}
                        ></input>
                    </div>
                </div>
            </div>
            <div className="flex justify-between space-x-8">
                <div className="flex flex-col w-full">
                    <label
                        htmlFor="category"
                        className="text-base font-semibold text-gray-700"
                    >
                        Kategori
                    </label>
                    {!isCustomCategory ? (
                        <select
                            id="category"
                            name="category"
                            value={formData.category}
                            onChange={(e) => {
                                if (e.target.value === "__other__") {
                                    setIsCustomCategory(true);
                                    setFormData((prev) => ({ ...prev, category: "" }));
                                } else {
                                    handleChange(e);
                                }
                            }}
                            className="mt-1 p-2 border border-gray-300 rounded-md bg-white"
                            disabled={isLoading}
                        >
                            <option value="" disabled>
                                Pilih kategori
                            </option>
                            {uniqueCategories.map((category) => (
                                <option key={category} value={category}>
                                    {category}
                                </option>
                            ))}
                            <option value="__other__">+ Tambah kategori lain...</option>
                        </select>
                    ) : (
                        <input
                            type="text"
                            name="category"
                            placeholder="Masukkan kategori baru"
                            value={formData.category}
                            onChange={handleChange}
                            onBlur={() => {
                                if (!formData.category) {
                                    setIsCustomCategory(false); // Jika kosong, kembali ke select
                                }
                            }}
                            className="mt-1 p-2 border border-gray-300 rounded-md bg-white"
                            disabled={isLoading}
                        />
                    )}
                </div>
                <div className="flex flex-col w-full">
                    <label
                        htmlFor="amount"
                        className="text-base font-semibold text-gray-900"
                    >
                        Tanggal
                    </label>
                    <input
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        id="date"
                        className="bg-white mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isLoading}
                    />
                </div>
            </div>
            <div className="flex space-x-4">
                <button
                    onClick={handleClick}
                    className={`px-6 py-2.5 ${isLoading ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-700'} focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-opacity-50 cursor-pointer text-white text-base rounded-lg font-semibold transition-colors duration-300 ease-in-out`}
                    disabled={isLoading}
                >
                    {isLoading ? "Memproses..." : (expenseEdit ? "Edit Pengeluaran" : "Tambah Pengeluaran")}
                </button>
                {expenseEdit && (
                    <button
                        onClick={handleCancel}
                        className="px-6 py-2.5 bg-gray-300 hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 cursor-pointer text-gray-700 text-base rounded-lg font-semibold transition-colors duration-300 ease-in-out"
                        disabled={isLoading}
                    >
                        Batal
                    </button>
                )}
            </div>
        </div>
    );
}

export default ExpenseForm;
