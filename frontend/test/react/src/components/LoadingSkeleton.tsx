// Loading 骨架屏组件
// 职责：展示加载中的骨架屏

import React from 'react';

export const LoadingSkeleton: React.FC = () => {
  return (
    <div className="loading-skeleton">
      <div className="skeleton-item" style={{ height: '60px', marginBottom: '16px' }} />
      <div className="skeleton-item" style={{ height: '40px', marginBottom: '12px' }} />
      <div className="skeleton-item" style={{ height: '40px', marginBottom: '12px' }} />
      <div className="skeleton-item" style={{ height: '40px', marginBottom: '12px' }} />
    </div>
  );
};

export const TableLoadingSkeleton: React.FC = () => {
  return (
    <div className="table-loading-skeleton">
      {[1, 2, 3, 4, 5].map((index) => (
        <div key={index} className="skeleton-row" style={{ marginBottom: '12px' }}>
          <div className="skeleton-item" style={{ height: '40px' }} />
        </div>
      ))}
    </div>
  );
};
