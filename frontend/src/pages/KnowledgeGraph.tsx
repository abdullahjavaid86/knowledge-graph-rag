import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Input,
  Select,
  Upload,
  Modal,
  Table,
  Tag,
  Space,
  Typography,
  message,
  Empty,
  Form,
} from 'antd';
import {
  Plus,
  Search,
  Upload as UploadIcon,
  Network,
  Trash2,
  Eye,
} from 'lucide-react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  Connection,
  addEdge,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useKnowledgeStore } from '../stores/knowledgeStore';
import { KnowledgeNode } from '../types';

const { Title, Text } = Typography;
const { Search: SearchInput } = Input;
const { Option } = Select;

const KnowledgeGraph: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'graph' | 'nodes' | 'upload'>(
    'graph'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNodeType, setSelectedNodeType] = useState<string>('');
  const [isAddNodeModalVisible, setIsAddNodeModalVisible] = useState(false);
  const [isAddRelationModalVisible, setIsAddRelationModalVisible] =
    useState(false);
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { addRelation } = useKnowledgeStore.getState();

  const {
    nodes: knowledgeNodes,
    relations,
    isLoading,
    loadKnowledgeGraph,
    addNode,
    deleteNode,
    searchNodes,
    uploadDocument,
  } = useKnowledgeStore();

  useEffect(() => {
    loadKnowledgeGraph();
  }, [loadKnowledgeGraph]);

  useEffect(() => {
    updateGraphVisualization();
  }, [knowledgeNodes, relations, selectedNodes]);

  const updateGraphVisualization = () => {
    // Use a grid layout for better positioning
    const cols = Math.ceil(Math.sqrt(knowledgeNodes.length));
    const spacing = 200;

    const flowNodes: Node[] = knowledgeNodes.map((node, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;

      return {
        id: node._id,
        type: 'default',
        position: {
          x: col * spacing + 50,
          y: row * spacing + 50,
        },
        data: {
          label: (
            <div className="p-2">
              <div className="font-semibold text-sm">{node.title}</div>
              <div className="text-xs text-gray-500">{node.type}</div>
            </div>
          ),
        },
        style: {
          background: getNodeColor(node.type),
          border: selectedNodes.includes(node._id)
            ? '2px solid #3b82f6'
            : '1px solid #e5e7eb',
          borderRadius: '8px',
          minWidth: 120,
        },
      };
    });

    const flowEdges: Edge[] = relations.map((relation) => ({
      id: `${relation.sourceNodeId}-${relation.targetNodeId}`,
      source: relation.sourceNodeId,
      target: relation.targetNodeId,
      label: relation.relationType,
      type: 'smoothstep',
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
        color: '#6b7280',
      },
      style: {
        stroke: '#6b7280',
        strokeWidth: 2,
      },
    }));

    setNodes(flowNodes);
    setEdges(flowEdges);
  };

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'document':
        return '#dbeafe';
      case 'concept':
        return '#dcfce7';
      case 'entity':
        return '#fef3c7';
      case 'relation':
        return '#fce7f3';
      default:
        return '#f3f4f6';
    }
  };

  const handleSearch = async () => {
    if (searchQuery.trim()) {
      await searchNodes(searchQuery.trim());
    }
  };

  const handleAddNode = async (values: any) => {
    const node = await addNode(
      values.title,
      values.content,
      values.type,
      values.metadata
    );
    if (node) {
      message.success('Node added successfully');
      setIsAddNodeModalVisible(false);
    }
  };

  const handleDeleteNode = async (nodeId: string) => {
    const success = await deleteNode(nodeId);
    if (success) {
      message.success('Node deleted successfully');
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      const result = await uploadDocument(file);
      if (result) {
        message.success(`Document processed: ${result.summary}`);
      }
    } catch (error) {
      message.error('Failed to upload document');
    }
  };

  const nodeColumns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag
          color={
            type === 'document'
              ? 'blue'
              : type === 'concept'
              ? 'green'
              : type === 'entity'
              ? 'orange'
              : 'pink'
          }
        >
          {type}
        </Tag>
      ),
    },
    {
      title: 'Content',
      dataIndex: 'content',
      key: 'content',
      render: (text: string) => (
        <Text ellipsis={{ tooltip: text }} style={{ maxWidth: 200 }}>
          {text}
        </Text>
      ),
    },
    {
      title: 'Connections',
      dataIndex: 'connections',
      key: 'connections',
      render: (connections: string[]) => connections.length,
    },
    {
      title: 'Created',
      dataIndex: 'metadata',
      key: 'created',
      render: (metadata: any) =>
        new Date(metadata.createdAt).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: KnowledgeNode) => (
        <Space>
          <Button
            type="text"
            icon={<Eye size={14} />}
            onClick={() => {
              Modal.info({
                title: record.title,
                content: (
                  <div>
                    <p>
                      <strong>Type:</strong> {record.type}
                    </p>
                    <p>
                      <strong>Content:</strong>
                    </p>
                    <p>{record.content}</p>
                    <p>
                      <strong>Connections:</strong> {record.connections.length}
                    </p>
                  </div>
                ),
                width: 600,
              });
            }}
          />
          <Button
            type="text"
            danger
            icon={<Trash2 size={14} />}
            onClick={() => handleDeleteNode(record._id)}
          />
        </Space>
      ),
    },
  ];

  const handleNodeClick = (_event: React.MouseEvent, node: any) => {
    const nodeId = node.id;
    setSelectedNodes((prev) => {
      if (prev.includes(nodeId)) {
        return prev.filter((id) => id !== nodeId);
      } else if (prev.length < 2) {
        return [...prev, nodeId];
      } else {
        return [nodeId];
      }
    });
  };

  const handleAddRelation = async (values: any) => {
    if (selectedNodes.length === 2) {
      await addRelation(
        selectedNodes[0],
        selectedNodes[1],
        values.relationType,
        values.strength,
        values.metadata
      );
      setSelectedNodes([]);
      setIsAddRelationModalVisible(false);
      message.success('Relation created successfully!');
    }
  };

  // Drag-to-connect handler from ReactFlow canvas
  const onConnect = async (connection: Connection) => {
    try {
      if (!connection.source || !connection.target) return;
      // create backend relation with a sensible default
      const created = await addRelation(
        connection.source,
        connection.target,
        'related',
        0.8,
        { createdVia: 'graph-connect' }
      );
      if (created) {
        // optimistically add edge to UI
        setEdges((eds) =>
          addEdge(
            {
              id: `${connection.source}-${connection.target}`,
              source: connection.source!,
              target: connection.target!,
              type: 'smoothstep',
              label: created.relationType || 'related',
              markerEnd: {
                type: MarkerType.ArrowClosed,
                width: 20,
                height: 20,
                color: '#6b7280',
              },
              style: { stroke: '#6b7280', strokeWidth: 2 },
            },
            eds
          )
        );
        message.success('Relation created');
      }
    } catch (e) {
      message.error('Failed to create relation');
    }
  };

  const renderGraphView = () => (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <Title level={4} className="mb-1">
            Knowledge Graph Visualization
          </Title>
          <Text type="secondary">
            Click on nodes to select them, then create relations between
            selected nodes
          </Text>
        </div>
        <div className="flex items-center space-x-2">
          {selectedNodes.length === 2 && (
            <Button
              type="primary"
              onClick={() => setIsAddRelationModalVisible(true)}
            >
              Create Relation
            </Button>
          )}
          <Button
            onClick={() => {
              setSelectedNodes([]);
              updateGraphVisualization();
            }}
          >
            Clear Selection
          </Button>
        </div>
      </div>

      <div className="h-96 border rounded-lg">
        {knowledgeNodes.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <Empty
              image={<Network size={64} className="text-gray-300" />}
              description="No knowledge nodes found. Upload documents or add nodes to build your knowledge graph."
            />
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={handleNodeClick}
            fitView
            attributionPosition="bottom-left"
          >
            <Controls />
            <Background />
          </ReactFlow>
        )}
      </div>

      {selectedNodes.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <Text strong>Selected Nodes: {selectedNodes.length}/2</Text>
          <div className="mt-2">
            {selectedNodes.map((nodeId) => {
              const node = knowledgeNodes.find((n) => n._id === nodeId);
              return node ? (
                <Tag key={nodeId} color="blue" className="mr-2">
                  {node.title}
                </Tag>
              ) : null;
            })}
          </div>
          {selectedNodes.length === 2 && (
            <Text type="secondary" className="block mt-2">
              Click "Create Relation" to connect these nodes
            </Text>
          )}
        </div>
      )}
    </Card>
  );

  const renderNodesView = () => (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <SearchInput
            placeholder="Search nodes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onSearch={handleSearch}
            style={{ width: 300 }}
          />
          <Select
            placeholder="Filter by type"
            value={selectedNodeType}
            onChange={setSelectedNodeType}
            style={{ width: 150 }}
            allowClear
          >
            <Option value="document">Document</Option>
            <Option value="concept">Concept</Option>
            <Option value="entity">Entity</Option>
            <Option value="relation">Relation</Option>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            type="primary"
            icon={<Plus size={16} />}
            onClick={() => setIsAddNodeModalVisible(true)}
          >
            Add Node
          </Button>
          <Button
            icon={<Network size={16} />}
            onClick={() => setActiveTab('graph')}
          >
            Graph View
          </Button>
        </div>
      </div>

      <Table
        columns={nodeColumns}
        dataSource={knowledgeNodes.filter(
          (node) => !selectedNodeType || node.type === selectedNodeType
        )}
        rowKey="_id"
        loading={isLoading}
        pagination={{ pageSize: 10 }}
      />
    </Card>
  );

  const renderUploadView = () => (
    <Card>
      <div className="text-center py-12">
        <UploadIcon size={64} className="text-gray-300 mx-auto mb-4" />
        <Title level={4} className="text-gray-500 mb-2">
          Upload Documents
        </Title>
        <Text type="secondary" className="mb-6 block">
          Upload PDF, TXT, or MD files to automatically extract knowledge and
          build your graph
        </Text>

        <Upload.Dragger
          name="document"
          multiple={false}
          beforeUpload={(file) => {
            handleFileUpload(file);
            return false;
          }}
          accept=".pdf,.txt,.md,.docx"
        >
          <p className="ant-upload-drag-icon">
            <UploadIcon size={48} className="text-primary-500" />
          </p>
          <p className="ant-upload-text">
            Click or drag file to this area to upload
          </p>
          <p className="ant-upload-hint">
            Support for PDF, TXT, MD, and DOCX files
          </p>
        </Upload.Dragger>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Title level={3} className="mb-1">
            Knowledge Graph
          </Title>
          <Text type="secondary">
            Manage and visualize your knowledge base with{' '}
            {knowledgeNodes.length} nodes and {relations.length} relations
          </Text>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            type={activeTab === 'graph' ? 'primary' : 'default'}
            icon={<Network size={16} />}
            onClick={() => setActiveTab('graph')}
          >
            Graph View
          </Button>
          <Button
            type={activeTab === 'nodes' ? 'primary' : 'default'}
            icon={<Search size={16} />}
            onClick={() => setActiveTab('nodes')}
          >
            Nodes
          </Button>
          <Button
            type={activeTab === 'upload' ? 'primary' : 'default'}
            icon={<UploadIcon size={16} />}
            onClick={() => setActiveTab('upload')}
          >
            Upload
          </Button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'graph' && renderGraphView()}
      {activeTab === 'nodes' && renderNodesView()}
      {activeTab === 'upload' && renderUploadView()}

      {/* Add Node Modal */}
      <Modal
        title="Add Knowledge Node"
        open={isAddNodeModalVisible}
        onCancel={() => setIsAddNodeModalVisible(false)}
        footer={null}
        width={600}
      >
        <AddNodeForm
          onSubmit={handleAddNode}
          onCancel={() => setIsAddNodeModalVisible(false)}
        />
      </Modal>

      {/* Add Relation Modal */}
      <Modal
        title="Create Relation"
        open={isAddRelationModalVisible}
        onCancel={() => setIsAddRelationModalVisible(false)}
        footer={null}
        width={500}
      >
        <AddRelationForm
          onSubmit={handleAddRelation}
          onCancel={() => setIsAddRelationModalVisible(false)}
          selectedNodes={selectedNodes}
          knowledgeNodes={knowledgeNodes}
        />
      </Modal>
    </div>
  );
};

