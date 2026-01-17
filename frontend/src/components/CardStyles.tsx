import type { CSSProperties } from 'react';

// 统一的卡片样式配置
export const cardStyles = {
  // 基础卡片样式
  base: {
    borderRadius: 12,
    transition: 'all 0.3s ease',
  } as CSSProperties,

  // 悬浮效果
  hoverable: {
    cursor: 'pointer',
  } as CSSProperties,

  // 角色卡片样式
  character: {
    // height: 320,
    display: 'flex',
    flexDirection: 'column',
    borderColor: 'var(--color-info)',
    borderRadius: 12,
  } as CSSProperties,

  // 组织卡片样式
  organization: {
    // height: 320,
    display: 'flex',
    flexDirection: 'column',
    borderColor: 'var(--color-success)',
    backgroundColor: 'var(--color-bg-base)', // 使用柔和的背景色
    borderRadius: 12,
  } as CSSProperties,

  // 项目卡片样式 - 现代化设计
  project: {
    height: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    background: 'var(--color-bg-container)',
    boxShadow: 'var(--shadow-card)',
    transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
    border: '1px solid var(--color-border-secondary)',
  } as CSSProperties,

  // 卡片内容区域样式
  body: {
    padding: 20,
    display: 'flex',
    flexDirection: 'column' as const,
  } as CSSProperties,

  // 卡片描述区域样式（固定高度，内容截断）
  description: {
    marginTop: 12,
    maxHeight: 200,
    overflow: 'hidden' as const,
  } as CSSProperties,

  // 文本截断样式
  ellipsis: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  } as CSSProperties,

  // 多行文本截断
  ellipsisMultiline: (lines: number = 2) => ({
    display: '-webkit-box',
    WebkitLineClamp: lines,
    WebkitBoxOrient: 'vertical' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  } as CSSProperties),
};

// 卡片悬浮动画 - 增强版
export const cardHoverHandlers = {
  onMouseEnter: (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    target.style.transform = 'translateY(-10px) scale(1.01)';
    target.style.boxShadow = 'var(--shadow-elevated)';
  },
  onMouseLeave: (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    target.style.transform = 'translateY(0) scale(1)';
    target.style.boxShadow = 'var(--shadow-card)';
  },
};

// 响应式网格配置
export const gridConfig = {
  gutter: [16, 16] as [number, number],
  xs: 24,
  sm: 12,
  lg: 8,
  xl: 6,
};

// 角色卡片网格配置
export const characterGridConfig = {
  gutter: 0,  // 移除 gutter，避免负边距
  xs: 24,  // 手机：1列
  sm: 12,  // 平板：2列
  md: 12,   // 中等屏幕：3列
  lg: 6,   // 大屏：4列
  xl: 6,   // 超大屏：4列
  xxl: 5,  // 超超大屏：6列
};

// 文本样式
export const textStyles = {
  label: {
    fontSize: 12,
    color: 'var(--color-text-tertiary)',
  } as CSSProperties,

  value: {
    fontSize: 14,
    color: 'var(--color-text-base)',
  } as CSSProperties,

  description: {
    fontSize: 12,
    color: 'var(--color-text-tertiary)',
    lineHeight: 1.6,
  } as CSSProperties,
};

// 头部按钮样式配置
export const headerButtonStyles = {
  // 主要按钮（渐变背景）
  primary: {
    borderRadius: 12,
    background: 'rgba(255, 255, 255, 0.2)',
    border: '1px solid rgba(255, 255, 255, 0.4)',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
    color: '#fff',
    fontWeight: 500,
    height: 44,
    backdropFilter: 'blur(10px)',
    transition: 'all 0.3s ease',
  } as CSSProperties,

  // 次要按钮
  secondary: {
    borderRadius: 12,
    background: 'rgba(255, 255, 255, 0.15)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    color: '#fff',
    height: 44,
    backdropFilter: 'blur(10px)',
    transition: 'all 0.3s ease',
  } as CSSProperties,

  // 高亮按钮（如灵感模式）
  highlight: {
    borderRadius: 12,
    background: 'rgba(255, 193, 7, 0.95)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    boxShadow: '0 4px 16px rgba(255, 193, 7, 0.4)',
    color: '#fff',
    fontWeight: 600,
    height: 44,
    transition: 'all 0.3s ease',
  } as CSSProperties,

  // 移动端按钮
  mobile: {
    borderRadius: 10,
    height: 42,
    fontWeight: 500,
    padding: '0 8px',
    fontSize: 13,
  } as CSSProperties,
};

// 语义化颜色映射（用于替换硬编码颜色）
export const semanticColors = {
  success: 'var(--color-success)',      // 替换 #52c41a
  info: 'var(--color-info)',            // 替换 #1890ff
  warning: 'var(--color-warning)',      // 替换 #faad14
  error: 'var(--color-error)',          // 替换 #ff4d4f
  primary: 'var(--color-primary)',      // 替换 #722ed1 或其他主色
  purple: 'var(--color-primary)',       // #722ed1 映射到主色
};

// Switch 组件容器样式
export const switchContainerStyles = {
  // 标准容器样式
  standard: {
    display: 'inline-flex',
    alignItems: 'center',
    flexShrink: 0,
    minWidth: '44px',
  } as CSSProperties,

  // 带间距的容器样式
  withMargin: {
    display: 'inline-flex',
    alignItems: 'center',
    flexShrink: 0,
    minWidth: '44px',
    marginLeft: 8,
  } as CSSProperties,
};

// Switch 组件直接样式
export const switchStyles = {
  // 防止压缩的基础样式
  base: {
    display: 'inline-block',  // 确保尺寸稳定
    flexShrink: 0,
    minWidth: '44px',
    minHeight: '22px',
  } as CSSProperties,
  
  // 小尺寸 Switch 样式
  small: {
    display: 'inline-block',
    flexShrink: 0,
    minWidth: '28px',
    minHeight: '16px',
  } as CSSProperties,
  
  // 默认尺寸 Switch 样式
  default: {
    display: 'inline-block',
    flexShrink: 0,
    minWidth: '44px',
    minHeight: '22px',
  } as CSSProperties,
};