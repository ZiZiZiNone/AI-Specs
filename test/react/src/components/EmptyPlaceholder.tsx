// 空状态占位组件
// 职责：展示数据为空时的友好提示

import React from 'react';

interface EmptyPlaceholderProps {
  message?: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyPlaceholder: React.FC<EmptyPlaceholderProps> = ({
  message = '暂无数据',
  actionText,
  onAction,
}) => {
  return (
    <div className="empty-placeholder">
      <div className="empty-icon">📭</div>
      <p className="empty-message">{message}</p>
      {actionText && onAction && (
        <button className="empty-action-btn" onClick={onAction}>
          {actionText}
        </button>
      )}
    </div>
  );
};
