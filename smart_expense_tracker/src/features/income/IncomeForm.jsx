import { useEffect, useState } from "react";

function IncomeForm({
    onAddIncome,
    incomesData,
    onUpdateIncome,
    incomeEdit,
    setIncomeEdit,
    isLoading,
}) {
    const [formData, setFormData] = useState({
        name: "",
        amount: "",
        source: "",
        notes: "",
        date: new Date().toISOString().split("T")[0],
    });
    const [displayAmount, setDisplayAmount] = useState("");
    const [isCustomSource, setIsCustomSource] = useState(false);
    const uniqueSources = [
        ...new Set(incomesData.map((income) => income.source)),
    ];

    useEffect(() => {
        if (incomeEdit) {
            const incomeDate = new Date(incomeEdit.date);
            const formattedDate = incomeDate.toISOString().split("T")[0]
            setFormData({
                name: incomeEdit.name,
                amount: incomeEdit.amount,
                source: incomeEdit.source,
                notes: incomeEdit.notes || "",
                date: formattedDate,
            });

            setDisplayAmount(
                new Intl.NumberFormat("id-ID").format(incomeEdit.amount)
            );
        }
    }, [incomeEdit]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === "name" || name === "source") {
            const capitalized = value
                .split(" ")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(" ");

            setFormData((prev) => ({
                ...prev,
                [name]: capitalized,
            }));
        } else if (name === "amount") {
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
            formData.source &&
            formData.date
        ) {
            const currentTime = new Date().toTimeString().split(" ")[0]; // jam:menit:detik
            const fullDateTime = new Date(`${formData.date}T${currentTime}`);

            const incomeData = {
                ...formData,
                amount: Number(formData.amount),
                date: fullDateTime,
            };
            if (incomeEdit) {
                onUpdateIncome({ ...incomeData, id: incomeEdit._id });
                setIncomeEdit(null);
            } else {
                onAddIncome(incomeData);
            }

            // Reset form
            setFormData({ name: "", amount: "", source: "", notes: "", date: "" });
            setDisplayAmount("");
        } else {
            alert("Mohon lengkapi field yang wajib (nama, jumlah, sumber, tanggal).");
        }
        setIsCustomSource(false);
    };

    const handleCancel = () => {
        // Clear form and editing state
        setFormData({ name: "", amount: "", source: "", notes: "", date: "" });
        setDisplayAmount("");
        setIncomeEdit(null);
    };

    return (
        <div className="bg-white shadow-md p-4 rounded-xl space-y-4">
            <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0">
                <div className="flex flex-col w-full">
                    <label
                        htmlFor="name"
                        className="text-base font-semibold text-gray-700"
                    >
                        Nama Pemasukan
                    </label>
                    <input
                        disabled={isLoading}
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Masukkan nama pemasukan"
                        className="mt-1 p-2 border border-gray-300 rounded-md bg-white w-full"
                    ></input>
                </div>
                <div className="flex flex-col w-full">
                    <label
                        htmlFor="amount"
                        className="text-base font-semibold text-gray-700"
                    >
                        Jumlah Pemasukan
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
            <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0">
                <div className="flex flex-col w-full">
                    <label
                        htmlFor="source"
                        className="text-base font-semibold text-gray-700"
                    >
                        Sumber Pemasukan
                    </label>
                    {!isCustomSource ? (
                        <select
                            id="source"
                            name="source"
                            value={formData.source}
                            onChange={(e) => {
                                if (e.target.value === "__other__") {
                                    setIsCustomSource(true);
                                    setFormData((prev) => ({ ...prev, source: "" }));
                                } else {
                                    handleChange(e);
                                }
                            }}
                            className="mt-1 p-2 border border-gray-300 rounded-md bg-white w-full"
                            disabled={isLoading}
                        >
                            <option value="" disabled>
                                Pilih sumber pemasukan
                            </option>
                            {uniqueSources.map((source) => (
                                <option key={source} value={source}>
                                    {source}
                                </option>
                            ))}
                            <option value="__other__">+ Tambah sumber lain...</option>
                        </select>
                    ) : (
                        <input
                            type="text"
                            name="source"
                            placeholder="Masukkan sumber baru"
                            value={formData.source}
                            onChange={handleChange}
                            onBlur={() => {
                                if (!formData.source) {
                                    setIsCustomSource(false); // Jika kosong, kembali ke select
                                }
                            }}
                            className="mt-1 p-2 border border-gray-300 rounded-md bg-white w-full"
                            disabled={isLoading}
                        />
                    )}
                </div>
                <div className="flex flex-col w-full">
                    <label
                        htmlFor="date"
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
                        className="bg-white mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 w-full"
                        disabled={isLoading}
                    />
                </div>
            </div>
            <div className="flex flex-col w-full">
                <label
                    htmlFor="notes"
                    className="text-base font-semibold text-gray-700"
                >
                    Catatan (Opsional)
                </label>
                <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Tambahkan catatan..."
                    rows={3}
                    className="mt-1 p-2 border border-gray-300 rounded-md bg-white w-full resize-none"
                    disabled={isLoading}
                />
            </div>
            <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-2 sm:space-y-0 mt-2">
                <button
                    onClick={handleClick}
                    className={`px-6 py-2.5 ${isLoading ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-700'} focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-opacity-50 cursor-pointer text-white text-base rounded-lg font-semibold transition-colors duration-300 ease-in-out w-full sm:w-auto`}
                    disabled={isLoading}
                >
                    {isLoading ? "Memproses..." : (incomeEdit ? "Edit Pemasukan" : "Tambah Pemasukan")}
                </button>
                {incomeEdit && (
                    <button
                        onClick={handleCancel}
                        className="px-6 py-2.5 bg-gray-300 hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 cursor-pointer text-gray-700 text-base rounded-lg font-semibold transition-colors duration-300 ease-in-out w-full sm:w-auto"
                        disabled={isLoading}
                    >
                        Batal
                    </button>
                )}
            </div>
        </div>
    );
}

export default IncomeForm;