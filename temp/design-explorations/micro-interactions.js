/**
 * JARVISH Micro-interactions Enhancement System
 * Professional animations and interactive behaviors
 * Version: 1.0 - Final Polish
 */

class MicroInteractions {
  constructor() {
    this.init();
    this.setupEventListeners();
    this.initializeAnimationObserver();
    this.respectUserPreferences();
  }

  /**
   * Initialize micro-interactions system
   */
  init() {
    // Check for reduced motion preference
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // Performance monitoring
    this.performanceMode = this.detectPerformanceMode();
    
    // Initialize subsystems
    this.initButtonEnhancements();
    this.initInputEnhancements();
    this.initCardAnimations();
    this.initComplianceScores();
    this.initLoadingStates();
    this.initNavigationTransitions();
  }

  /**
   * Setup global event listeners
   */
  setupEventListeners() {
    // Debounced scroll handler for reveal animations
    let scrollTimeout;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => this.handleScroll(), 100);
    });

    // Page visibility change handler
    document.addEventListener('visibilitychange', () => {
      this.handleVisibilityChange();
    });

    // Network status monitoring
    window.addEventListener('online', () => this.handleNetworkStatus(true));
    window.addEventListener('offline', () => this.handleNetworkStatus(false));
  }

  /**
   * Initialize Intersection Observer for reveal animations
   */
  initializeAnimationObserver() {
    if (this.prefersReducedMotion) return;

    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };

    this.animationObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.revealElement(entry.target);
          this.animationObserver.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // Observe elements with data-reveal attribute
    document.querySelectorAll('[data-reveal]').forEach(element => {
      this.animationObserver.observe(element);
    });
  }

  /**
   * Button Enhancement System
   */
  initButtonEnhancements() {
    const buttons = document.querySelectorAll('.btn');
    
    buttons.forEach(button => {
      // Add ripple effect on click
      button.addEventListener('click', (e) => {
        if (!this.prefersReducedMotion) {
          this.createRipple(e, button);
        }
        
        // Handle loading states
        if (button.dataset.loading === 'true') {
          this.setButtonLoading(button);
        }
      });

      // Enhanced hover effect
      button.addEventListener('mouseenter', () => {
        if (!this.prefersReducedMotion) {
          this.enhanceButtonHover(button);
        }
      });

      // Success state handling
      if (button.dataset.success) {
        button.addEventListener('transitionend', () => {
          this.handleButtonSuccess(button);
        });
      }
    });
  }

  /**
   * Create ripple effect on element
   */
  createRipple(event, element) {
    const ripple = document.createElement('span');
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.classList.add('ripple-effect');

    element.appendChild(ripple);

    ripple.addEventListener('animationend', () => {
      ripple.remove();
    });
  }

  /**
   * Set button loading state
   */
  setButtonLoading(button) {
    button.classList.add('loading');
    button.disabled = true;
    
    // Store original text
    button.dataset.originalText = button.textContent;
    
    // Simulate loading completion
    setTimeout(() => {
      this.completeButtonLoading(button);
    }, 2000);
  }

  /**
   * Complete button loading
   */
  completeButtonLoading(button) {
    button.classList.remove('loading');
    button.classList.add('success');
    button.disabled = false;
    
    // Restore text after animation
    setTimeout(() => {
      button.textContent = button.dataset.originalText;
      button.classList.remove('success');
    }, 1000);
  }

  /**
   * Input Field Enhancement System
   */
  initInputEnhancements() {
    const inputs = document.querySelectorAll('.input-field');
    
    inputs.forEach(input => {
      // Floating label animation
      this.setupFloatingLabel(input);
      
      // Real-time validation
      if (input.dataset.validate) {
        input.addEventListener('input', () => {
          this.validateInput(input);
        });
      }

      // Focus animations
      input.addEventListener('focus', () => {
        this.enhanceInputFocus(input);
      });

      input.addEventListener('blur', () => {
        this.handleInputBlur(input);
      });
    });
  }

  /**
   * Setup floating label behavior
   */
  setupFloatingLabel(input) {
    const label = input.parentElement.querySelector('label');
    if (!label) return;

    // Check if input has value on load
    if (input.value) {
      label.classList.add('floating');
    }

    input.addEventListener('input', () => {
      if (input.value) {
        label.classList.add('floating');
      } else {
        label.classList.remove('floating');
      }
    });
  }

  /**
   * Validate input field
   */
  validateInput(input) {
    const value = input.value;
    const validationType = input.dataset.validate;
    
    let isValid = false;

    switch (validationType) {
      case 'email':
        isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        break;
      case 'phone':
        isValid = /^[0-9]{10}$/.test(value);
        break;
      case 'compliance':
        isValid = this.validateCompliance(value);
        break;
      default:
        isValid = value.length > 0;
    }

    // Update visual state
    if (isValid) {
      input.classList.remove('invalid');
      input.classList.add('valid');
      this.showValidationIcon(input, 'success');
    } else if (value.length > 0) {
      input.classList.remove('valid');
      input.classList.add('invalid');
      this.showValidationIcon(input, 'error');
    }
  }

  /**
   * Validate compliance content
   */
  validateCompliance(content) {
    // Simulated SEBI compliance check
    const prohibitedTerms = ['guaranteed', 'risk-free', 'assured returns'];
    const hasProhibited = prohibitedTerms.some(term => 
      content.toLowerCase().includes(term)
    );
    
    return !hasProhibited && content.length >= 10;
  }

  /**
   * Show validation icon
   */
  showValidationIcon(input, type) {
    const existingIcon = input.parentElement.querySelector('.validation-icon');
    if (existingIcon) {
      existingIcon.remove();
    }

    const icon = document.createElement('span');
    icon.className = `validation-icon validation-icon-${type}`;
    icon.innerHTML = type === 'success' ? '✓' : '✕';
    
    input.parentElement.appendChild(icon);

    // Animate icon appearance
    requestAnimationFrame(() => {
      icon.style.transform = 'scale(1)';
      icon.style.opacity = '1';
    });
  }

  /**
   * Card Animation System
   */
  initCardAnimations() {
    const cards = document.querySelectorAll('.card');
    
    cards.forEach((card, index) => {
      // Staggered entrance animation
      if (!this.prefersReducedMotion) {
        card.style.animationDelay = `${index * 50}ms`;
        card.classList.add('animate-in');
      }

      // 3D hover effect
      card.addEventListener('mousemove', (e) => {
        if (!this.prefersReducedMotion) {
          this.handle3DHover(e, card);
        }
      });

      card.addEventListener('mouseleave', () => {
        if (!this.prefersReducedMotion) {
          this.reset3DHover(card);
        }
      });

      // Click feedback
      card.addEventListener('click', () => {
        this.handleCardClick(card);
      });
    });
  }

  /**
   * Handle 3D hover effect
   */
  handle3DHover(event, card) {
    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = (y - centerY) / 20;
    const rotateY = (centerX - x) / 20;
    
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
  }

  /**
   * Reset 3D hover effect
   */
  reset3DHover(card) {
    card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
  }

  /**
   * Compliance Score Animation System
   */
  initComplianceScores() {
    const scores = document.querySelectorAll('.compliance-score');
    
    scores.forEach(score => {
      const value = parseInt(score.dataset.score);
      
      // Animate score on visibility
      this.animationObserver.observe(score);
      score.addEventListener('reveal', () => {
        this.animateComplianceScore(score, value);
      });
    });
  }

  /**
   * Animate compliance score
   */
  animateComplianceScore(element, targetValue) {
    const duration = 1500;
    const startTime = performance.now();
    const numberElement = element.querySelector('.score-number');
    const progressRing = element.querySelector('.progress-ring');
    
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function
      const eased = 1 - Math.pow(1 - progress, 3);
      
      // Update number
      const currentValue = Math.floor(targetValue * eased);
      numberElement.textContent = currentValue;
      
      // Update progress ring
      if (progressRing) {
        const circumference = 2 * Math.PI * 45;
        const offset = circumference - (circumference * eased * (targetValue / 100));
        progressRing.style.strokeDashoffset = offset;
      }
      
      // Update color based on score
      this.updateScoreColor(element, currentValue);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }

  /**
   * Update score color based on value
   */
  updateScoreColor(element, score) {
    let colorClass = 'score-low';
    
    if (score >= 80) {
      colorClass = 'score-high';
    } else if (score >= 60) {
      colorClass = 'score-medium';
    }
    
    element.className = `compliance-score ${colorClass}`;
  }

  /**
   * Loading State System
   */
  initLoadingStates() {
    // Skeleton screens
    this.initSkeletonScreens();
    
    // Progress bars
    this.initProgressBars();
    
    // Spinners
    this.initSpinners();
  }

  /**
   * Initialize skeleton screens
   */
  initSkeletonScreens() {
    const skeletons = document.querySelectorAll('.skeleton');
    
    skeletons.forEach(skeleton => {
      // Auto-remove skeleton after content loads
      if (skeleton.dataset.autoRemove) {
        setTimeout(() => {
          this.transitionFromSkeleton(skeleton);
        }, 1500);
      }
    });
  }

  /**
   * Transition from skeleton to content
   */
  transitionFromSkeleton(skeleton) {
    skeleton.style.opacity = '0';
    
    setTimeout(() => {
      skeleton.style.display = 'none';
      
      // Reveal actual content
      const content = skeleton.nextElementSibling;
      if (content) {
        content.style.opacity = '0';
        content.style.display = 'block';
        
        requestAnimationFrame(() => {
          content.style.transition = 'opacity 300ms ease';
          content.style.opacity = '1';
        });
      }
    }, 300);
  }

  /**
   * Initialize progress bars
   */
  initProgressBars() {
    const progressBars = document.querySelectorAll('.progress-bar');
    
    progressBars.forEach(bar => {
      const fill = bar.querySelector('.progress-bar-fill');
      const targetWidth = bar.dataset.progress || '0';
      
      // Animate on visibility
      this.animationObserver.observe(bar);
      bar.addEventListener('reveal', () => {
        fill.style.width = `${targetWidth}%`;
      });
    });
  }

  /**
   * Navigation Transition System
   */
  initNavigationTransitions() {
    // Tab navigation
    this.initTabNavigation();
    
    // Page transitions
    this.initPageTransitions();
    
    // Mobile navigation
    this.initMobileNavigation();
  }

  /**
   * Initialize tab navigation
   */
  initTabNavigation() {
    const tabContainers = document.querySelectorAll('.tab-navigation');
    
    tabContainers.forEach(container => {
      const tabs = container.querySelectorAll('.tab');
      const indicator = container.querySelector('.tab-indicator');
      
      tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          this.switchTab(tab, tabs, indicator);
        });
      });
      
      // Initialize indicator position
      const activeTab = container.querySelector('.tab.active');
      if (activeTab && indicator) {
        this.updateTabIndicator(activeTab, indicator);
      }
    });
  }

  /**
   * Switch tab with animation
   */
  switchTab(selectedTab, allTabs, indicator) {
    // Update active states
    allTabs.forEach(tab => tab.classList.remove('active'));
    selectedTab.classList.add('active');
    
    // Update indicator
    if (indicator) {
      this.updateTabIndicator(selectedTab, indicator);
    }
    
    // Trigger content transition
    this.transitionTabContent(selectedTab.dataset.tab);
  }

  /**
   * Update tab indicator position
   */
  updateTabIndicator(tab, indicator) {
    const tabRect = tab.getBoundingClientRect();
    const containerRect = tab.parentElement.getBoundingClientRect();
    
    indicator.style.left = `${tabRect.left - containerRect.left}px`;
    indicator.style.width = `${tabRect.width}px`;
  }

  /**
   * Toast Notification System
   */
  showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-icon">${this.getToastIcon(type)}</div>
      <div class="toast-message">${message}</div>
      <button class="toast-close">×</button>
    `;
    
    // Add to container
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    
    container.appendChild(toast);
    
    // Trigger animation
    requestAnimationFrame(() => {
      toast.classList.add('toast-show');
    });
    
    // Auto dismiss
    const dismissTimer = setTimeout(() => {
      this.dismissToast(toast);
    }, duration);
    
    // Manual dismiss
    toast.querySelector('.toast-close').addEventListener('click', () => {
      clearTimeout(dismissTimer);
      this.dismissToast(toast);
    });
    
    return toast;
  }

  /**
   * Get toast icon based on type
   */
  getToastIcon(type) {
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };
    return icons[type] || icons.info;
  }

  /**
   * Dismiss toast notification
   */
  dismissToast(toast) {
    toast.classList.add('toast-exit');
    
    toast.addEventListener('animationend', () => {
      toast.remove();
    });
  }

  /**
   * Modal System
   */
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    // Show backdrop
    let backdrop = document.querySelector('.modal-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop';
      document.body.appendChild(backdrop);
    }
    
    // Show modal
    modal.style.display = 'flex';
    backdrop.style.display = 'block';
    
    // Trigger animations
    requestAnimationFrame(() => {
      backdrop.classList.add('show');
      modal.classList.add('show');
    });
    
    // Focus management
    const firstFocusable = modal.querySelector('button, [href], input, select, textarea');
    if (firstFocusable) {
      firstFocusable.focus();
    }
    
    // Close handlers
    backdrop.addEventListener('click', () => this.closeModal(modalId));
    modal.querySelector('.modal-close')?.addEventListener('click', () => this.closeModal(modalId));
  }

  /**
   * Close modal
   */
  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    const backdrop = document.querySelector('.modal-backdrop');
    
    if (!modal) return;
    
    // Trigger exit animations
    modal.classList.remove('show');
    backdrop?.classList.remove('show');
    
    // Remove after animation
    setTimeout(() => {
      modal.style.display = 'none';
      if (backdrop) {
        backdrop.style.display = 'none';
      }
    }, 300);
  }

  /**
   * Performance Detection
   */
  detectPerformanceMode() {
    // Check device capabilities
    const memory = navigator.deviceMemory || 4;
    const cores = navigator.hardwareConcurrency || 4;
    
    if (memory < 4 || cores < 4) {
      return 'low';
    } else if (memory >= 8 && cores >= 8) {
      return 'high';
    }
    
    return 'standard';
  }

  /**
   * Respect User Preferences
   */
  respectUserPreferences() {
    // Listen for preference changes
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
      this.prefersReducedMotion = e.matches;
      this.updateAnimationSettings();
    });
    
    // Battery status
    if ('getBattery' in navigator) {
      navigator.getBattery().then(battery => {
        this.handleBatteryStatus(battery);
        battery.addEventListener('levelchange', () => this.handleBatteryStatus(battery));
      });
    }
  }

  /**
   * Handle battery status
   */
  handleBatteryStatus(battery) {
    if (battery.level < 0.2) {
      document.body.classList.add('battery-saver');
    } else {
      document.body.classList.remove('battery-saver');
    }
  }

  /**
   * Update animation settings based on preferences
   */
  updateAnimationSettings() {
    if (this.prefersReducedMotion) {
      document.body.classList.add('reduced-motion');
    } else {
      document.body.classList.remove('reduced-motion');
    }
  }

  /**
   * Reveal element with animation
   */
  revealElement(element) {
    element.classList.add('revealed');
    element.dispatchEvent(new Event('reveal'));
  }

  /**
   * Handle scroll events
   */
  handleScroll() {
    // Update progress indicators
    this.updateScrollProgress();
    
    // Parallax effects
    if (!this.prefersReducedMotion && this.performanceMode !== 'low') {
      this.updateParallax();
    }
  }

  /**
   * Update scroll progress indicator
   */
  updateScrollProgress() {
    const progress = document.querySelector('.scroll-progress');
    if (!progress) return;
    
    const scrollTop = window.pageYOffset;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = (scrollTop / docHeight) * 100;
    
    progress.style.width = `${scrollPercent}%`;
  }

  /**
   * Handle network status changes
   */
  handleNetworkStatus(online) {
    if (online) {
      this.showToast('Connection restored', 'success');
    } else {
      this.showToast('Connection lost. Some features may be unavailable.', 'warning');
    }
  }

  /**
   * Handle visibility change
   */
  handleVisibilityChange() {
    if (document.hidden) {
      // Pause animations to save resources
      document.body.classList.add('animations-paused');
    } else {
      // Resume animations
      document.body.classList.remove('animations-paused');
    }
  }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.microInteractions = new MicroInteractions();
  });
} else {
  window.microInteractions = new MicroInteractions();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MicroInteractions;
}