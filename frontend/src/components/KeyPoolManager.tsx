import { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Space,
  Typography,
  Spin,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  message,
  List,
  Tag,
  Popconfirm,
  Empty,
  Progress,
  Tooltip,
  Table,
  Badge,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  ThunderboltOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { settingsApi } from '../services/api/index.js';
import type { KeyPool, KeyPoolCreateRequest, KeyPoolStatsResponse, KeyStats } from '../types';

const { Text } = Typography;
const { TextArea } = Input;

interface KeyPoolManagerProps {
  isMobile: boolean;
}

export default function KeyPoolManager({ isMobile }: KeyPoolManagerProps) {
  const [pools, setPools] = useState<KeyPool[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingPool, setEditingPool] = useState<KeyPool | null>(null);
  const [form] = Form.useForm();
  const [testingPoolId, setTestingPoolId] = useState<string | null>(null);
  const [statsModalVisible, setStatsModalVisible] = useState(false);
  const [currentStats, setCurrentStats] = useState<KeyPoolStatsResponse | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // API 提供商选项
  const apiProviders = [
    { value: 'openai', label: 'OpenAI Compatible', defaultUrl: 'https://api.openai.com/v1' },
    { value: 'gemini', label: 'Google Gemini', defaultUrl: 'https://generativelanguage.googleapis.com/v1beta' },
  ];

  useEffect(() => {
    loadPools();
  }, []);

  const loadPools = async () => {
    setLoading(true);
    try {
      const response = await settingsApi.getKeyPools();
      setPools(response.pools);
    } catch (error) {
      message.error('加载 Key 池列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingPool(null);
    form.resetFields();
    form.setFieldsValue({
      provider: 'openai',
      base_url: 'https://api.openai.com/v1',
      enabled: true,
      keys_text: '',
    });
    setIsModalVisible(true);
  };

  const handleEdit = (pool: KeyPool) => {
    setEditingPool(pool);
    form.setFieldsValue({
      name: pool.name,
      provider: pool.provider,
      base_url: pool.base_url,
      model: pool.model,
      enabled: pool.enabled,
      keys_text: pool.keys.join('\n'),
    });
    setIsModalVisible(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      // 解析 keys（每行一个）
      const keysText = values.keys_text || '';
      const keys = keysText
        .split('\n')
        .map((k: string) => k.trim())
        .filter((k: string) => k.length > 0);

      if (keys.length === 0) {
        message.error('请至少输入一个 API Key');
        return;
      }

      const data: KeyPoolCreateRequest = {
        name: values.name,
        provider: values.provider,
        base_url: values.base_url,
        model: values.model,
        keys: keys,
        enabled: values.enabled,
      };

      if (editingPool) {
        await settingsApi.updateKeyPool(editingPool.id, {
          name: values.name,
          keys: keys,
          enabled: values.enabled,
        });
        message.success('Key 池已更新');
      } else {
        await settingsApi.createKeyPool(data);
        message.success('Key 池已创建');
      }

      setIsModalVisible(false);
      loadPools();
    } catch (error: any) {
      const errorMsg = error?.response?.data?.detail || '保存失败';
      message.error(errorMsg);
    }
  };

  const handleDelete = async (poolId: string) => {
    try {
      await settingsApi.deleteKeyPool(poolId);
      message.success('Key 池已删除');
      loadPools();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleTest = async (poolId: string) => {
    setTestingPoolId(poolId);
    try {
      const result = await settingsApi.testKeyPool(poolId);
      Modal.info({
        title: `测试结果 - ${result.pool_name}`,
        width: 600,
        content: (
          <div style={{ marginTop: 16 }}>
            <div style={{ marginBottom: 16 }}>
              <Progress
                percent={Math.round((result.success_count / result.total_count) * 100)}
                status={result.success_count === result.total_count ? 'success' : 'exception'}
                format={() => `${result.success_count}/${result.total_count} 成功`}
              />
            </div>
            <List
              size="small"
              dataSource={result.results}
              renderItem={(item) => (
                <List.Item>
                  <Space>
                    {item.success ? (
                      <CheckCircleOutlined style={{ color: '#52c41a' }} />
                    ) : (
                      <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                    )}
                    <Text code>{item.key_preview}</Text>
                    <Text type={item.success ? 'success' : 'danger'}>
                      {item.success ? `${item.response_time_ms}ms` : item.message}
                    </Text>
                  </Space>
                </List.Item>
              )}
            />
          </div>
        ),
      });
    } catch (error) {
      message.error('测试失败');
    } finally {
      setTestingPoolId(null);
    }
  };

  const handleViewStats = async (poolId: string) => {
    setStatsLoading(true);
    setStatsModalVisible(true);
    try {
      const stats = await settingsApi.getKeyPoolStats(poolId);
      setCurrentStats(stats);
    } catch (error) {
      message.error('获取统计信息失败');
      setStatsModalVisible(false);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleResetKey = async (poolId: string, key: string) => {
    try {
      await settingsApi.resetKeyStatus(poolId, key);
      message.success('Key 状态已重置');
      // 刷新统计
      const stats = await settingsApi.getKeyPoolStats(poolId);
      setCurrentStats(stats);
    } catch (error) {
      message.error('重置失败');
    }
  };

  const handleProviderChange = (value: string) => {
    const provider = apiProviders.find((p) => p.value === value);
    if (provider) {
      form.setFieldValue('base_url', provider.defaultUrl);
    }
  };

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'openai':
        return 'green';
      case 'anthropic':
        return 'purple';
      case 'gemini':
        return 'blue';
      default:
        return 'default';
    }
  };

  const statsColumns = [
    {
      title: 'Key',
      dataIndex: 'key_preview',
      key: 'key_preview',
      render: (text: string) => <Text code>{text}</Text>,
    },
    {
      title: '请求次数',
      dataIndex: 'request_count',
      key: 'request_count',
      sorter: (a: KeyStats, b: KeyStats) => a.request_count - b.request_count,
    },
    {
      title: '错误次数',
      dataIndex: 'error_count',
      key: 'error_count',
      render: (count: number) => (
        <Text type={count > 0 ? 'danger' : undefined}>{count}</Text>
      ),
    },
    {
      title: '状态',
      dataIndex: 'is_disabled',
      key: 'is_disabled',
      render: (disabled: boolean) =>
        disabled ? (
          <Badge status="error" text="已禁用" />
        ) : (
          <Badge status="success" text="正常" />
        ),
    },
    {
      title: '最后使用',
      dataIndex: 'last_used',
      key: 'last_used',
      render: (time: string) =>
        time ? new Date(time).toLocaleString() : '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: KeyStats) =>
        record.is_disabled && currentStats ? (
          <Button
            type="link"
            size="small"
            onClick={() => handleResetKey(currentStats.pool_id, record.key_full)}
          >
            重置
          </Button>
        ) : null,
    },
  ];

  return (
    <Spin spinning={loading}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 说明 */}
        <Card
          size="small"
          style={{
            background: 'linear-gradient(135deg, #f6ffed 0%, #e8f8e0 100%)',
            border: '1px solid #b7eb8f',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 2px 8px rgba(82, 196, 26, 0.08)'
          }}
        >
          <Space direction="vertical" size={4}>
            <Text strong style={{ color: 'var(--color-success)', fontSize: 14 }}>
              <CheckCircleOutlined style={{ marginRight: 8 }} />
              Key 池轮询功能说明
            </Text>
            <Text type="secondary" style={{ fontSize: 13, lineHeight: 1.6 }}>
              为同一服务商/模型配置多个 API Key，系统会自动轮询使用，避免单个 Key 请求过多。
              轮询不会影响上下文，因为对话历史存储在本地数据库中。
            </Text>
          </Space>
        </Card>

        {/* 操作按钮 */}
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
            style={{
              borderRadius: 'var(--radius-sm)',
              boxShadow: 'var(--shadow-primary)',
            }}
          >
            创建 Key 池
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={loadPools}
            style={{ borderRadius: 'var(--radius-sm)' }}
          >
            刷新
          </Button>
        </Space>

        {/* Key 池列表 */}
        {pools.length === 0 ? (
          <Empty
            description="暂无 Key 池配置"
            style={{
              padding: '60px 0',
              background: 'var(--color-bg-container)',
              borderRadius: 'var(--radius-lg)',
              border: '1px dashed var(--color-border)'
            }}
          />
        ) : (
          <List
            dataSource={pools}
            renderItem={(pool) => (
              <List.Item
                style={{
                  background: 'linear-gradient(180deg, var(--color-bg-container) 0%, var(--color-bg-elevated) 100%)',
                  marginBottom: 16,
                  borderRadius: 'var(--radius-lg)',
                  padding: isMobile ? '16px' : '20px 24px',
                  border: '1px solid var(--color-border-light)',
                  boxShadow: 'var(--shadow-card)',
                  transition: 'all var(--transition-normal) var(--ease-out)',
                }}
                actions={isMobile ? undefined : [
                  <Tooltip title="查看统计" key="stats">
                    <Button
                      type="link"
                      onClick={() => handleViewStats(pool.id)}
                      style={{ color: 'var(--color-info)' }}
                    >
                      统计
                    </Button>
                  </Tooltip>,
                  <Tooltip title="测试所有 Key" key="test">
                    <Button
                      type="link"
                      icon={<ThunderboltOutlined />}
                      loading={testingPoolId === pool.id}
                      onClick={() => handleTest(pool.id)}
                      style={{ color: 'var(--color-warning)' }}
                    >
                      测试
                    </Button>
                  </Tooltip>,
                  <Button
                    type="link"
                    icon={<EditOutlined />}
                    onClick={() => handleEdit(pool)}
                    key="edit"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    编辑
                  </Button>,
                  <Popconfirm
                    title="确定删除此 Key 池？"
                    onConfirm={() => handleDelete(pool.id)}
                    key="delete"
                  >
                    <Button type="link" danger icon={<DeleteOutlined />}>
                      删除
                    </Button>
                  </Popconfirm>,
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space style={{ marginBottom: 4 }}>
                      <Text strong style={{ fontSize: 16, color: 'var(--color-text-primary)' }}>{pool.name}</Text>
                      {pool.enabled ? (
                        <Tag color="success" style={{ borderRadius: 'var(--radius-sm)' }}>启用</Tag>
                      ) : (
                        <Tag color="default" style={{ borderRadius: 'var(--radius-sm)' }}>禁用</Tag>
                      )}
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size={10} style={{ marginTop: 8, width: '100%' }}>
                      <Space wrap size={[8, 8]}>
                        <Tag
                          color={getProviderColor(pool.provider)}
                          style={{
                            borderRadius: 'var(--radius-sm)',
                            fontWeight: 500
                          }}
                        >
                          {pool.provider.toUpperCase()}
                        </Tag>
                        <Tag style={{ borderRadius: 'var(--radius-sm)' }}>{pool.model}</Tag>
                        <Tag
                          color="blue"
                          style={{ borderRadius: 'var(--radius-sm)' }}
                        >
                          {pool.key_count} 个 Key
                        </Tag>
                        <Tag
                          color="orange"
                          style={{ borderRadius: 'var(--radius-sm)' }}
                        >
                          已请求 {pool.total_requests} 次
                        </Tag>
                      </Space>
                      <Text
                        type="secondary"
                        style={{
                          fontSize: 12,
                          fontFamily: 'monospace',
                          background: 'var(--color-bg-elevated)',
                          padding: '4px 8px',
                          borderRadius: 'var(--radius-sm)',
                          display: 'inline-block'
                        }}
                      >
                        Keys: {pool.keys_preview.join(', ')}
                      </Text>
                      {isMobile && (
                        <Space wrap size={[8, 8]} style={{ marginTop: 8 }}>
                          <Button
                            size="small"
                            onClick={() => handleViewStats(pool.id)}
                            style={{ borderRadius: 'var(--radius-sm)' }}
                          >
                            统计
                          </Button>
                          <Button
                            size="small"
                            icon={<ThunderboltOutlined />}
                            loading={testingPoolId === pool.id}
                            onClick={() => handleTest(pool.id)}
                            style={{ borderRadius: 'var(--radius-sm)' }}
                          >
                            测试
                          </Button>
                          <Button
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => handleEdit(pool)}
                            style={{ borderRadius: 'var(--radius-sm)' }}
                          >
                            编辑
                          </Button>
                          <Popconfirm
                            title="确定删除此 Key 池？"
                            onConfirm={() => handleDelete(pool.id)}
                          >
                            <Button
                              size="small"
                              danger
                              icon={<DeleteOutlined />}
                              style={{ borderRadius: 'var(--radius-sm)' }}
                            >
                              删除
                            </Button>
                          </Popconfirm>
                        </Space>
                      )}
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Space>

      {/* 创建/编辑对话框 */}
      <Modal
        title={
          <Space>
            {editingPool ? <EditOutlined /> : <PlusOutlined />}
            <span>{editingPool ? '编辑 Key 池' : '创建 Key 池'}</span>
          </Space>
        }
        open={isModalVisible}
        onOk={handleSave}
        onCancel={() => setIsModalVisible(false)}
        width={isMobile ? '95%' : 600}
        centered
        okText="保存"
        cancelText="取消"
        styles={{
          body: { padding: '24px' }
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Key 池名称"
            rules={[
              { required: true, message: '请输入名称' },
              { max: 50, message: '名称不能超过50个字符' },
            ]}
          >
            <Input placeholder="例如：OpenAI GPT-4 轮询池" />
          </Form.Item>

          <Form.Item
            name="provider"
            label="API 提供商"
            rules={[{ required: true, message: '请选择提供商' }]}
          >
            <Select onChange={handleProviderChange} disabled={!!editingPool}>
              {apiProviders.map((p) => (
                <Select.Option key={p.value} value={p.value}>
                  {p.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="base_url"
            label="API Base URL"
            rules={[{ required: true, message: '请输入 API 地址' }]}
          >
            <Input placeholder="https://api.openai.com/v1" disabled={!!editingPool} />
          </Form.Item>

          <Form.Item
            name="model"
            label="模型名称"
            rules={[{ required: true, message: '请输入模型名称' }]}
            extra="同一 Key 池中的所有 Key 将用于请求此模型"
          >
            <Input placeholder="例如：gpt-4, gpt-3.5-turbo" disabled={!!editingPool} />
          </Form.Item>

          <Form.Item
            name="keys_text"
            label="API Keys（每行一个）"
            rules={[{ required: true, message: '请输入至少一个 API Key' }]}
            extra="每行输入一个 API Key，系统会自动轮询使用"
          >
            <TextArea
              rows={6}
              placeholder={`sk-key1...\nsk-key2...\nsk-key3...`}
              style={{ fontFamily: 'monospace' }}
            />
          </Form.Item>

          <Form.Item name="enabled" label="启用轮询" valuePropName="checked">
            <Switch 
              checkedChildren="启用" 
              unCheckedChildren="禁用"
              style={{
                flexShrink: 0,
                minWidth: '44px'
              }}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 统计对话框 */}
      <Modal
        title="Key 池使用统计"
        open={statsModalVisible}
        onCancel={() => setStatsModalVisible(false)}
        footer={null}
        width={800}
        centered
      >
        <Spin spinning={statsLoading}>
          {currentStats && (
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <Space size="large">
                <Text>
                  总请求: <Text strong>{currentStats.total_requests}</Text>
                </Text>
                <Text>
                  活跃 Key: <Text strong type="success">{currentStats.active_keys}</Text>
                </Text>
                <Text>
                  禁用 Key: <Text strong type="danger">{currentStats.disabled_keys}</Text>
                </Text>
              </Space>

              <Table
                dataSource={currentStats.keys}
                columns={statsColumns}
                rowKey="key_preview"
                size="small"
                pagination={false}
              />
            </Space>
          )}
        </Spin>
      </Modal>
    </Spin>
  );
}
