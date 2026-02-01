import type { ReactNode } from 'react';

import { Card, Row, Col, Space, Typography } from 'antd';

import { useResponsive } from '../hooks/useResponsive.js';

const { Title, Text } = Typography;

export interface PageHeaderProps {
  /** 页面标题 */
  title: string;
  /** 标题图标 */
  icon?: ReactNode;
  /** 描述文字 */
  description?: string;
  /** 操作按钮区域 */
  actions?: ReactNode;
  /** 统计数据区域 */
  stats?: ReactNode;
  /** 额外内容区域 */
  extra?: ReactNode;
}

/**
 * 装饰性圆形背景元素
 */
function DecorativeCircles() {
  return (
    <>
      <div
        style={{
          position: 'absolute',
          top: -60,
          right: -60,
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.08)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: -40,
          left: '30%',
          width: 120,
          height: 120,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.05)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '50%',
          right: '15%',
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.06)',
          pointerEvents: 'none',
        }}
      />
    </>
  );
}

/**
 * PageHeader - 统一的页面头部渐变卡片组件
 *
 * 用于替换各页面中重复的头部Card结构，提供一致的视觉效果和响应式布局。
 *
 * Usage:
 * ```tsx
 * <PageHeader
 *   title="项目列表"
 *   icon={<ProjectOutlined />}
 *   description="管理您的所有写作项目"
 *   actions={<Button>新建项目</Button>}
 *   stats={<Row gutter={16}><Col><StatCard ... /></Col></Row>}
 * />
 * ```
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 */
export function PageHeader({
  title,
  icon,
  description,
  actions,
  stats,
  extra,
}: PageHeaderProps) {
  const { isMobile } = useResponsive();

  return (
    <Card
      variant="borderless"
      style={{
        background:
          'linear-gradient(135deg, var(--color-primary) 0%, #5A9BA5 50%, var(--color-primary-hover) 100%)',
        borderRadius: isMobile ? 16 : 24,
        boxShadow: 'var(--shadow-primary)',
        border: 'none',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* 装饰性背景元素 */}
      <DecorativeCircles />

      <Row
        align="middle"
        justify="space-between"
        gutter={[16, 16]}
        style={{ position: 'relative', zIndex: 1 }}
      >
        <Col xs={24} sm={12} md={10}>
          <Space direction="vertical" size={8}>
            <Title
              level={isMobile ? 3 : 2}
              style={{
                margin: 0,
                color: '#fff',
                textShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }}
            >
              {icon && <span style={{ marginRight: 12 }}>{icon}</span>}
              {title}
            </Title>
            {description && (
              <Text
                style={{
                  fontSize: isMobile ? 13 : 15,
                  color: 'rgba(255,255,255,0.85)',
                }}
              >
                {description}
              </Text>
            )}
          </Space>
        </Col>
        {actions && (
          <Col xs={24} sm={12} md={14}>
            {actions}
          </Col>
        )}
      </Row>

      {extra}
      {stats}
    </Card>
  );
}

export default PageHeader;
