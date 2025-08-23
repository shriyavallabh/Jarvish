import { useForm as useReactHookForm, UseFormProps, FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ZodSchema } from 'zod';
import { useState } from 'react';
import { toast } from 'sonner';

interface UseFormOptions<T extends FieldValues> extends UseFormProps<T> {
  schema?: ZodSchema<T>;
  onSubmit?: (data: T) => Promise<void> | void;
  onError?: (error: any) => void;
  successMessage?: string;
  errorMessage?: string;
}

export function useForm<T extends FieldValues>({
  schema,
  onSubmit,
  onError,
  successMessage = 'Success!',
  errorMessage = 'Something went wrong',
  ...formOptions
}: UseFormOptions<T> = {}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useReactHookForm<T>({
    ...formOptions,
    resolver: schema ? zodResolver(schema) : undefined,
  });

  const handleSubmit = form.handleSubmit(async (data: T) => {
    if (!onSubmit) return;

    setIsSubmitting(true);
    try {
      await onSubmit(data);
      toast.success(successMessage);
      form.reset();
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error(errorMessage);
      onError?.(error);
    } finally {
      setIsSubmitting(false);
    }
  });

  return {
    ...form,
    handleSubmit,
    isSubmitting,
  };
}

// Hook for multi-step forms
export function useMultiStepForm<T extends FieldValues>(
  steps: number,
  options?: UseFormOptions<T>
) {
  const [currentStep, setCurrentStep] = useState(0);
  const form = useForm(options);

  const nextStep = () => {
    if (currentStep < steps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (step: number) => {
    if (step >= 0 && step < steps) {
      setCurrentStep(step);
    }
  };

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps - 1;
  const progress = ((currentStep + 1) / steps) * 100;

  return {
    ...form,
    currentStep,
    nextStep,
    prevStep,
    goToStep,
    isFirstStep,
    isLastStep,
    progress,
    totalSteps: steps,
  };
}

// Hook for auto-save forms
export function useAutoSaveForm<T extends FieldValues>(
  saveFunction: (data: Partial<T>) => Promise<void>,
  debounceMs: number = 1000,
  options?: UseFormOptions<T>
) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const form = useForm(options);

  // Watch all form fields
  const watchedValues = form.watch();

  // Auto-save on change
  useState(() => {
    const timeoutId = setTimeout(async () => {
      if (Object.keys(watchedValues).length > 0) {
        setIsSaving(true);
        try {
          await saveFunction(watchedValues);
          setLastSaved(new Date());
        } catch (error) {
          console.error('Auto-save failed:', error);
        } finally {
          setIsSaving(false);
        }
      }
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  });

  return {
    ...form,
    isSaving,
    lastSaved,
  };
}