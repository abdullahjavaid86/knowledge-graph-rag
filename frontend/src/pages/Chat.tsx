import React, { useState, useEffect, useRef } from 'react';
import {
  Button,
  Input,
  Card,
  Select,
  Switch,
  Typography,
  Empty,
} from 'antd';
import { Send, Plus, Bot, User, FileText, Zap } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

import { useChatStore } from '../stores/chatStore';
import { ChatMessage, ModelProvider } from '../types';
import { apiClient } from '@/lib/api';

const { TextArea } = Input;
const { Title, Text } = Typography;
const { Option } = Select;

const Chat: React.FC = () => {
  const [message, setMessage] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<string>('openai');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [selectedProviderId, setSelectedProviderId] = useState<string>('');
  const [useRAG, setUseRAG] = useState(true);
  const [providers, setProviders] = useState<ModelProvider[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    currentSession,
    isLoading,
    createSession,
    loadSessions,
    sendMessage,
  } = useChatStore();

  useEffect(() => {
    loadSessions();
    loadProviders();
  }, [loadSessions]);

  useEffect(() => {
    scrollToBottom();
  }, [currentSession?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadProviders = async () => {
    const response = await apiClient.getProviders();
    if (!response.success) {
      return;
    }
    setProviders(response.data?.providers || []);
    const firstProvider = response?.data?.providers?.[0];
    setSelectedProvider(firstProvider?.type || '');
    setSelectedProviderId(`${firstProvider?.type}-${firstProvider?.customKeyId || 'default'}`);
    setSelectedModel(firstProvider?.models?.[0] || '');
  };

  const handleNewSession = async () => {
    createSession();
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const currentProvider = providers.find(p => `${p.type}-${p.customKeyId || 'default'}` === selectedProviderId);
    
    const request = {
      message: message.trim(),
      sessionId: currentSession?.id,
      model: selectedModel,
      provider: selectedProvider,
      useRAG,
      customKeyId: currentProvider?.customKeyId,
      apiKey: currentProvider?.apiKey,
      baseUrl: currentProvider?.baseUrl,
    };

    setMessage('');
    await sendMessage(request);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderMessage = (msg: ChatMessage) => {
    const isUser = msg.role === 'user';

    return (
      <div
        key={msg.id}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div
          className={`flex max-w-3xl ${
            isUser ? 'flex-row-reverse' : 'flex-row'
          } items-start space-x-3`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              isUser ? 'bg-primary-600' : 'bg-gray-200'
            }`}
          >
            {isUser ? (
              <User className="w-4 h-4 text-white" />
            ) : (
              <Bot className="w-4 h-4 text-gray-600" />
            )}
          </div>

          <div className={`flex-1 ${isUser ? 'text-right' : 'text-left'}`}>
            <div
              className={`inline-block p-4 rounded-lg ${
                isUser
                  ? 'bg-primary-600 text-white'
                  : 'bg-white border border-gray-200'
              }`}
            >
              {isUser ? (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              ) : (
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              )}
            </div>

            <div
              className={`text-xs text-gray-500 mt-1 ${
                isUser ? 'text-right' : 'text-left'
              }`}
            >
              {formatTimestamp(msg.timestamp)}
              {msg.metadata && (
                <span className="ml-2">
                  • {msg.metadata.provider} • {msg.metadata.model}
                  {msg.metadata.tokens && ` • ${msg.metadata.tokens} tokens`}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Title level={3} className="mb-1">
            Chat Assistant
          </Title>
          <Text type="secondary">
            Ask questions and get intelligent responses powered by your
            knowledge graph
          </Text>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            icon={<Plus size={16} />}
            onClick={handleNewSession}
            className="flex items-center"
          >
            New Chat
          </Button>
        </div>
      </div>

      {/* Settings Panel */}
      <Card className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Text strong>Provider:</Text>
              <Select
                value={selectedProviderId}
                onChange={(value) => {
                  const provider = providers.find(p => `${p.type}-${p.customKeyId || 'default'}` === value);
                  if (provider) {
                    setSelectedProvider(provider.type);
                    setSelectedProviderId(value);
                    setSelectedModel(provider.models[0] || '');
                  }
                }}
                style={{ width: 180 }}
                size="small"
              >
                {providers.map((provider) => {
                  const providerId = `${provider.type}-${provider.customKeyId || 'default'}`;
                  return (
                    <Option key={providerId} value={providerId}>
                      <div className="flex items-center justify-between">
                        <span>{provider.name}</span>
                        {provider.isDefault && (
                          <span className="text-xs text-gray-500 ml-2">(Default)</span>
                        )}
                        {!provider.isDefault && (
                          <span className="text-xs text-blue-500 ml-2">(Custom)</span>
                        )}
                      </div>
                    </Option>
                  );
                })}
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Text strong>Model:</Text>
              <Select
                value={selectedModel}
                onChange={setSelectedModel}
                style={{ width: 150 }}
                size="small"
              >
                {(() => {
                  const currentProvider = providers.find(p => `${p.type}-${p.customKeyId || 'default'}` === selectedProviderId);
                  return currentProvider?.models.map((model) => (
                    <Option key={model} value={model}>
                      {model}
                    </Option>
                  )) || [];
                })()}
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Zap size={16} className="text-yellow-500" />
              <Text strong>RAG:</Text>
              <Switch checked={useRAG} onChange={setUseRAG} size="small" />
            </div>
          </div>

          <div className="text-sm text-gray-500">
            {useRAG ? 'Enhanced with Knowledge Graph' : 'Direct AI Response'}
          </div>
        </div>
      </Card>

      {/* Chat Messages */}
      <Card className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto p-4 chat-messages">
          {currentSession?.messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <Empty
                image={<FileText size={64} className="text-gray-300" />}
                description={
                  <div className="text-center">
                    <Title level={4} className="text-gray-500">
                      Start a conversation
                    </Title>
                    <Text type="secondary">
                      Ask a question or upload documents to build your knowledge
                      graph
                    </Text>
                  </div>
                }
              />
            </div>
          ) : (
            <div className="space-y-4">
              {currentSession?.messages.map(renderMessage)}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="bg-gray-100 rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                        <div className="loading-dots">Thinking</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Message Input */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-end space-x-3">
            <div className="flex-1">
              <TextArea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message here... (Press Enter to send, Shift+Enter for new line)"
                autoSize={{ minRows: 1, maxRows: 4 }}
                className="resize-none"
                disabled={isLoading}
              />
            </div>
            <Button
              type="primary"
              icon={<Send size={16} />}
              onClick={handleSendMessage}
              loading={isLoading}
              disabled={!message.trim()}
              className="h-10"
            >
              Send
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Chat;
