// SSE 基础 URL 配置
// 优先使用环境变量，如果未设置则使用当前域名
const SSE_BASE_URL = (import.meta as any).env?.VITE_SSE_API_URL || '';

export interface SSEMessage {
  type: 'progress' | 'chunk' | 'result' | 'error' | 'done';
  message?: string;
  progress?: number;
  word_count?: number;
  status?: 'processing' | 'success' | 'error' | 'warning';
  content?: string;
  data?: any;
  error?: string;
  code?: number;
}

export interface SSEClientOptions {
  onProgress?: (message: string, progress: number, status: string, wordCount?: number) => void;
  onChunk?: (content: string) => void;
  onResult?: (data: any) => void;
  onError?: (error: string, code?: number) => void;
  onComplete?: () => void;
  onConnectionError?: (error: Event) => void;
  onCharacterConfirmation?: (data: any) => void;  // 新增：角色确认回调
  onOrganizationConfirmation?: (data: any) => void;  // 新增：组织确认回调
  timeout?: number;      // 超时时间（毫秒），默认 300000（5分钟）
  maxRetries?: number;   // 最大重试次数，默认 3
  retryDelay?: number;   // 重试延迟（毫秒），默认 2000
}

export class SSEClient {
  private eventSource: EventSource | null = null;
  private url: string;
  private options: SSEClientOptions;
  private accumulatedContent: string = '';

  constructor(url: string, options: SSEClientOptions = {}) {
    this.url = url;
    this.options = options;
  }

  connect(): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        this.eventSource = new EventSource(this.url);

        this.eventSource.onmessage = (event) => {
          try {
            const message: SSEMessage = JSON.parse(event.data);
            this.handleMessage(message, resolve, reject);
          } catch (error) {
            console.error('解析SSE消息失败:', error);
          }
        };

        this.eventSource.onerror = (error) => {
          console.error('SSE连接错误:', error);
          if (this.options.onConnectionError) {
            this.options.onConnectionError(error);
          }
          this.close();
          reject(new Error('SSE连接失败'));
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  private handleMessage(
    message: SSEMessage,
    resolve: (value: unknown) => void,
    reject: (reason?: unknown) => void
  ) {
    switch (message.type) {
      case 'progress':
        if (this.options.onProgress && message.progress !== undefined) {
          this.options.onProgress(
            message.message || '',
            message.progress,
            message.status || 'processing',
            message.word_count
          );
        }
        break;

      case 'chunk':
        if (message.content) {
          this.accumulatedContent += message.content;
          if (this.options.onChunk) {
            this.options.onChunk(message.content);
          }
        }
        break;

      case 'result':
        if (this.options.onResult && message.data) {
          this.options.onResult(message.data);
        }
        break;

      case 'error':
        if (this.options.onError) {
          this.options.onError(message.error || '未知错误', message.code);
        }
        this.close();
        reject(new Error(message.error || '未知错误'));
        break;

      case 'done':
        if (this.options.onComplete) {
          this.options.onComplete();
        }
        this.close();
        if (!this.options.onResult && this.accumulatedContent) {
          resolve({ content: this.accumulatedContent });
        } else {
          resolve(true);
        }
        break;
    }
  }

  close() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  getAccumulatedContent(): string {
    return this.accumulatedContent;
  }
}

export class SSEPostClient {
  private url: string;
  private data: any;
  private options: SSEClientOptions;
  private abortController: AbortController | null = null;
  private accumulatedContent: string = '';
  private timeout: number;
  private maxRetries: number;
  private retryDelay: number;
  // ✅ 新增：标记是否因为确认事件而暂停（不应该重试）
  private pausedForConfirmation: boolean = false;

  constructor(url: string, data: any, options: SSEClientOptions = {}) {
    this.url = url;
    this.data = data;
    this.options = options;
    // 🔧 修复：增加超时时间到10分钟，防止长时间AI调用（如角色/组织分析）导致超时
    this.timeout = options.timeout || 600000; // 10分钟
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 2000;
  }

