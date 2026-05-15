import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

function ExpenseForm({
  onAddExpense,
  expensesData,
  incomesData,
  onUpdateExpense,
  expenseEdit,
  setExpenseEdit,
  isLoading,
}) {
  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    category: "",
    sourceIncomeId: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [displayAmount, setDisplayAmount] = useState("");
  const [selectedIncome, setSelectedIncome] = useState(null);
  const [isCustomCategory, setIsCustomCategory] = useState(false);

  const allIncomes = useMemo(
    () => (Array.isArray(incomesData) ? incomesData : []),
    [incomesData],
  );

  const availableIncomes = useMemo(
    () => allIncomes.filter((income) => income.remainingAmount > 0),
    [allIncomes],
  );

  const uniqueCategories = [
    ...new Set(expensesData.map((expense) => expense.category)),
  ];

  useEffect(() => {
    if (!expenseEdit) {
      return;
    }

    const expenseDate = new Date(expenseEdit.date);
    const formattedDate = expenseDate.toISOString().split("T")[0];
    const incomeIdValue =
      typeof expenseEdit.incomeId === "object"
        ? expenseEdit.incomeId?._id
        : expenseEdit.incomeId;

    setFormData({
      name: expenseEdit.name,
      amount: expenseEdit.amount,
      category: expenseEdit.category,
      sourceIncomeId: incomeIdValue || "",
      date: formattedDate,
    });

    setDisplayAmount(new Intl.NumberFormat("id-ID").format(expenseEdit.amount));

    if (incomeIdValue) {
      const editIncome =
        allIncomes.find((income) => income._id === incomeIdValue) || null;
      setSelectedIncome(editIncome);
    }
  }, [allIncomes, expenseEdit]);

  useEffect(() => {
    if (!selectedIncome) {
      return;
    }

    const refreshedIncome = allIncomes.find(
      (income) => income._id === selectedIncome._id,
    );

    if (!refreshedIncome || refreshedIncome.remainingAmount <= 0) {
      setSelectedIncome(null);
      setFormData((prev) => ({ ...prev, sourceIncomeId: "" }));
      toast.warning("Sumber pendapatan yang dipilih sudah tidak tersedia", {
        position: "top-right",
        autoClose: 3000,
        theme: "colored",
      });
      return;
    }

    if (refreshedIncome.remainingAmount !== selectedIncome.remainingAmount) {
      setSelectedIncome(refreshedIncome);
    }
  }, [allIncomes, selectedIncome]);

  const validateAmountAgainstIncome = (amount, income) => {
    if (!income || !amount) return true;

    let availableAmount = income.remainingAmount;

    if (expenseEdit && expenseEdit.incomeId) {
      const editIncomeId =
        typeof expenseEdit.incomeId === "object"
          ? expenseEdit.incomeId?._id
          : expenseEdit.incomeId;

      if (editIncomeId === income._id) {
        availableAmount += Number(expenseEdit.amount);
      }
    }

    return Number(amount) <= availableAmount;
  };

  const showErrorToast = (message) => {
    if (!toast.isActive("form-error")) {
      toast.error(message, {
        toastId: "form-error",
        position: "top-right",
        autoClose: 3000,
        theme: "colored",
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "name" || name === "category") {
      const capitalized = value
        .split(" ")
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
        )
        .join(" ");

      setFormData((prev) => ({
        ...prev,
        [name]: capitalized,
      }));
      return;
    }

    if (name === "amount") {
      if (!selectedIncome && !expenseEdit) {
        showErrorToast("Pilih sumber pendapatan terlebih dahulu");
        return;
      }

      const numericValue = value.replace(/\D/g, "");

      if (
        selectedIncome &&
        numericValue &&
        !validateAmountAgainstIncome(numericValue, selectedIncome)
      ) {
        let availableAmount = selectedIncome.remainingAmount;

        if (expenseEdit && expenseEdit.incomeId) {
          const editIncomeId =
            typeof expenseEdit.incomeId === "object"
              ? expenseEdit.incomeId?._id
              : expenseEdit.incomeId;

          if (editIncomeId === selectedIncome._id) {
            availableAmount += Number(expenseEdit.amount);
          }
        }

        showErrorToast(
          `Jumlah pengeluaran tidak boleh melebihi saldo ${selectedIncome.name}: Rp ${new Intl.NumberFormat("id-ID").format(availableAmount)}`,
        );
        return;
      }

      setFormData((prev) => ({
        ...prev,
        [name]: numericValue,
      }));

      setDisplayAmount(
        numericValue ? new Intl.NumberFormat("id-ID").format(numericValue) : "",
      );
      return;
    }

    if (name === "sourceIncomeId") {
      const selected =
        allIncomes.find((income) => income._id === value) || null;

      setFormData((prev) => ({ ...prev, sourceIncomeId: value }));
      setSelectedIncome(selected);

      if (
        formData.amount &&
        selected &&
        !validateAmountAgainstIncome(formData.amount, selected)
      ) {
        let availableAmount = selected.remainingAmount;

        if (expenseEdit && expenseEdit.incomeId) {
          const editIncomeId =
            typeof expenseEdit.incomeId === "object"
              ? expenseEdit.incomeId?._id
              : expenseEdit.incomeId;

          if (editIncomeId === selected._id) {
            availableAmount += Number(expenseEdit.amount);
          }
        }

        toast.error(
          `Jumlah pengeluaran melebihi saldo ${selected.name}: Rp ${new Intl.NumberFormat("id-ID").format(availableAmount)}. Jumlah telah direset.`,
          {
            position: "top-right",
            autoClose: 4000,
            theme: "colored",
          },
        );
        setFormData((prev) => ({ ...prev, amount: "" }));
        setDisplayAmount("");
      }
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const isFormValid = () => {
    const basicFieldsValid =
      formData.name && formData.amount && formData.category && formData.date;

    let sourceId = formData.sourceIncomeId;
    if (typeof sourceId === "object" && sourceId !== null) {
      sourceId = sourceId._id;
    }

    const sourceIncomeValid = sourceId || (expenseEdit && expenseEdit.incomeId);
    const amountValid =
      !selectedIncome ||
      validateAmountAgainstIncome(formData.amount, selectedIncome);
    const hasAvailableSources = availableIncomes.length > 0 || expenseEdit;

    return (
      basicFieldsValid &&
      sourceIncomeValid &&
      amountValid &&
      hasAvailableSources
    );
  };

  const handleClick = async () => {
    if (!isFormValid()) {
      if (availableIncomes.length === 0 && !expenseEdit) {
        toast.error(
          "Tidak ada pemasukan tersedia. Silakan tambahkan pemasukan terlebih dahulu.",
        );
      } else if (
        !formData.name ||
        !formData.amount ||
        !formData.category ||
        !formData.date
      ) {
        toast.error("Mohon lengkapi semua field yang diperlukan.");
      } else {
        let sourceId = formData.sourceIncomeId;
        if (typeof sourceId === "object" && sourceId !== null) {
          sourceId = sourceId._id;
        }

        if (!sourceId && !(expenseEdit && expenseEdit.incomeId)) {
          toast.error("Mohon pilih sumber pendapatan.");
        } else if (
          selectedIncome &&
          !validateAmountAgainstIncome(formData.amount, selectedIncome)
        ) {
          toast.error("Jumlah pengeluaran melebihi saldo yang tersedia.");
        }
      }
      return;
    }

    const currentTime = new Date().toTimeString().split(" ")[0];
    const fullDateTime = new Date(`${formData.date}T${currentTime}`);

    let finalSourceIncomeId = formData.sourceIncomeId;
    if (
      typeof finalSourceIncomeId === "object" &&
      finalSourceIncomeId !== null
    ) {
      finalSourceIncomeId = finalSourceIncomeId._id;
    }

    if (!finalSourceIncomeId && expenseEdit) {
      finalSourceIncomeId =
        typeof expenseEdit.incomeId === "object"
          ? expenseEdit.incomeId._id
          : expenseEdit.incomeId;
    }

    const finalSourceIncomeName = selectedIncome
      ? selectedIncome.name
      : expenseEdit
        ? typeof expenseEdit.incomeId === "object"
          ? expenseEdit.incomeId.name
          : expenseEdit.sourceIncomeName || ""
        : "";

    const expenseData = {
      ...formData,
      sourceIncomeId: finalSourceIncomeId,
      amount: Number(formData.amount),
      date: fullDateTime,
      sourceIncomeName: finalSourceIncomeName,
    };

    try {
      if (expenseEdit) {
        await onUpdateExpense({ ...expenseData, id: expenseEdit._id });
        toast.success("Pengeluaran berhasil diperbarui");
        setExpenseEdit(null);
      } else {
        await onAddExpense(expenseData);
        toast.success("Pengeluaran berhasil ditambahkan");
      }

      setFormData({
        name: "",
        amount: "",
        category: "",
        sourceIncomeId: "",
        date: new Date().toISOString().split("T")[0],
      });
      setDisplayAmount("");
      setSelectedIncome(null);
      setIsCustomCategory(false);
    } catch (error) {
      console.error("Error saat menyimpan pengeluaran:", error);
      toast.error("Terjadi kesalahan. Silakan coba lagi");
    }
  };

  const handleCancel = () => {
    setFormData({
      name: "",
      amount: "",
      category: "",
      sourceIncomeId: "",
      date: new Date().toISOString().split("T")[0],
    });
    setDisplayAmount("");
    setSelectedIncome(null);
    setExpenseEdit(null);
    setIsCustomCategory(false);
  };

  const getAmountValidationMessage = () => {
    if (!formData.amount || !selectedIncome) return null;
    if (!validateAmountAgainstIncome(formData.amount, selectedIncome)) {
      let availableAmount = selectedIncome.remainingAmount;

      if (expenseEdit && expenseEdit.incomeId) {
        const editIncomeId =
          typeof expenseEdit.incomeId === "object"
            ? expenseEdit.incomeId?._id
            : expenseEdit.incomeId;

        if (editIncomeId === selectedIncome._id) {
          availableAmount += Number(expenseEdit.amount);
        }
      }

      return `Jumlah melebihi saldo tersedia: Rp ${new Intl.NumberFormat("id-ID").format(availableAmount)}`;
    }
    return null;
  };

  const hasNoAvailableIncomes = availableIncomes.length === 0 && !expenseEdit;

  return (
    <div className="bg-white shadow-md p-4 rounded-xl space-y-4">
      {hasNoAvailableIncomes && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start space-x-3">
          <div className="flex-shrink-0">
            <svg
              className="w-5 h-5 text-yellow-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-yellow-800">
              Belum Ada Pemasukan Tersedia
            </h3>
            <p className="text-sm text-yellow-700 mt-1">
              Anda perlu menambahkan pemasukan terlebih dahulu sebelum bisa
              mencatat pengeluaran. Silakan buat pemasukan baru atau pastikan
              pemasukan yang ada masih memiliki saldo.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0">
        <div className="flex flex-col w-full">
          <label
            htmlFor="name"
            className="text-base font-semibold text-gray-700"
          >
            Nama Pengeluaran
          </label>
          <input
            disabled={isLoading || hasNoAvailableIncomes}
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Masukkan nama pengeluaran"
            className={`mt-1 p-2 border border-gray-300 rounded-md w-full ${
              hasNoAvailableIncomes ? "bg-gray-100 text-gray-500" : "bg-white"
            }`}
          />
        </div>
        <div className="flex flex-col w-full">
          <label
            htmlFor="sourceIncomeId"
            className="text-base font-semibold text-gray-700"
          >
            Sumber Pendapatan
            <span className="text-red-500 ml-1">*</span>
            {expenseEdit && !formData.sourceIncomeId && (
              <span className="text-sm text-gray-500 font-normal block">
                Menggunakan sumber pendapatan sebelumnya
              </span>
            )}
          </label>
          <select
            id="sourceIncomeId"
            name="sourceIncomeId"
            value={formData.sourceIncomeId}
            onChange={handleChange}
            className={`mt-1 p-2 border border-gray-300 rounded-md w-full ${
              hasNoAvailableIncomes ? "bg-gray-100 text-gray-500" : "bg-white"
            }`}
            disabled={isLoading || hasNoAvailableIncomes}
          >
            <option value="" disabled>
              {availableIncomes.length === 0
                ? "Tidak ada pendapatan tersedia"
                : "Pilih sumber pendapatan"}
            </option>
            {availableIncomes.map((income) => (
              <option key={income._id} value={income._id}>
                {income.name} - Rp{" "}
                {new Intl.NumberFormat("id-ID").format(income.remainingAmount)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0">
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
              className={`mt-1 p-2 border border-gray-300 rounded-md w-full ${
                hasNoAvailableIncomes ? "bg-gray-100 text-gray-500" : "bg-white"
              }`}
              disabled={isLoading || hasNoAvailableIncomes}
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
                  setIsCustomCategory(false);
                }
              }}
              className={`mt-1 p-2 border border-gray-300 rounded-md w-full ${
                hasNoAvailableIncomes ? "bg-gray-100 text-gray-500" : "bg-white"
              }`}
              disabled={isLoading || hasNoAvailableIncomes}
            />
          )}
        </div>

        <div className="flex flex-col w-full">
          <label
            htmlFor="amount"
            className="text-base font-semibold text-gray-700 flex justify-between items-center"
          >
            <span>Jumlah Pengeluaran</span>
            {selectedIncome && (
              <span className="text-sm text-gray-600 font-normal">
                Saldo Tersedia: Rp{" "}
                {new Intl.NumberFormat("id-ID").format(
                  (() => {
                    let availableAmount = selectedIncome.remainingAmount;

                    if (expenseEdit && expenseEdit.incomeId) {
                      const editIncomeId =
                        typeof expenseEdit.incomeId === "object"
                          ? expenseEdit.incomeId?._id
                          : expenseEdit.incomeId;

                      if (editIncomeId === selectedIncome._id) {
                        availableAmount += Number(expenseEdit.amount);
                      }
                    }

                    return availableAmount;
                  })(),
                )}
              </span>
            )}
          </label>

          <div className="relative mt-1">
            <span
              className={`absolute left-3 inset-y-0 flex items-center pointer-events-none ${
                hasNoAvailableIncomes || (!selectedIncome && !expenseEdit)
                  ? "text-gray-600"
                  : "text-gray-700"
              }`}
            >
              Rp
            </span>
            <input
              type="text"
              id="amount"
              name="amount"
              value={displayAmount}
              onChange={handleChange}
              placeholder={
                !selectedIncome && !expenseEdit
                  ? "Pilih sumber pendapatan dulu"
                  : "0"
              }
              className={`p-2 pl-8 border rounded-md w-full ${
                getAmountValidationMessage()
                  ? "border-red-300"
                  : "border-gray-300"
              } ${
                hasNoAvailableIncomes || (!selectedIncome && !expenseEdit)
                  ? "bg-gray-100 text-gray-700 placeholder-gray-500"
                  : "bg-white text-gray-800 placeholder-gray-400"
              }`}
              disabled={
                isLoading ||
                hasNoAvailableIncomes ||
                (!selectedIncome && !expenseEdit)
              }
            />
          </div>

          {!selectedIncome && !hasNoAvailableIncomes && !expenseEdit && (
            <p className="text-sm text-amber-700 mt-1 mb-1">
              Pilih sumber pendapatan terlebih dahulu
            </p>
          )}

          {getAmountValidationMessage() && (
            <span className="text-sm text-red-600 mt-1 block">
              {getAmountValidationMessage()}
            </span>
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
            className={`mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full ${
              hasNoAvailableIncomes ? "bg-gray-100 text-gray-500" : "bg-white"
            }`}
            disabled={isLoading || hasNoAvailableIncomes}
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-2 sm:space-y-0 mt-2">
        <button
          onClick={handleClick}
          className={`px-6 py-2.5 ${
            isLoading || !isFormValid()
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-700"
          } focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-opacity-50 cursor-pointer text-white text-base rounded-lg font-semibold transition-colors duration-300 ease-in-out w-full sm:w-auto`}
          disabled={isLoading || !isFormValid()}
        >
          {isLoading
            ? "Memproses..."
            : expenseEdit
              ? "Edit Pengeluaran"
              : "Tambah Pengeluaran"}
        </button>
        {expenseEdit && (
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

export default ExpenseForm;
