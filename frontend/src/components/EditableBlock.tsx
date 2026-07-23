import { useState, useRef, useEffect, useCallback } from 'react';

export interface SyncError {
  path: string;
  message: string;
  attempts: number;
}

interface EditableBlockProps {
  content: string;
  maxLength: number;
  onSave: (newContent: string) => Promise<void>;
  onError?: (error: SyncError) => void;
  type: 'title' | 'description' | 'fundamentacion';
  fieldPath: string;
  planificacionId: string;
  className?: string;
  as?: 'p' | 'h3' | 'span' | 'div';
}

const DEBOUNCE_MS = 2000;
const MAX_RETRIES = 3;
const STORAGE_KEY_PREFIX = 'pending-edits-';

function getPendingEdits(planificacionId: string): Record<string, string> {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${planificacionId}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setPendingEdit(planificacionId: string, path: string, value: string) {
  const edits = getPendingEdits(planificacionId);
  edits[path] = value;
  localStorage.setItem(`${STORAGE_KEY_PREFIX}${planificacionId}`, JSON.stringify(edits));
}

function removePendingEdit(planificacionId: string, path: string) {
  const edits = getPendingEdits(planificacionId);
  delete edits[path];
  const json = JSON.stringify(edits);
  if (json === '{}') {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${planificacionId}`);
  } else {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${planificacionId}`, json);
  }
}

export default function EditableBlock({
  content,
  maxLength,
  onSave,
  onError,
  type,
  fieldPath,
  planificacionId,
  className = '',
  as: Tag = 'p',
}: EditableBlockProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showPencil, setShowPencil] = useState(false);
  const [value, setValue] = useState(content);
  const [isSaving, setIsSaving] = useState(false);
  const [syncError, setSyncError] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync with external content changes
  useEffect(() => {
    if (!isEditing) {
      setValue(content);
    }
  }, [content, isEditing]);

  // Auto-resize textarea
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [isEditing, value]);

  const saveWithRetry = useCallback(async (newValue: string) => {
    setIsSaving(true);
    setSyncError(false);

    // Store in localStorage for offline resilience
    setPendingEdit(planificacionId, fieldPath, newValue);

    let attempts = 0;
    let success = false;

    while (attempts < MAX_RETRIES && !success) {
      attempts++;
      try {
        await onSave(newValue);
        success = true;
        removePendingEdit(planificacionId, fieldPath);
        setSyncError(false);
      } catch {
        if (attempts >= MAX_RETRIES) {
          setSyncError(true);
          onError?.({
            path: fieldPath,
            message: 'No se pudieron guardar los cambios después de 3 intentos.',
            attempts,
          });
        }
        // Brief delay before retry
        if (attempts < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, 500 * attempts));
        }
      }
    }

    setIsSaving(false);
  }, [onSave, onError, fieldPath, planificacionId]);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    setShowPencil(false);

    if (value !== content) {
      // Clear any existing debounce
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        saveWithRetry(value);
      }, DEBOUNCE_MS);
    }
  }, [value, content, saveWithRetry]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleActivate = () => {
    setIsEditing(true);
  };

  const handleInteraction = () => {
    setShowPencil(true);
  };

  const remaining = maxLength - value.length;

  if (isEditing) {
    return (
      <div className={`relative ${className}`}>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            const newVal = e.target.value.slice(0, maxLength);
            setValue(newVal);
            // Auto-resize
            if (textareaRef.current) {
              textareaRef.current.style.height = 'auto';
              textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
            }
          }}
          onBlur={handleBlur}
          maxLength={maxLength}
          className={`w-full resize-none border border-green-primary/40 rounded-lg p-2 font-quicksand text-sm text-text-dark focus:outline-none focus:ring-2 focus:ring-green-primary/30 ${
            type === 'title' ? 'font-semibold' : ''
          }`}
          aria-label={`Editar ${type}`}
        />
        <span
          className={`absolute bottom-1 right-2 text-xs font-quicksand ${
            remaining <= 20 ? 'text-red-500' : 'text-text-muted'
          }`}
          aria-live="polite"
        >
          {remaining} caracteres restantes
        </span>
      </div>
    );
  }

  return (
    <div
      className={`relative group cursor-pointer ${className}`}
      onClick={handleInteraction}
      onTouchStart={handleInteraction}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleInteraction();
        }
      }}
      aria-label={`Editar: ${content.slice(0, 50)}...`}
    >
      <Tag className={`inline ${type === 'title' ? 'font-semibold' : ''}`}>
        {content}
      </Tag>

      {/* Sync error indicator */}
      {syncError && (
        <span
          className="inline-flex ml-1 text-red-500"
          title="Error de sincronización - los cambios no se guardaron"
          aria-label="Error de sincronización"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </span>
      )}

      {/* Saving indicator */}
      {isSaving && (
        <span className="inline-flex ml-1 text-green-primary animate-pulse" aria-label="Guardando">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <circle cx="10" cy="10" r="8" />
          </svg>
        </span>
      )}

      {/* Pencil icon */}
      {showPencil && !isEditing && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleActivate();
          }}
          className="inline-flex ml-2 text-green-primary hover:text-green-primary/80 active:scale-95 transition-all"
          aria-label="Editar campo"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
      )}
    </div>
  );
}
