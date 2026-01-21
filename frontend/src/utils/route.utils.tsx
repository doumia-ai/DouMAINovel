import type { ReactElement } from 'react';

import type { RouteObject } from 'react-router-dom';

import type { RouteConfig } from '../config/routes.config.js';

import AppFooter from '../components/AppFooter.js';
import ProtectedRoute from '../components/ProtectedRoute.js';

/**
 * Wraps a route element with authentication protection if required
 * @param element - The route element to wrap
 * @param requiresAuth - Whether the route requires authentication
 * @returns The wrapped element
 */
export function wrapRouteWithAuth(
  element: ReactElement,
  requiresAuth: boolean = false
): ReactElement {
  if (requiresAuth) {
    return <ProtectedRoute>{element}</ProtectedRoute>;
  }
  return element;
}

/**
 * Wraps a route element with footer if required
 * @param element - The route element to wrap
 * @param showFooter - Whether to show the footer
 * @returns The wrapped element
 */
export function wrapRouteWithFooter(
  element: ReactElement,
  showFooter: boolean = false
): ReactElement {
  if (showFooter) {
    return (
      <>
        {element}
        <AppFooter />
      </>
    );
  }
  return element;
}

/**
 * Processes route metadata and wraps the element accordingly
 * @param route - The route configuration
 * @returns The processed route object
 */
export function processRouteMetadata(route: RouteConfig): RouteObject {
  const { meta, element, children, ...rest } = route;

  let processedElement = element;

  if (processedElement && meta) {
    // Apply footer wrapper first
    if (meta.showFooter) {
      processedElement = wrapRouteWithFooter(processedElement, true);
    }

    // Apply auth wrapper second (outer wrapper)
    if (meta.requiresAuth) {
      processedElement = wrapRouteWithAuth(processedElement, true);
    }
  }

  // Process children recursively
  const processedChildren = children?.map((child) => {
    if ('meta' in child) {
      return processRouteMetadata(child as RouteConfig);
    }
    return child;
  });

  return {
    ...rest,
    element: processedElement,
    children: processedChildren,
  };
}

/**
 * Processes all routes and applies metadata wrappers
 * @param routes - Array of route configurations
 * @returns Array of processed route objects
 */
export function processRoutes(routes: RouteConfig[]): RouteObject[] {
  return routes.map(processRouteMetadata);
}

/**
 * Gets the title from route metadata
 * @param route - The route configuration
 * @returns The route title or undefined
 */
export function getRouteTitle(route: RouteConfig): string | undefined {
  return route.meta?.title;
}

/**
 * Checks if a route requires authentication
 * @param route - The route configuration
 * @returns True if the route requires authentication
 */
export function requiresAuthentication(route: RouteConfig): boolean {
  return route.meta?.requiresAuth ?? false;
}

/**
 * Checks if a route requires admin privileges
 * @param route - The route configuration
 * @returns True if the route requires admin privileges
 */
export function requiresAdmin(route: RouteConfig): boolean {
  return route.meta?.requiresAdmin ?? false;
}
