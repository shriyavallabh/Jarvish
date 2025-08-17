import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils'; // Assuming you're using shadcn/ui utilities

// Types
interface TimelineStep {
  id: string;
  title: string;
  description: string;
  duration: string;
  status: 'pending' | 'active' | 'completed';
  dayRange: [number, number];
}

interface JourneyTimelineProps {
  variant: 'horizontal' | 'vertical' | 'compact';
  steps?: TimelineStep[];
  currentStep?: number;
  onStepClick?: (stepId: string, index: number) => void;
  className?: string;
  animated?: boolean;
}

// Default timeline data
const defaultSteps: TimelineStep[] = [
  {
    id: 'setup',
    title: 'Quick Setup',
    description: 'Connect WhatsApp, verify credentials, set preferences',
    duration: 'Day 1-3',
    status: 'completed',
    dayRange: [1, 3]
  },
  {
    id: 'first-campaign',
    title: 'First Campaign',
    description: 'Launch AI-powered content with compliance checking',
    duration: 'Day 4-7',
    status: 'completed',
    dayRange: [4, 7]
  },
  {
    id: 'optimize',
    title: 'Optimize',
    description: 'Analyze performance, refine strategy, build audience',
    duration: 'Day 8-21',
    status: 'active',
    dayRange: [8, 21]
  },
  {
    id: 'scale',
    title: 'Scale',
    description: 'Expand reach, advanced features, premium branding',
    duration: 'Day 22-30',
    status: 'pending',
    dayRange: [22, 30]
  }
];

