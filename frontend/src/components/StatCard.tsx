import type { ReactNode } from 'react';

import { Card, Statistic } from 'antd';

import { useResponsive } from '../hooks/useResponsive.js';

interface StatCardProps {
  title: string;
  value: number | string;
  icon?: ReactNode;
  formatter?: (value: number | string) => ReactNode;
}

/**
 * 统计卡片组件
 * 用于在页面头部显示统计数据，支持响应式布局
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */
export function StatCard({ title, value, icon, formatter }: StatCardProps) {
  const { isMobile } = useResponsive();

  return (
    <Card
      variant="borderless"
      style={{
        background: 'rgba(255, 255, 255, 0.2)',
        borderRadius: isMobile ? 12 : 16,
        border: '1px solid rgba(255, 255, 255, 0.3)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
        padding: isMobile ? '8px 4px' : '12px',
      }}
      styles={{ body: { padding: isMobile ? '4px' : '12px' } }}
    >
      <Statistic
        title={
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: isMobile ? 'column' : 'row',
              marginBottom: isMobile ? 4 : 8,
            }}
          >
            {icon && (
              <span
                style={{
                  fontSize: isMobile ? 16 : 24,
                  color: 'rgba(255,255,255,0.9)',
                  marginRight: isMobile ? 0 : 8,
                }}
              >
                {icon}
              </span>
            )}
            <span
              style={{
                color: 'rgba(255,255,255,0.8)',
                fontSize: isMobile ? 11 : 16,
                marginTop: isMobile && icon ? 2 : 0,
              }}
            >
              {title}
            </span>
          </div>
        }
        value={value}
        formatter={formatter}
        valueStyle={{
          color: '#fff',
          fontSize: isMobile ? 18 : 32,
          fontWeight: 'bold',
          textShadow: '0 1px 2px rgba(0,0,0,0.1)',
          textAlign: 'center',
        }}
      />
    </Card>
  );
}

export default StatCard;
