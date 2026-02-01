import { Navigate } from 'react-router-dom';

import AIGCDetect from '../pages/AIGCDetect.js';
import AuthCallback from '../pages/AuthCallback.js';
import Careers from '../pages/Careers.js';
import ChapterAnalysis from '../pages/ChapterAnalysis.js';
import ChapterReader from '../pages/ChapterReader.js';
import Chapters from '../pages/Chapters.js';
import Characters from '../pages/Characters.js';
import Foreshadows from '../pages/Foreshadows.js';
import Genres from '../pages/Genres.js';
import Inspiration from '../pages/Inspiration.js';
import Login from '../pages/Login.js';
import MCPPlugins from '../pages/MCPPlugins.js';
import Organizations from '../pages/Organizations.js';
import Outline from '../pages/Outline.js';
import ProjectDetail from '../pages/ProjectDetail.js';
import ProjectList from '../pages/ProjectList.js';
import ProjectWizardNew from '../pages/ProjectWizardNew.js';
import PromptTemplates from '../pages/PromptTemplates.js';
import Relationships from '../pages/Relationships.js';
import Settings from '../pages/Settings.js';
import Sponsor from '../pages/Sponsor.js';
import UserManagement from '../pages/UserManagement.js';
import WorldSetting from '../pages/WorldSetting.js';
import WritingStyles from '../pages/WritingStyles.js';

/**
 * Route metadata interface
 */
export interface RouteMetadata {
  title?: string;
  requiresAuth?: boolean;
  requiresAdmin?: boolean;
  showFooter?: boolean;
}

/**
 * Extended route configuration with metadata
 */
export interface RouteConfig {
  path?: string;
  index?: boolean;
  element?: React.ReactElement;
  children?: RouteConfig[];
  meta?: RouteMetadata;
}

/**
 * Application route configurations
 */
export const routes: RouteConfig[] = [
  // Public routes
  {
    path: '/login',
    element: <Login />,
    meta: {
      requiresAuth: false,
      showFooter: true,
      title: '登录',
    },
  },
  {
    path: '/auth/callback',
    element: <AuthCallback />,
    meta: {
      requiresAuth: false,
      showFooter: false,
      title: '认证回调',
    },
  },

  // Protected routes - Top level
  {
    path: '/',
    element: <ProjectList />,
    meta: {
      requiresAuth: true,
      showFooter: true,
      title: '项目列表',
    },
  },
  {
    path: '/projects',
    element: <ProjectList />,
    meta: {
      requiresAuth: true,
      showFooter: true,
      title: '项目列表',
    },
  },
  {
    path: '/wizard',
    element: <ProjectWizardNew />,
    meta: {
      requiresAuth: true,
      showFooter: false,
      title: '创建项目',
    },
  },
  {
    path: '/inspiration',
    element: <Inspiration />,
    meta: {
      requiresAuth: true,
      showFooter: false,
      title: '灵感',
    },
  },
  {
    path: '/settings',
    element: <Settings />,
    meta: {
      requiresAuth: true,
      showFooter: false,
      title: '设置',
    },
  },
  {
    path: '/prompt-templates',
    element: <PromptTemplates />,
    meta: {
      requiresAuth: true,
      showFooter: true,
      title: '提示词模板',
    },
  },
  {
    path: '/mcp-plugins',
    element: <MCPPlugins />,
    meta: {
      requiresAuth: true,
      showFooter: false,
      title: 'MCP 插件',
    },
  },
  {
    path: '/genres',
    element: <Genres />,
    meta: {
      requiresAuth: true,
      showFooter: false,
      title: '类型管理',
    },
  },
  {
    path: '/user-management',
    element: <UserManagement />,
    meta: {
      requiresAuth: true,
      requiresAdmin: true,
      showFooter: false,
      title: '用户管理',
    },
  },
  {
    path: '/aigc-detect',
    element: <AIGCDetect />,
    meta: {
      requiresAuth: true,
      showFooter: false,
      title: 'AIGC 检测',
    },
  },
  {
    path: '/chapters/:chapterId/reader',
    element: <ChapterReader />,
    meta: {
      requiresAuth: true,
      showFooter: false,
      title: '章节阅读',
    },
  },

  // Project detail routes (nested)
  {
    path: '/project/:projectId',
    element: <ProjectDetail />,
    meta: {
      requiresAuth: true,
      showFooter: false,
      title: '项目详情',
    },
    children: [
      {
        index: true,
        element: <Navigate to="sponsor" replace />,
      },
      {
        path: 'world-setting',
        element: <WorldSetting />,
        meta: {
          title: '世界设定',
        },
      },
      {
        path: 'careers',
        element: <Careers />,
        meta: {
          title: '职业管理',
        },
      },
      {
        path: 'outline',
        element: <Outline />,
        meta: {
          title: '大纲',
        },
      },
      {
        path: 'characters',
        element: <Characters />,
        meta: {
          title: '角色',
        },
      },
      {
        path: 'relationships',
        element: <Relationships />,
        meta: {
          title: '关系',
        },
      },
      {
        path: 'organizations',
        element: <Organizations />,
        meta: {
          title: '组织',
        },
      },
      {
        path: 'chapters',
        element: <Chapters />,
        meta: {
          title: '章节',
        },
      },
      {
        path: 'chapter-analysis',
        element: <ChapterAnalysis />,
        meta: {
          title: '章节分析',
        },
      },
      {
        path: 'foreshadows',
        element: <Foreshadows />,
        meta: {
          title: '伏笔管理',
        },
      },
      {
        path: 'writing-styles',
        element: <WritingStyles />,
        meta: {
          title: '写作风格',
        },
      },
      {
        path: 'sponsor',
        element: <Sponsor />,
        meta: {
          title: '赞助',
        },
      },
    ],
  },
];
