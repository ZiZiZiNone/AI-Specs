// 用户筛选器组件
// 职责：展示筛选条件表单，通过回调上报筛选变化

import React, { useState, useEffect } from 'react';
import type { UserRole, UserStatus } from '../types/user.types';

interface UserFilterProps {
  keyword: string;
  role?: UserRole;
  status?: UserStatus;
  onFilterChange: (filters: {
    keyword: string;
    role?: UserRole;
    status?: UserStatus;
  }) => void;
  onReset: () => void;
}

// 防抖 Hook
function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export const UserFilter: React.FC<UserFilterProps> = ({
  keyword: initialKeyword,
  role: initialRole,
  status: initialStatus,
  onFilterChange,
  onReset,
}) => {
  const [keyword, setKeyword] = useState(initialKeyword);
  const [role, setRole] = useState<UserRole | undefined>(initialRole);
  const [status, setStatus] = useState<UserStatus | undefined>(initialStatus);

  // 搜索关键词防抖 300ms
  const debouncedKeyword = useDebouncedValue(keyword, 300);

  // 防抖后触发筛选
  useEffect(() => {
    onFilterChange({
      keyword: debouncedKeyword,
      role,
      status,
    });
  }, [debouncedKeyword, role, status, onFilterChange]);

  const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKeyword(e.target.value);
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setRole(value ? (value as UserRole) : undefined);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setStatus(value ? (value as UserStatus) : undefined);
  };

  const handleReset = () => {
    setKeyword('');
    setRole(undefined);
    setStatus(undefined);
    onReset();
  };

  return (
    <div className="user-filter">
      <div className="filter-item">
        <input
          type="text"
          placeholder="搜索姓名、邮箱"
          value={keyword}
          onChange={handleKeywordChange}
          className="filter-input"
        />
      </div>

      <div className="filter-item">
        <select
          value={role || ''}
          onChange={handleRoleChange}
          className="filter-select"
        >
          <option value="">全部角色</option>
          <option value="admin">管理员</option>
          <option value="user">普通用户</option>
          <option value="guest">访客</option>
        </select>
      </div>

      <div className="filter-item">
        <select
          value={status || ''}
          onChange={handleStatusChange}
          className="filter-select"
        >
          <option value="">全部状态</option>
          <option value="active">启用</option>
          <option value="inactive">禁用</option>
        </select>
      </div>

      <div className="filter-item">
        <button onClick={handleReset} className="filter-reset-btn">
          重置
        </button>
      </div>
    </div>
  );
};
