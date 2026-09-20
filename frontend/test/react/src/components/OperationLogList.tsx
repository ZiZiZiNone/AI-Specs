// 操作记录列表组件
// 职责：展示操作记录列表，不涉及数据加载

import React from 'react';
import type { OperationLog } from '../types/user.types';

interface OperationLogListProps {
  logs: OperationLog[];
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const OperationLogList: React.FC<OperationLogListProps> = ({
  logs,
  hasMore,
  isLoading,
  onLoadMore,
}) => {
  if (logs.length === 0) {
    return (
      <div className="operation-logs-empty">
        <p>暂无操作记录</p>
      </div>
    );
  }

  return (
    <div className="operation-logs">
      <h3>操作记录</h3>

      <div className="logs-list">
        {logs.map((log) => (
          <div key={log.id} className="log-item">
            <div className="log-type">{log.type}</div>
            <div className="log-content">
              <div className="log-description">{log.description}</div>
              <div className="log-meta">
                <span className="log-operator">{log.operator}</span>
                <span className="log-time">{formatDate(log.time)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="logs-load-more">
          <button onClick={onLoadMore} disabled={isLoading}>
            {isLoading ? '加载中...' : '加载更多'}
          </button>
        </div>
      )}
    </div>
  );
};