// Horizontal Timeline Component
const HorizontalTimeline: React.FC<JourneyTimelineProps> = ({
  steps = defaultSteps,
  onStepClick,
  className,
  animated = true
}) => {
  const [progress, setProgress] = useState(0);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => {
        const completedSteps = steps.filter(s => s.status === 'completed').length;
        const activeStep = steps.findIndex(s => s.status === 'active');
        const totalProgress = ((completedSteps + (activeStep >= 0 ? 0.5 : 0)) / steps.length) * 100;
        setProgress(totalProgress);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [steps, animated]);

  return (
    <div className={cn(
      "bg-white rounded-2xl p-12 shadow-lg relative overflow-hidden",
      className
    )}>
      {/* Top gradient bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0C310C] to-[#CEA200]" />
      
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-[#0B1F33] to-[#0C310C] bg-clip-text text-transparent">
          From Setup to Scale in 30 Days
        </h1>
        <p className="text-xl text-gray-600">
          Transform your advisory practice with AI-powered WhatsApp automation
        </p>
      </div>

      {/* Timeline Track */}
      <div className="relative py-8">
        {/* Progress Background */}
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -translate-y-1/2 rounded-full">
          <div 
            ref={progressRef}
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#0C310C] to-[#CEA200] rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Steps */}
        <div className="flex justify-between relative z-10">
          {steps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => onStepClick?.(step.id, index)}
              className={cn(
                "flex-1 text-center group transition-transform hover:-translate-y-1",
                animated && "animate-in fade-in slide-in-from-bottom-4"
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Step Marker */}
              <div className={cn(
                "w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center relative transition-all",
                step.status === 'completed' && "bg-green-500 border-green-500",
                step.status === 'active' && "bg-[#CEA200] border-[#CEA200] shadow-[0_0_0_0_rgba(206,162,0,0.4)] animate-pulse-ring",
                step.status === 'pending' && "bg-white border-gray-300",
                "border-3"
              )}>
                <span className={cn(
                  "text-2xl font-bold",
                  (step.status === 'completed' || step.status === 'active') ? "text-white" : "text-[#0B1F33]"
                )}>
                  {step.status === 'completed' ? '✓' : index + 1}
                </span>
              </div>

              {/* Step Content */}
              <div className="max-w-[200px] mx-auto">
                <h3 className="text-lg font-semibold mb-1 text-[#0B1F33]">
                  {step.title}
                </h3>
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                  {step.description}
                </p>
                <span className="inline-block px-3 py-1 bg-gray-50 rounded-full text-xs font-semibold text-[#0C310C]">
                  {step.duration}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Vertical Timeline Component
const VerticalTimeline: React.FC<JourneyTimelineProps> = ({
  steps = defaultSteps,
  onStepClick,
  className,
  animated = true
}) => {
  const [progressHeight, setProgressHeight] = useState(0);

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => {
        const completedSteps = steps.filter(s => s.status === 'completed').length;
        const activeStep = steps.findIndex(s => s.status === 'active');
        const totalProgress = ((completedSteps + (activeStep >= 0 ? 0.5 : 0)) / steps.length) * 100;
        setProgressHeight(totalProgress);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [steps, animated]);

  return (
    <div className={cn(
      "bg-white rounded-xl p-6 shadow-md max-w-xs",
      className
    )}>
      {/* Header */}
      <div className="mb-6 pb-6 border-b-2 border-gray-100">
        <h3 className="text-xl font-bold mb-1 text-[#0B1F33]">Your Journey</h3>
        <p className="text-sm text-gray-600">Track your progress to success</p>
      </div>

      {/* Timeline Track */}
      <div className="relative pl-6">
        {/* Vertical Line */}
        <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200">
          <div 
            className="absolute left-0 top-0 w-full bg-gradient-to-b from-[#0C310C] to-[#CEA200] transition-all duration-1000 ease-out"
            style={{ height: `${progressHeight}%` }}
          />
        </div>

        {/* Steps */}
        <div className="space-y-6">
          {steps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => onStepClick?.(step.id, index)}
              className={cn(
                "relative text-left w-full group transition-transform hover:translate-x-1",
                animated && "animate-in fade-in slide-in-from-left-4"
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Step Marker */}
              <div className={cn(
                "absolute -left-6 top-7 w-6 h-6 rounded-full transition-all",
                step.status === 'completed' && "bg-green-500 border-green-500",
                step.status === 'active' && "bg-[#CEA200] border-[#CEA200] shadow-[0_0_0_8px_rgba(206,162,0,0.2)]",
                step.status === 'pending' && "bg-white border-gray-300",
                "border-2"
              )} />

              {/* Step Content */}
              <div className="pl-4">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-base font-semibold text-[#0B1F33]">
                    {step.title}
                  </h4>
                  <span className="text-xs text-[#CEA200] font-semibold">
                    {step.duration}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {step.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Compact Timeline Component
const CompactTimeline: React.FC<JourneyTimelineProps> = ({
  steps = defaultSteps,
  onStepClick,
  className,
  animated = true
}) => {
  const activeStepIndex = steps.findIndex(s => s.status === 'active');
  const completedCount = steps.filter(s => s.status === 'completed').length;

  return (
    <div className={cn(
      "bg-white rounded-lg p-6 shadow-sm",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-[#0B1F33]">
          Advisor Onboarding Progress
        </h3>
        <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-full">
          <div className="w-2 h-2 bg-[#CEA200] rounded-full animate-pulse" />
          <span className="text-xs font-semibold text-[#0C310C]">In Progress</span>
        </div>
      </div>

      {/* Progress Track */}
      <div className="h-12 bg-gray-50 rounded-lg relative overflow-hidden mb-4">
        <div 
          className="absolute inset-0 bg-gradient-to-r from-green-500 via-[#CEA200] to-transparent"
          style={{
            background: `linear-gradient(90deg, 
              #10B981 0%, 
              #10B981 ${(completedCount / steps.length) * 100}%, 
              #CEA200 ${(completedCount / steps.length) * 100}%, 
              #CEA200 ${((completedCount + 0.5) / steps.length) * 100}%, 
              transparent ${((completedCount + 0.5) / steps.length) * 100}%)`
          }}
        />
        
        {/* Markers */}
        <div className="flex justify-between items-center h-full px-2 relative z-10">
          {steps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => onStepClick?.(step.id, index)}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                step.status === 'completed' && "bg-green-500 text-white",
                step.status === 'active' && "bg-[#CEA200] text-white scale-125",
                step.status === 'pending' && "bg-white border-2 border-gray-300 text-[#0B1F33]"
              )}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-4 gap-4">
        {steps.map((step, index) => (
          <button
            key={step.id}
            onClick={() => onStepClick?.(step.id, index)}
            className="text-center p-2 rounded hover:bg-gray-50 transition-colors"
          >
            <div className="text-xs font-semibold text-[#0B1F33] mb-0.5">
              {step.title}
            </div>
            <div className="text-[11px] text-gray-600">
              {step.status === 'completed' ? 'Completed' : 
               step.status === 'active' ? `Day ${Math.floor((step.dayRange[1] - step.dayRange[0]) / 2)} of ${step.dayRange[1] - step.dayRange[0] + 1}` :
               'Upcoming'}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

// Main Component Export
export const JourneyTimeline: React.FC<JourneyTimelineProps> = ({
  variant = 'horizontal',
  ...props
}) => {
  switch (variant) {
    case 'vertical':
      return <VerticalTimeline {...props} />;
    case 'compact':
      return <CompactTimeline {...props} />;
    case 'horizontal':
    default:
      return <HorizontalTimeline {...props} />;
  }
};

// Tailwind CSS classes that need to be included in your config
// Add these to your global CSS or Tailwind config:
/*
@keyframes pulse-ring {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(206, 162, 0, 0.4);
  }
  50% {
    box-shadow: 0 0 0 20px rgba(206, 162, 0, 0);
  }
}

.animate-pulse-ring {
  animation: pulse-ring 2s infinite;
}

.animate-in {
  animation-fill-mode: both;
}

.fade-in {
  animation: fadeIn 0.5s ease;
}

.slide-in-from-bottom-4 {
  animation: slideInUp 0.5s ease;
}

.slide-in-from-left-4 {
  animation: slideInLeft 0.5s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideInUp {
  from { 
    opacity: 0;
    transform: translateY(1rem);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInLeft {
  from { 
    opacity: 0;
    transform: translateX(-1rem);
  }
  to { 
    opacity: 1;
    transform: translateX(0);
  }
}
*/

export default JourneyTimeline;