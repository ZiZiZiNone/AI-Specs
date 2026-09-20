// 分页组件
// 职责：展示分页信息和控制，通过回调上报分页变化

import React from 'react';

interface PaginationProps {
  current: number;
  pageSize: number;
  total: number;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  current,
  pageSize,
  total,
  pageSizeOptions = [10, 20, 50],
  onPageChange,
  onPageSizeChange,
}) => {
  const totalPages = Math.ceil(total / pageSize);
  const hasPrevPage = current > 1;
  const hasNextPage = current < totalPages;

  const handlePrevPage = () => {
    if (hasPrevPage) {
      onPageChange(current - 1);
    }
  };

  const handleNextPage = () => {
    if (hasNextPage) {
      onPageChange(current + 1);
    }
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPageSize = parseInt(e.target.value, 10);
    onPageSizeChange(newPageSize);
  };

  if (total === 0) {
    return null;
  }

  const startItem = (current - 1) * pageSize + 1;
  const endItem = Math.min(current * pageSize, total);

  return (
    <div className="pagination">
      <div className="pagination-info">
        显示第 {startItem}-{endItem} 条，共 {total} 条
      </div>

      <div className="pagination-controls">
        <button
          className="pagination-btn"
          onClick={handlePrevPage}
          disabled={!hasPrevPage}
        >
          上一页
        </button>

        <span className="pagination-current">
          第 {current} / {totalPages} 页
        </span>

        <button
          className="pagination-btn"
          onClick={handleNextPage}
          disabled={!hasNextPage}
        >
          下一页
        </button>
      </div>

      <div className="pagination-page-size">
        <select value={pageSize} onChange={handlePageSizeChange}>
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size} 条/页
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
