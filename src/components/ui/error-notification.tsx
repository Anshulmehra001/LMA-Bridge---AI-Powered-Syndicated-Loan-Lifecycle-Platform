import React from 'react';
import { AlertCircle, X, RefreshCw } from 'lucide-react';
import { Button } from './button';
import { UserFriendlyError } from '@/types';

interface ErrorNotificationProps {
  error: UserFriendlyError;
  onDismiss?: () => void;
  onRetry?: () => void;
  className?: string;
}

export function ErrorNotification({ 
  error, 
  onDismiss, 
  onRetry, 
  className = '' 
}: ErrorNotificationProps) {
  return (
    <div className={`bg-red-50 border border-red-200 rounded-md p-4 animate-fade-in ${className}`}>
      <div className="flex items-start">
        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-red-800">
            {error.title}
          </h3>
          <p className="text-sm text-red-700 mt-1">
            {error.message}
          </p>
          {error.action && (
            <p className="text-xs text-red-600 mt-2 italic">
              {error.action}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-2 ml-3">
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="text-red-700 border-red-300 hover:bg-red-100"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Retry
            </Button>
          )}
          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="text-red-500 hover:text-red-700 hover:bg-red-100 p-1"
              aria-label="Close error notification"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

interface FieldErrorProps {
  errors: string[];
  className?: string;
}

export function FieldError({ errors, className = '' }: FieldErrorProps) {
  if (!errors || errors.length === 0) return null;

  return (
    <div className={`text-sm text-red-600 mt-1 ${className}`}>
      {errors.map((error, index) => (
        <div key={index} className="flex items-center">
          <AlertCircle className="w-3 h-3 mr-1 flex-shrink-0" />
          <span>{error}</span>
        </div>
      ))}
    </div>
  );
}