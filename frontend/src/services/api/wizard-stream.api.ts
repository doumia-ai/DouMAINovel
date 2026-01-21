import type {
  WorldBuildingResponse,
  GenerateCharactersResponse,
  GenerateOutlineResponse,
} from '../../types/index.js';
import type { SSEClientOptions } from '../../utils/sseClient.js';

import { ssePost } from '../../utils/sseClient.js';

/**
 * Wizard stream API endpoints (SSE-based)
 */
export const wizardStreamApi = {
  /**
   * Generate world building with streaming
   */
  generateWorldBuildingStream: (
    data: {
      title: string;
      description: string;
      theme: string;
      genre: string | string[];
      narrative_perspective?: string;
      target_words?: number;
      chapter_count?: number;
      character_count?: number;
      outline_mode?: 'one-to-one' | 'one-to-many';
      provider?: string;
      model?: string;
    },
    options?: SSEClientOptions
  ) => ssePost<WorldBuildingResponse>(
    '/api/wizard-stream/world-building',
    data,
    options
  ),

  /**
   * Generate characters with streaming
   */
  generateCharactersStream: (
    data: {
      project_id: string;
      count?: number;
      world_context?: Record<string, string>;
      theme?: string;
      genre?: string;
      requirements?: string;
      provider?: string;
      model?: string;
    },
    options?: SSEClientOptions
  ) => ssePost<GenerateCharactersResponse>(
    '/api/wizard-stream/characters',
    data,
    options
  ),

  /**
   * Generate career system with streaming
   */
  generateCareerSystemStream: (
    data: {
      project_id: string;
      provider?: string;
      model?: string;
    },
    options?: SSEClientOptions
  ) => ssePost<{
    project_id: string;
    main_careers_count: number;
    sub_careers_count: number;
    main_careers: string[];
    sub_careers: string[];
  }>(
    '/api/wizard-stream/career-system',
    data,
    options
  ),

  /**
   * Generate complete outline with streaming
   */
  generateCompleteOutlineStream: (
    data: {
      project_id: string;
      chapter_count: number;
      narrative_perspective: string;
      target_words?: number;
      requirements?: string;
      provider?: string;
      model?: string;
    },
    options?: SSEClientOptions
  ) => ssePost<GenerateOutlineResponse>(
    '/api/wizard-stream/outline',
    data,
    options
  ),

  /**
   * Update world building with streaming
   */
  updateWorldBuildingStream: (
    projectId: string,
    data: {
      time_period?: string;
      location?: string;
      atmosphere?: string;
      rules?: string;
    },
    options?: SSEClientOptions
  ) => ssePost<WorldBuildingResponse>(
    `/api/wizard-stream/world-building/${projectId}`,
    data,
    options
  ),

  /**
   * Regenerate world building with streaming
   */
  regenerateWorldBuildingStream: (
    projectId: string,
    data?: {
      provider?: string;
      model?: string;
    },
    options?: SSEClientOptions
  ) => ssePost<WorldBuildingResponse>(
    `/api/wizard-stream/world-building/${projectId}/regenerate`,
    data || {},
    options
  ),

  /**
   * Cleanup wizard data with streaming
   */
  cleanupWizardDataStream: (
    projectId: string,
    options?: SSEClientOptions
  ) => ssePost<{ message: string; deleted: { characters: number; outlines: number; chapters: number } }>(
    `/api/wizard-stream/cleanup/${projectId}`,
    {},
    options
  ),
};
