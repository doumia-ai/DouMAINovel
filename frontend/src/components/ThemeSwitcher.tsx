import { Segmented } from 'antd';
import { useTheme, ThemeMode } from '../contexts/ThemeContext';

interface ThemeSwitcherProps {
  style?: React.CSSProperties;
}

export default function ThemeSwitcher({ style }: ThemeSwitcherProps) {
  const { themeMode, setThemeMode } = useTheme();

  const options = [
    { label: '浅色', value: 'light' as ThemeMode },
    { label: '深色', value: 'dark' as ThemeMode },
    { label: '自动', value: 'auto' as ThemeMode },
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
