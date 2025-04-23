function ExpenseForm() {
    return (
        <div className="bg-white shadow-md p-4 rounded-xl space-y-6">
            <div className="flex justify-between space-x-8">
                <div className="flex flex-col w-full">
                    <label htmlFor="name" className="text-base font-semibold text-gray-700">
                        Nama Pengeluaran
                    </label>
                    <input
                        type="text"
                        id="name"
                        placeholder="Masukkan nama pengeluaran"
                        className="mt-1 p-2 border border-gray-300 rounded-md bg-white"
                    ></input>
                </div>
                <div className="flex flex-col w-full">
                    <label htmlFor="amount" className="text-base font-semibold text-gray-700">
                        Jumlah Pengeluaran
                    </label>
                    <input
                        type="text"
                        id="amount"
                        placeholder="Rp. 0"
                        className="mt-1 p-2 border border-gray-300 rounded-md bg-white"
                    ></input>
                </div>
            </div>
            <div className="flex justify-between space-x-8">
                <div className="flex flex-col w-full">
                    <label htmlFor="category" className="text-base font-semibold text-gray-700">
                        Kategori
                    </label>
                    <select
                        id="category"
                        className="mt-1 p-2 border border-gray-300 rounded-md bg-white"
                    >
                        <option>Makanan</option>
                        <option>Transportasi</option>
                        <option>Kebutuhan Rumah</option>
                        <option>Hiburan</option>
                    </select>
                </div>
                <div className="flex flex-col w-full">
                    <label htmlFor="amount" className="text-base font-semibold text-gray-900">
                        Tanggal
                    </label>
                    <input
                        type="date"
                        id="date"
                        className="bg-white mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>
            <button className="px-6 py-2.5 bg-blue-500 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-opacity-50 cursor-pointer text-white text-base rounded-lg font-semibold transition-colors duration-300 ease-in-out ">Tambah Pengeluaran</button>
        </div>
    );
}

export default ExpenseForm;
