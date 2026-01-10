import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Card,
  Input,
  Button,
  Space,
  Typography,
  Alert,
  message,
  theme,
} from 'antd';
import {
  SearchOutlined,
  ArrowLeftOutlined,
  SafetyCertificateOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { DetectConfigPanel, DetectResultPanel } from '../components/AIGCDetect';
import {
  aigcDetectService,
  loadDetectConfig,
  saveDetectConfig,
  type DetectConfig,
  type DetectResponse,
} from '../services/aigcDetectService';

const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;
const { useToken } = theme;

const AIGCDetect: React.FC = () => {
  const navigate = useNavigate();
  // 1. 获取全局 Token，自动感知是浅色还是深色模式
  const { token } = useToken();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // ===== 状态管理 =====
  const [config, setConfig] = useState<DetectConfig>(() => loadDetectConfig());
  const [inputText, setInputText] = useState<string>('');
  const [paragraphs, setParagraphs] = useState<string[]>([]);
  const [result, setResult] = useState<DetectResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // 响应式处理
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ===== 配置变更 =====
  const handleConfigChange = useCallback((newConfig: DetectConfig) => {
    setConfig(newConfig);
    saveDetectConfig(newConfig);
  }, []);

  // ===== 段落拆分 =====
  const previewParagraphs = useMemo(
    () => aigcDetectService.splitTextToParagraphs(inputText),
    [inputText]
  );

  // ===== 执行检测 =====
  const handleDetect = async () => {
    if (!inputText.trim()) {
      message.warning('请输入待检测的文本');
      return;
    }

    if (previewParagraphs.length === 0) {
      message.warning('未检测到有效段落，请检查输入文本');
      return;
    }

    setParagraphs(previewParagraphs);
    setLoading(true);
    setResult(null);

    try {
      const detectResult = await aigcDetectService.detectTexts(
        previewParagraphs,
        config
      );

      if (detectResult.items.length !== previewParagraphs.length) {
        message.error('检测结果与段落数量不匹配');
        return;
      }

      setResult(detectResult);
      message.success(`检测完成，共分析 ${previewParagraphs.length} 个段落`);
    } catch (error: any) {
      console.error('检测失败:', error);
      message.error(error?.message || '检测失败');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setInputText('');
    setParagraphs([]);
    setResult(null);
  };

  return (
    // 2. 移除 ConfigProvider，直接使用 div，背景色跟随全局 token
    <div
      style={{
        minHeight: '100vh',
        background: token.colorBgLayout, // 浅色模式下是浅灰，深色模式下是深蓝
        transition: 'background 0.3s',
      }}
    >
      {/* 顶部标题栏 - 保持主色调背景，文字固定白色 */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: token.colorPrimary,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        transition: 'background 0.3s',
      }}>
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: isMobile ? '12px 16px' : '16px 24px',
        }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/')}
            size={isMobile ? 'middle' : 'large'}
            style={{
              background: 'rgba(255,255,255,0.2)',
              borderColor: 'rgba(255,255,255,0.3)',
              color: '#fff',
            }}
          >
            {isMobile ? '返回' : '返回首页'}
          </Button>

          <Title level={isMobile ? 4 : 2} style={{
            margin: 0,
            color: '#fff',
            textShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}>
            <SafetyCertificateOutlined style={{ marginRight: 8 }} />
            AI 检测工具
          </Title>

          <div style={{ width: isMobile ? 60 : 120 }}></div>
        </div>
      </div>

      {/* 内容区域 */}
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: isMobile ? '16px 12px' : '24px 24px',
      }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          
          {/* 配置面板 */}
          <DetectConfigPanel
            config={config}
            onConfigChange={handleConfigChange}
            disabled={loading}
          />

          {/* 文本输入区 - Card 会自动跟随全局主题变白或变黑 */}
          <Card
            title={
              <Space>
                <SearchOutlined />
                <span>文本输入与检测</span>
              </Space>
            }
            size="small"
          >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <TextArea
                placeholder="请在此粘贴或输入待检测的文本内容（小说章节、文章等）..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                rows={10}
                showCount
                maxLength={50000}
                style={{ resize: 'vertical' }}
              />

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 16,
                marginTop: 12,
              }}>
                {/* 使用 secondary 颜色，在浅色模式下是灰色，深色模式下是浅灰，自动适配 */}
                <Text type="secondary">
                  {inputText.trim() 
                    ? `已输入 ${inputText.length} 字符，预计拆分为 ${previewParagraphs.length} 个段落`
                    : '支持粘贴长文本，系统将自动按空行拆分段落'
                  }
                </Text>

                <Space>
                  <Button onClick={handleClear} disabled={loading}>
                    清空
                  </Button>
                  <Button
                    type="primary"
                    icon={<SearchOutlined />}
                    onClick={handleDetect}
                    loading={loading}
                    disabled={!inputText.trim()}
                  >
                    开始检测
                  </Button>
                </Space>
              </div>
            </Space>
          </Card>

          <DetectResultPanel
            result={result}
            paragraphs={paragraphs}
            loading={loading}
          />

          <Alert
            type="warning"
            icon={<WarningOutlined />}
            showIcon
            message="免责声明"
            description={
              <Paragraph style={{ marginBottom: 0, textAlign: 'center' }}>
                本检测结果仅用于写作辅助参考，不作为任何审核或处罚依据。
              </Paragraph>
            }
            style={{ textAlign: 'center' }}
          />
        </Space>
      </div>
    </div>
  );
};

export default AIGCDetect;