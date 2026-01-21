/**
 * Career API Module
 * Handles all career-related API requests
 */

import { httpClient } from '../http.client.js';

export interface CareerStage {
  level: number;
  name: string;
  description?: string;
}

export interface Career {
  id: string;
  project_id: string;
  name: string;
  type: 'main' | 'sub';
  description?: string;
  category?: string;
  stages: CareerStage[];
  max_stage: number;
  requirements?: string;
  special_abilities?: string;
  worldview_rules?: string;
  attribute_bonuses?: Record<string, string>;
  source: 'ai' | 'manual';
  created_at: string;
  updated_at: string;
}

export interface CareerCreate {
  project_id: string;
  name: string;
  type: 'main' | 'sub';
  description?: string;
  category?: string;
  stages: CareerStage[];
  max_stage: number;
  requirements?: string;
  special_abilities?: string;
  worldview_rules?: string;
  attribute_bonuses?: Record<string, string>;
  source: 'ai' | 'manual';
}

export interface CareerUpdate {
  name?: string;
  description?: string;
  category?: string;
  stages?: CareerStage[];
  max_stage?: number;
  requirements?: string;
  special_abilities?: string;
  worldview_rules?: string;
  attribute_bonuses?: Record<string, string>;
}

export interface CareerListResponse {
  total: number;
  main_careers: Career[];
  sub_careers: Career[];
}

export const careerApi = {
  /**
   * Get all careers for a project
   */
  getCareers: (projectId: string) =>
    httpClient.get<CareerListResponse>('/careers', {
      params: { project_id: projectId }
    }),

  /**
   * Get a single career by ID
   */
  getCareer: (careerId: string) =>
    httpClient.get<Career>(`/careers/${careerId}`),

  /**
   * Create a new career
   */
  createCareer: (data: CareerCreate) =>
    httpClient.post<Career>('/careers', data),

  /**
   * Update an existing career
   */
  updateCareer: (careerId: string, data: CareerUpdate) =>
    httpClient.put<Career>(`/careers/${careerId}`, data),

  /**
   * Delete a career
   */
  deleteCareer: (careerId: string) =>
    httpClient.delete<{ message: string; id: string }>(`/careers/${careerId}`),
};
