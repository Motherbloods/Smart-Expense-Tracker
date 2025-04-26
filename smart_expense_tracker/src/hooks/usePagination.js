import { useState, useMemo } from "react";

function usePagination(data = [], itemsPerPage = 10, sortFunction = null) {
  const [currentPage, setCurrentPage] = useState(1);

  // Pertama, urutkan seluruh data jika sortFunction disediakan
  const sortedData = useMemo(() => {
    if (sortFunction) {
      return [...data].sort(sortFunction);
    }
    return data;
  }, [data, sortFunction]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  const currentData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return sortedData.slice(start, end);
  }, [currentPage, sortedData, itemsPerPage]);

  const changePage = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  return {
    currentPage,
    totalPages,
    currentData,
    changePage,
  };
}

export default usePagination;