// Add Node Form Component
const AddNodeForm: React.FC<{
  onSubmit: (values: any) => void;
  onCancel: () => void;
}> = ({ onSubmit, onCancel }) => {
  const [form] = Form.useForm();

  const handleSubmit = (values: any) => {
    onSubmit(values);
    form.resetFields();
  };

  return (
    <Form form={form} layout="vertical" onFinish={handleSubmit}>
      <Form.Item
        name="title"
        label="Title"
        rules={[{ required: true, message: 'Please enter a title' }]}
      >
        <Input placeholder="Enter node title" />
      </Form.Item>

      <Form.Item
        name="type"
        label="Type"
        rules={[{ required: true, message: 'Please select a type' }]}
      >
        <Select placeholder="Select node type">
          <Option value="document">Document</Option>
          <Option value="concept">Concept</Option>
          <Option value="entity">Entity</Option>
          <Option value="relation">Relation</Option>
        </Select>
      </Form.Item>

      <Form.Item
        name="content"
        label="Content"
        rules={[{ required: true, message: 'Please enter content' }]}
      >
        <Input.TextArea rows={4} placeholder="Enter node content" />
      </Form.Item>

      <Form.Item className="mb-0">
        <div className="flex justify-end space-x-3">
          <Button onClick={onCancel}>Cancel</Button>
          <Button type="primary" htmlType="submit">
            Add Node
          </Button>
        </div>
      </Form.Item>
    </Form>
  );
};

