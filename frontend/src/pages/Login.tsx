import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { User, Lock, Mail } from 'lucide-react';

import { useUserStore } from '../stores/userStore';

const { Title, Text } = Typography;

const Login: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { login, isLoading, error } = useUserStore();

  const handleSubmit = async (values: { email: string; password: string }) => {
    const success = await login(values.email, values.password);
    if (success) {
      message.success('Login successful!');
      navigate('/chat');
    } else {
      message.error(error || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-white" />
            </div>
            <Title level={2} className="mb-2">
              Welcome Back
            </Title>
            <Text type="secondary">
              Sign in to your Knowledge Graph RAG account
            </Text>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            size="large"
          >
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'Please enter your email' },
                { type: 'email', message: 'Please enter a valid email' },
              ]}
            >
              <Input
                prefix={<Mail className="w-4 h-4 text-gray-400" />}
                placeholder="Enter your email"
                className="rounded-lg"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              rules={[
                { required: true, message: 'Please enter your password' },
                { min: 6, message: 'Password must be at least 6 characters' },
              ]}
            >
              <Input.Password
                prefix={<Lock className="w-4 h-4 text-gray-400" />}
                placeholder="Enter your password"
                className="rounded-lg"
              />
            </Form.Item>

            <Form.Item className="mb-6">
              <Button
                type="primary"
                htmlType="submit"
                loading={isLoading}
                className="w-full h-12 rounded-lg font-medium"
              >
                Sign In
              </Button>
            </Form.Item>
          </Form>

          <div className="text-center">
            <Text type="secondary">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Sign up
              </Link>
            </Text>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login;
