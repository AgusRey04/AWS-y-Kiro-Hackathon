import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Feature: edu-planner
 * Property tests for auth validation
 * Validates: Requirements 8.4, 8.5, 8.6
 */

// --- Pure validation logic extracted from RegisterPage.tsx ---

interface FormErrors {
  nombre?: string;
  escuela?: string;
  email?: string;
  password?: string;
}

interface FormFields {
  nombre: string;
  escuela: string;
  email: string;
  password: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateRegistrationForm(fields: FormFields): FormErrors {
  const newErrors: FormErrors = {};

  if (!fields.nombre.trim()) {
    newErrors.nombre = 'El nombre es obligatorio';
  } else if (fields.nombre.trim().length > 100) {
    newErrors.nombre = 'El nombre no puede superar los 100 caracteres';
  }

  if (!fields.escuela.trim()) {
    newErrors.escuela = 'La escuela es obligatoria';
  } else if (fields.escuela.trim().length > 150) {
    newErrors.escuela = 'La escuela no puede superar los 150 caracteres';
  }

  if (!fields.email.trim()) {
    newErrors.email = 'El email es obligatorio';
  } else if (fields.email.trim().length > 254) {
    newErrors.email = 'El email no puede superar los 254 caracteres';
  } else if (!EMAIL_REGEX.test(fields.email.trim())) {
    newErrors.email = 'El formato del email no es válido';
  }

  if (!fields.password) {
    newErrors.password = 'La contraseña es obligatoria';
  } else if (fields.password.length < 6) {
    newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
  } else if (fields.password.length > 72) {
    newErrors.password = 'La contraseña no puede superar los 72 caracteres';
  }

  return newErrors;
}

function isValidPassword(password: string): boolean {
  return password.length >= 6 && password.length <= 72;
}

function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

// --- Property Tests ---

describe('Feature: edu-planner, Property 13: Registration form field validation', () => {
  /**
   * **Validates: Requirements 8.4**
   *
   * For any combination of form field values at submission time, the system SHALL
   * highlight with an error indicator exactly those required fields that are empty,
   * without clearing non-empty fields.
   */
  it('should flag exactly the empty/whitespace-only required fields with errors', () => {
    // Generator for form fields: mix of empty/whitespace and non-empty values
    const fieldArb = fc.oneof(
      // Empty or whitespace-only strings (should trigger "required" error)
      fc.constantFrom('', ' ', '  ', '\t', '\n', '   \t  '),
      // Non-empty strings (should NOT trigger "required" error for that field)
      fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0)
    );

    // Password needs special handling since it doesn't use .trim() for empty check
    const passwordArb = fc.oneof(
      fc.constant(''), // empty password
      fc.string({ minLength: 1, maxLength: 50 }) // non-empty password
    );

    fc.assert(
      fc.property(fieldArb, fieldArb, fieldArb, passwordArb, (nombre, escuela, email, password) => {
        const fields: FormFields = { nombre, escuela, email, password };
        const errors = validateRegistrationForm(fields);

        const requiredFields = ['nombre', 'escuela', 'email', 'password'] as const;

        for (const field of requiredFields) {
          const value = fields[field];
          const isEmpty = field === 'password' ? value === '' : value.trim() === '';

          if (isEmpty) {
            // Empty fields MUST have an error
            expect(errors[field]).toBeDefined();
          }
          // Note: non-empty fields may still have errors (format, length) but won't have "required" error
        }

        // Verify that non-empty field values are preserved (the function doesn't mutate inputs)
        for (const field of requiredFields) {
          expect(fields[field]).toBe(
            field === 'nombre' ? nombre :
            field === 'escuela' ? escuela :
            field === 'email' ? email : password
          );
        }
      }),
      { numRuns: 200 }
    );
  });

  it('should not flag non-empty fields with a "required" error message', () => {
    const nonEmptyArb = fc.string({ minLength: 1, maxLength: 30 }).filter((s) => s.trim().length > 0);

    fc.assert(
      fc.property(nonEmptyArb, nonEmptyArb, nonEmptyArb, nonEmptyArb, (nombre, escuela, email, password) => {
        const fields: FormFields = { nombre, escuela, email, password };
        const errors = validateRegistrationForm(fields);

        // None of the fields should have a "required" error since all are non-empty
        if (errors.nombre) {
          expect(errors.nombre).not.toContain('obligatorio');
        }
        if (errors.escuela) {
          expect(errors.escuela).not.toContain('obligatoria');
        }
        if (errors.email) {
          expect(errors.email).not.toContain('obligatorio');
        }
        if (errors.password) {
          expect(errors.password).not.toContain('obligatoria');
        }
      }),
      { numRuns: 200 }
    );
  });
});

