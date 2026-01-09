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
} from 'antd';
import {
  CheckCircleOutlined,
  QuestionCircleOutlined,
  RobotOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import type { DetectResponse } from '../../services/aigcDetectService';

const { Text, Paragraph } = Typography;

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

// 边框颜色映射
const borderColorMap: Record<string, string> = {
  human: '#52c41a',
  suspected_ai: '#faad14',
  ai: '#ff4d4f',
};

// 背景颜色映射（浅色）
const bgColorMap: Record<string, string> = {
  human: 'rgba(82, 196, 26, 0.1)',
  suspected_ai: 'rgba(250, 173, 20, 0.1)',
  ai: 'rgba(255, 77, 79, 0.1)',
};

const DetectResultPanel: React.FC<DetectResultPanelProps> = ({
  result,
  paragraphs,
  loading = false,
}) => {
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
    >
      {result && (
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {/* 结果总览 */}
          <Card type="inner" title="结果总览" size="small">
            <Row gutter={[24, 16]} justify="center">
              <Col xs={24} sm={8}>
                <div style={{ textAlign: 'center' }}>
                  <Progress
                    type="circle"
                    percent={Math.round(result.summary.human_ratio * 100)}
                    strokeColor="#52c41a"
                    format={(percent) => (
                      <span style={{ color: '#52c41a' }}>
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
                    strokeColor="#faad14"
                    format={(percent) => (
                      <span style={{ color: '#faad14' }}>
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
                    strokeColor="#ff4d4f"
                    format={(percent) => (
                      <span style={{ color: '#ff4d4f' }}>
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
          <Card type="inner" title="段落级检测结果" size="small">
            <List
              dataSource={result.items.map((item, index) => ({
                ...item,
                text: paragraphs[index] || '',
                index: index + 1,
              }))}
              renderItem={(item) => (
                <List.Item
                  style={{
                    borderLeft: `4px solid ${borderColorMap[item.label]}`,
                    backgroundColor: bgColorMap[item.label],
                    marginBottom: 8,
                    padding: '12px 16px',
                    borderRadius: '0 4px 4px 0',
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
                      <Text strong>段落 {item.index}</Text>
                      <Space>
                        <Tag
                          color={labelColorMap[item.label]}
                          icon={labelIconMap[item.label]}
                        >
                          {labelTextMap[item.label]}
                        </Tag>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          AI 概率: {Math.round(item.ai_probability * 100)}%
                        </Text>
                      </Space>
                    </div>
                    <Paragraph
                      ellipsis={{ rows: 3, expandable: true, symbol: '展开' }}
                      style={{ marginBottom: 0 }}
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