import React from 'react';
import {
  Card,
  Progress,
  List,
  Tag,
  Typography,
  Row,
  Col,
  Empty,
  Space,
  theme,
} from 'antd';
import {
  CheckCircleOutlined,
  QuestionCircleOutlined,
  RobotOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import type { DetectResponse } from '../../services/aigcDetectService';

const { Text, Paragraph } = Typography;
const { useToken } = theme;

interface DetectResultPanelProps {
  result: DetectResponse | null;
  paragraphs: string[];
  loading?: boolean;
}

// 标签颜色映射
const labelColorMap: Record<string, string> = {
  human: 'success',
  suspected_ai: 'warning',
  ai: 'error',
};

// 标签文本映射
const labelTextMap: Record<string, string> = {
  human: '人工特征',
  suspected_ai: '疑似 AI',
  ai: 'AI 特征',
};

// 标签图标映射
const labelIconMap: Record<string, React.ReactNode> = {
  human: <CheckCircleOutlined />,
  suspected_ai: <QuestionCircleOutlined />,
  ai: <RobotOutlined />,
};

// 边框颜色映射（深色主题下使用更亮的颜色）
const getBorderColor = (label: string, isDark: boolean): string => {
  const lightColors: Record<string, string> = {
    human: '#52c41a',
    suspected_ai: '#faad14',
    ai: '#ff4d4f',
  };
  const darkColors: Record<string, string> = {
    human: '#73d13d',
    suspected_ai: '#ffc53d',
    ai: '#ff7875',
  };
  return isDark ? (darkColors[label] || lightColors[label]) : (lightColors[label] || '#d9d9d9');
};

// 背景颜色映射（深色主题下提高透明度）
const getBgColor = (label: string, isDark: boolean): string => {
  const lightColors: Record<string, string> = {
    human: 'rgba(82, 196, 26, 0.1)',
    suspected_ai: 'rgba(250, 173, 20, 0.1)',
    ai: 'rgba(255, 77, 79, 0.1)',
  };
  const darkColors: Record<string, string> = {
    human: 'rgba(115, 209, 61, 0.18)',
    suspected_ai: 'rgba(255, 197, 61, 0.18)',
    ai: 'rgba(255, 120, 117, 0.18)',
  };
  return isDark ? (darkColors[label] || lightColors[label]) : (lightColors[label] || 'transparent');
};

const DetectResultPanel: React.FC<DetectResultPanelProps> = ({
  result,
  paragraphs,
  loading = false,
}) => {
  const { token } = useToken();
  
  // 简单判断是否深色模式（用于图表颜色微调）
  const isDark = token.colorBgContainer === '#242438' || token.colorBgBase === '#1a1a2e';

  // 根据主题获取 Progress 百分比文字颜色
  const getProgressTextColor = (type: 'human' | 'suspected_ai' | 'ai'): string => {
    const lightColors = { human: '#52c41a', suspected_ai: '#faad14', ai: '#ff4d4f' };
    const darkColors = { human: '#73d13d', suspected_ai: '#ffc53d', ai: '#ff7875' };
    return isDark ? darkColors[type] : lightColors[type];
  };

  // 定义卡片的通用样式（强制应用 Token 颜色）
  const commonCardStyle = {
    background: token.colorBgContainer,
    borderColor: token.colorBorderSecondary,
  };

  if (!result && !loading) {
    return (
      <Card
        title={
          <Space>
            <FileTextOutlined />
            <span>检测结果</span>
          </Space>
        }
        size="small"
        style={commonCardStyle} // 修复 Empty 状态的背景
      >
        <Empty description="暂无检测结果，请输入文本并点击「开始检测」" />
      </Card>
    );
  }

  return (
    <Card
      title={
        <Space>
          <FileTextOutlined />
          <span>检测结果</span>
        </Space>
      }
      size="small"
      loading={loading}
      style={commonCardStyle} // 修复最外层背景
    >
      {result && (
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {/* 结果总览 */}
          <Card 
            type="inner" 
            title="结果总览" 
            size="small"
            style={{ ...commonCardStyle, background: 'transparent' }} // 内部卡片背景透明或跟随
            headStyle={{ color: token.colorText, borderBottomColor: token.colorBorderSecondary }}
          >
            <Row gutter={[24, 16]} justify="center">
              <Col xs={24} sm={8}>
                <div style={{ textAlign: 'center' }}>
                  <Progress
                    type="circle"
                    percent={Math.round(result.summary.human_ratio * 100)}
                    strokeColor={getProgressTextColor('human')}
                    format={(percent) => (
                      <span style={{ color: getProgressTextColor('human') }}>
                        {percent}%
                      </span>
                    )}
                    size={100}
                  />
                  <div style={{ marginTop: 8 }}>
                    <Tag color="success" icon={<CheckCircleOutlined />}>
                      人工特征
                    </Tag>
                  </div>
                </div>
              </Col>
              <Col xs={24} sm={8}>
                <div style={{ textAlign: 'center' }}>
                  <Progress
                    type="circle"
                    percent={Math.round(result.summary.suspected_ai_ratio * 100)}
                    strokeColor={getProgressTextColor('suspected_ai')}
                    format={(percent) => (
                      <span style={{ color: getProgressTextColor('suspected_ai') }}>
                        {percent}%
                      </span>
                    )}
                    size={100}
                  />
                  <div style={{ marginTop: 8 }}>
                    <Tag color="warning" icon={<QuestionCircleOutlined />}>
                      疑似 AI
                    </Tag>
                  </div>
                </div>
              </Col>
              <Col xs={24} sm={8}>
                <div style={{ textAlign: 'center' }}>
                  <Progress
                    type="circle"
                    percent={Math.round(result.summary.ai_ratio * 100)}
                    strokeColor={getProgressTextColor('ai')}
                    format={(percent) => (
                      <span style={{ color: getProgressTextColor('ai') }}>
                        {percent}%
                      </span>
                    )}
                    size={100}
                  />
                  <div style={{ marginTop: 8 }}>
                    <Tag color="error" icon={<RobotOutlined />}>
                      AI 特征
                    </Tag>
                  </div>
                </div>
              </Col>
            </Row>
          </Card>

          {/* 段落级检测结果 */}
          <Card 
            type="inner" 
            title="段落级检测结果" 
            size="small"
            style={{ ...commonCardStyle, background: 'transparent' }}
            headStyle={{ color: token.colorText, borderBottomColor: token.colorBorderSecondary }}
          >
            <List
              dataSource={result.items.map((item, index) => ({
                ...item,
                text: paragraphs[index] || '',
                index: index + 1,
              }))}
              renderItem={(item) => (
                <List.Item
                  style={{
                    borderLeft: `4px solid ${getBorderColor(item.label, isDark)}`,
                    backgroundColor: getBgColor(item.label, isDark),
                    marginBottom: 8,
                    padding: '12px 16px',
                    borderRadius: '0 4px 4px 0',
                    color: token.colorText, // 确保列表项文字颜色正确
                  }}
                >
                  <div style={{ width: '100%' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 8,
                      }}
                    >
                      <Text strong style={{ color: token.colorText }}>段落 {item.index}</Text>
                      <Space>
                        <Tag
                          color={labelColorMap[item.label]}
                          icon={labelIconMap[item.label]}
                        >
                          {labelTextMap[item.label]}
                        </Tag>
                        <Text type="secondary" style={{ fontSize: 12, color: token.colorTextSecondary }}>
                          AI 概率: {Math.round(item.ai_probability * 100)}%
                        </Text>
                      </Space>
                    </div>
                    <Paragraph
                      ellipsis={{ rows: 3, expandable: true, symbol: '展开' }}
                      style={{ marginBottom: 0, color: token.colorTextSecondary }}
                    >
                      {item.text}
                    </Paragraph>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Space>
      )}
    </Card>
  );
};

export default DetectResultPanel;