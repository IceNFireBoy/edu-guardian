import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ErrorBoundary from '../ErrorBoundary';

// Component that throws an error
const ThrowError = () => {
  throw new Error('Test error');
};

// Mock component for testing
const MockComponent = () => <div>Test Component</div>;

describe('ErrorBoundary', () => {
  // Suppress console.error for expected error throws
  const originalError = console.error;
  beforeAll(() => {
    console.error = vi.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <MockComponent />
      </ErrorBoundary>
    );
    expect(screen.getByText('Test Component')).toBeInTheDocument();
  });

  it('renders error UI when child component throws', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Oops! Something went wrong.')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('renders custom fallback when provided', () => {
    const CustomFallback = () => <div>Custom Error UI</div>;
    
    render(
      <ErrorBoundary fallback={<CustomFallback />}>
        <ThrowError />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Custom Error UI')).toBeInTheDocument();
  });

  it('calls onError callback when error occurs', () => {
    const onError = vi.fn();
    
    render(
      <ErrorBoundary onError={onError}>
        <ThrowError />
      </ErrorBoundary>
    );
    
    expect(onError).toHaveBeenCalled();
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(onError.mock.calls[0][0].message).toBe('Test error');
  });

  it('shows component stack when details are expanded', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );
    
    const detailsButton = screen.getByText('Show Component Stack');
    fireEvent.click(detailsButton);
    
    // The stack trace should be visible in a pre element
    const stackTrace = document.querySelector('pre');
    expect(stackTrace).toBeInTheDocument();
  });

  it('reloads page when reload button is clicked', () => {
    const reload = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: reload },
      writable: true
    });

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );
    
    const reloadButton = screen.getByText('Reload Page');
    fireEvent.click(reloadButton);
    
    expect(reload).toHaveBeenCalled();
  });

  it('goes back when back button is clicked', () => {
    const back = vi.fn();
    Object.defineProperty(window, 'history', {
      value: { back: back },
      writable: true
    });

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );
    
    const backButton = screen.getByText('Go Back');
    fireEvent.click(backButton);
    
    expect(back).toHaveBeenCalled();
  });
}); 