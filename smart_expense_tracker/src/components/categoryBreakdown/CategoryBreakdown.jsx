import expenses from "../../dummy/expenses";

function CategoryBreakdown() {
    const categoryData = {};

    expenses.forEach((expense) => {
        if (!categoryData[expense.category]) {
            categoryData[expense.category] = 0;
        }
        categoryData[expense.category] += expense.amount;
    });

    return (
        <div className="lg:col-span-1">
            <div className="bg-white p-4 mt-4 rounded-xl shadow-lg">
                <h1 className="text-xl font-semibold mb-4">Breakdown Kategori</h1>

                {Object.keys(categoryData).length > 0 ? (
                    <div className="space-y-2 divide-y divide-gray-100">
                        {Object.entries(categoryData).map(([category, amount]) => (
                            <div
                                key={category}
                                className="flex justify-between items-center pt-2 first:pt-0"
                            >
                                <span className="px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800">
                                    {category}
                                </span>
                                <span className="text-sm font-semibold text-gray-700">
                                    Rp {amount.toLocaleString("id-ID")}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-center text-gray-500">
                        Belum ada data kategori
                    </p>
                )}
            </div>
        </div>
    );
}

export default CategoryBreakdown;
