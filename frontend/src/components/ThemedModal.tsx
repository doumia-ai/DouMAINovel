import { Modal, ConfigProvider, theme } from 'antd';
import type { ModalProps } from 'antd';
import { useTheme } from '../contexts/ThemeContext';

/**
 * ThemedModal - A Modal component that automatically inherits theme from ThemeContext
 * 
 * This component wraps Ant Design's Modal with ConfigProvider to ensure
 * the modal content follows the current theme (light/dark).
 * 
 * Usage:
 * ```tsx
 * <ThemedModal open={isOpen} onCancel={handleClose} title="My Modal">
 *   <p>Modal content here</p>
 * </ThemedModal>
 * ```
 * 
 * Requirements: 3.1, 3.2, 3.5
 */
export interface ThemedModalProps extends ModalProps {
  children?: React.ReactNode;
}

export function ThemedModal({ children, ...props }: ThemedModalProps) {
  const { actualTheme } = useTheme();
  
  return (
    <ConfigProvider
      theme={{
        algorithm: actualTheme === 'dark' 
          ? theme.darkAlgorithm 
          : theme.defaultAlgorithm,
      }}
    >
      <Modal {...props}>
        {children}
      </Modal>
    </ConfigProvider>
  );
}

export default ThemedModal;
