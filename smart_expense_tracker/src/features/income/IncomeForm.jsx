import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  PlusCircle,
  Edit3,
  X,
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

  const inputBase = "field-input";
  const inputFocus = "is-focused";
  const inputIdle = "";

  const getInputClass = (fieldName) =>
    `${inputBase} ${focused === fieldName ? inputFocus : inputIdle}`;

  return (
    <div className="form-card">
      <div className="form-card__head">
        <div className="flex items-center gap-3">
          <div
            className={`form-icon form-icon--income${incomeEdit ? " form-icon--edit" : ""}`}
          >
            {incomeEdit ? (
              <Edit3 size={16} />
            ) : (
              <PlusCircle size={16} />
            )}
          </div>
          <div>
            <h2 className="form-title">
              {incomeEdit ? "Edit Pemasukan" : "Tambah Pemasukan"}
            </h2>
            <p className="form-sub">
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

      <div className="form-body">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="income-name" className="field-label">
              Nama Pemasukan
            </label>
            <input
              disabled={isLoading}
              type="text"
              
              id="income-name"
              value={formData.name}
              onChange={handleChange}
              onFocus={() => setFocused("name")}
              onBlur={() => setFocused(null)}
              placeholder="mis. Gaji Bulanan"
              className={getInputClass("name")}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="income-amount" className="field-label">
              Jumlah Pemasukan
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500 pointer-events-none">
                Rp
              </span>
              <input
                type="text"
                
                id="income-amount"
                value={displayAmount}
                onChange={handleChange}
                onFocus={() => setFocused("amount")}
                onBlur={() => setFocused(null)}
                placeholder="0"
                className={`${getInputClass("amount")} field-input--prefixed mono`}
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="income-source" className="field-label">
              Sumber Pemasukan
            </label>
            {!isCustomSource ? (
              <select
                
                id="income-source"
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
                  
                  id="income-source"
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="income-date" className="field-label">
              Tanggal
            </label>
            <input
              type="date"
              
              id="income-date"
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
          <label htmlFor="income-notes" className="field-label">
            Catatan{" "}
            <span className="text-slate-500 font-normal normal-case">
              (Opsional)
            </span>
          </label>
          <textarea
            
            id="income-notes"
            value={formData.notes}
            onChange={handleChange}
            onFocus={() => setFocused("notes")}
            onBlur={() => setFocused(null)}
            placeholder="Tambahkan catatan tambahan..."
            rows={3}
            className={getInputClass("notes")}
            disabled={isLoading}
          />
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={handleClick}
            disabled={isLoading}
            className="dash-btn-primary"
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
              className="dash-btn-secondary"
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
