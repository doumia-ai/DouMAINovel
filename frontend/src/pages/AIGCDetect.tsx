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
  ConfigProvider,
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

const AIGCDetect: React.FC = () => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // ===== 定义深色主题配置 (用于 Antd 组件内部 JS 逻辑) =====
  // 即使有 CSS 变量，ConfigProvider 依然必要，它确保波纹效果、弹窗等也是深色的
  const darkTheme = {
    algorithm: theme.darkAlgorithm,
    token: {
      colorPrimary: '#5A9BA5',
      colorBgContainer: '#242438',
      colorBgElevated: '#2D2D4A',
      colorBgLayout: '#1a1a2e',
      colorText: '#E8E8E8',
      colorTextSecondary: '#A8A8A8',
      colorBorder: '#3D3D5C',
      colorBorderSecondary: '#2D2D4A',
    },
  };

  // ===== 状态管理 =====
  const [config, setConfig] = useState<DetectConfig>(() => loadDetectConfig());
  const [inputText, setInputText] = useState<string>('');
  const [paragraphs, setParagraphs] = useState<string[]>([]);
  const [result, setResult] = useState<DetectResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleConfigChange = useCallback((newConfig: DetectConfig) => {
    setConfig(newConfig);
    saveDetectConfig(newConfig);
  }, []);

  const previewParagraphs = useMemo(
    () => aigcDetectService.splitTextToParagraphs(inputText),
    [inputText]
  );

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
    // 1. ConfigProvider 负责 Ant Design 组件内部的 JS 样式计算
    <ConfigProvider theme={darkTheme}>
      {/* 2. 添加 "aigc-force-dark" 类名 
         这会触发我们在 index.css 中定义的 CSS 变量覆盖，确保 CSS 变量也是深色的
      */}
      <div 
        className="aigc-force-dark"
        style={{
          minHeight: '100vh',
          // 这里的背景色会读取我们刚才在 CSS 里强制设置的深色变量
          background: 'var(--color-bg-base)', 
          color: 'var(--color-text-base)',
        }}
      >
        {/* 顶部标题栏 */}
        <div style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'var(--color-primary)', // 使用 CSS 变量
          boxShadow: 'var(--shadow-header)',
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

            {/* 文本输入区 */}
            <Card
              title={
                <Space>
                  <SearchOutlined />
                  <span>文本输入与检测</span>
                </Space>
              }
              size="small"
              // 不需要手动加 style 了，因为 .aigc-force-dark .ant-card 已经在 CSS 里处理了
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
    </ConfigProvider>
  );
};

export default AIGCDetect;