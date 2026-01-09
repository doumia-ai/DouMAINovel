import React, { useState, useCallback, useMemo } from 'react';
import {
  Layout,
  Card,
  Input,
  Button,
  Space,
  Typography,
  Alert,
  message,
  Breadcrumb,
} from 'antd';
import {
  SearchOutlined,
  HomeOutlined,
  SafetyCertificateOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { DetectConfigPanel, DetectResultPanel } from '../components/AIGCDetect';
import {
  aigcDetectService,
  loadDetectConfig,
  saveDetectConfig,
  type DetectConfig,
  type DetectResponse,
} from '../services/aigcDetectService';

const { Content } = Layout;
const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;

const AIGCDetect: React.FC = () => {
  // ===== 状态管理 =====
  const [config, setConfig] = useState<DetectConfig>(() => loadDetectConfig());
  const [inputText, setInputText] = useState<string>('');
  const [paragraphs, setParagraphs] = useState<string[]>([]);
  const [result, setResult] = useState<DetectResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

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
    <Layout style={{ minHeight: '100vh', background: 'transparent' }}>
      <Content
        style={{
          padding: '24px',
          maxWidth: 1200,
          margin: '0 auto',
          width: '100%',
        }}
      >
        {/* 面包屑导航 */}
        <Breadcrumb
          style={{ marginBottom: 16 }}
          items={[
            {
              title: (
                <Link to="/">
                  <HomeOutlined /> 首页
                </Link>
              ),
            },
            {
              title: (
                <>
                  <SafetyCertificateOutlined /> AI 生成文本检测
                </>
              ),
            },
          ]}
        />

        {/* 页面标题 */}
        <div style={{ marginBottom: 24 }}>
          <Title level={3} style={{ marginBottom: 8 }}>
            <SafetyCertificateOutlined style={{ marginRight: 8 }} />
            AI 生成文本检测工具
          </Title>
          <Text type="secondary">
            检测文本中的 AI 生成特征，辅助写作参考。支持内置检测服务和自定义检测 API。
          </Text>
        </div>

        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* 检测配置区 */}
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
              />

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Text type="secondary">
                  {inputText.trim() ? (
                    <>
                      已输入 {inputText.length} 字符，预计拆分为{' '}
                      {previewParagraphs.length} 个段落
                    </>
                  ) : (
                    '支持粘贴长文本，系统将自动按空行拆分段落'
                  )}
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
              <Paragraph style={{ marginBottom: 0 }}>
                本检测结果仅用于写作辅助参考，不作为任何审核或处罚依据。
                <br />
                AI 检测技术存在一定误差，检测结果可能受文本风格、长度、主题等因素影响。
                <br />
                请勿将本工具用于学术诚信审查、内容审核或任何可能对他人产生不利影响的场景。
              </Paragraph>
            }
          />
        </Space>
      </Content>
    </Layout>
  );
};

export default AIGCDetect;