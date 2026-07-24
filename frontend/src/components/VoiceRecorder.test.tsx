import { useState } from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import VoiceRecorder from './VoiceRecorder';
import type { VoiceError } from '../types';

// Mock SpeechRecognition
class MockSpeechRecognition {
  lang = '';
  continuous = false;
  interimResults = false;
  onstart: (() => void) | null = null;
  onresult: ((event: unknown) => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;
  onend: (() => void) | null = null;

  start = vi.fn(() => {
    if (this.onstart) this.onstart();
  });

  stop = vi.fn(() => {
    if (this.onend) this.onend();
  });

  abort = vi.fn();
}

let mockRecognitionInstance: MockSpeechRecognition;

function setupSpeechRecognitionSupport(supported = true) {
  if (supported) {
    mockRecognitionInstance = new MockSpeechRecognition();
    (window as unknown as Record<string, unknown>).SpeechRecognition = vi.fn(
      () => mockRecognitionInstance
    );
  } else {
    delete (window as unknown as Record<string, unknown>).SpeechRecognition;
    delete (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
  }
}

describe('VoiceRecorder', () => {
  const defaultProps = {
    onTranscript: vi.fn(),
    onPartialTranscript: vi.fn(),
    onError: vi.fn(),
    maxChars: 500,
    lang: 'es-AR' as const,
  };

  beforeEach(() => {
    vi.useFakeTimers();
    setupSpeechRecognitionSupport(true);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  /**
   * Arnés de test que replica el consumo real del componente (HomePage):
   * el texto parcial y el final se depositan en el campo de consigna, que es
   * el elemento que describen los requisitos 1.2 y 1.7 ("mostrar / preservar
   * el texto parcial en el campo de consigna"). VoiceRecorder no renderiza el
   * texto por sí mismo: lo emite por callbacks para que el campo lo muestre.
   */
  function ConsignaHarness({ maxChars = 500 }: { maxChars?: number }) {
    const [consigna, setConsigna] = useState('');

    return (
      <>
        <VoiceRecorder
          maxChars={maxChars}
          lang="es-AR"
          onPartialTranscript={(text: string) => {
            defaultProps.onPartialTranscript(text);
            setConsigna(text);
          }}
          onTranscript={(text: string) => {
            defaultProps.onTranscript(text);
            setConsigna(text);
          }}
          onError={(error: VoiceError) => {
            defaultProps.onError(error);
          }}
        />
        <textarea aria-label="Consigna" value={consigna} readOnly />
      </>
    );
  }

  describe('Feature detection', () => {
    it('hides button and shows message when Web Speech API is not supported', () => {
      setupSpeechRecognitionSupport(false);
      render(<VoiceRecorder {...defaultProps} />);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
      expect(
        screen.getByText(/tu navegador no soporta reconocimiento de voz/i)
      ).toBeInTheDocument();
    });

    it('shows record button when Web Speech API is supported', () => {
      render(<VoiceRecorder {...defaultProps} />);

      expect(
        screen.getByRole('button', { name: /iniciar grabación de voz/i })
      ).toBeInTheDocument();
    });
  });

  describe('Recording start', () => {
    it('configures recognition with lang es-AR', () => {
      render(<VoiceRecorder {...defaultProps} />);

      const btn = screen.getByRole('button', { name: /iniciar grabación/i });
      fireEvent.click(btn);

      expect(mockRecognitionInstance.lang).toBe('es-AR');
      expect(mockRecognitionInstance.continuous).toBe(true);
      expect(mockRecognitionInstance.interimResults).toBe(true);
    });

    it('shows animated recording indicator while active', () => {
      render(<VoiceRecorder {...defaultProps} />);

      const btn = screen.getByRole('button', { name: /iniciar grabación/i });
      fireEvent.click(btn);

      expect(screen.getByText('Grabando...')).toBeInTheDocument();
      expect(screen.getByLabelText('Grabando')).toBeInTheDocument();
    });

    it('changes button to stop when recording', () => {
      render(<VoiceRecorder {...defaultProps} />);

      const btn = screen.getByRole('button', { name: /iniciar grabación/i });
      fireEvent.click(btn);

      expect(
        screen.getByRole('button', { name: /detener grabación/i })
      ).toBeInTheDocument();
    });
  });

  describe('Transcription', () => {
    it('displays partial transcript in the consigna field during recognition', () => {
      render(<ConsignaHarness />);

      fireEvent.click(screen.getByRole('button', { name: /iniciar grabación/i }));

      // Simulate interim result
      act(() => {
        mockRecognitionInstance.onresult?.({
          results: [
            { 0: { transcript: 'hola mundo' }, isFinal: false, length: 1 },
          ],
          resultIndex: 0,
          length: 1,
        });
      });

      expect(defaultProps.onPartialTranscript).toHaveBeenCalledWith('hola mundo');
      expect(screen.getByLabelText('Consigna')).toHaveValue('hola mundo');
    });

    it('calls onTranscript when stop button is pressed', () => {
      render(<VoiceRecorder {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /iniciar grabación/i }));

      // Simulate a final result
      act(() => {
        mockRecognitionInstance.onresult?.({
          results: [
            { 0: { transcript: 'texto final' }, isFinal: true, length: 1 },
          ],
          resultIndex: 0,
          length: 1,
        });
      });

      // Press stop
      fireEvent.click(screen.getByRole('button', { name: /detener grabación/i }));

      expect(defaultProps.onTranscript).toHaveBeenCalledWith('texto final');
    });
  });

  describe('Auto-stop on silence', () => {
    it('auto-stops after 10 seconds of silence and shows notification', () => {
      render(<VoiceRecorder {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /iniciar grabación/i }));

      // Advance 10 seconds
      act(() => {
        vi.advanceTimersByTime(10_000);
      });

      expect(
        screen.getByText(/grabación detenida por inactividad/i)
      ).toBeInTheDocument();
      expect(
        screen.queryByText('Grabando...')
      ).not.toBeInTheDocument();
    });
  });

  describe('Auto-stop on character limit', () => {
    it('auto-stops at maxChars limit and shows notification', () => {
      const props = { ...defaultProps, maxChars: 20 };
      render(<VoiceRecorder {...props} />);

      fireEvent.click(screen.getByRole('button', { name: /iniciar grabación/i }));

      // Simulate result exceeding limit
      act(() => {
        mockRecognitionInstance.onresult?.({
          results: [
            {
              0: { transcript: 'Este texto es bastante largo y excede' },
              isFinal: true,
              length: 1,
            },
          ],
          resultIndex: 0,
          length: 1,
        });
      });

      expect(props.onError).toHaveBeenCalledWith('max-length');
      expect(screen.getByText(/límite de 20 caracteres alcanzado/i)).toBeInTheDocument();
      expect(props.onTranscript).toHaveBeenCalledWith(
        'Este texto es bastan' // first 20 chars
      );
    });
  });

  describe('Permission denial', () => {
    it('shows informative message when permission is denied', () => {
      render(<VoiceRecorder {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /iniciar grabación/i }));

      // Simulate permission denied error
      act(() => {
        mockRecognitionInstance.onerror?.({ error: 'not-allowed' });
      });

      expect(defaultProps.onError).toHaveBeenCalledWith('permission-denied');
      // The alert role has the persistent error message
      expect(screen.getByRole('alert')).toHaveTextContent(
        /se necesita permiso de micrófono/i
      );
    });
  });

  describe('Recognition error with preserved transcript', () => {
    it('stops recording, preserves partial transcript in the consigna field and notifies on recognition error', () => {
      render(<ConsignaHarness />);

      fireEvent.click(screen.getByRole('button', { name: /iniciar grabación/i }));

      // Simulate some text first
      act(() => {
        mockRecognitionInstance.onresult?.({
          results: [
            { 0: { transcript: 'texto parcial' }, isFinal: false, length: 1 },
          ],
          resultIndex: 0,
          length: 1,
        });
      });

      // Simulate a recognition error
      act(() => {
        mockRecognitionInstance.onerror?.({ error: 'network' });
      });

      expect(defaultProps.onError).toHaveBeenCalledWith('recognition-error');
      expect(defaultProps.onTranscript).toHaveBeenCalledWith('texto parcial');

      // El texto parcial queda preservado en el campo de consigna (Req 1.7)
      expect(screen.getByLabelText('Consigna')).toHaveValue('texto parcial');

      // La grabación se detuvo
      expect(screen.queryByText('Grabando...')).not.toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /iniciar grabación de voz/i })
      ).toBeInTheDocument();

      // Notificación visual del error
      expect(
        screen.getByText(/error de reconocimiento\. se conservó el texto parcial\./i)
      ).toBeInTheDocument();
    });
  });
});
