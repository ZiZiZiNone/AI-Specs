// 用户列表表格组件
// 职责：展示用户列表数据，不直接请求数据，通过回调上报事件

import React from 'react';
import type { User, SortBy, SortOrder } from '../types/user.types';

interface UserTableProps {
  data: User[];
  sortBy?: SortBy;
  sortOrder?: SortOrder;
  onView: (userId: string) => void;
  onEdit: (userId: string) => void;
  onDelete: (userId: string) => void;
  onToggleStatus: (userId: string, currentStatus: 'active' | 'inactive') => void;
  onSort?: (sortBy: SortBy, sortOrder: SortOrder) => void;
}

/**
 * 格式化日期
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * 格式化角色显示
 */
function formatRole(role: string): string {
  const roleMap: Record<string, string> = {
    admin: '管理员',
    user: '普通用户',
    guest: '访客',
  };
  return roleMap[role] || role;
}

/**
 * 格式化状态显示
 */
function formatStatus(status: string): string {
  const statusMap: Record<string, string> = {
    active: '启用',
    inactive: '禁用',
  };
  return statusMap[status] || status;
}

export const UserTable: React.FC<UserTableProps> = ({
  data,
  sortBy,
  sortOrder,
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
  onSort,
}) => {
  const handleSortClick = (field: SortBy) => {
    if (!onSort) return;

    const newSortOrder: SortOrder =
      sortBy === field && sortOrder === 'asc' ? 'desc' : 'asc';
    onSort(field, newSortOrder);
  };

  return (
    <div className="user-table">
      <table>
        <thead>
          <tr>
            <th>姓名</th>
            <th>邮箱</th>
            <th>角色</th>
            <th>状态</th>
            <th
              className={onSort ? 'sortable' : ''}
              onClick={() => handleSortClick('createdAt')}
            >
              创建时间
              {sortBy === 'createdAt' && (
                <span className="sort-indicator">
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {data.map((user) => (
            <tr key={user.id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{formatRole(user.role)}</td>
              <td>
                <span className={`status-badge status-${user.status}`}>
                  {formatStatus(user.status)}
                </span>
              </td>
              <td>{formatDate(user.createdAt)}</td>
              <td>
                <div className="action-buttons">
                  <button
                    className="btn-link"
                    onClick={() => onView(user.id)}
                  >
                    查看
                  </button>
                  <button
                    className="btn-link"
                    onClick={() => onEdit(user.id)}
                  >
                    编辑
                  </button>
                  <button
                    className="btn-link"
                    onClick={() => onDelete(user.id)}
                  >
                    删除
                  </button>
                  <button
                    className="btn-link"
                    onClick={() => onToggleStatus(user.id, user.status)}
                  >
                    {user.status === 'active' ? '禁用' : '启用'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
