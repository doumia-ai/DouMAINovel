import { useState, useEffect } from 'react';

import { useNavigate } from 'react-router-dom';
import {
  Card,
  Button,
  Space,
  Typography,
  Modal,
  Form,
  Input,
  Switch,
  Select,
  message,
  Tag,
  Spin,
  Empty,
  Alert,
  Row,
  Col,
  theme, // 1. 引入 theme
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ThunderboltOutlined,
  InfoCircleOutlined,
  ToolOutlined,
  ArrowLeftOutlined,
  ApiOutlined,
  QuestionCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { mcpPluginApi, settingsApi } from '../services/api/index.js';
import type { MCPPlugin, MCPTool } from '../types';

const { Paragraph, Text, Title } = Typography;
const { TextArea } = Input;

export default function MCPPluginsPage() {
  const navigate = useNavigate();
  // 2. 获取当前主题的 Token（核心修复）
  const { token } = theme.useToken();
  
  const isMobile = window.innerWidth <= 768;
  const [form] = Form.useForm();
  const [modal, contextHolder] = Modal.useModal();
  const [loading, setLoading] = useState(false);
  const [plugins, setPlugins] = useState<MCPPlugin[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPlugin, setEditingPlugin] = useState<MCPPlugin | null>(null);
  const [testingPluginId, setTestingPluginId] = useState<string | null>(null);
  const [viewingTools, setViewingTools] = useState<{ pluginId: string; tools: MCPTool[] } | null>(null);
  const [checkingFunctionCalling, setCheckingFunctionCalling] = useState(false);
  const [modelSupportStatus, setModelSupportStatus] = useState<'unknown' | 'supported' | 'unsupported'>('unknown');

  useEffect(() => {
    const initPage = async () => {
      setLoading(true);
      try {
        const [pluginsData, settings] = await Promise.all([
          mcpPluginApi.getPlugins(),
          settingsApi.getSettings()
        ]);
        
        setPlugins(pluginsData);

        const verifiedConfigStr = localStorage.getItem('mcp_verified_config');
        if (verifiedConfigStr) {
          try {
            const verifiedConfig = JSON.parse(verifiedConfigStr);
            const currentConfig = {
              provider: settings.api_provider,
              baseUrl: settings.api_base_url,
              model: settings.llm_model
            };

            const isConfigChanged =
              verifiedConfig.provider !== currentConfig.provider ||
              verifiedConfig.baseUrl !== currentConfig.baseUrl ||
              verifiedConfig.model !== currentConfig.model;

            if (isConfigChanged) {
              setModelSupportStatus('unknown');
              
              const activePlugins = pluginsData.filter(p => p.enabled);
              if (activePlugins.length > 0) {
                message.loading({ content: '检测到模型配置变更，正在为了安全自动禁用插件...', key: 'auto_disable' });
                await Promise.all(activePlugins.map(p => mcpPluginApi.togglePlugin(p.id, false)));
                const updatedPlugins = await mcpPluginApi.getPlugins();
                setPlugins(updatedPlugins);
                message.success({ content: '已自动禁用所有插件，请重新检测模型能力', key: 'auto_disable' });
                
                modal.warning({
                  title: '配置变更提醒',
                  centered: true,
                  content: '检测到您更换了 AI 模型或接口地址。为了防止错误调用，系统已自动暂停所有 MCP 插件。请重新进行"模型能力检查"，确认新模型支持 Function Calling 后再启用插件。',
                  okText: '知道了',
                });
              } else {
                message.info('检测到模型配置已变更，请重新检测模型能力');
              }
              localStorage.removeItem('mcp_verified_config');
            } else {
              const cachedStatus = verifiedConfig.status || 'supported';
              setModelSupportStatus(cachedStatus as 'unknown' | 'supported' | 'unsupported');
            }
          } catch (e) {
            console.error('Failed to parse verified config:', e);
            localStorage.removeItem('mcp_verified_config');
          }
        }
      } catch (error) {
        console.error('Init page failed:', error);
        message.error('页面初始化失败');
      } finally {
        setLoading(false);
      }
    };
    initPage();
  }, [modal]);

  const loadPlugins = async () => {
    try {
      const data = await mcpPluginApi.getPlugins();
      setPlugins(data);
    } catch (error) {
      console.error('Load plugins failed:', error);
      message.error('加载插件列表失败');
    }
  };

  const handleCreate = () => {
    if (modelSupportStatus !== 'supported') {
      modal.confirm({
        title: '模型能力检查',
        centered: true,
        icon: <WarningOutlined />,
        content: '为了确保 MCP 插件正常工作，您当前使用的 AI 模型必须支持 Function Calling（工具调用）能力。请先进行模型支持检测。',
        okText: '去检测',
        cancelText: '取消',
        onOk: handleCheckFunctionCalling,
      });
      return;
    }
    setEditingPlugin(null);
    form.resetFields();
    form.setFieldsValue({
      enabled: true,
      category: 'search',
      config_json: `{
  "mcpServers": {
    "exa": {
      "type": "http",
      "url": "https://mcp.exa.ai/mcp?exaApiKey=YOUR_API_KEY",
      "headers": {}
    }
  }
}`
    });
    setModalVisible(true);
  };

  const handleEdit = (plugin: MCPPlugin) => {
    setEditingPlugin(plugin);
    const mcpConfig: Record<string, Record<string, Record<string, unknown>>> = {
      mcpServers: {
        [plugin.plugin_name]: {
          type: plugin.plugin_type || 'http'
        }
      }
    };

    if (plugin.plugin_type === 'http' || plugin.plugin_type === 'streamable_http' || plugin.plugin_type === 'sse') {
      mcpConfig.mcpServers[plugin.plugin_name].url = plugin.server_url;
      mcpConfig.mcpServers[plugin.plugin_name].headers = plugin.headers || {};
    } else {
      mcpConfig.mcpServers[plugin.plugin_name].command = plugin.command;
      mcpConfig.mcpServers[plugin.plugin_name].args = plugin.args || [];
      mcpConfig.mcpServers[plugin.plugin_name].env = plugin.env || {};
    }

    form.setFieldsValue({
      config_json: JSON.stringify(mcpConfig, null, 2),
      enabled: plugin.enabled,
      category: plugin.category || 'general',
    });
    setModalVisible(true);
  };

  const handleDelete = (plugin: MCPPlugin) => {
    modal.confirm({
      title: '删除插件',
      content: `确定要删除插件 "${plugin.display_name || plugin.plugin_name}" 吗？`,
      centered: true,
      okText: '确定',
      cancelText: '取消',
      okType: 'danger',
      onOk: async () => {
        try {
          await mcpPluginApi.deletePlugin(plugin.id);
          message.success('插件已删除');
          loadPlugins();
        } catch (error) {
          console.error('Delete plugin failed:', error);
          message.error('删除插件失败');
        }
      },
    });
  };

  const handleToggle = async (plugin: MCPPlugin, enabled: boolean) => {
    try {
      await mcpPluginApi.togglePlugin(plugin.id, enabled);
      message.success(enabled ? '插件已启用' : '插件已禁用');
      loadPlugins();
    } catch (error) {
      console.error('Toggle plugin failed:', error);
      message.error('切换插件状态失败');
    }
  };

  const handleTest = async (pluginId: string) => {
    setTestingPluginId(pluginId);
    try {
      const result = await mcpPluginApi.testPlugin(pluginId);
      await loadPlugins();

      if (result.success) {
        const suggestions = result.suggestions || [];
        const aiChoice = suggestions.find((s: string) => s.startsWith('🤖'))?.replace('🤖 AI选择: ', '') || '';
        const paramsStr = suggestions.find((s: string) => s.startsWith('📝'))?.replace('📝 参数: ', '') || '';
        const callTime = suggestions.find((s: string) => s.startsWith('⏱️'))?.replace('⏱️ 耗时: ', '') || '';
        const resultStr = suggestions.find((s: string) => s.startsWith('📊'))?.replace('📊 结果:\n', '') || '';

        modal.success({
          title: '🎉 测试成功',
          centered: true,
          width: isMobile ? '95%' : 700,
          content: (
            <div style={{ padding: '8px 0' }}>
              <div style={{ marginBottom: 16, padding: 12, background: token.colorSuccessBg, border: `1px solid ${token.colorSuccessBorder}`, borderRadius: 8 }}>
                <Typography.Text strong style={{ color: token.colorSuccess, fontSize: 14 }}>
                  ✓ {result.message}
                </Typography.Text>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div style={{ padding: 12, background: token.colorBgLayout, borderRadius: 8 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>可用工具数</Text>
                  <div><Text strong style={{ fontSize: 20 }}>{result.tools_count || 0}</Text></div>
                </div>
                <div style={{ padding: 12, background: token.colorBgLayout, borderRadius: 8 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>总响应时间</Text>
                  <div><Text strong style={{ fontSize: 20 }}>{result.response_time_ms?.toFixed(0) || 0}ms</Text></div>
                </div>
              </div>

              {aiChoice && (
                <div style={{ marginBottom: 12, padding: 12, background: token.colorInfoBg, borderRadius: 8, border: `1px solid ${token.colorInfoBorder}` }}>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>🤖 AI选择的工具</Text>
                  <Text code strong style={{ color: token.colorText }}>{aiChoice}</Text>
                  {callTime && <Tag color="blue" style={{ marginLeft: 8 }}>{callTime}</Tag>}
                </div>
              )}

              {paramsStr && (
                <div style={{ marginBottom: 12 }}>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>📝 调用参数</Text>
                  <pre style={{ margin: 0, padding: 8, background: token.colorBgLayout, borderRadius: 4, fontSize: 12, overflow: 'auto', maxHeight: 100, color: token.colorText }}>
                    {(() => { try { return JSON.stringify(JSON.parse(paramsStr), null, 2); } catch { return paramsStr; } })()}
                  </pre>
                </div>
              )}

              {resultStr && (
                <div style={{ marginBottom: 12 }}>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>📊 返回结果预览</Text>
                  <pre style={{ margin: 0, padding: 8, background: token.colorBgLayout, borderRadius: 4, fontSize: 11, overflow: 'auto', maxHeight: 150, whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: token.colorText }}>
                    {resultStr}
                  </pre>
                </div>
              )}
            </div>
          ),
        });
      } else {
        modal.error({
          title: '测试失败',
          centered: true,
          width: isMobile ? '90%' : 600,
          content: (
            <div style={{ padding: '8px 0' }}>
              <div style={{ marginBottom: 16 }}>
                <Alert message={result.message || 'MCP插件测试失败'} type="error" showIcon />
              </div>
              {result.error && (
                <div style={{
                  padding: 16,
                  background: token.colorErrorBg,
                  border: `1px solid ${token.colorErrorBorder}`,
                  borderRadius: 8,
                  marginBottom: 16
                }}>
                  <Text strong style={{ fontSize: 14, display: 'block', marginBottom: 8 }}>错误信息:</Text>
                  <Text style={{ fontSize: 13, color: token.colorError, fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {result.error}
                  </Text>
                </div>
              )}
            </div>
          ),
        });
      }
    } catch {
      message.error('测试插件失败');
    } finally {
      setTestingPluginId(null);
    }
  };

  const handleViewTools = async (pluginId: string) => {
    try {
      const result = await mcpPluginApi.getPluginTools(pluginId);
      setViewingTools({ pluginId, tools: result.tools });
    } catch (error) {
      console.error('Get tools failed:', error);
      message.error('获取工具列表失败');
    }
  };

  const handleCheckFunctionCalling = async () => {
    setCheckingFunctionCalling(true);
    try {
      const settings = await settingsApi.getSettings();
      if (!settings.api_key || !settings.llm_model) {
        message.warning('请先在设置页面配置 API Key 和模型');
        return;
      }

      const result = await settingsApi.checkFunctionCalling({
        api_key: settings.api_key,
        api_base_url: settings.api_base_url || '',
        provider: settings.api_provider || 'openai',
        llm_model: settings.llm_model,
      });

      const configToCache = {
        provider: settings.api_provider,
        baseUrl: settings.api_base_url,
        model: settings.llm_model,
        status: result.success && result.supported ? 'supported' : 'unsupported',
        testedAt: new Date().toISOString()
      };
      localStorage.setItem('mcp_verified_config', JSON.stringify(configToCache));

      if (result.success && result.supported) {
        setModelSupportStatus('supported');
        modal.success({
          title: '✅ Function Calling 支持检测',
          centered: true,
          width: isMobile ? '95%' : 700,
          content: (
            <div style={{ padding: '8px 0' }}>
              <div style={{ marginBottom: 16, padding: 12, background: token.colorSuccessBg, border: `1px solid ${token.colorSuccessBorder}`, borderRadius: 8 }}>
                <Typography.Text strong style={{ color: token.colorSuccess, fontSize: 14 }}>
                  ✓ {result.message}
                </Typography.Text>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div style={{ padding: 12, background: token.colorBgLayout, borderRadius: 8 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>API 提供商</Text>
                  <div><Text strong style={{ fontSize: 16 }}>{result.provider}</Text></div>
                </div>
                <div style={{ padding: 12, background: token.colorBgLayout, borderRadius: 8 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>响应时间</Text>
                  <div><Text strong style={{ fontSize: 16 }}>{result.response_time_ms?.toFixed(0) || 0}ms</Text></div>
                </div>
              </div>
            </div>
          ),
        });
      } else {
        setModelSupportStatus('unsupported');
        modal.warning({
          title: '❌ Function Calling 支持检测',
          centered: true,
          width: isMobile ? '95%' : 700,
          content: (
            <div style={{ padding: '8px 0' }}>
              <div style={{ marginBottom: 16 }}>
                <Alert message={result.message || '模型不支持 Function Calling'} type="warning" showIcon />
              </div>
              {result.error && (
                <div style={{
                  padding: 16,
                  background: token.colorWarningBg,
                  border: `1px solid ${token.colorWarningBorder}`,
                  borderRadius: 8,
                  marginBottom: 16
                }}>
                  <Text strong style={{ fontSize: 14, display: 'block', marginBottom: 8 }}>错误信息:</Text>
                  <Text style={{ fontSize: 13, fontFamily: 'monospace' }}>{result.error}</Text>
                </div>
              )}
            </div>
          ),
        });
      }
    } catch (error) {
      console.error('Check function calling failed:', error);
      message.error('检测失败，请稍后重试');
      setModelSupportStatus('unsupported');
    } finally {
      setCheckingFunctionCalling(false);
    }
  };

  const handleSubmit = async (values: { config_json: string; enabled: boolean; category?: string }) => {
    setLoading(true);
    try {
      try {
        JSON.parse(values.config_json);
      } catch {
        message.error('配置JSON格式错误，请检查');
        setLoading(false);
        return;
      }
      const data = {
        config_json: values.config_json,
        enabled: values.enabled,
        category: values.category || 'general',
      };
      await mcpPluginApi.createPluginSimple(data);
      message.success(editingPlugin ? '插件已更新' : '插件已创建');
      setModalVisible(false);
      form.resetFields();
      loadPlugins();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      message.error(err?.response?.data?.detail || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (plugin: MCPPlugin) => {
    if (!plugin.enabled) return <Tag color="default">已禁用</Tag>;
    switch (plugin.status) {
      case 'active': return <Tag color="success" icon={<CheckCircleOutlined />}>运行中</Tag>;
      case 'error': return <Tag color="error" icon={<CloseCircleOutlined />} title={plugin.last_error}>错误</Tag>;
      default: return <Tag color="default">未激活</Tag>;
    }
  };

  return (
    <>
      {contextHolder}
      <div style={{
        minHeight: '100vh',
        // 3. 修复页面大背景：移除硬编码的 #EEF2F3，改用 token
        background: `linear-gradient(180deg, ${token.colorBgBase} 0%, ${token.colorBgLayout} 100%)`,
        padding: isMobile ? '20px 16px' : '40px 24px',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{
          maxWidth: 1400,
          margin: '0 auto',
          width: '100%',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* 顶部导航卡片 */}
          <Card
            variant="borderless"
            style={{
              background: `linear-gradient(135deg, ${token.colorPrimary} 0%, #5A9BA5 50%, ${token.colorPrimaryActive || token.colorPrimary} 100%)`,
              borderRadius: isMobile ? 16 : 24,
              boxShadow: '0 12px 40px rgba(77, 128, 136, 0.25), 0 4px 12px rgba(0, 0, 0, 0.06)',
              marginBottom: isMobile ? 20 : 24,
              border: 'none',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* 装饰性背景保持不变，因为它们是透明度层 */}
            <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255, 255, 255, 0.08)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: -40, left: '30%', width: 120, height: 120, borderRadius: '50%', background: 'rgba(255, 255, 255, 0.05)', pointerEvents: 'none' }} />

            <Row align="middle" justify="space-between" gutter={[16, 16]} style={{ position: 'relative', zIndex: 1 }}>
              <Col xs={24} sm={12}>
                <Space direction="vertical" size={4}>
                  <Space align="center">
                    <Title level={isMobile ? 3 : 2} style={{ margin: 0, color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                      <ToolOutlined style={{ color: 'rgba(255,255,255,0.9)', marginRight: 8 }} />
                      MCP插件管理
                    </Title>
                  </Space>
                  <Text style={{ fontSize: isMobile ? 12 : 14, color: 'rgba(255,255,255,0.85)', marginLeft: isMobile ? 40 : 48 }}>
                    扩展AI能力，连接外部工具与服务
                  </Text>
                </Space>
              </Col>
              <Col xs={24} sm={12}>
                <Space size={12} style={{ display: 'flex', justifyContent: isMobile ? 'flex-start' : 'flex-end', width: '100%' }}>
                  <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/')} style={{ borderRadius: 12, background: 'rgba(255, 255, 255, 0.15)', border: '1px solid rgba(255, 255, 255, 0.3)', color: '#fff' }}>
                    返回主页
                  </Button>
                  <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate} style={{ borderRadius: 12, background: 'rgba(255, 193, 7, 0.95)', border: '1px solid rgba(255, 255, 255, 0.3)', color: '#fff', fontWeight: 600 }}>
                    添加插件
                  </Button>
                </Space>
              </Col>
            </Row>

            <div style={{ marginTop: isMobile ? 16 : 24, display: 'flex', gap: 16, flexDirection: isMobile ? 'column' : 'row' }}>
              {/* 4. 修复信息卡片：显式指定背景色为 Token，移除硬编码的白色 */}
              <Card
                variant="borderless"
                style={{
                  flex: 1,
                  borderRadius: 12,
                  background: token.colorBgContainer, // 自动适配深/浅
                  border: `1px solid ${token.colorBorderSecondary}`,
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)'
                }}
                bodyStyle={{ padding: 20 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Space align="start">
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%',
                      background: (() => {
                        if (modelSupportStatus === 'supported') return token.colorSuccessBg;
                        if (modelSupportStatus === 'unsupported') return token.colorErrorBg;
                        return token.colorInfoBg;
                      })(),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: `1px solid ${(() => {
                        if (modelSupportStatus === 'supported') return token.colorSuccessBorder;
                        if (modelSupportStatus === 'unsupported') return token.colorErrorBorder;
                        return token.colorInfoBorder;
                      })()}`
                    }}>
                      {modelSupportStatus === 'supported' ? (
                        <CheckCircleOutlined style={{ fontSize: 20, color: token.colorSuccess }} />
                      ) : modelSupportStatus === 'unsupported' ? (
                        <CloseCircleOutlined style={{ fontSize: 20, color: token.colorError }} />
                      ) : (
                        <QuestionCircleOutlined style={{ fontSize: 20, color: token.colorInfo }} />
                      )}
                    </div>
                    <div>
                      <Text strong style={{ fontSize: 16, display: 'block', color: token.colorText }}>模型能力检查</Text>
                      <Text type="secondary" style={{ fontSize: 13 }}>
                        {(() => {
                          if (modelSupportStatus === 'supported') return '当前模型支持 Function Calling';
                          if (modelSupportStatus === 'unsupported') return '当前模型不支持 Function Calling';
                          return '请先检测模型能力';
                        })()}
                      </Text>
                    </div>
                  </Space>
                  <Button type={modelSupportStatus === 'supported' ? 'default' : 'primary'} icon={<ApiOutlined />} onClick={handleCheckFunctionCalling} loading={checkingFunctionCalling} style={{ borderRadius: 8 }}>
                    {modelSupportStatus === 'unknown' ? '开始检测' : '重新检测'}
                  </Button>
                </div>
              </Card>

              <Card
                variant="borderless"
                style={{
                  flex: 1,
                  borderRadius: 12,
                  background: token.colorBgContainer, // 自动适配深/浅
                  border: `1px solid ${token.colorBorderSecondary}`,
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)'
                }}
                bodyStyle={{ padding: 20 }}
              >
                <Space align="start">
                  <InfoCircleOutlined style={{ fontSize: 20, color: token.colorPrimary, marginTop: 4 }} />
                  <div>
                    <Text strong style={{ fontSize: 16, display: 'block', color: token.colorText, marginBottom: 4 }}>什么是 MCP 插件？</Text>
                    <Text style={{ fontSize: 13, display: 'block', color: token.colorTextSecondary, lineHeight: 1.6 }}>
                      MCP (Model Context Protocol) 协议允许 AI 调用外部工具获取数据，大幅增强创作能力。
                    </Text>
                  </div>
                </Space>
              </Card>
            </div>
          </Card>

          <div style={{ flex: 1 }}>
            {modelSupportStatus !== 'supported' && plugins.length > 0 && (
              <Alert
                message={modelSupportStatus === 'unsupported' ? '当前模型不支持 Function Calling' : '请先完成模型能力检查'}
                type={modelSupportStatus === 'unsupported' ? 'error' : 'warning'}
                showIcon
                style={{ marginBottom: 16, borderRadius: 8 }}
              />
            )}

            <Spin spinning={loading}>
              {plugins.length === 0 ? (
                <Empty description="还没有添加任何插件" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: isMobile ? '40px 0' : '60px 0' }}>
                  <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>添加第一个插件</Button>
                </Empty>
              ) : (
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  {plugins.map((plugin) => (
                    // 5. 修复插件列表卡片：显式指定背景色和边框
                    <Card
                      key={plugin.id}
                      size="small"
                      style={{
                        borderRadius: 8,
                        border: `1px solid ${token.colorBorderSecondary}`,
                        background: token.colorBgContainer, 
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Space direction="vertical" size="small" style={{ width: '100%' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <Text strong style={{ fontSize: isMobile ? '14px' : '16px', color: token.colorText }}>
                                {plugin.display_name || plugin.plugin_name}
                              </Text>
                              {getStatusTag(plugin)}
                              <Tag color={['http', 'streamable_http', 'sse'].includes(plugin.plugin_type || '') ? 'blue' : 'cyan'}>
                                {plugin.plugin_type?.toUpperCase() || 'UNKNOWN'}
                              </Tag>
                              {plugin.category && plugin.category !== 'general' && <Tag color="purple">{plugin.category}</Tag>}
                            </div>
                            {plugin.description && (
                              <Paragraph type="secondary" style={{ margin: 0, fontSize: isMobile ? '12px' : '13px' }} ellipsis={{ rows: 2 }}>
                                {plugin.description}
                              </Paragraph>
                            )}
                            
                            {/* 6. 修复 URL 文字颜色 */}
                            {(['http', 'streamable_http', 'sse'].includes(plugin.plugin_type || '')) && plugin.server_url && (
                              <div style={{ fontSize: isMobile ? '11px' : '12px' }}>
                                <Text type="secondary" code style={{ color: token.colorTextSecondary }}>
                                  {plugin.server_url.replace(/([?&])(apiKey|api_key|key|token|secret|password|auth)=([^&]+)/gi, '$1$2=***')}
                                </Text>
                              </div>
                            )}

                            {plugin.plugin_type === 'stdio' && plugin.command && (
                              <div style={{ fontSize: isMobile ? '11px' : '12px' }}>
                                <Text type="secondary" code style={{ color: token.colorTextSecondary }}>
                                  {plugin.command} {plugin.args?.join(' ')}
                                </Text>
                              </div>
                            )}

                            {plugin.last_error && <Text type="danger" style={{ fontSize: isMobile ? '11px' : '12px' }}>错误: {plugin.last_error}</Text>}
                          </Space>
                        </div>

                        <Space size="small" wrap>
                          <Switch
                            checked={plugin.enabled}
                            onChange={(checked) => handleToggle(plugin, checked)}
                            disabled={modelSupportStatus !== 'supported'}
                            size={isMobile ? 'small' : 'default'}
                            style={{ 
                              display: 'inline-block',
                              flexShrink: 0, 
                              minWidth: isMobile ? '28px' : '44px',
                              minHeight: isMobile ? '16px' : '22px'
                            }}
                          />
                          <Button icon={<ThunderboltOutlined />} onClick={() => handleTest(plugin.id)} loading={testingPluginId === plugin.id} disabled={modelSupportStatus !== 'supported'} size={isMobile ? 'small' : 'middle'} />
                          <Button icon={<ToolOutlined />} onClick={() => handleViewTools(plugin.id)} disabled={modelSupportStatus !== 'supported' || !plugin.enabled || plugin.status !== 'active'} size={isMobile ? 'small' : 'middle'} />
                          <Button icon={<EditOutlined />} onClick={() => handleEdit(plugin)} disabled={modelSupportStatus !== 'supported'} size={isMobile ? 'small' : 'middle'} />
                          <Button danger icon={<DeleteOutlined />} onClick={() => handleDelete(plugin)} disabled={modelSupportStatus !== 'supported'} size={isMobile ? 'small' : 'middle'} />
                        </Space>
                      </div>
                    </Card>
                  ))}
                </Space>
              )}
            </Spin>
          </div>
        </div>
        
        {/* Modals 保持不变，Antd 会自动处理其样式 */}
        <Modal
          title={editingPlugin ? '编辑插件' : '添加插件'}
          open={modalVisible}
          centered
          onCancel={() => { setModalVisible(false); form.resetFields(); }}
          onOk={() => form.submit()}
          width={isMobile ? '100%' : 600}
          confirmLoading={loading}
          okText="保存"
          cancelText="取消"
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item label="MCP配置JSON" name="config_json" rules={[{ required: true, message: '请输入配置JSON' }]} extra="粘贴标准MCP配置，系统自动提取插件名称。">
              <TextArea rows={16} style={{ fontFamily: 'monospace', fontSize: '13px' }} />
            </Form.Item>
            <Form.Item label="插件分类" name="category" rules={[{ required: true, message: '请选择插件分类' }]}>
              <Select placeholder="请选择分类">
                <Select.Option value="search">搜索类 (Search)</Select.Option>
                <Select.Option value="analysis">分析类 (Analysis)</Select.Option>
                <Select.Option value="filesystem">文件系统 (FileSystem)</Select.Option>
                <Select.Option value="database">数据库 (Database)</Select.Option>
                <Select.Option value="api">API调用 (API)</Select.Option>
                <Select.Option value="generation">生成类 (Generation)</Select.Option>
                <Select.Option value="general">通用 (General)</Select.Option>
              </Select>
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title={<Space><ToolOutlined /><span>可用工具列表</span></Space>}
          open={!!viewingTools}
          onCancel={() => setViewingTools(null)}
          footer={[<Button key="close" type="primary" onClick={() => setViewingTools(null)}>关闭</Button>]}
          width={isMobile ? '95%' : 800}
          centered
        >
          {viewingTools && (
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              {viewingTools.tools.length === 0 ? (
                <Empty description="该插件没有提供任何工具" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              ) : (
                viewingTools.tools.map((tool, index) => (
                  <Card key={index} size="small" style={{ borderRadius: 8, border: `1px solid ${token.colorBorderSecondary}` }}>
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                      <Text strong code>{tool.name}</Text>
                      {tool.description && <Paragraph style={{ margin: 0, padding: '8px', background: token.colorBgLayout, borderRadius: 4 }}>{tool.description}</Paragraph>}
                      {tool.inputSchema && <pre style={{ margin: 0, padding: '8px', background: token.colorBgLayout, borderRadius: 4, overflow: 'auto', maxHeight: '200px', color: token.colorText }}>{JSON.stringify(tool.inputSchema, null, 2)}</pre>}
                    </Space>
                  </Card>
                ))
              )}
            </Space>
          )}
        </Modal>
      </div>
    </>
  );
}