// Add Relation Form Component
const AddRelationForm: React.FC<{
  onSubmit: (values: any) => void;
  onCancel: () => void;
  selectedNodes: string[];
  knowledgeNodes: KnowledgeNode[];
}> = ({ onSubmit, onCancel, selectedNodes, knowledgeNodes }) => {
  const [form] = Form.useForm();

  const handleSubmit = (values: any) => {
    onSubmit(values);
    form.resetFields();
  };

  const sourceNode = knowledgeNodes.find((n) => n._id === selectedNodes[0]);
  const targetNode = knowledgeNodes.find((n) => n._id === selectedNodes[1]);

  return (
    <Form form={form} layout="vertical" onFinish={handleSubmit}>
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <Text strong>Connecting Nodes:</Text>
        <div className="mt-2">
          <Tag color="blue">{sourceNode?.title}</Tag>
          <span className="mx-2">→</span>
          <Tag color="green">{targetNode?.title}</Tag>
        </div>
      </div>

      <Form.Item
        name="relationType"
        label="Relation Type"
        rules={[{ required: true, message: 'Please enter a relation type' }]}
      >
        <Input placeholder="e.g., contains, relates to, depends on" />
      </Form.Item>

      <Form.Item
        name="strength"
        label="Strength (0-1)"
        rules={[{ required: true, message: 'Please enter a strength value' }]}
      >
        <Input type="number" step="0.1" min="0" max="1" placeholder="0.8" />
      </Form.Item>

      <Form.Item name="metadata" label="Description (Optional)">
        <Input.TextArea rows={3} placeholder="Describe the relationship..." />
      </Form.Item>

      <Form.Item className="mb-0">
        <div className="flex justify-end space-x-3">
          <Button onClick={onCancel}>Cancel</Button>
          <Button type="primary" htmlType="submit">
            Create Relation
          </Button>
        </div>
      </Form.Item>
    </Form>
  );
};

export default KnowledgeGraph;
