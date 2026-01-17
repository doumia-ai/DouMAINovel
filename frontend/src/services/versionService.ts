import { VERSION_INFO } from '../config/version';

interface VersionCheckResult {
  hasUpdate: boolean;
  latestVersion: string;
  releaseUrl: string;
}

/**
 * 解析版本号，分离主版本号和后缀
 * 例如: "1.2.4-e" => { numbers: [1, 2, 4], suffix: "e" }
 *       "1.2.4" => { numbers: [1, 2, 4], suffix: "" }
 */
function parseVersion(version: string): { numbers: number[]; suffix: string } {
  // 移除开头的 v
  const cleanVersion = version.replace(/^v/, '');
  
  // 分离主版本号和后缀 (如 1.2.4-e => 1.2.4 和 e)
  const suffixMatch = cleanVersion.match(/^([\d.]+)(?:-(.+))?$/);
  
  if (!suffixMatch) {
    return { numbers: [0], suffix: '' };
  }
  
  const mainPart = suffixMatch[1];
  const suffix = suffixMatch[2] || '';
  const numbers = mainPart.split('.').map(Number).filter(n => !isNaN(n));
  
  return { numbers, suffix };
}

/**
 * 比较版本号
 * @returns -1: v1 < v2, 0: v1 = v2, 1: v1 > v2
 *
 * 比较规则:
 * 1. 先比较数字部分 (1.2.4 vs 1.2.5)
 * 2. 如果数字部分相同，带后缀的版本被认为是同一版本的变体
 *    例如: 1.2.4-e 和 1.2.4 被视为相同版本 (返回 0)
 */
function compareVersion(v1: string, v2: string): number {
  // 先进行完整字符串比较（忽略 v 前缀）
  const clean1 = v1.replace(/^v/, '');
  const clean2 = v2.replace(/^v/, '');
  
  if (clean1 === clean2) {
    return 0;
  }
  
  const parsed1 = parseVersion(v1);
  const parsed2 = parseVersion(v2);
  
  // 比较数字部分
  for (let i = 0; i < Math.max(parsed1.numbers.length, parsed2.numbers.length); i++) {
    const num1 = parsed1.numbers[i] || 0;
    const num2 = parsed2.numbers[i] || 0;
    
    if (num1 < num2) return -1;
    if (num1 > num2) return 1;
  }
  
  // 数字部分相同，检查后缀
  // 如果一个有后缀一个没有，或者后缀不同，视为同一版本
  // 这样 1.2.4-e 和 1.2.4 不会触发更新提示
  return 0;
}

/**
 * 使用 shields.io Badge API 获取最新版本
 * 优点：无 CORS 问题，自动从 GitHub 获取，无需维护
 */
export async function checkLatestVersion(): Promise<VersionCheckResult> {
  try {
    // 使用 shields.io 的 GitHub release badge API
    const badgeUrl = 'https://img.shields.io/github/v/release/doumia-ai/DouMAINovel';
    
    const response = await fetch(badgeUrl, {
      method: 'GET',
      cache: 'no-cache',
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }
    
    // shields.io 返回的是 SVG 格式
    const svgText = await response.text();
    
    // 从 SVG 中提取版本号
    // SVG 中版本号通常在 <text> 标签内，格式如: v1.0.0, 1.0.0, v1.2.4-e 等
    // 支持带后缀的版本号 (如 -alpha, -beta, -rc, -e 等)
    const versionRegex = /v?([\d.]+(?:-[a-zA-Z0-9]+)?)/g;
    const matches = svgText.match(versionRegex);
    
    if (matches && matches.length > 0) {
      // 通常最后一个匹配是版本号（前面的可能是标签文本）
      const versionMatch = matches[matches.length - 1];
      const latestVersion = versionMatch.replace(/^v/, '');
      
      // 验证版本号格式 (x.x.x 或 x.x.x-suffix)
      if (/^\d+\.\d+(\.\d+)?(-[a-zA-Z0-9]+)?$/.test(latestVersion)) {
        const hasUpdate = compareVersion(VERSION_INFO.version, latestVersion) < 0;
        
        return {
          hasUpdate,
          latestVersion,
          releaseUrl: `https://github.com/doumia-ai/DouMAINovel/releases/tag/v${latestVersion}`,
        };
      }
    }
    
    throw new Error('无法从 Badge API 解析版本信息');
  } catch (error) {
    // 失败时返回无更新
    return {
      hasUpdate: false,
      latestVersion: VERSION_INFO.version,
      releaseUrl: VERSION_INFO.githubUrl,
    };
  }
}

/**
 * 检查是否应该执行版本检查（避免频繁请求）
 */
export function shouldCheckVersion(): boolean {
  const lastCheck = localStorage.getItem('version_last_check');
  
  if (!lastCheck) {
    return true;
  }
  
  const lastCheckTime = new Date(lastCheck).getTime();
  const now = Date.now();
  const sixHoursMs = 6 * 60 * 60 * 1000; // 6小时
  
  return now - lastCheckTime >= sixHoursMs;
}

/**
 * 记录版本检查时间
 */
export function markVersionChecked(): void {
  localStorage.setItem('version_last_check', new Date().toISOString());
}

/**
 * 获取缓存的版本信息
 */
export function getCachedVersionInfo(): VersionCheckResult | null {
  const cached = localStorage.getItem('version_check_result');
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * 缓存版本信息
 */
export function cacheVersionInfo(info: VersionCheckResult): void {
  localStorage.setItem('version_check_result', JSON.stringify(info));
}

/**
 * 用户已查看更新提示
 */
export function markUpdateViewed(version: string): void {
  localStorage.setItem('version_viewed', version);
}

/**
 * 检查用户是否已查看此版本的更新提示
 */
export function hasViewedUpdate(version: string): boolean {
  const viewedVersion = localStorage.getItem('version_viewed');
  
  // 如果已查看的版本低于最新版本，应该显示红点
  if (viewedVersion && version) {
    // 使用改进的版本比较函数
    const comparison = compareVersion(viewedVersion, version);
    
    if (comparison < 0) {
      return false; // 已查看的版本低于最新版本，需要显示红点
    }
    if (comparison > 0) {
      return true; // 已查看的版本高于最新版本
    }
  }
  
  // 完全相同或无法比较时
  return viewedVersion === version;
}