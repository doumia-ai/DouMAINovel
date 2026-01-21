import type { PolishTextRequest } from '../../types/index.js';

import { httpClient } from '../http.client.js';

/**
 * Text polishing API endpoints
 */
export const polishApi = {
  /**
   * Polish single text
   */
  polishText: (data: PolishTextRequest) =>
    httpClient.post<unknown, { polished_text: string }>('/polish', data),

  /**
   * Polish multiple texts in batch
   */
  polishBatch: (texts: string[]) =>
    httpClient.post<unknown, { polished_texts: string[] }>('/polish/batch', { texts }),
};
