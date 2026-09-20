// 错误占位组件
// 职责：展示加载失败时的错误提示和重试按钮

import React from 'react';

interface ErrorPlaceholderProps {
  message: string;
  onRetry?: () => void;
  onBack?: () => void;
}

export const ErrorPlaceholder: React.FC<ErrorPlaceholderProps> = ({
  message,
  onRetry,
  onBack,
}) => {
  return (
    <div className="error-placeholder">
      <div className="error-icon">⚠️</div>
      <p className="error-message">{message}</p>
      <div className="error-actions">
        {onRetry && (
          <button className="error-retry-btn" onClick={onRetry}>
            重试
          </button>
        )}
        {onBack && (
          <button className="error-back-btn" onClick={onBack}>
            返回
          </button>
        )}
      </div>
    </div>
  );
};
