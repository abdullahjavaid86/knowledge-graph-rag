import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Layout as AntLayout,
  Menu,
  Avatar,
  Dropdown,
  Button,
  Space,
} from 'antd';
import {
  MessageCircle,
  Network,
  Settings,
  LogOut,
  User,
  MenuIcon,
} from 'lucide-react';

import { useUserStore } from '../stores/userStore';
import { useChatStore } from '../stores/chatStore';

const { Header, Sider, Content } = AntLayout;

const Layout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const { user, logout } = useUserStore();
  const { loadSessions } = useChatStore();

  const menuItems = [
    {
      key: '/chat',
      icon: <MessageCircle size={20} />,
      label: 'Chat',
    },
    {
      key: '/knowledge',
      icon: <Network size={20} />,
      label: 'Knowledge Graph',
    },
    {
      key: '/settings',
      icon: <Settings size={20} />,
      label: 'Settings',
    },
  ];

  const userMenuItems = [
    {
      key: 'profile',
      icon: <User size={16} />,
      label: 'Profile',
    },
    {
      key: 'logout',
      icon: <LogOut size={16} />,
      label: 'Logout',
      onClick: () => {
        logout();
        navigate('/login');
      },
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  const handleUserMenuClick = ({ key }: { key: string }) => {
    if (key === 'logout') {
      logout();
      navigate('/login');
    }
  };

  return (
    <AntLayout className="min-h-screen">
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        className="bg-white border-r border-gray-200"
        width={250}
      >
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <Network className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  Knowledge RAG
                </h1>
                <p className="text-xs text-gray-500">Chat Assistant</p>
              </div>
            )}
          </div>
        </div>

        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          className="border-0"
        />
      </Sider>

      <AntLayout>
        <Header className="bg-white border-b border-gray-200 px-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              type="text"
              icon={<MenuIcon />}
              onClick={() => setCollapsed(!collapsed)}
              className={`text-gray-600 ${
                collapsed ? 'rotate-180' : ''
              } transition-all`}
            />
            <h2 className="text-lg font-medium text-gray-900">
              {menuItems.find((item) => item.key === location.pathname)
                ?.label || 'Chat'}
            </h2>
          </div>

          <div className="flex items-center space-x-4">
            <Dropdown
              menu={{ items: userMenuItems, onClick: handleUserMenuClick }}
              placement="bottomRight"
              arrow
            >
              <Space className="cursor-pointer hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors">
                <Avatar size="small" className="bg-primary-600">
                  {user?.name?.charAt(0).toUpperCase()}
                </Avatar>
                <span className="text-sm font-medium text-gray-700">
                  {user?.name}
                </span>
              </Space>
            </Dropdown>
          </div>
        </Header>

        <Content className="p-6 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;
