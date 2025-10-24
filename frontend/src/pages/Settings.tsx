import React, { useState } from 'react';
import { Card, Form, Input, Button, Select, Switch, Table, Space, Typography, message, Modal, Tag } from 'antd';
import { Plus, Edit, Trash2, Key, User, Settings as SettingsIcon } from 'lucide-react';

import { useUserStore } from '../stores/userStore';
import { ApiKey } from '../types';

const { Title, Text } = Typography;
const { Option } = Select;

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'api-keys'>('profile');
  const [isAddApiKeyModalVisible, setIsAddApiKeyModalVisible] = useState(false);
  const [isEditApiKeyModalVisible, setIsEditApiKeyModalVisible] = useState(false);
  const [editingApiKey, setEditingApiKey] = useState<ApiKey | null>(null);

  const { user, updateProfile, addApiKey, updateApiKey, deleteApiKey, isLoading } = useUserStore();

  const handleUpdateProfile = async (values: any) => {
    // This would need to be implemented in the backend
    message.success('Profile updated successfully');
  };

  const handleAddApiKey = async (values: any) => {
    const success = await addApiKey(values.provider, values.key, values.model, values.baseUrl);
    if (success) {
      message.success('API key added successfully');
      setIsAddApiKeyModalVisible(false);
    }
  };

  const handleUpdateApiKey = async (values: any) => {
    if (editingApiKey) {
      const success = await updateApiKey(editingApiKey.id, values);
      if (success) {
        message.success('API key updated successfully');
        setIsEditApiKeyModalVisible(false);
        setEditingApiKey(null);
      }
    }
  };

  const handleDeleteApiKey = async (apiKeyId: string) => {
    Modal.confirm({
      title: 'Delete API Key',
      content: 'Are you sure you want to delete this API key?',
      onOk: async () => {
        const success = await deleteApiKey(apiKeyId);
        if (success) {
          message.success('API key deleted successfully');
        }
      },
    });
  };

  const apiKeyColumns = [
    {
      title: 'Provider',
      dataIndex: 'provider',
      key: 'provider',
      render: (provider: string) => (
        <Tag color={provider === 'openai' ? 'green' : provider === 'anthropic' ? 'blue' : 'orange'}>
          {provider.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Model',
      dataIndex: 'model',
      key: 'model',
      render: (model: string) => model || 'Default',
    },
    {
      title: 'Base URL',
      dataIndex: 'baseUrl',
      key: 'baseUrl',
      render: (url: string) => url || 'Default',
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: ApiKey) => (
        <Space>
          <Button
            type="text"
            icon={<Edit size={14} />}
            onClick={() => {
              setEditingApiKey(record);
              setIsEditApiKeyModalVisible(true);
            }}
          />
          <Button
            type="text"
            danger
            icon={<Trash2 size={14} />}
            onClick={() => handleDeleteApiKey(record.id)}
          />
        </Space>
      ),
    },
  ];

  const renderProfileTab = () => (
    <Card>
      <div className="mb-6">
        <Title level={4} className="mb-2">
          Profile Information
        </Title>
        <Text type="secondary">
          Update your personal information and account settings
        </Text>
      </div>

      <Form
        layout="vertical"
        initialValues={{
          name: user?.name,
          email: user?.email,
        }}
        onFinish={handleUpdateProfile}
        className="max-w-md"
      >
        <Form.Item
          name="name"
          label="Full Name"
          rules={[{ required: true, message: 'Please enter your name' }]}
        >
          <Input prefix={<User size={16} />} />
        </Form.Item>

        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: 'Please enter your email' },
            { type: 'email', message: 'Please enter a valid email' },
          ]}
        >
          <Input prefix={<User size={16} />} disabled />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={isLoading}>
            Update Profile
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );

  const renderApiKeysTab = () => (
    <Card>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Title level={4} className="mb-2">
            API Keys
          </Title>
          <Text type="secondary">
            Manage your API keys for different AI providers
          </Text>
        </div>
        <Button
          type="primary"
          icon={<Plus size={16} />}
          onClick={() => setIsAddApiKeyModalVisible(true)}
        >
          Add API Key
        </Button>
      </div>

      <Table
        columns={apiKeyColumns}
        dataSource={user?.apiKeys || []}
        rowKey="id"
        loading={isLoading}
        pagination={false}
      />
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Title level={3} className="mb-1">
            Settings
          </Title>
          <Text type="secondary">
            Manage your account settings and API configurations
          </Text>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        <Button
          type={activeTab === 'profile' ? 'primary' : 'text'}
          icon={<User size={16} />}
          onClick={() => setActiveTab('profile')}
          className="flex items-center"
        >
          Profile
        </Button>
        <Button
          type={activeTab === 'api-keys' ? 'primary' : 'text'}
          icon={<Key size={16} />}
          onClick={() => setActiveTab('api-keys')}
          className="flex items-center"
        >
          API Keys
        </Button>
      </div>

      {/* Content */}
      {activeTab === 'profile' && renderProfileTab()}
      {activeTab === 'api-keys' && renderApiKeysTab()}

      {/* Add API Key Modal */}
      <Modal
        title="Add API Key"
        open={isAddApiKeyModalVisible}
        onCancel={() => setIsAddApiKeyModalVisible(false)}
        footer={null}
        width={500}
      >
        <AddApiKeyForm onSubmit={handleAddApiKey} onCancel={() => setIsAddApiKeyModalVisible(false)} />
      </Modal>

      {/* Edit API Key Modal */}
      <Modal
        title="Edit API Key"
        open={isEditApiKeyModalVisible}
        onCancel={() => {
          setIsEditApiKeyModalVisible(false);
          setEditingApiKey(null);
        }}
        footer={null}
        width={500}
      >
        <EditApiKeyForm
          apiKey={editingApiKey}
          onSubmit={handleUpdateApiKey}
          onCancel={() => {
            setIsEditApiKeyModalVisible(false);
            setEditingApiKey(null);
          }}
        />
      </Modal>
    </div>
  );
};

