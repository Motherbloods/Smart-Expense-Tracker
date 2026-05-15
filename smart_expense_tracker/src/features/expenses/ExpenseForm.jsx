import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  PlusCircle,
  Edit3,
  X,
  Wallet,
  Calendar,
  Tag,
  AlertCircle,
  Info,
} from "lucide-react";

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
  const [focused, setFocused] = useState(null);

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
    if (!expenseEdit) return;
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
    if (!selectedIncome) return;
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
      if (editIncomeId === income._id)
        availableAmount += Number(expenseEdit.amount);
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
      setFormData((prev) => ({ ...prev, [name]: capitalized }));
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
          if (editIncomeId === selectedIncome._id)
            availableAmount += Number(expenseEdit.amount);
        }
        showErrorToast(
          `Jumlah tidak boleh melebihi saldo ${selectedIncome.name}: Rp ${new Intl.NumberFormat("id-ID").format(availableAmount)}`,
        );
        return;
      }
      setFormData((prev) => ({ ...prev, [name]: numericValue }));
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
          if (editIncomeId === selected._id)
            availableAmount += Number(expenseEdit.amount);
        }
        toast.error(
          `Jumlah pengeluaran melebihi saldo ${selected.name}: Rp ${new Intl.NumberFormat("id-ID").format(availableAmount)}. Jumlah telah direset.`,
          { position: "top-right", autoClose: 4000, theme: "colored" },
        );
        setFormData((prev) => ({ ...prev, amount: "" }));
        setDisplayAmount("");
      }
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const isFormValid = () => {
    const basicFieldsValid =
      formData.name && formData.amount && formData.category && formData.date;
    let sourceId = formData.sourceIncomeId;
    if (typeof sourceId === "object" && sourceId !== null)
      sourceId = sourceId._id;
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
        if (typeof sourceId === "object" && sourceId !== null)
          sourceId = sourceId._id;
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
        if (editIncomeId === selectedIncome._id)
          availableAmount += Number(expenseEdit.amount);
      }
      return `Melebihi saldo: Rp ${new Intl.NumberFormat("id-ID").format(availableAmount)}`;
    }
    return null;
  };

  const hasNoAvailableIncomes = availableIncomes.length === 0 && !expenseEdit;

  const inputBase =
    "w-full px-4 py-2.5 text-sm text-gray-800 bg-gray-50 border rounded-xl transition-all duration-200 outline-none placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed";
  const inputFocus = "border-blue-400 bg-white ring-2 ring-blue-100";
  const inputIdle = "border-gray-200 hover:border-gray-300";
  const inputDisabled =
    "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed";

  const getInputClass = (fieldName, hasError = false) => {
    if (hasNoAvailableIncomes) return `${inputBase} ${inputDisabled}`;
    if (hasError)
      return `${inputBase} border-red-300 bg-white ring-2 ring-red-100`;
    return `${inputBase} ${focused === fieldName ? inputFocus : inputIdle}`;
  };

  const getAvailableAmount = () => {
    if (!selectedIncome) return null;
    let amount = selectedIncome.remainingAmount;
    if (expenseEdit && expenseEdit.incomeId) {
      const editIncomeId =
        typeof expenseEdit.incomeId === "object"
          ? expenseEdit.incomeId?._id
          : expenseEdit.incomeId;
      if (editIncomeId === selectedIncome._id)
        amount += Number(expenseEdit.amount);
    }
    return amount;
  };

  const validationMsg = getAmountValidationMessage();
  const availableAmount = getAvailableAmount();

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center ${expenseEdit ? "bg-amber-100" : "bg-blue-100"}`}
          >
            {expenseEdit ? (
              <Edit3 size={16} className="text-amber-600" />
            ) : (
              <PlusCircle size={16} className="text-blue-600" />
            )}
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              {expenseEdit ? "Edit Pengeluaran" : "Tambah Pengeluaran"}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {expenseEdit
                ? "Perbarui data pengeluaran"
                : "Catat pengeluaran baru"}
            </p>
          </div>
        </div>
        {expenseEdit && (
          <button
            onClick={handleCancel}
            className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <X size={14} className="text-gray-500" />
          </button>
        )}
      </div>

      <div className="p-6 space-y-5">
        {hasNoAvailableIncomes && (
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <AlertCircle size={16} className="text-amber-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-800">
                Belum Ada Pemasukan Tersedia
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Tambahkan pemasukan terlebih dahulu sebelum mencatat
                pengeluaran.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
              <Tag size={12} />
              Nama Pengeluaran
            </label>
            <input
              disabled={isLoading || hasNoAvailableIncomes}
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              onFocus={() => setFocused("name")}
              onBlur={() => setFocused(null)}
              placeholder="mis. Belanja Bulanan"
              className={getInputClass("name")}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
              <Wallet size={12} />
              Sumber Pendapatan
              <span className="text-red-400">*</span>
            </label>
            <select
              name="sourceIncomeId"
              value={formData.sourceIncomeId}
              onChange={handleChange}
              onFocus={() => setFocused("sourceIncomeId")}
              onBlur={() => setFocused(null)}
              className={getInputClass("sourceIncomeId")}
              disabled={isLoading || hasNoAvailableIncomes}
            >
              <option value="" disabled>
                {availableIncomes.length === 0
                  ? "Tidak ada pendapatan tersedia"
                  : "Pilih sumber pendapatan"}
              </option>
              {availableIncomes.map((income) => (
                <option key={income._id} value={income._id}>
                  {income.name} — Rp{" "}
                  {new Intl.NumberFormat("id-ID").format(
                    income.remainingAmount,
                  )}
                </option>
              ))}
            </select>
            {expenseEdit && !formData.sourceIncomeId && (
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <Info size={11} /> Menggunakan sumber pendapatan sebelumnya
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Kategori
            </label>
            {!isCustomCategory ? (
              <select
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
                onFocus={() => setFocused("category")}
                onBlur={() => setFocused(null)}
                className={getInputClass("category")}
                disabled={isLoading || hasNoAvailableIncomes}
              >
                <option value="" disabled>
                  Pilih kategori
                </option>
                {uniqueCategories.map((category, index) => (
                  <option key={`${category}-${index}`} value={category}>
                    {category}
                  </option>
                ))}
                <option value="__other__">+ Tambah kategori...</option>
              </select>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  name="category"
                  placeholder="Kategori baru"
                  value={formData.category}
                  onChange={handleChange}
                  onFocus={() => setFocused("category")}
                  onBlur={() => {
                    setFocused(null);
                    if (!formData.category) setIsCustomCategory(false);
                  }}
                  className={getInputClass("category")}
                  disabled={isLoading || hasNoAvailableIncomes}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomCategory(false);
                    setFormData((p) => ({ ...p, category: "" }));
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center justify-between">
              <span>Jumlah</span>
              {availableAmount !== null && (
                <span
                  className={`text-xs font-normal normal-case ${validationMsg ? "text-red-500" : "text-gray-400"}`}
                >
                  Saldo: Rp{" "}
                  {new Intl.NumberFormat("id-ID").format(availableAmount)}
                </span>
              )}
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400 pointer-events-none">
                Rp
              </span>
              <input
                type="text"
                name="amount"
                value={displayAmount}
                onChange={handleChange}
                onFocus={() => setFocused("amount")}
                onBlur={() => setFocused(null)}
                placeholder={
                  !selectedIncome && !expenseEdit ? "Pilih sumber dulu" : "0"
                }
                className={`${getInputClass("amount", !!validationMsg)} pl-10`}
                disabled={
                  isLoading ||
                  hasNoAvailableIncomes ||
                  (!selectedIncome && !expenseEdit)
                }
              />
            </div>
            {validationMsg && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle size={11} /> {validationMsg}
              </p>
            )}
            {!selectedIncome && !hasNoAvailableIncomes && !expenseEdit && (
              <p className="text-xs text-amber-600 flex items-center gap-1">
                <Info size={11} /> Pilih sumber pendapatan dulu
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
              <Calendar size={12} />
              Tanggal
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              onFocus={() => setFocused("date")}
              onBlur={() => setFocused(null)}
              className={getInputClass("date")}
              disabled={isLoading || hasNoAvailableIncomes}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={handleClick}
            disabled={isLoading || !isFormValid()}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200
                            ${
                              isLoading || !isFormValid()
                                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                : expenseEdit
                                  ? "bg-amber-500 hover:bg-amber-600 text-white shadow-sm shadow-amber-200 hover:shadow-md"
                                  : "bg-blue-500 hover:bg-blue-600 text-white shadow-sm shadow-blue-200 hover:shadow-md"
                            }`}
          >
            {isLoading ? (
              <>
                <svg
                  className="w-4 h-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Memproses...
              </>
            ) : expenseEdit ? (
              <>
                <Edit3 size={14} /> Simpan Perubahan
              </>
            ) : (
              <>
                <PlusCircle size={14} /> Tambah Pengeluaran
              </>
            )}
          </button>
          {expenseEdit && (
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Batal
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ExpenseForm;
