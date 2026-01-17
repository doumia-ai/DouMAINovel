import { Grid } from 'antd';

interface ResponsiveState {
  isMobile: boolean;    // <= 768px (xs, sm)
  isTablet: boolean;    // 769px - 1024px (md)
  isDesktop: boolean;   // > 1024px (lg, xl, xxl)
  breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
}

/**
 * 响应式断点Hook
 * 使用Ant Design的Grid.useBreakpoint()提供统一的响应式判断
 * 
 * Ant Design断点:
 * - xs: <576px
 * - sm: ≥576px
 * - md: ≥768px
 * - lg: ≥992px
 * - xl: ≥1200px
 * - xxl: ≥1600px
 */
export function useResponsive(): ResponsiveState {
  const screens = Grid.useBreakpoint();
  
  // isMobile: 小于md断点 (< 768px)
  const isMobile = !screens.md;
  
  // isTablet: md断点但小于lg (768px - 991px)
  const isTablet = Boolean(screens.md && !screens.lg);
  
  // isDesktop: lg及以上 (≥ 992px)
  const isDesktop = Boolean(screens.lg);
  
  // 计算当前断点
  let breakpoint: ResponsiveState['breakpoint'] = 'xs';
  if (screens.xxl) breakpoint = 'xxl';
  else if (screens.xl) breakpoint = 'xl';
  else if (screens.lg) breakpoint = 'lg';
  else if (screens.md) breakpoint = 'md';
  else if (screens.sm) breakpoint = 'sm';
  
  return { isMobile, isTablet, isDesktop, breakpoint };
}

export default useResponsive;
