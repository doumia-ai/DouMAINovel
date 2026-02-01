/**
 * Unified API export entry point
 * 
 * This file exports all API modules for easy importing throughout the application.
 * Import pattern: import { authApi, projectApi } from '@/services/api';
 */

import axios from 'axios';

export { adminApi } from './admin.api.js';
export { authApi } from './auth.api.js';
export { careerApi } from './career.api.js';
export { chapterApi } from './chapter.api.js';
export { characterApi } from './character.api.js';
export { foreshadowApi } from './foreshadow.api.js';
export { genreApi } from './genre.api.js';
export { inspirationApi } from './inspiration.api.js';
export { mcpPluginApi } from './mcp-plugin.api.js';
export { outlineApi } from './outline.api.js';
export { polishApi } from './polish.api.js';
export { projectApi } from './project.api.js';
export { settingsApi } from './settings.api.js';
export { userApi } from './user.api.js';
export { wizardStreamApi } from './wizard-stream.api.js';
export { writingStyleApi } from './writing-style.api.js';

export default axios.create({
  baseURL: '/api',
  timeout: 120000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});
