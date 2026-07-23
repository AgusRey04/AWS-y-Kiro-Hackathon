# Implementation Plan: EduPlanner

## Overview

Implementación incremental de EduPlanner como SPA React + Vite con backend Node.js/Express, PostgreSQL, Gemini API y generación de PDF client-side con jsPDF. Se construye desde la infraestructura base hacia las features de usuario, integrando tests de propiedades en cada paso.

## Tasks

- [x] 1. Set up project structure, configuration and core interfaces
  - [x] 1.1 Initialize monorepo with frontend (React + Vite + TypeScript + Tailwind CSS) and backend (Node.js + Express + TypeScript)
    - Create `/frontend` and `/backend` directories
    - Configure Vite with React and TypeScript
    - Set up Tailwind CSS with the custom color palette (bg-cream, green-primary, mostaza, lavanda, etc.)
    - Import Quicksand font from Google Fonts
    - Configure Express with TypeScript and project structure (routes, services, models)
    - Add shared types file for domain models (Planificacion, Actividad, Material, Adaptacion, User, AuthState, etc.)
    - Set up Vitest + Testing Library + fast-check for frontend tests
    - Set up Vitest for backend tests
    - Configure MSW for API mocking
    - _Requirements: 13.2, 13.3_

  - [x] 1.2 Set up PostgreSQL database schema and connection
    - Create database migration files for tables: usuario, planificacion, actividad, material, adaptacion
    - Implement database connection pool configuration
    - Add UUID generation for primary keys
    - Define indexes on usuario.email (unique) and planificacion.usuario_id + planificacion.created_at
    - _Requirements: 8.1, 7.2_

  - [x] 1.3 Create static data file (efemérides and seasons)
    - Create `efemerides.json` with Argentine national/provincial holidays and commemorative dates
    - Include season definitions for Southern Hemisphere (verano: dic-feb, otoño: mar-may, invierno: jun-ago, primavera: sep-nov)
    - Add `sugerenciaConsigna` for each ephemeris
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

- [x] 2. Implement authentication system
  - [x] 2.1 Implement backend auth service (register + login + session)
    - Create POST `/api/auth/register` endpoint with field validation (nombre ≤100, escuela ≤150, email ≤254, password 6-72 chars)
    - Create POST `/api/auth/login` endpoint with JWT token generation
    - Create POST `/api/auth/logout` and GET `/api/auth/me` endpoints
    - Hash passwords with bcrypt before storing
    - Return generic error for invalid credentials (without revealing email existence)
    - Return 409 CONFLICT for duplicate email registration
    - _Requirements: 8.1, 8.2, 8.3, 8.5, 8.6, 9.1, 9.2, 9.3_

  - [x] 2.2 Implement frontend auth context and forms
    - Create AuthContext with useReducer for global auth state
    - Implement RegisterForm with field validation (required fields, email format, password length)
    - Implement LoginForm with "Mantener sesión iniciada" checkbox
    - Persist session in localStorage when "mantener sesión" is active, sessionStorage otherwise
    - Show inline error messages with red border and descriptive text below fields
    - Redirect to `/home` on successful login/register within 3 seconds
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 9.1, 9.2, 9.3, 9.4, 9.5_

  - [ ]* 2.3 Write property tests for auth validation
    - **Property 13: Registration form field validation**
    - **Property 14: Password length validation**
    - **Property 15: Email format validation**
    - **Validates: Requirements 8.4, 8.5, 8.6**

