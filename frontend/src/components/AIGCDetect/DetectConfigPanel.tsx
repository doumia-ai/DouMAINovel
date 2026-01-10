import React, { useState } from 'react';
import {
  Card,
  Radio,
  Input,
  Button,
  Space,
  Form,
  message,
  Collapse,
  Typography,
  Divider,
  theme,
} from 'antd';
import {
  PlusOutlined,
  MinusCircleOutlined,
  ApiOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import type { DetectConfig, ServiceConfig } from '../../services/aigcDetectService';
import { aigcDetectService } from '../../services/aigcDetectService';

const { Text } = Typography;
const { useToken } = theme;

interface DetectConfigPanelProps {
  config: DetectConfig;
  onConfigChange: (config: DetectConfig) => void;
  disabled?: boolean;
}

const DEFAULT_BUILTIN_CONFIG: ServiceConfig = {
  baseUrl: 'http://aigc-text-detector:8080',
  detectPath: '/detect/batch',
  headers: [],
};

const DEFAULT_CUSTOM_CONFIG: ServiceConfig = {
  baseUrl: '',
  detectPath: '/detect/batch',
  headers: [],
};

const DetectConfigPanel: React.FC<DetectConfigPanelProps> = ({
  config,
  onConfigChange,
  disabled = false,
}) => {
  const { token } = useToken();
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // 处理检测来源切换
  const handleSourceChange = (source: 'builtin' | 'custom') => {
    onConfigChange({
      ...config,
      source,
    });
    setTestResult(null);
  };

  // 处理内置服务配置变更
  const handleBuiltinConfigChange = (
    field: keyof ServiceConfig,
    value: string | Array<{ key: string; value: string }>
  ) => {
    onConfigChange({
      ...config,
      builtinConfig: {
        ...config.builtinConfig,
        [field]: value,
      },
    });
    setTestResult(null);
  };

  // 处理自定义服务配置变更
  const handleCustomConfigChange = (
    field: keyof ServiceConfig,
    value: string | Array<{ key: string; value: string }>
  ) => {
    onConfigChange({
      ...config,
      customConfig: {
        ...config.customConfig,
        [field]: value,
      },
    });
    setTestResult(null);
  };

  // 处理 Headers 变更（内置服务）
  const handleBuiltinHeaderChange = (
    index: number,
    field: 'key' | 'value',
    value: string
  ) => {
    const newHeaders = [...(config.builtinConfig.headers || [])];
    newHeaders[index] = { ...newHeaders[index], [field]: value };
    handleBuiltinConfigChange('headers', newHeaders);
  };

  // 添加 Header（内置服务）
  const handleAddBuiltinHeader = () => {
    handleBuiltinConfigChange('headers', [
      ...(config.builtinConfig.headers || []),
      { key: '', value: '' },
    ]);
  };

  // 删除 Header（内置服务）
  const handleRemoveBuiltinHeader = (index: number) => {
    const newHeaders = [...(config.builtinConfig.headers || [])];
    newHeaders.splice(index, 1);
    handleBuiltinConfigChange('headers', newHeaders);
  };

  // 处理 Headers 变更（自定义服务）
  const handleCustomHeaderChange = (
    index: number,
    field: 'key' | 'value',
    value: string
  ) => {
    const newHeaders = [...(config.customConfig.headers || [])];
    newHeaders[index] = { ...newHeaders[index], [field]: value };
    handleCustomConfigChange('headers', newHeaders);
  };

  // 添加 Header（自定义服务）
  const handleAddCustomHeader = () => {
    handleCustomConfigChange('headers', [
      ...(config.customConfig.headers || []),
      { key: '', value: '' },
    ]);
  };

  // 删除 Header（自定义服务）
  const handleRemoveCustomHeader = (index: number) => {
    const newHeaders = [...(config.customConfig.headers || [])];
    newHeaders.splice(index, 1);
    handleCustomConfigChange('headers', newHeaders);
  };

  // 重置为默认配置
  const handleResetBuiltinConfig = () => {
    onConfigChange({
      ...config,
      builtinConfig: { ...DEFAULT_BUILTIN_CONFIG },
    });
    setTestResult(null);
    message.info('已重置为默认配置');
  };

  const handleResetCustomConfig = () => {
    onConfigChange({
      ...config,
      customConfig: { ...DEFAULT_CUSTOM_CONFIG },
    });
    setTestResult(null);
    message.info('已重置为默认配置');
  };

  // 测试连接
  const handleTestConnection = async () => {
    const activeConfig = config.source === 'builtin' ? config.builtinConfig : config.customConfig;
    
    if (!activeConfig.baseUrl) {
      message.warning('请先填写 API Base URL');
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const result = await aigcDetectService.testConnection(config);
      setTestResult(result);
      if (result.success) {
        message.success(result.message);
      } else {
        message.error(result.message);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '测试失败';
      setTestResult({ success: false, message: errorMessage });
      message.error(errorMessage);
    } finally {
      setTesting(false);
    }
  };

  // 渲染服务配置表单
  const renderServiceConfigForm = (
    serviceConfig: ServiceConfig,
    isBuiltin: boolean
  ) => {
    const handleConfigChange = isBuiltin ? handleBuiltinConfigChange : handleCustomConfigChange;
    const handleHeaderChange = isBuiltin ? handleBuiltinHeaderChange : handleCustomHeaderChange;
    const handleAddHeader = isBuiltin ? handleAddBuiltinHeader : handleAddCustomHeader;
    const handleRemoveHeader = isBuiltin ? handleRemoveBuiltinHeader : handleRemoveCustomHeader;
    const handleReset = isBuiltin ? handleResetBuiltinConfig : handleResetCustomConfig;

    return (
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Form.Item
          label="接口地址"
          required
          style={{ marginBottom: 0 }}
          tooltip={isBuiltin ? '内置检测服务的地址，通常是独立部署的 Docker 服务' : '自定义检测 API 的基础地址'}
        >
          <Input
            placeholder={isBuiltin ? '例如: http://localhost:8088 或 http://detect-service:8088' : '例如: https://api.example.com'}
            value={serviceConfig.baseUrl}
            onChange={(e) => handleConfigChange('baseUrl', e.target.value)}
            disabled={disabled}
            // 强制背景色，防止变成白色
            style={{ background: token.colorBgContainer, borderColor: token.colorBorder }}
          />
        </Form.Item>

        <Form.Item
          label="检测路径"
          style={{ marginBottom: 0 }}
          tooltip="检测接口的路径"
        >
          <Input
            placeholder="/detect/batch"
            value={serviceConfig.detectPath}
            onChange={(e) => handleConfigChange('detectPath', e.target.value)}
            disabled={disabled}
            style={{ background: token.colorBgContainer, borderColor: token.colorBorder }}
          />
        </Form.Item>

        <Form.Item label="请求头（可选）" style={{ marginBottom: 0 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            {(serviceConfig.headers || []).map((header, index) => (
              <Space key={index} style={{ width: '100%' }}>
                <Input
                  placeholder="键"
                  value={header.key}
                  onChange={(e) => handleHeaderChange(index, 'key', e.target.value)}
                  style={{ width: 150, background: token.colorBgContainer, borderColor: token.colorBorder }}
                  disabled={disabled}
                />
                <Input
                  placeholder="值"
                  value={header.value}
                  onChange={(e) => handleHeaderChange(index, 'value', e.target.value)}
                  style={{ width: 200, background: token.colorBgContainer, borderColor: token.colorBorder }}
                  disabled={disabled}
                />
                <Button
                  type="text"
                  danger
                  icon={<MinusCircleOutlined />}
                  onClick={() => handleRemoveHeader(index)}
                  disabled={disabled}
                />
              </Space>
            ))}
            <Button
              type="dashed"
              onClick={handleAddHeader}
              icon={<PlusOutlined />}
              style={{ width: '100%' }}
              disabled={disabled}
            >
              添加请求头
            </Button>
          </Space>
        </Form.Item>

        <Divider style={{ margin: '12px 0' }} />

        <Form.Item style={{ marginBottom: 0 }}>
          <Space>
            <Button
              type="primary"
              onClick={handleTestConnection}
              loading={testing}
              disabled={disabled}
            >
              测试连接
            </Button>
            <Button onClick={handleReset} disabled={disabled}>
              重置为默认
            </Button>
            {testResult && (
              <Text type={testResult.success ? 'success' : 'danger'}>
                {testResult.success ? (
                  <CheckCircleOutlined />
                ) : (
                  <CloseCircleOutlined />
                )}{' '}
                {testResult.message}
              </Text>
            )}
          </Space>
        </Form.Item>
      </Space>
    );
  };

  return (
    <Card
      title={
        <Space>
          <ApiOutlined />
          <span>检测来源与配置</span>
        </Space>
      }
      size="small"
      // 关键修复：显式指定背景色和边框颜色为 Token 值
      style={{ 
        background: token.colorBgContainer,
        borderColor: token.colorBorderSecondary,
      }}
    >
      <Form layout="vertical">
        <Form.Item label="检测来源">
          <Radio.Group
            value={config.source}
            onChange={(e) => handleSourceChange(e.target.value)}
            disabled={disabled}
          >
            <Radio value="builtin">内置</Radio>
            <Radio value="custom">自定义 API</Radio>
          </Radio.Group>
        </Form.Item>

        {config.source === 'builtin' && (
          <Collapse
            defaultActiveKey={[]}
            style={{ background: 'transparent' }} // 确保 Collapse 背景透明
            items={[
              {
                key: 'builtin-config',
                label: (
                  <Space>
                    <SettingOutlined />
                    <span>内置配置</span>
                  </Space>
                ),
                children: renderServiceConfigForm(config.builtinConfig, true),
              },
            ]}
          />
        )}

        {config.source === 'custom' && (
          <Collapse
            defaultActiveKey={[]}
            style={{ background: 'transparent' }}
            items={[
              {
                key: 'custom-config',
                label: (
                  <Space>
                    <SettingOutlined />
                    <span>自定义 API 配置</span>
                  </Space>
                ),
                children: renderServiceConfigForm(config.customConfig, false),
              },
            ]}
          />
        )}

        {config.source === 'custom' && (
          <div style={{ marginTop: 16 }}>
            <Text type="secondary" style={{ color: token.colorTextSecondary }}>
              💡 自定义 API 需要遵循相同的接口规范：
              POST 请求，请求体为 <code style={{
                backgroundColor: token.colorFillSecondary,
                padding: '2px 6px',
                borderRadius: 4,
                color: token.colorText
              }}>{`{"texts": string[]}`}</code>，
              响应包含 <code style={{
                backgroundColor: token.colorFillSecondary,
                padding: '2px 6px',
                borderRadius: 4,
                color: token.colorText
              }}>summary</code> 和 <code style={{
                backgroundColor: token.colorFillSecondary,
                padding: '2px 6px',
                borderRadius: 4,
                color: token.colorText
              }}>items</code> 字段。
            </Text>
          </div>
        )}
      </Form>
    </Card>
  );
};

export default DetectConfigPanel;