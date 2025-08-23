/**
 * JARVISH Frontend Performance Optimizer
 * Code splitting, lazy loading, and performance monitoring for React components
 * Target: <1.2s FCP, <2.5s LCP, optimal bundle sizes
 */

import dynamic from 'next/dynamic';
import { Suspense, ComponentType, useEffect, useState, ReactNode, lazy } from 'react';
import { performanceMonitor } from './performance-monitor';

interface LazyComponentOptions {
  loading?: ComponentType;
  error?: ComponentType<{ error: Error }>;
  delay?: number;
  timeout?: number;
  ssr?: boolean;
}

interface PerformanceMetrics {
  fcp?: number;
  lcp?: number;
  cls?: number;
  fid?: number;
  ttfb?: number;
}

/**
 * Enhanced lazy loading with performance monitoring
 */
export function createLazyComponent<T extends ComponentType<any>>(
  loader: () => Promise<{ default: T }>,
  options: LazyComponentOptions = {}
): ComponentType {
  const {
    loading: LoadingComponent = DefaultLoadingComponent,
    error: ErrorComponent = DefaultErrorComponent,
    delay = 200,
    timeout = 10000,
    ssr = false
  } = options;

  const LazyComponent = dynamic(loader, {
    loading: () => <LoadingComponent />,
    ssr
  });

  return function EnhancedLazyComponent(props: any) {
    const [loadTime, setLoadTime] = useState<number>();
    const [error, setError] = useState<Error>();

    useEffect(() => {
      const startTime = performance.now();
      
      // Track component load time
      const timeoutId = setTimeout(() => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        setLoadTime(duration);
        
        // Record performance metrics
        performanceMonitor.recordMetric('component.lazy_load_time', duration, {
          component: loader.toString().slice(0, 50),
          type: 'lazy_component'
        });
      }, delay);

      return () => clearTimeout(timeoutId);
    }, []);

    if (error) {
      return <ErrorComponent error={error} />;
    }

    return (
      <Suspense fallback={<LoadingComponent />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

/**
 * Code splitting utilities for different component types
 */
export const LazyComponents = {
  // Dashboard components
  AdminDashboard: createLazyComponent(
    () => import('@/components/admin/dashboard-stats'),
    { loading: DashboardSkeleton, ssr: false }
  ),
  
  AdvisorDashboard: createLazyComponent(
    () => import('@/components/advisor/dashboard-stats'),
    { loading: DashboardSkeleton, ssr: false }
  ),

  // Analytics components
  AnalyticsChart: createLazyComponent(
    () => import('@/components/ui/charts/line-chart'),
    { loading: ChartSkeleton, ssr: false }
  ),

  PerformanceChart: createLazyComponent(
    () => import('@/components/ui/charts/metrics-card'),
    { loading: ChartSkeleton, ssr: false }
  ),

  // Content creation components
  ContentCreator: createLazyComponent(
    () => import('@/components/content/content-creator'),
    { loading: FormSkeleton, ssr: false }
  ),

  ComplianceChecker: createLazyComponent(
    () => import('@/components/compliance/compliance-checker'),
    { loading: FormSkeleton, ssr: false }
  ),

  // WhatsApp components
  WhatsAppPreview: createLazyComponent(
    () => import('@/components/whatsapp/message-preview'),
    { loading: MessageSkeleton, ssr: false }
  ),

  DeliveryMonitor: createLazyComponent(
    () => import('@/components/whatsapp/DeliveryMonitor'),
    { loading: TableSkeleton, ssr: false }
  ),

  // Heavy third-party components
  RichTextEditor: createLazyComponent(
    () => import('@/components/ui/rich-text-editor'),
    { loading: EditorSkeleton, timeout: 15000, ssr: false }
  ),

  DataTable: createLazyComponent(
    () => import('@/components/ui/data-table'),
    { loading: TableSkeleton, ssr: false }
  )
};

/**
 * Progressive loading for images with performance tracking
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  className = '',
  onLoad,
  ...props
}: {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
  onLoad?: () => void;
  [key: string]: any;
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const startTime = performance.now();
    
    const img = new Image();
    img.onload = () => {
      const loadTime = performance.now() - startTime;
      
      performanceMonitor.recordMetric('image.load_time', loadTime, {
        src: src.slice(0, 50),
        width: width?.toString(),
        height: height?.toString(),
        priority: priority.toString()
      });
      
      setIsLoaded(true);
      onLoad?.();
    };
    
    img.onerror = () => setError(true);
    img.src = src;
  }, [src, width, height, priority, onLoad]);

  if (error) {
    return (
      <div className={`bg-gray-200 flex items-center justify-center ${className}`}>
        <span className="text-gray-500 text-sm">Failed to load image</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        {...props}
      />
    </div>
  );
}

/**
 * Bundle size optimizer for dynamic imports
 */
export class BundleOptimizer {
  private static chunkMap = new Map<string, Promise<any>>();
  
  static async loadChunk<T>(
    chunkName: string,
    loader: () => Promise<T>,
    options: { timeout?: number; retry?: number } = {}
  ): Promise<T> {
    const { timeout = 10000, retry = 2 } = options;
    
    if (this.chunkMap.has(chunkName)) {
      return this.chunkMap.get(chunkName)!;
    }

    const startTime = performance.now();
    
    const loadWithTimeout = async (attempt: number): Promise<T> => {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Chunk ${chunkName} load timeout`)), timeout);
      });
      
      try {
        const result = await Promise.race([loader(), timeoutPromise]);
        
        const loadTime = performance.now() - startTime;
        performanceMonitor.recordMetric('bundle.chunk_load_time', loadTime, {
          chunk: chunkName,
          attempt: attempt.toString(),
          success: 'true'
        });
        
        return result;
      } catch (error) {
        if (attempt < retry) {
          console.warn(`Chunk ${chunkName} load failed, retrying...`, error);
          return loadWithTimeout(attempt + 1);
        }
        
        performanceMonitor.recordMetric('bundle.chunk_load_time', performance.now() - startTime, {
          chunk: chunkName,
          attempt: attempt.toString(),
          success: 'false'
        });
        
        throw error;
      }
    };

    const chunkPromise = loadWithTimeout(1);
    this.chunkMap.set(chunkName, chunkPromise);
    
    return chunkPromise;
  }

  static preloadChunk(chunkName: string, loader: () => Promise<any>): void {
    if (!this.chunkMap.has(chunkName)) {
      this.loadChunk(chunkName, loader).catch(error => {
        console.warn(`Preload failed for chunk ${chunkName}:`, error);
      });
    }
  }

  static getChunkStats(): { loaded: number; total: number; loadedChunks: string[] } {
    const loadedChunks = Array.from(this.chunkMap.keys());
    return {
      loaded: loadedChunks.length,
      total: loadedChunks.length,
      loadedChunks
    };
  }
}

/**
 * Performance monitoring hook for components
 */
export function usePerformanceMonitor(componentName: string) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({});

  useEffect(() => {
    const startTime = performance.now();

    // Collect Web Vitals
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        entries.forEach((entry) => {
          if (entry.entryType === 'paint') {
            if (entry.name === 'first-contentful-paint') {
              setMetrics(prev => ({ ...prev, fcp: entry.startTime }));
              performanceMonitor.recordMetric('web_vitals.fcp', entry.startTime, {
                component: componentName
              });
            }
          } else if (entry.entryType === 'largest-contentful-paint') {
            setMetrics(prev => ({ ...prev, lcp: entry.startTime }));
            performanceMonitor.recordMetric('web_vitals.lcp', entry.startTime, {
              component: componentName
            });
          } else if (entry.entryType === 'layout-shift') {
            if (!(entry as any).hadRecentInput) {
              const cls = (entry as any).value;
              setMetrics(prev => ({ ...prev, cls: (prev.cls || 0) + cls }));
              performanceMonitor.recordMetric('web_vitals.cls', cls, {
                component: componentName
              });
            }
          }
        });
      });

      observer.observe({ type: 'paint', buffered: true });
      observer.observe({ type: 'largest-contentful-paint', buffered: true });
      observer.observe({ type: 'layout-shift', buffered: true });

      return () => observer.disconnect();
    }
  }, [componentName]);

  useEffect(() => {
    return () => {
      const mountTime = performance.now();
      performanceMonitor.recordMetric('component.mount_time', mountTime, {
        component: componentName
      });
    };
  }, [componentName]);

  return metrics;
}

/**
 * Resource preloader for critical assets
 */
export class ResourcePreloader {
  private static preloadedResources = new Set<string>();

  static preloadScript(src: string, crossOrigin?: string): void {
    if (this.preloadedResources.has(src) || typeof document === 'undefined') {
      return;
    }

    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'script';
    link.href = src;
    if (crossOrigin) link.crossOrigin = crossOrigin;

    document.head.appendChild(link);
    this.preloadedResources.add(src);
  }

  static preloadStylesheet(href: string): void {
    if (this.preloadedResources.has(href) || typeof document === 'undefined') {
      return;
    }

    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'style';
    link.href = href;

    document.head.appendChild(link);
    this.preloadedResources.add(href);
  }

  static preloadFont(href: string, type: string = 'font/woff2'): void {
    if (this.preloadedResources.has(href) || typeof document === 'undefined') {
      return;
    }

    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'font';
    link.type = type;
    link.href = href;
    link.crossOrigin = 'anonymous';

    document.head.appendChild(link);
    this.preloadedResources.add(href);
  }

  static preloadImage(src: string): void {
    if (this.preloadedResources.has(src) || typeof document === 'undefined') {
      return;
    }

    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;

    document.head.appendChild(link);
    this.preloadedResources.add(src);
  }

  static preloadRoute(route: string): void {
    if (this.preloadedResources.has(route) || typeof window === 'undefined') {
      return;
    }

    import('next/router').then(({ default: Router }) => {
      Router.prefetch(route);
    });

    this.preloadedResources.add(route);
  }
}

// Default loading components
function DefaultLoadingComponent() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
}

function DefaultErrorComponent({ error }: { error: Error }) {
  return (
    <div className="flex items-center justify-center p-8 text-red-600">
      <p>Error loading component: {error.message}</p>
    </div>
  );
}

// Skeleton components
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-gray-200 animate-pulse rounded-lg h-24" />
        ))}
      </div>
      <div className="bg-gray-200 animate-pulse rounded-lg h-64" />
    </div>
  );
}

function ChartSkeleton() {
  return <div className="bg-gray-200 animate-pulse rounded-lg h-64 w-full" />;
}

function FormSkeleton() {
  return (
    <div className="space-y-4">
      <div className="bg-gray-200 animate-pulse rounded h-10 w-full" />
      <div className="bg-gray-200 animate-pulse rounded h-32 w-full" />
      <div className="bg-gray-200 animate-pulse rounded h-10 w-32" />
    </div>
  );
}

function MessageSkeleton() {
  return (
    <div className="border rounded-lg p-4 space-y-2">
      <div className="bg-gray-200 animate-pulse rounded h-4 w-3/4" />
      <div className="bg-gray-200 animate-pulse rounded h-4 w-1/2" />
      <div className="bg-gray-200 animate-pulse rounded h-4 w-5/6" />
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-2">
      <div className="bg-gray-200 animate-pulse rounded h-8 w-full" />
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="bg-gray-200 animate-pulse rounded h-6 w-full" />
      ))}
    </div>
  );
}

function EditorSkeleton() {
  return (
    <div className="border rounded-lg">
      <div className="bg-gray-200 animate-pulse rounded-t-lg h-10 w-full" />
      <div className="bg-gray-100 animate-pulse rounded-b-lg h-32 w-full" />
    </div>
  );
}

/**
 * Critical CSS inlining utility
 */
export function inlineCriticalCSS(css: string): void {
  if (typeof document === 'undefined') return;

  const style = document.createElement('style');
  style.textContent = css;
  style.setAttribute('data-critical', 'true');
  
  document.head.insertBefore(style, document.head.firstChild);
}

/**
 * Service Worker registration for caching
 */
export function registerServiceWorker(): void {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('Service Worker registered:', registration.scope);
          
          performanceMonitor.recordMetric('service_worker.registration', 1, {
            scope: registration.scope,
            status: 'success'
          });
        })
        .catch(error => {
          console.error('Service Worker registration failed:', error);
          
          performanceMonitor.recordMetric('service_worker.registration', 0, {
            status: 'failed',
            error: error.message
          });
        });
    });
  }
}

/**
 * Performance optimization helper for React components
 */
export function withPerformanceOptimization<P extends object>(
  WrappedComponent: ComponentType<P>,
  options: {
    displayName?: string;
    trackMetrics?: boolean;
    preloadResources?: string[];
  } = {}
) {
  const { displayName, trackMetrics = true, preloadResources = [] } = options;
  
  const OptimizedComponent = (props: P) => {
    const componentName = displayName || WrappedComponent.displayName || WrappedComponent.name;
    
    // Track performance metrics
    const metrics = trackMetrics ? usePerformanceMonitor(componentName) : {};
    
    // Preload resources
    useEffect(() => {
      preloadResources.forEach(resource => {
        if (resource.endsWith('.css')) {
          ResourcePreloader.preloadStylesheet(resource);
        } else if (resource.endsWith('.js')) {
          ResourcePreloader.preloadScript(resource);
        } else if (resource.match(/\.(jpg|jpeg|png|webp|svg)$/i)) {
          ResourcePreloader.preloadImage(resource);
        }
      });
    }, []);
    
    return <WrappedComponent {...props} />;
  };
  
  OptimizedComponent.displayName = `withPerformanceOptimization(${componentName})`;
  
  return OptimizedComponent;
}