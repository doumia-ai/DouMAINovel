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
  ConfigProvider, // 1. 引入 ConfigProvider
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
// const { useToken } = theme; // 删除或注释掉这行，因为在这个组件层级我们手动指定颜色

const AIGCDetect: React.FC = () => {
  const navigate = useNavigate();
  // const { token } = useToken(); // 不要使用这个 token，因为它会获取到全局的浅色配置
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  // ===== 0. 定义强制深色主题配置 (复用 App.tsx 的深色设置) =====
  const darkTheme = {
    algorithm: theme.darkAlgorithm,
    token: {
      colorPrimary: '#5A9BA5',
      colorBgContainer: '#242438',  // 卡片背景
      colorBgElevated: '#2D2D4A',
      colorBgLayout: '#1a1a2e',     // 页面大背景
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

  // 响应式处理
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ===== 配置变更（保存到本地）=====
  const handleConfigChange = useCallback((newConfig: DetectConfig) => {
    setConfig(newConfig);
    saveDetectConfig(newConfig);
  }, []);

  // ===== 段落拆分（统一、避免重复计算）=====
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

      // ⚠️ 关键防御：段落数量必须一致
      if (detectResult.items.length !== previewParagraphs.length) {
        message.error(
          '检测结果与段落数量不匹配，请检查检测服务返回格式'
        );
        return;
      }

      setResult(detectResult);
      message.success(`检测完成，共分析 ${previewParagraphs.length} 个段落`);
    } catch (error: any) {
      console.error('检测失败:', error);
      message.error(
        error?.message || '检测失败，请检查网络连接或 API 配置'
      );
    } finally {
      setLoading(false);
    }
  };

  // ===== 清空 =====
  const handleClear = () => {
    setInputText('');
    setParagraphs([]);
    setResult(null);
  };

  return (
    // 1. 使用 ConfigProvider 包裹所有内容，强制应用深色主题
    <ConfigProvider theme={darkTheme}>
      <div style={{
        minHeight: '100vh',
        // 2. 这里直接使用 darkTheme 中的颜色，而不是 token.xxx
        // 因为 ConfigProvider 内部的组件才能通过 hook 获取到新 token，
        // 而这一层 div 还在 ConfigProvider 外部（逻辑上），所以手动指定。
        background: darkTheme.token.colorBgLayout, 
      }}>
        {/* 顶部标题栏 - 固定不滚动 */}
        <div style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: darkTheme.token.colorPrimary, // 使用深色配置的主色
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
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
            {/* 检测配置区 - 这里的组件内部现在会自动应用深色模式 */}
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
              // Card 背景色会自动变为 darkTheme.token.colorBgContainer (#242438)
            >
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <TextArea
                  placeholder="请在此粘贴或输入待检测的文本内容（小说章节、文章等）...\n\n系统将自动按空行拆分段落进行检测。"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  rows={10}
                  showCount
                  maxLength={50000}
                  style={{ resize: 'vertical' }}
                  // TextArea 背景和文字颜色会自动适配深色
                />

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 16,
                    marginTop: 12,
                  }}
                >
                  <Text type="secondary" style={{ color: darkTheme.token.colorTextSecondary, flex: '1 1 auto', minWidth: 200 }}>
                    {inputText.trim() ? (
                      <>
                        已输入 {inputText.length} 字符，预计拆分为{' '}
                        {previewParagraphs.length} 个段落
                      </>
                    ) : (
                      '支持粘贴长文本，系统将自动按空行拆分段落'
                    )}
                  </Text>

                  <Space style={{ flexShrink: 0 }}>
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

            {/* 检测结果区 */}
            <DetectResultPanel
              result={result}
              paragraphs={paragraphs}
              loading={loading}
            />

            {/* 免责声明 */}
            <Alert
              type="warning"
              icon={<WarningOutlined />}
              showIcon
              message="免责声明"
              description={
                <Paragraph style={{ marginBottom: 0, textAlign: 'center' }}>
                  本检测结果仅用于写作辅助参考，不作为任何审核或处罚依据。
                  <br />
                  AI 检测技术存在一定误差，检测结果可能受文本风格、长度、主题等因素影响。
                  <br />
                  请勿将本工具用于学术诚信审查、内容审核或任何可能对他人产生不利影响的场景。
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