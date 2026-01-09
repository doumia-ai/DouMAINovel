import React from 'react';
import { Card, Row, Col, Progress, Tag, Alert, Space, Typography, Empty, Spin } from 'antd';

const { Text, Paragraph } = Typography;

interface DetectResultPanelProps {
  result: {
    summary: {
      human_ratio: number;
      suspected_ai_ratio: number;
      ai_ratio: number;
    };
    items: Array<{
      ai_probability: number;
      human_probability: number;
      label: 'human' | 'suspected_ai' | 'ai';
    }>;
  } | null;
  paragraphs: string[];
  loading: boolean;
}

const COLOR_MAP: Record<'human' | 'suspected_ai' | 'ai', string> = {
  human: '#52c41a',
  suspected_ai: '#faad14',
  ai: '#ff4d4f',
};

const LABEL_TEXT: Record<'human' | 'suspected_ai' | 'ai', string> = {
  human: '人工特征',
  suspected_ai: '疑似 AI',
  ai: 'AI 特征',
};

const DetectResultPanel: React.FC<DetectResultPanelProps> = ({
  result,
  paragraphs,
  loading,
}) => {
  if (loading) {
    return (
      <Card size="small">
        <Spin tip="正在分析文本，请稍候..." />
      </Card>
    );
  }

  if (!result) {
    return (
      <Card size="small">
        <Empty description="暂无检测结果，请输入文本并开始检测" />
      </Card>
    );
  }

  const { human_ratio, suspected_ai_ratio, ai_ratio } = result.summary;

  // 结果解读文案（对应截图语义）
  const overallTip =
    ai_ratio >= 0.6
      ? '检测结果显示 AI 特征较明显，建议人工润色后再使用。'
      : ai_ratio >= 0.3
      ? '检测到部分 AI 特征，可适当调整表达方式以增强自然度。'
      : '整体更接近人工写作风格，AI 特征较低。';

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* 总览区 */}
      <Card title="检测结果总览" size="small">
        <Row gutter={24} justify="center">
          <Col>
            <Progress
              type="circle"
              percent={Math.round(human_ratio * 100)}
              strokeColor={COLOR_MAP.human}
              format={(p) => (
                <>
                  <div style={{ fontSize: 22, fontWeight: 600 }}>{p}%</div>
                  <div style={{ fontSize: 12, color: '#666' }}>人工特征</div>
                </>
              )}
            />
          </Col>
          <Col>
            <Progress
              type="circle"
              percent={Math.round(suspected_ai_ratio * 100)}
              strokeColor={COLOR_MAP.suspected_ai}
              format={(p) => (
                <>
                  <div style={{ fontSize: 22, fontWeight: 600 }}>{p}%</div>
                  <div style={{ fontSize: 12, color: '#666' }}>疑似 AI</div>
                </>
              )}
            />
          </Col>
          <Col>
            <Progress
              type="circle"
              percent={Math.round(ai_ratio * 100)}
              strokeColor={COLOR_MAP.ai}
              format={(p) => (
                <>
                  <div style={{ fontSize: 22, fontWeight: 600 }}>{p}%</div>
                  <div style={{ fontSize: 12, color: '#666' }}>AI 特征</div>
                </>
              )}
            />
          </Col>
        </Row>

        <div style={{ marginTop: 16 }}>
          <Alert type="info" showIcon message={overallTip} />
        </div>
      </Card>

      {/* 段落级结果 */}
      <Card title="段落级检测结果" size="small">
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {result.items.map((item, index) => (
            <Card
              key={index}
              size="small"
              style={{
                borderLeft: `4px solid ${COLOR_MAP[item.label]}`,
              }}
            >
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                <Space>
                  <Tag color={COLOR_MAP[item.label]}>
                    {LABEL_TEXT[item.label]}
                  </Tag>
                  <Text type="secondary">
                    AI 概率 {Math.round(item.ai_probability * 100)}%
                  </Text>
                </Space>

                <Paragraph style={{ marginBottom: 0 }}>
                  {paragraphs[index]}
                </Paragraph>
              </Space>
            </Card>
          ))}
        </Space>
      </Card>
    </Space>
  );
};

export default DetectResultPanel;
