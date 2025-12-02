// Scripts barrel export
// Components - use named exports to avoid init conflicts
export { init as initAnimations } from './components/animations-unified';
export { init as initBlog } from './components/blog';
export { init as initCarousel, startAuto, stopAuto } from './components/carousel';
export { initFAQ } from './components/faq';
export { init as initForms } from './components/forms';
export { init as initGallery } from './components/gallery';
export { initLazyLoading, initSmoothScroll, init as initInteractive } from './components/interactive';
export { init as initNavigation } from './components/navigation';
export { init as initPreloader } from './components/preloader';
export { init as initSakura } from './components/sakura';
export { init as initTheme } from './components/theme';

// Utils
export * from './utils/analytics';
export * from './utils/api';
export * from './utils/events';
export * from './utils/performance';
export * from './utils/store';

// Config
export * from './config/api.config';