// Add API Key Form Component
const AddApiKeyForm: React.FC<{ onSubmit: (values: any) => void; onCancel: () => void }> = ({ onSubmit, onCancel }) => {
  const [form] = Form.useForm();

  const handleSubmit = (values: any) => {
    onSubmit(values);
    form.resetFields();
  };

  return (
    <Form form={form} layout="vertical" onFinish={handleSubmit}>
      <Form.Item
        name="provider"
        label="Provider"
        rules={[{ required: true, message: 'Please select a provider' }]}
      >
        <Select placeholder="Select AI provider">
          <Option value="openai">OpenAI</Option>
          <Option value="anthropic">Anthropic</Option>
          <Option value="ollama">Ollama</Option>
        </Select>
      </Form.Item>

      <Form.Item
        name="key"
        label="API Key"
        rules={[{ required: true, message: 'Please enter your API key' }]}
      >
        <Input.Password placeholder="Enter your API key" />
      </Form.Item>

      <Form.Item
        name="model"
        label="Model (Optional)"
      >
        <Input placeholder="e.g., gpt-4, claude-3-sonnet" />
      </Form.Item>

      <Form.Item
        name="baseUrl"
        label="Base URL (Optional)"
      >
        <Input placeholder="e.g., https://api.openai.com/v1" />
      </Form.Item>

      <Form.Item className="mb-0">
        <div className="flex justify-end space-x-3">
          <Button onClick={onCancel}>Cancel</Button>
          <Button type="primary" htmlType="submit">Add API Key</Button>
        </div>
      </Form.Item>
    </Form>
  );
};

// Edit API Key Form Component
const EditApiKeyForm: React.FC<{ 
  apiKey: ApiKey | null; 
  onSubmit: (values: any) => void; 
  onCancel: () => void 
}> = ({ apiKey, onSubmit, onCancel }) => {
  const [form] = Form.useForm();

  React.useEffect(() => {
    if (apiKey) {
      form.setFieldsValue({
        model: apiKey.model,
        baseUrl: apiKey.baseUrl,
        isActive: apiKey.isActive,
      });
    }
  }, [apiKey, form]);

  const handleSubmit = (values: any) => {
    onSubmit(values);
  };

  return (
    <Form form={form} layout="vertical" onFinish={handleSubmit}>
      <Form.Item
        name="model"
        label="Model"
      >
        <Input placeholder="e.g., gpt-4, claude-3-sonnet" />
      </Form.Item>

      <Form.Item
        name="baseUrl"
        label="Base URL"
      >
        <Input placeholder="e.g., https://api.openai.com/v1" />
      </Form.Item>

      <Form.Item
        name="isActive"
        label="Status"
        valuePropName="checked"
      >
        <Switch />
      </Form.Item>

      <Form.Item className="mb-0">
        <div className="flex justify-end space-x-3">
          <Button onClick={onCancel}>Cancel</Button>
          <Button type="primary" htmlType="submit">Update API Key</Button>
        </div>
      </Form.Item>
    </Form>
  );
};

export default Settings;