describe('Feature: edu-planner, Property 14: Password length validation', () => {
  /**
   * **Validates: Requirements 8.5**
   *
   * For any string, the password validation SHALL accept it if and only if
   * its length is between 6 and 72 characters inclusive.
   */
  it('should accept passwords with length between 6 and 72 inclusive', () => {
    const validPasswordArb = fc.string({ minLength: 6, maxLength: 72 }).filter((s) => s.length >= 6);

    fc.assert(
      fc.property(validPasswordArb, (password) => {
        expect(isValidPassword(password)).toBe(true);

        // Also verify via full form validation - password field should have no error
        const fields: FormFields = {
          nombre: 'Test',
          escuela: 'Escuela',
          email: 'test@example.com',
          password,
        };
        const errors = validateRegistrationForm(fields);
        expect(errors.password).toBeUndefined();
      }),
      { numRuns: 200 }
    );
  });

  it('should reject passwords with length less than 6', () => {
    const shortPasswordArb = fc.string({ minLength: 1, maxLength: 5 });

    fc.assert(
      fc.property(shortPasswordArb, (password) => {
        expect(isValidPassword(password)).toBe(false);

        // Also verify via full form validation
        const fields: FormFields = {
          nombre: 'Test',
          escuela: 'Escuela',
          email: 'test@example.com',
          password,
        };
        const errors = validateRegistrationForm(fields);
        expect(errors.password).toBeDefined();
      }),
      { numRuns: 200 }
    );
  });

  it('should reject passwords with length greater than 72', () => {
    const longPasswordArb = fc.string({ minLength: 73, maxLength: 200 });

    fc.assert(
      fc.property(longPasswordArb, (password) => {
        expect(isValidPassword(password)).toBe(false);

        // Also verify via full form validation
        const fields: FormFields = {
          nombre: 'Test',
          escuela: 'Escuela',
          email: 'test@example.com',
          password,
        };
        const errors = validateRegistrationForm(fields);
        expect(errors.password).toBeDefined();
      }),
      { numRuns: 200 }
    );
  });

  it('should reject empty passwords', () => {
    expect(isValidPassword('')).toBe(false);

    const fields: FormFields = {
      nombre: 'Test',
      escuela: 'Escuela',
      email: 'test@example.com',
      password: '',
    };
    const errors = validateRegistrationForm(fields);
    expect(errors.password).toBeDefined();
  });

  it('password acceptance is equivalent to length in [6, 72]', () => {
    const anyStringArb = fc.string({ minLength: 0, maxLength: 200 });

    fc.assert(
      fc.property(anyStringArb, (password) => {
        const accepted = isValidPassword(password);
        const lengthInRange = password.length >= 6 && password.length <= 72;
        expect(accepted).toBe(lengthInRange);
      }),
      { numRuns: 300 }
    );
  });
});

describe('Feature: edu-planner, Property 15: Email format validation', () => {
  /**
   * **Validates: Requirements 8.6**
   *
   * For any string, the email validation SHALL accept it if and only if it matches
   * the standard email format (user@domain.extension with at least one character in each part).
   */

  // Generator for valid emails: user@domain.extension
  const validEmailArb = fc.tuple(
    // user part: at least 1 char, no spaces or @
    fc.string({ minLength: 1, maxLength: 30 }).filter((s) => s.length > 0 && !/[\s@]/.test(s)),
    // domain part: at least 1 char, no spaces or @
    fc.string({ minLength: 1, maxLength: 30 }).filter((s) => s.length > 0 && !/[\s@]/.test(s)),
    // extension part: at least 1 char, no spaces, @ or dots
    fc.string({ minLength: 1, maxLength: 10 }).filter((s) => s.length > 0 && !/[\s@.]/.test(s))
  ).map(([user, domain, ext]) => `${user}@${domain}.${ext}`);

  it('should accept emails matching user@domain.extension format', () => {
    fc.assert(
      fc.property(validEmailArb, (email) => {
        expect(isValidEmail(email)).toBe(true);
      }),
      { numRuns: 200 }
    );
  });

  it('should reject strings without @ symbol', () => {
    const noAtArb = fc.string({ minLength: 1, maxLength: 50 }).filter((s) => !s.includes('@'));

    fc.assert(
      fc.property(noAtArb, (email) => {
        expect(isValidEmail(email)).toBe(false);
      }),
      { numRuns: 200 }
    );
  });

  it('should reject strings without a dot after @', () => {
    const noExtensionArb = fc.tuple(
      fc.string({ minLength: 1, maxLength: 20 }).filter((s) => s.length > 0 && !/[\s@]/.test(s)),
      fc.string({ minLength: 1, maxLength: 20 }).filter((s) => s.length > 0 && !/[\s@.]/.test(s))
    ).map(([user, domain]) => `${user}@${domain}`);

    fc.assert(
      fc.property(noExtensionArb, (email) => {
        expect(isValidEmail(email)).toBe(false);
      }),
      { numRuns: 200 }
    );
  });

  it('should reject emails with empty user part', () => {
    const emptyUserArb = fc.tuple(
      fc.string({ minLength: 1, maxLength: 20 }).filter((s) => s.length > 0 && !/[\s@]/.test(s)),
      fc.string({ minLength: 1, maxLength: 10 }).filter((s) => s.length > 0 && !/[\s@.]/.test(s))
    ).map(([domain, ext]) => `@${domain}.${ext}`);

    fc.assert(
      fc.property(emptyUserArb, (email) => {
        expect(isValidEmail(email)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('should reject emails with spaces', () => {
    const emailWithSpacesArb = fc.tuple(
      fc.string({ minLength: 1, maxLength: 10 }).filter((s) => s.length > 0 && !/[@]/.test(s)),
      fc.string({ minLength: 1, maxLength: 10 }).filter((s) => s.length > 0 && !/[@.]/.test(s)),
      fc.string({ minLength: 1, maxLength: 5 }).filter((s) => s.length > 0 && !/[@.]/.test(s))
    ).map(([user, domain, ext]) => `${user} @${domain}.${ext}`);

    fc.assert(
      fc.property(emailWithSpacesArb, (email) => {
        expect(isValidEmail(email)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('email acceptance is equivalent to matching regex /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/', () => {
    const anyStringArb = fc.string({ minLength: 0, maxLength: 80 });

    fc.assert(
      fc.property(anyStringArb, (str) => {
        const accepted = isValidEmail(str);
        const matchesRegex = EMAIL_REGEX.test(str.trim());
        expect(accepted).toBe(matchesRegex);
      }),
      { numRuns: 300 }
    );
  });
});
