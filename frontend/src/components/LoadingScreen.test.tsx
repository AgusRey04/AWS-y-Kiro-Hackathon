import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import LoadingScreen, { LOADING_MESSAGES, ROTATION_INTERVAL_MS } from './LoadingScreen';

describe('LoadingScreen', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the first loading message initially', () => {
    render(<LoadingScreen />);
    expect(screen.getByText(LOADING_MESSAGES[0])).toBeInTheDocument();
  });

  it('rotates to the next message after 3 seconds', () => {
    render(<LoadingScreen />);

    act(() => {
      vi.advanceTimersByTime(ROTATION_INTERVAL_MS);
    });

    expect(screen.getByText(LOADING_MESSAGES[1])).toBeInTheDocument();
  });

  it('cycles back to the first message after all messages are shown', () => {
    render(<LoadingScreen />);

    act(() => {
      vi.advanceTimersByTime(ROTATION_INTERVAL_MS * LOADING_MESSAGES.length);
    });

    expect(screen.getByText(LOADING_MESSAGES[0])).toBeInTheDocument();
  });

  it('has an accessible status role', () => {
    render(<LoadingScreen />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('displays secondary help text', () => {
    render(<LoadingScreen />);
    expect(screen.getByText('Esto puede tomar unos segundos')).toBeInTheDocument();
  });
});
