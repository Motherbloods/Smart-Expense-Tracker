import { useMemo } from "react";
import usePagination from "../../hooks/usePagination.js";

function CategoryBreakdown({ expenses }) {
    const allCategoryData = useMemo(() => {
        const categoryTotals = {};
        expenses.forEach((expense) => {
            if (!categoryTotals[expense.category]) {
                categoryTotals[expense.category] = 0;
            }
            categoryTotals[expense.category] += expense.amount;
        });

        // Convert to array for pagination
        return Object.entries(categoryTotals).map(([category, amount]) => ({
            category,
            amount
        }));
    }, [expenses]);

    // Then paginate the category breakdown
    const { currentPage, totalPages, currentData, changePage } = usePagination(allCategoryData, 5);

    return (
        <div className="lg:col-span-1">
            <div className="bg-white p-4 mt-4 rounded-xl shadow-lg">
                <h1 className="text-xl font-semibold mb-4">Breakdown Kategori</h1>

                {currentData.length > 0 ? (
                    <div className="space-y-2 divide-y divide-gray-100">
                        {currentData.map(({ category, amount }) => (
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

            <div className="flex justify-center items-center py-4 mx-auto">
                <button
                    onClick={() => changePage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 cursor-pointer text-sm text-gray-500 border border-gray-300 rounded-md hover:bg-gray-100 mr-4"
                >
                    Previous
                </button>
                <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                </span>
                <button
                    onClick={() => changePage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 cursor-pointer text-sm text-gray-500 border border-gray-300 rounded-md hover:bg-gray-100"
                >
                    Next
                </button>
            </div>
        </div>
    );
}

export default CategoryBreakdown;