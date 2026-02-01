import type { CSSProperties } from 'react';

interface ResponsiveModalProps {
  width: string | number;
  centered: boolean;
  style?: CSSProperties;
  styles?: {
    body?: CSSProperties;
  };
}

/**
 * 获取响应式Modal配置
 * 根据是否为移动端返回不同的Modal配置
 * 
 * @param isMobile - 是否为移动端
 * @param desktopWidth - 桌面端宽度，默认600
 * @returns Modal配置对象
 */
export function getResponsiveModalProps(
  isMobile: boolean,
  desktopWidth: number = 600
): ResponsiveModalProps {
  if (isMobile) {
    return {
      width: '100%',
      centered: false,
      style: { 
        top: 0, 
        paddingBottom: 0, 
        maxWidth: '100vw' 
      },
      styles: {
        body: { 
          maxHeight: 'calc(100vh - 110px)', 
          overflowY: 'auto' 
        }
      }
    };
  }
  
  return {
    width: desktopWidth,
    centered: true
  };
}

export default getResponsiveModalProps;
