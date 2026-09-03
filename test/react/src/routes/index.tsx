// 路由配置
// 用户管理系统的路由定义

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { UserListPage } from '../pages/UserListPage';
import { UserDetailPage } from '../pages/UserDetailPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* 默认重定向到用户列表 */}
      <Route path="/" element={<Navigate to="/users" replace />} />

      {/* 用户列表页 */}
      <Route path="/users" element={<UserListPage />} />

      {/* 用户详情页 */}
      <Route path="/users/:id" element={<UserDetailPage />} />

      {/* 404 页面 */}
      <Route path="*" element={<div>404 - 页面不存在</div>} />
    </Routes>
  );
};
