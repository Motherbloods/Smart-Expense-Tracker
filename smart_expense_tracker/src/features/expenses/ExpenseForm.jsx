import { useEffect, useState } from "react";

function ExpenseForm({
    onAddExpense,
    expensesData,
    onUpdateExpense,
    expenseEdit,
    setExpenseEdit,
}) {
    const [formData, setFormData] = useState({
        name: "",
        amount: "",
        category: "",
        date: "",
    });
    const [displayAmount, setDisplayAmount] = useState("");
    const uniqueCategories = [
        ...new Set(expensesData.map((expense) => expense.category)),
    ];

    useEffect(() => {
        console.log(expenseEdit)
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
            const expenseData = {
                ...formData,
                amount: Number(formData.amount),
            };
            if (expenseEdit) {
                onUpdateExpense({ ...expenseData, id: expenseEdit.id });
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
                    <select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className="mt-1 p-2 border border-gray-300 rounded-md bg-white"
                    >
                        {uniqueCategories.map((category) => (
                            <option key={category} value={category}>
                                {category}
                            </option>
                        ))}
                    </select>
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
                    />
                </div>
            </div>
            <div className="flex space-x-4">
                <button
                    onClick={handleClick}
                    className="px-6 py-2.5 bg-blue-500 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-opacity-50 cursor-pointer text-white text-base rounded-lg font-semibold transition-colors duration-300 ease-in-out"
                >
                    {expenseEdit ? "Edit Pengeluaran" : "Tambah Pengeluaran"}
                </button>
                {expenseEdit && (
                    <button
                        onClick={handleCancel}
                        className="px-6 py-2.5 bg-gray-300 hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 cursor-pointer text-gray-700 text-base rounded-lg font-semibold transition-colors duration-300 ease-in-out"
                    >
                        Batal
                    </button>
                )}
            </div>
        </div>
    );
}

export default ExpenseForm;
