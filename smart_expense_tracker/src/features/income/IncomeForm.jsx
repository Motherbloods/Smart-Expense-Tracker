import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  PlusCircle,
  Edit3,
  X,
  Wallet,
  Calendar,
  FileText,
  Tag,
} from "lucide-react";

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
  const [focused, setFocused] = useState(null);

  const uniqueSources = [
    ...new Set(incomesData.map((income) => income.source)),
  ];

  useEffect(() => {
    if (incomeEdit) {
      const incomeDate = new Date(incomeEdit.date);
      const formattedDate = incomeDate.toISOString().split("T")[0];
      setFormData({
        name: incomeEdit.name,
        amount: incomeEdit.amount,
        source: incomeEdit.source,
        notes: incomeEdit.notes || "",
        date: formattedDate,
      });
      setDisplayAmount(
        new Intl.NumberFormat("id-ID").format(incomeEdit.amount),
      );
    }
  }, [incomeEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "name" || name === "source") {
      const capitalized = value
        .split(" ")
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
        )
        .join(" ");
      setFormData((prev) => ({ ...prev, [name]: capitalized }));
    } else if (name === "amount") {
      const numericValue = value.replace(/\D/g, "");
      setFormData((prev) => ({ ...prev, [name]: numericValue }));
      setDisplayAmount(
        numericValue ? new Intl.NumberFormat("id-ID").format(numericValue) : "",
      );
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleClick = async () => {
    if (
      !formData.name ||
      !formData.amount ||
      !formData.source ||
      !formData.date
    ) {
      toast.error(
        "Mohon lengkapi field yang wajib (nama, jumlah, sumber, tanggal).",
        {
          position: "top-right",
          autoClose: 3000,
        },
      );
      return;
    }
    try {
      const currentTime = new Date().toTimeString().split(" ")[0];
      const fullDateTime = new Date(`${formData.date}T${currentTime}`);
      const incomeData = {
        name: formData.name,
        amount: Number(formData.amount),
        source: formData.source,
        notes: formData.notes,
        date: fullDateTime,
      };
      if (incomeEdit) {
        await onUpdateIncome({ id: incomeEdit._id, ...incomeData });
        setIncomeEdit(null);
      } else {
        await onAddIncome(incomeData);
        toast.success("✅ Pemasukan berhasil ditambahkan", {
          position: "top-right",
          autoClose: 3000,
        });
      }
      setFormData({
        name: "",
        amount: "",
        source: "",
        notes: "",
        date: new Date().toISOString().split("T")[0],
      });
      setDisplayAmount("");
      setIsCustomSource(false);
    } catch (error) {
      console.error("Error saat menyimpan pemasukan:", error);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: "",
      amount: "",
      source: "",
      notes: "",
      date: new Date().toISOString().split("T")[0],
    });
    setDisplayAmount("");
    setIsCustomSource(false);
    setIncomeEdit(null);
  };

  const inputBase =
    "w-full px-4 py-2.5 text-sm text-gray-800 bg-gray-50 border rounded-xl transition-all duration-200 outline-none placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed";
  const inputFocus = "border-emerald-400 bg-white ring-2 ring-emerald-100";
  const inputIdle = "border-gray-200 hover:border-gray-300";

  const getInputClass = (fieldName) =>
    `${inputBase} ${focused === fieldName ? inputFocus : inputIdle}`;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center ${incomeEdit ? "bg-amber-100" : "bg-emerald-100"}`}
          >
            {incomeEdit ? (
              <Edit3 size={16} className="text-amber-600" />
            ) : (
              <PlusCircle size={16} className="text-emerald-600" />
            )}
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              {incomeEdit ? "Edit Pemasukan" : "Tambah Pemasukan"}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {incomeEdit
                ? "Perbarui data pemasukan yang ada"
                : "Catat sumber pemasukan baru"}
            </p>
          </div>
        </div>
        {incomeEdit && (
          <button
            onClick={handleCancel}
            className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            title="Batalkan edit"
          >
            <X size={14} className="text-gray-500" />
          </button>
        )}
      </div>

      <div className="p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
              <FileText size={12} />
              Nama Pemasukan
            </label>
            <input
              disabled={isLoading}
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              onFocus={() => setFocused("name")}
              onBlur={() => setFocused(null)}
              placeholder="mis. Gaji Bulanan"
              className={getInputClass("name")}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
              <Wallet size={12} />
              Jumlah Pemasukan
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
                placeholder="0"
                className={`${getInputClass("amount")} pl-10`}
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
              <Tag size={12} />
              Sumber Pemasukan
            </label>
            {!isCustomSource ? (
              <select
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
                onFocus={() => setFocused("source")}
                onBlur={() => setFocused(null)}
                className={getInputClass("source")}
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
              <div className="relative">
                <input
                  type="text"
                  name="source"
                  placeholder="Masukkan sumber baru"
                  value={formData.source}
                  onChange={handleChange}
                  onFocus={() => setFocused("source")}
                  onBlur={() => {
                    setFocused(null);
                    if (!formData.source) setIsCustomSource(false);
                  }}
                  className={getInputClass("source")}
                  disabled={isLoading}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomSource(false);
                    setFormData((p) => ({ ...p, source: "" }));
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              </div>
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
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
            Catatan{" "}
            <span className="text-gray-400 font-normal normal-case">
              (Opsional)
            </span>
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            onFocus={() => setFocused("notes")}
            onBlur={() => setFocused(null)}
            placeholder="Tambahkan catatan tambahan..."
            rows={3}
            className={`${getInputClass("notes")} resize-none`}
            disabled={isLoading}
          />
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={handleClick}
            disabled={isLoading}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 
                            ${
                              isLoading
                                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                : incomeEdit
                                  ? "bg-amber-500 hover:bg-amber-600 text-white shadow-sm shadow-amber-200 hover:shadow-md hover:shadow-amber-200"
                                  : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm shadow-emerald-200 hover:shadow-md hover:shadow-emerald-200"
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
            ) : incomeEdit ? (
              <>
                <Edit3 size={14} />
                Simpan Perubahan
              </>
            ) : (
              <>
                <PlusCircle size={14} />
                Tambah Pemasukan
              </>
            )}
          </button>
          {incomeEdit && (
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
            >
              Batal
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default IncomeForm;