  async connect(): Promise<any> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        return await this.attemptConnect(attempt);
      } catch (error: any) {
        lastError = error;
        
        // ✅ 如果是因为确认事件暂停，不重试
        if (this.pausedForConfirmation) {
          console.log('SSE 因确认事件暂停，不重试');
          return { paused: true, reason: 'confirmation_required' };
        }
        
        // 如果是用户取消或服务器明确错误（4xx），不重试
        if (error.name === 'AbortError' || 
            (error.code && error.code >= 400 && error.code < 500)) {
          throw error;
        }
        
        // 网络错误或服务器错误（5xx），尝试重试
        if (attempt < this.maxRetries - 1) {
          console.log(`SSE 连接失败，${this.retryDelay/1000}秒后重试 (${attempt + 1}/${this.maxRetries})`);
          if (this.options.onProgress) {
            this.options.onProgress(
              `连接中断，正在重试 (${attempt + 1}/${this.maxRetries})...`,
              0,
              'warning'
            );
          }
          await this.delay(this.retryDelay);
        }
      }
    }
    
    throw lastError || new Error('SSE 连接失败');
  }

  private async attemptConnect(_attempt: number): Promise<any> {
    return new Promise((resolve, reject) => {
      let timeoutId: number | null = null;

      const run = async () => {
        try {
        this.abortController = new AbortController();
        
        // 设置超时
        timeoutId = window.setTimeout(() => {
          console.log(`SSE 请求超时 (${this.timeout/1000}秒)`);
          this.abortController?.abort();
          reject(new Error('请求超时'));
        }, this.timeout);

        const response = await fetch(this.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(this.data),
          signal: this.abortController.signal,
        });

        if (!response.ok) {
          const error: any = new Error(`HTTP error! status: ${response.status}`);
          error.code = response.status;
          throw error;
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error('无法获取响应流');
        }

        let buffer = '';
        let currentEvent = '';  // 跟踪当前事件类型

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.trim() === '' || line.startsWith(':')) {
              // 心跳消息，忽略
              continue;
            }

            try {
              // 检查是否有事件类型
              const eventMatch = line.match(/^event: (.+)$/m);
              if (eventMatch) {
                currentEvent = eventMatch[1];
              }

              // 解析数据
              const dataMatch = line.match(/^data: (.+)$/m);
              if (dataMatch) {
                const data = JSON.parse(dataMatch[1]);

                // 根据事件类型处理
                if (currentEvent === 'character_confirmation_required') {
                  // ✅ 处理角色确认事件 - 标记为暂停状态
                  console.log('收到角色确认事件，暂停SSE流程');
                  this.pausedForConfirmation = true;
                  if (this.options.onCharacterConfirmation) {
                    this.options.onCharacterConfirmation(data);
                  }
                  currentEvent = '';  // 重置事件类型
                  // 清除超时
                  if (timeoutId !== null) {
                    window.clearTimeout(timeoutId);
                  }
                  // ✅ 正确 resolve，而不是 return（避免 Promise 悬挂）
                  resolve({ paused: true, reason: 'character_confirmation_required', data });
                  return;
                } else if (currentEvent === 'organization_confirmation_required') {
                  // ✅ 处理组织确认事件 - 标记为暂停状态
                  console.log('收到组织确认事件，暂停SSE流程');
                  this.pausedForConfirmation = true;
                  if (this.options.onOrganizationConfirmation) {
                    this.options.onOrganizationConfirmation(data);
                  }
                  currentEvent = '';  // 重置事件类型
                  // 清除超时
                  if (timeoutId !== null) {
                    window.clearTimeout(timeoutId);
                  }
                  // ✅ 正确 resolve，而不是 return（避免 Promise 悬挂）
                  resolve({ paused: true, reason: 'organization_confirmation_required', data });
                  return;
                } else {
                  // 标准消息处理
                  const message: SSEMessage = data;
                  this.handleMessage(message, resolve, reject);
                  currentEvent = '';  // 重置事件类型
                }
              }
            } catch (error) {
              console.error('解析SSE消息失败:', error, line);
            }
          }
        }

        // 清除超时
        if (timeoutId !== null) {
          window.clearTimeout(timeoutId);
        }

        } catch (error: any) {
          // 清除超时
          if (timeoutId !== null) {
            window.clearTimeout(timeoutId);
          }

          if (error.name === 'AbortError') {
            reject(new Error('请求超时或已取消'));
          } else {
            console.error('SSE POST请求失败:', error);
            if (this.options.onError) {
              this.options.onError(error.message || '请求失败');
            }
            reject(error);
          }
        }
      };

      void run();
    });
  }

  private handleMessage(
    message: SSEMessage,
    resolve: (value: unknown) => void,
    reject: (reason?: unknown) => void
  ) {
    switch (message.type) {
      case 'progress':
        if (this.options.onProgress && message.progress !== undefined) {
          this.options.onProgress(
            message.message || '',
            message.progress,
            message.status || 'processing',
            message.word_count
          );
        }
        break;

      case 'chunk':
        if (message.content) {
          this.accumulatedContent += message.content;
          if (this.options.onChunk) {
            this.options.onChunk(message.content);
          }
        }
        break;

      case 'result':
        if (this.options.onResult && message.data) {
          this.options.onResult(message.data);
        }
        (this as any).resultData = message.data;
        break;

      case 'error':
        if (this.options.onError) {
          this.options.onError(message.error || '未知错误', message.code);
        }
        reject(new Error(message.error || '未知错误'));
        break;

      case 'done':
        if (this.options.onComplete) {
          this.options.onComplete();
        }
        if ((this as any).resultData) {
          resolve((this as any).resultData);
        } else if (this.accumulatedContent) {
          resolve({ content: this.accumulatedContent });
        } else {
          resolve(true);
        }
        break;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  abort() {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  getAccumulatedContent(): string {
    return this.accumulatedContent;
  }
}

/**
 * 构建完整的 SSE URL
 * 如果配置了 SSE_BASE_URL，则使用它；否则使用相对路径
 */
function buildSSEUrl(path: string): string {
  if (SSE_BASE_URL) {
    // 移除路径开头的 /api，因为 SSE_BASE_URL 应该已经包含了完整的基础路径
    const cleanPath = path.startsWith('/api') ? path.substring(4) : path;
    return `${SSE_BASE_URL}${cleanPath}`;
  }
  return path;
}

export async function ssePost<T = any>(
  url: string,
  data: any,
  options: SSEClientOptions = {}
): Promise<T> {
  const fullUrl = buildSSEUrl(url);
  console.log(`SSE 请求: ${url} -> ${fullUrl}`);
  
  const client = new SSEPostClient(fullUrl, data, options);
  try {
    return await client.connect();
  } finally {
    client.abort();
  }
}