- [x] 3. Implement routing and navigation
  - [x] 3.1 Set up React Router with protected routes and layouts
    - Configure routes: `/` (Landing), `/login`, `/register`, `/home`, `/preview/:id`, `/history`
    - Create AppLayout with BottomNav for authenticated routes
    - Create AuthLayout for login/register routes
    - Implement route guards that redirect unauthenticated users to `/login`
    - Implement BottomNav with "Inicio" (house icon) and "Historial" (clock icon) with active state highlighting
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

  - [x] 3.2 Implement Landing Page
    - Create hero section with title "Planifica con amor, enseña con libertad" and mockup image
    - Add benefits list: "Fundamentación Propia", "Actividades Editables", "Inclusión a medida"
    - Add "Empezar Gratis" CTA button (mostaza #E9B44C) navigating to `/register`
    - Add "Iniciar Sesión" outlined button navigating to `/login`
    - Ensure responsive design from 320px width with no horizontal scroll
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement Home screen with voice and text input
  - [x] 5.1 Implement ConsignaInput component and suggestion chips
    - Create text input with placeholder "¿Qué querés trabajar esta semana?" and min-height 56px
    - Enforce 500 character max limit
    - Show remaining character counter when text exceeds 400 characters
    - Create SuggestionChips component displaying 2-5 chips from static data
    - Implement chip insertion: set text if field empty, append with space if field has content
    - Ensure chip insertion respects 500 char total limit
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 14.4_

  - [ ]* 5.2 Write property tests for text input and suggestion chips
    - **Property 2: Text input character limit and counter visibility**
    - **Property 3: Suggestion chip insertion semantics**
    - **Property 18: Suggestion chip count bounds**
    - **Validates: Requirements 2.2, 2.4, 2.5, 14.4**

  - [ ] 5.3 Implement VoiceRecorder component with Web Speech API
    - Implement feature detection (hide button if browser doesn't support Web Speech API)
    - Request microphone permission on first press
    - Configure recognition with lang 'es-AR'
    - Show animated recording indicator while active
    - Transcribe and display partial text with ≤2s latency
    - Auto-stop after 10s of silence with notification
    - Auto-stop at 500 character limit with notification
    - Handle permission denial with informative message
    - Preserve partial transcript on recognition error
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8_

  - [ ]* 5.4 Write property test for voice transcript truncation
    - **Property 1: Voice transcript truncation at character limit**
    - **Validates: Requirements 1.8**

  - [ ] 5.5 Implement HomeScreen with toggle, greeting, banner and CREAR button
    - Create VoiceTextToggle (pill shape) with "Voz" and "Texto" options, "Texto" selected by default
    - Show personalized greeting with user's name
    - Show ephemeris banner when an ephemeris is within 7 days
    - Create CREAR button (mostaza, full-width, min-height 56px)
    - Validate consigna on submit (1-500 chars required)
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 3.7_

  - [ ]* 5.6 Write property tests for home screen
    - **Property 4: Consigna submission validation**
    - **Property 19: Personalized greeting contains user name**
    - **Validates: Requirements 3.7, 14.1**

- [ ] 6. Implement AI generation (backend + frontend loading)
  - [ ] 6.1 Implement Gemini API integration service
    - Create Planning Service that builds prompt with consigna + curricular context of Santa Fe
    - Configure Gemini API with JSON Schema structured output (GeminiPlanificacionResponse)
    - Implement 30-second timeout handling
    - Validate response structure (non-empty title, 2-4 objectives, activities for each weekday, etc.)
    - Handle malformed/incomplete responses with appropriate error codes (AI_PARSE_ERROR)
    - Persist valid planificación to database (planificacion + actividades + materiales + adaptaciones)
    - Include ephemeris reference when within 7 days of a commemorative date
    - Consider current season (Southern Hemisphere) for activity content
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.8, 12.1, 12.2_

  - [ ]* 6.2 Write property tests for Gemini response parsing and static data
    - **Property 5: Gemini response structural integrity**
    - **Property 16: Date-to-season mapping (Southern Hemisphere)**
    - **Property 17: Ephemeris proximity detection and suggestion strategy**
    - **Validates: Requirements 3.3, 3.5, 12.1, 12.2, 12.3, 12.4, 14.5**

  - [ ] 6.3 Implement frontend loading screen and API call
    - Create PlanContext with `crear(consigna)` method calling POST `/api/planificaciones`
    - Implement Loading screen with rotating messages every 3 seconds ("Alineando objetivos...", "Cultivando tu planificación...")
    - Handle success → navigate to `/preview/:id`
    - Handle error → show friendly message with retry button
    - _Requirements: 3.1, 3.2, 3.6_

- [ ] 7. Implement Preview screen with tabs and inline editing
  - [ ] 7.1 Implement PreviewScreen with header and tab navigation
    - Create PreviewHeader with título, subtítulo "PLANIFICACIÓN SEMANAL · NIVEL INICIAL", date range, objetivos, area curricular
    - Implement TabBar with 4 tabs: "Actividades", "Materiales", "Adaptaciones", "Fundamentación"
    - Show "Actividades" as default active tab
    - Style active tab with folder/divider appearance and rounded borders
    - Show empty state message when a tab has no content
    - _Requirements: 4.1, 4.2, 4.3, 4.8_

  - [ ] 7.2 Implement tab content components (Actividades, Materiales, Adaptaciones, Fundamentación)
    - Create ActividadesTab with DayCards organized by day (lunes-viernes) with color-coded borders
    - Create MaterialesTab with list of materials (nombre + icono)
    - Create AdaptacionesTab with lavanda (#9B89B3) background cards
    - Create FundamentacionTab with pedagogical framework text
    - _Requirements: 4.4, 4.5, 4.6, 4.7_

  - [ ]* 7.3 Write property test for activities grouping and ordering
    - **Property 6: Activities grouped and ordered by weekday**
    - **Validates: Requirements 4.4**

  - [ ] 7.4 Implement EditableBlock component with inline editing
    - Show pencil icon on touch/click of editable block
    - Enable inline text editing on activation
    - Auto-save on blur with debounce (2s) via PATCH `/api/planificaciones/:id`
    - Enforce character limits: 500 for titles, 2000 for descriptions/fundamentación
    - Show remaining character counter in edit mode
    - Implement retry logic (3 attempts) on save failure with visual sync error indicator
    - Store pending changes in localStorage for offline resilience
    - Maintain tab structure and day organization during/after editing
    - Implement "Agregar actividad" and "Agregar item personalizado" buttons
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [ ]* 7.5 Write property tests for inline editing
    - **Property 7: Structural preservation during inline editing**
    - **Property 8: Editable block character limits by type**
    - **Validates: Requirements 5.4, 5.6**

- [ ] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Implement PDF generation
  - [ ] 9.1 Implement Módulo PDF with jsPDF (client-side)
    - Generate A4 vertical PDF with all planificación sections (título, fechas, objetivos, área, actividades por día, materiales, adaptaciones, fundamentación)
    - Apply formatting: min 11pt body text, 15mm margins, bold section titles, 8pt vertical spacing between sections
    - Implement "Descargar PDF" button generating and downloading the file
    - Implement "Imprimir" button opening browser print dialog with A4 formatted content
    - Generate filename: "[título] - [fecha inicio].pdf" truncated to 100 chars max
    - Handle PDF generation errors with retry option
    - Ensure PDF generation is fully client-side (no server dependency)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [ ]* 9.2 Write property tests for PDF generation
    - **Property 9: PDF content completeness**
    - **Property 10: PDF filename format and length constraint**
    - **Validates: Requirements 6.1, 6.6**

- [ ] 10. Implement History screen
  - [ ] 10.1 Implement backend endpoint for planificaciones listing with filters
    - Create GET `/api/planificaciones` with `?filtro=recientes|efemerides|proyectos` query param
    - Order by created_at descending by default
    - Filter by categoria field for efemerides and proyectos
    - Return planificación summaries with truncated description (80 chars max)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ] 10.2 Implement HistoryScreen with grid, cards and filters
    - Create responsive grid (3 columns desktop, 1 column mobile)
    - Create PlanCard with: image, date badge, title, truncated description (80 chars), category chips, "Ver" and "Re-Imprimir" buttons
    - Implement FilterChips: "Recientes", "Efemérides", "Proyectos"
    - Navigate to `/preview/:id` on "Ver" press
    - Trigger PDF generation on "Re-Imprimir" press
    - Show empty state with descriptive message and navigation button to Home
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9_

  - [ ]* 10.3 Write property tests for history
    - **Property 11: History card content completeness**
    - **Property 12: History ordering and filtering**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5**

- [ ] 11. Implement static data service and ephemeris integration
  - [ ] 11.1 Implement backend static data endpoints and frontend suggestion service
    - Create GET `/api/datos-estaticos/efemerides?dias=7` endpoint returning upcoming ephemerides
    - Create GET `/api/datos-estaticos/sugerencias` endpoint returning suggestion chips based on proximity rules
    - Implement frontend SuggestionService: if ephemeris within 7 days → use ephemeris-based chips; otherwise → season-based chips
    - Ensure chip count is always between 2 and 5 inclusive
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 14.4, 14.5_

- [ ] 12. Apply design system and mobile-first polish
  - [ ] 12.1 Apply global design system tokens and responsive behavior
    - Verify all interactive elements have min-height 56px
    - Verify color palette usage across all components
    - Verify Quicksand typography weights (bold titles, medium body)
    - Verify rounded-xl on cards/inputs and pill shape on buttons/chips
    - Add active:scale-95 / brightness-110 feedback on button touch
    - Verify PDF and Imprimir buttons visible without horizontal scroll on Preview
    - Test responsive layouts from 320px width
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 4.9_

- [ ] 13. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The tech stack is React + Vite + TypeScript (frontend), Node.js + Express + TypeScript (backend), PostgreSQL, jsPDF, Web Speech API, Gemini API
- fast-check is used for property-based testing, Vitest as test runner, Testing Library for component tests, MSW for API mocking

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.3"] },
    { "id": 1, "tasks": ["1.2", "3.2"] },
    { "id": 2, "tasks": ["2.1", "3.1"] },
    { "id": 3, "tasks": ["2.2", "5.1"] },
    { "id": 4, "tasks": ["2.3", "5.2", "5.3"] },
    { "id": 5, "tasks": ["5.4", "5.5"] },
    { "id": 6, "tasks": ["5.6", "6.1"] },
    { "id": 7, "tasks": ["6.2", "6.3"] },
    { "id": 8, "tasks": ["7.1", "10.1"] },
    { "id": 9, "tasks": ["7.2", "7.4", "10.2"] },
    { "id": 10, "tasks": ["7.3", "7.5", "10.3"] },
    { "id": 11, "tasks": ["9.1", "11.1"] },
    { "id": 12, "tasks": ["9.2", "12.1"] }
  ]
}
```
