import { Segmented } from 'antd';
import { useTheme, type ThemeMode } from '../contexts/ThemeContext';
import { SunOutlined, MoonOutlined, LaptopOutlined } from '@ant-design/icons';

interface ThemeSwitcherProps {
  style?: React.CSSProperties;
}

export default function ThemeSwitcher({ style }: ThemeSwitcherProps) {
  const { themeMode, setThemeMode } = useTheme();

  const options = [
    { 
      label: (
        <span title="浅色模式">
          <SunOutlined style={{ fontSize: 16 }} />
        </span>
      ), 
      value: 'light' as ThemeMode 
    },
    { 
      label: (
        <span title="深色模式">
          <MoonOutlined style={{ fontSize: 16 }} />
        </span>
      ), 
      value: 'dark' as ThemeMode 
    },
    { 
      label: (
        <span title="自动模式">
          <LaptopOutlined style={{ fontSize: 16 }} />
        </span>
      ), 
      value: 'auto' as ThemeMode 
    },
  ];

  return (
    <div style={{ padding: '8px 12px', ...style }}>
      <div style={{
        fontSize: 12,
        color: 'var(--color-text-secondary)',
        marginBottom: 8
      }}>
        主题模式
      </div>
      <Segmented
        value={themeMode}
        onChange={(value) => setThemeMode(value as ThemeMode)}
        options={options}
        block
        size="small"
      />
    </div>
  );
}
