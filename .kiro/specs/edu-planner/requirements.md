# Requirements Document

## Introduction

EduPlanner es una aplicación web mobile-first dirigida a docentes de nivel inicial (jardín de infantes) en la provincia de Santa Fe, Argentina. La aplicación permite a las maestras generar planificaciones semanales completas a partir de una consigna hablada o escrita, utilizando inteligencia artificial (Gemini API). El resultado incluye actividades diarias, materiales, adaptaciones de inclusión y fundamentación pedagógica, alineados con el diseño curricular provincial.

## Glossary

- **Sistema**: La aplicación web EduPlanner en su conjunto (frontend + backend + IA)
- **Usuaria**: Docente de nivel inicial que utiliza la aplicación
- **Consigna**: Texto hablado o escrito que describe la temática y contexto de la planificación deseada (ej: "esta semana trabajamos el otoño con sala de 4")
- **Planificación**: Documento generado que contiene actividades diarias, materiales, adaptaciones y fundamentación para una semana
- **Módulo_de_Voz**: Componente que utiliza Web Speech API del navegador para convertir voz a texto
- **Módulo_de_Texto**: Componente de entrada de texto para escribir la consigna manualmente
- **Generador_IA**: Componente backend que envía la consigna a Gemini API y procesa la respuesta estructurada
- **Preview**: Pantalla que muestra la planificación generada organizada en pestañas
- **Módulo_PDF**: Componente client-side (jsPDF) que genera documentos PDF descargables/imprimibles
- **Historial**: Sección que almacena las planificaciones previas de la usuaria
- **Adaptaciones**: Estrategias pedagógicas de inclusión para necesidades educativas específicas (NEE)
- **Fundamentación**: Marco teórico pedagógico que sustenta las actividades planificadas
- **Diseño_Curricular**: Documento oficial del diseño curricular de la provincia de Santa Fe para nivel inicial (ámbitos de experiencia)
- **Datos_Estáticos**: Archivo JSON con feriados nacionales/provinciales y estaciones del año argentinos

## Requirements

### Requirement 1: Ingreso de Consigna por Voz

**User Story:** Como docente de nivel inicial, quiero dictar mi consigna por voz desde el celular, para poder crear planificaciones rápidamente entre clase y clase sin necesidad de tipear.

#### Acceptance Criteria

1. WHEN la Usuaria presiona el botón de grabación, THE Módulo_de_Voz SHALL solicitar permiso de micrófono (si no fue concedido previamente), activar el reconocimiento de voz del navegador mediante Web Speech API con idioma configurado en español (Argentina), y mostrar un indicador visual animado de grabación activa
2. WHILE el reconocimiento de voz está activo, THE Módulo_de_Voz SHALL transcribir el audio y mostrar el texto parcial en el campo de consigna con una latencia no mayor a 2 segundos desde la emisión del habla
3. WHEN la Usuaria presiona el botón de detener grabación, THE Módulo_de_Voz SHALL finalizar el reconocimiento y depositar el texto completo transcrito en el campo de consigna, permitiendo a la Usuaria editar libremente el texto resultante
4. IF el navegador no soporta Web Speech API, THEN THE Sistema SHALL ocultar el botón de grabación, mostrar un mensaje indicando que el navegador no soporta entrada por voz, y ofrecer únicamente la opción de ingreso por texto
5. IF no se detecta audio durante 10 segundos de grabación activa, THEN THE Módulo_de_Voz SHALL detener automáticamente la grabación y mostrar una notificación visual en pantalla informando que la grabación se detuvo por inactividad
6. IF la Usuaria deniega el permiso de micrófono, THEN THE Módulo_de_Voz SHALL cancelar la activación de grabación, mostrar un mensaje indicando que el permiso de micrófono es necesario para usar entrada por voz, y mantener disponible la opción de ingreso por texto
7. IF ocurre un error de reconocimiento de voz durante la grabación (por pérdida de red o audio no reconocible), THEN THE Módulo_de_Voz SHALL detener la grabación, preservar el texto parcial ya transcrito en el campo de consigna, y mostrar una notificación visual indicando que ocurrió un error en el reconocimiento
8. THE Módulo_de_Voz SHALL limitar el texto transcrito en el campo de consigna a un máximo de 500 caracteres y, al alcanzar dicho límite, detener automáticamente la grabación e informar a la Usuaria que se alcanzó el límite de extensión

### Requirement 2: Ingreso de Consigna por Texto

**User Story:** Como docente de nivel inicial, quiero escribir mi consigna manualmente, para poder crear planificaciones cuando no puedo hablar o prefiero tipear.

#### Acceptance Criteria

1. THE Módulo_de_Texto SHALL presentar un campo de texto con placeholder descriptivo (ej: "¿Qué querés trabajar esta semana?") con altura mínima de 56px
2. WHEN la Usuaria escribe en el campo de texto, THE Módulo_de_Texto SHALL aceptar texto libre sin restricción de formato ni longitud mínima obligatoria, con una longitud máxima de 500 caracteres, mostrando un contador de caracteres restantes cuando el texto supere los 400 caracteres
3. THE Sistema SHALL mostrar un máximo de 6 chips de sugerencias con temáticas comunes (efemérides próximas, estaciones, proyectos habituales) debajo del campo de texto, obtenidas de los Datos_Estáticos
4. WHEN la Usuaria selecciona un chip de sugerencia y el campo de consigna está vacío, THE Módulo_de_Texto SHALL insertar el texto de la sugerencia en el campo de consigna
5. WHEN la Usuaria selecciona un chip de sugerencia y el campo de consigna ya contiene texto, THE Módulo_de_Texto SHALL agregar el texto de la sugerencia al final del contenido existente separado por un espacio

### Requirement 3: Generación de Planificación con IA

**User Story:** Como docente de nivel inicial, quiero que la app genere automáticamente una planificación semanal completa a partir de mi consigna, para ahorrar tiempo en la preparación de clases.

#### Acceptance Criteria

1. WHEN la Usuaria presiona el botón "CREAR" con una consigna de entre 1 y 500 caracteres en el campo, THE Generador_IA SHALL enviar la consigna junto con el contexto curricular de Santa Fe a Gemini API
2. WHILE la planificación está siendo generada, THE Sistema SHALL mostrar la pantalla de carga con mensajes animados secuenciales que rotan cada 3 segundos ("Alineando objetivos...", "Cultivando tu planificación...")
3. WHEN Gemini API devuelve una respuesta exitosa, THE Generador_IA SHALL estructurar la respuesta en cuatro secciones: actividades diarias (una actividad mínimo por cada día de lunes a viernes), materiales, adaptaciones de inclusión y fundamentación pedagógica
4. THE Generador_IA SHALL identificar explícitamente en la respuesta al menos un ámbito de experiencia del Diseño_Curricular de Santa Fe al que se vincula la planificación generada
5. THE Generador_IA SHALL incluir en la respuesta el título de la planificación, las fechas de la semana, entre 2 y 4 objetivos principales y el área curricular correspondiente
6. IF Gemini API devuelve un error o no responde en 30 segundos, THEN THE Sistema SHALL mostrar un mensaje amigable de error y ofrecer la opción de reintentar
7. IF la consigna está vacía o excede 500 caracteres al presionar "CREAR", THEN THE Sistema SHALL mostrar un mensaje indicando el requisito de longitud válida para generar la planificación
8. IF Gemini API devuelve una respuesta exitosa pero con estructura incompleta o no parseable, THEN THE Sistema SHALL mostrar un mensaje de error indicando que no se pudo procesar la respuesta y ofrecer la opción de reintentar

### Requirement 4: Preview de Planificación en Pestañas

**User Story:** Como docente de nivel inicial, quiero ver la planificación generada organizada en pestañas claras, para poder revisar cada sección de forma ordenada desde mi celular.

#### Acceptance Criteria

1. WHEN la planificación ha sido generada exitosamente, THE Preview SHALL mostrar un header con título, subtítulo "PLANIFICACIÓN SEMANAL · NIVEL INICIAL", rango de fechas, objetivos y área curricular
2. THE Preview SHALL organizar el contenido en 4 pestañas navegables: "Actividades", "Materiales", "Adaptaciones" y "Fundamentación", mostrando la pestaña "Actividades" como activa por defecto al cargar la vista
3. THE Preview SHALL indicar visualmente la pestaña activa diferenciándola de las inactivas mediante un estilo de carpeta/divisor físico con bordes redondeados
4. WHEN la Usuaria selecciona la pestaña "Actividades", THE Preview SHALL mostrar las actividades organizadas por día (lunes a viernes), cada día en una tarjeta individual con descripción de la actividad correspondiente
5. WHEN la Usuaria selecciona la pestaña "Materiales", THE Preview SHALL mostrar la lista de recursos necesarios para las actividades de la semana
6. WHEN la Usuaria selecciona la pestaña "Adaptaciones", THE Preview SHALL mostrar las estrategias de inclusión con fondo lavanda (#9B89B3)
7. WHEN la Usuaria selecciona la pestaña "Fundamentación", THE Preview SHALL mostrar el marco teórico pedagógico que sustenta la planificación
8. IF una pestaña no contiene datos generados, THEN THE Preview SHALL mostrar un mensaje indicando que no hay contenido disponible para esa sección
9. THE Preview SHALL mostrar en la parte inferior los botones "DESCARGAR PDF" e "IMPRIMIR" visibles sin necesidad de hacer scroll horizontal

### Requirement 5: Edición Inline de Contenido

**User Story:** Como docente de nivel inicial, quiero poder editar cualquier parte de la planificación generada, para ajustarla a las necesidades específicas de mi sala.

#### Acceptance Criteria

1. WHEN la Usuaria toca un bloque editable en el Preview, THE Sistema SHALL mostrar un ícono de edición (lápiz) y habilitar la edición inline del texto de ese bloque, donde los bloques editables son: títulos y descripciones de actividades por día, ítems de la lista de materiales, estrategias de adaptación, y texto de fundamentación
2. WHEN el campo editado pierde el foco y el contenido ha sido modificado, THE Sistema SHALL guardar los cambios localmente y persistirlos al backend mediante llamada API en un máximo de 5 segundos
3. IF la persistencia al backend falla al guardar un cambio, THEN THE Sistema SHALL mantener los cambios localmente, mostrar un indicador visual de error de sincronización en el bloque afectado, y reintentar automáticamente hasta 3 veces
4. THE Sistema SHALL mantener la estructura de pestañas, la organización por días, y el formato visual de la planificación durante y después de la edición inline
5. WHEN la Usuaria presiona el botón "Agregar actividad" en una pestaña de día o "Agregar item personalizado" en la lista de materiales, THE Sistema SHALL insertar un nuevo bloque editable vacío en la posición correspondiente con el foco activo para escritura inmediata
6. THE Sistema SHALL limitar el texto de cada bloque editable a un máximo de 500 caracteres para títulos y 2000 caracteres para descripciones y fundamentación, mostrando un contador de caracteres restantes al estar en modo edición

### Requirement 6: Generación y Descarga de PDF

**User Story:** Como docente de nivel inicial, quiero descargar o imprimir mi planificación en PDF, para tener una copia física que puedo llevar al aula o adjuntar a la carpeta didáctica.

#### Acceptance Criteria

1. WHEN la Usuaria presiona el botón "Descargar PDF" en el Preview, THE Módulo_PDF SHALL generar un documento PDF en formato A4 vertical que incluya: título de la planificación, fechas de la semana, objetivos, área curricular, actividades organizadas por día (lunes a viernes), lista de materiales, adaptaciones de inclusión y fundamentación pedagógica
2. WHEN la Usuaria presiona el botón "Imprimir", THE Sistema SHALL abrir el diálogo de impresión del navegador con el contenido de la planificación formateado en tamaño A4
3. THE Módulo_PDF SHALL generar el PDF completamente en el dispositivo de la Usuaria (client-side) sin requerir conexión al servidor
4. THE Módulo_PDF SHALL formatear el PDF con tipografía de tamaño mínimo 11pt para cuerpo de texto, márgenes de al menos 15mm en todos los lados, y separación entre secciones mediante títulos en negrita y un espaciado vertical mínimo de 8pt entre secciones
5. IF la generación del PDF falla por cualquier motivo, THEN THE Sistema SHALL mostrar un mensaje de error indicando que no se pudo generar el PDF y ofrecer la opción de reintentar
6. WHEN el PDF es generado exitosamente, THE Módulo_PDF SHALL nombrar el archivo descargado con el formato "[título de la planificación] - [fecha de inicio de semana]" y extensión .pdf, con un máximo de 100 caracteres en el nombre

### Requirement 7: Historial de Planificaciones

**User Story:** Como docente de nivel inicial, quiero acceder a mis planificaciones anteriores, para poder reutilizarlas, consultarlas o reimprimirlas cuando las necesite.

#### Acceptance Criteria

1. WHEN la Usuaria navega a la sección Historial, THE Sistema SHALL mostrar un grid responsivo de cards (3 columnas en desktop, 1 columna en móvil) donde cada card incluye: imagen representativa de la planificación, badge con fecha de creación, título de la planificación, descripción truncada a un máximo de 80 caracteres, chips indicando nivel y tipo, y los botones "Ver" y "Re-Imprimir"
2. THE Sistema SHALL ordenar las planificaciones por fecha de creación descendente por defecto
3. WHEN la Usuaria selecciona el filtro "Recientes", THE Sistema SHALL mostrar las planificaciones ordenadas por fecha de creación descendente
4. WHEN la Usuaria selecciona el filtro "Efemérides", THE Sistema SHALL mostrar únicamente las planificaciones asociadas a fechas conmemorativas
5. WHEN la Usuaria selecciona el filtro "Proyectos", THE Sistema SHALL mostrar únicamente las planificaciones categorizadas como proyectos
6. WHEN la Usuaria presiona "Ver" en una card del Historial, THE Sistema SHALL navegar al Preview completo de esa planificación
7. WHEN la Usuaria presiona "Re-Imprimir" en una card del Historial, THE Módulo_PDF SHALL regenerar el PDF de esa planificación y presentar el diálogo de descarga o impresión del navegador
8. IF la regeneración del PDF falla o la planificación no puede ser recuperada, THEN THE Sistema SHALL mostrar un mensaje de error indicando que no fue posible generar el PDF y ofrecer la opción de reintentar
9. IF la Usuaria no tiene planificaciones guardadas o el filtro activo no arroja resultados, THEN THE Sistema SHALL mostrar un estado vacío con mensaje descriptivo y un botón para navegar a la pantalla Home a crear una nueva planificación

### Requirement 8: Registro de Usuaria

**User Story:** Como docente de nivel inicial, quiero crear una cuenta con mis datos básicos, para que mis planificaciones queden asociadas a mi perfil.

#### Acceptance Criteria

1. THE Sistema SHALL presentar un formulario de registro con los campos: nombre completo (máximo 100 caracteres), nombre de escuela (máximo 150 caracteres), email (máximo 254 caracteres) y contraseña
2. WHEN la Usuaria completa todos los campos con datos válidos y presiona "Registrarse", THE Sistema SHALL crear la cuenta y redirigir a la pantalla Home en no más de 3 segundos
3. IF el email ingresado ya está registrado, THEN THE Sistema SHALL mostrar un mensaje indicando que el email ya tiene una cuenta asociada sin borrar los demás campos del formulario
4. IF algún campo obligatorio está vacío al enviar el formulario, THEN THE Sistema SHALL señalar cada campo faltante con un borde de color de error y un texto descriptivo debajo del campo indicando que es requerido
5. THE Sistema SHALL requerir una contraseña con mínimo 6 caracteres y máximo 72 caracteres
6. IF el email ingresado no cumple el formato estándar de email (usuario@dominio.extensión), THEN THE Sistema SHALL señalar el campo email con indicador visual de error y un texto indicando el formato esperado
7. IF el registro falla por error de conexión o del servidor, THEN THE Sistema SHALL mostrar un mensaje de error indicando que no se pudo completar el registro y permitir reintentar sin perder los datos ingresados

### Requirement 9: Inicio de Sesión

**User Story:** Como docente de nivel inicial, quiero iniciar sesión con mi email y contraseña, para acceder a mis planificaciones guardadas.

#### Acceptance Criteria

1. THE Sistema SHALL presentar un formulario de inicio de sesión con campos email, contraseña y opción "Mantener sesión iniciada"
2. WHEN la Usuaria ingresa credenciales válidas y presiona "Iniciar Sesión", THE Sistema SHALL autenticar a la Usuaria y redirigir a la pantalla Home en no más de 3 segundos
3. IF las credenciales son inválidas, THEN THE Sistema SHALL mostrar un mensaje de error genérico sin revelar si el email existe o no
4. WHEN la Usuaria marca "Mantener sesión iniciada" e inicia sesión exitosamente, THE Sistema SHALL persistir la sesión en localStorage del dispositivo hasta que la Usuaria cierre sesión manualmente
5. IF la Usuaria no marca "Mantener sesión iniciada", THEN THE Sistema SHALL finalizar la sesión al cerrar el navegador

### Requirement 10: Landing Page

**User Story:** Como docente de nivel inicial que visita la app por primera vez, quiero entender rápidamente qué hace EduPlanner y cómo empezar, para decidir si quiero registrarme.

#### Acceptance Criteria

1. THE Sistema SHALL mostrar la Landing Page con sección hero (título "Planifica con amor, enseña con libertad" y mockup), listado de beneficios ("Fundamentación Propia", "Actividades Editables", "Inclusión a medida"), botón CTA "Empezar Gratis" en color mostaza (#E9B44C) y botón "Iniciar Sesión" en estilo outlined
2. WHEN la Usuaria presiona "Empezar Gratis", THE Sistema SHALL navegar a la pantalla de Registro
3. WHEN la Usuaria presiona "Iniciar Sesión", THE Sistema SHALL navegar a la pantalla de Inicio de Sesión
4. THE Sistema SHALL mostrar la Landing Page con diseño responsive donde todos los elementos son visibles y utilizables sin scroll horizontal en pantallas desde 320px de ancho

### Requirement 11: Navegación Principal

**User Story:** Como docente de nivel inicial, quiero navegar fácilmente entre las secciones principales de la app, para acceder a crear planificaciones o ver mi historial sin perderme.

#### Acceptance Criteria

1. WHILE la Usuaria está autenticada, THE Sistema SHALL mostrar una barra de navegación inferior fija con las opciones "Inicio" (ícono casa) e "Historial" (ícono reloj)
2. WHEN la Usuaria presiona "Inicio" en la navegación, THE Sistema SHALL mostrar la pantalla Home con el campo de consigna y botón CREAR
3. WHEN la Usuaria presiona "Historial" en la navegación, THE Sistema SHALL mostrar la pantalla de Historial de planificaciones
4. THE Sistema SHALL resaltar visualmente la pestaña activa en la barra de navegación inferior diferenciándola de la inactiva mediante color o peso visual distinto

### Requirement 12: Alineación Curricular con Datos Estáticos

**User Story:** Como docente de nivel inicial, quiero que las planificaciones generadas consideren las efemérides y estaciones argentinas, para que el contenido sea relevante al contexto local.

#### Acceptance Criteria

1. WHEN la fecha de generación está dentro de los 7 días previos a una fecha conmemorativa registrada en los Datos_Estáticos, THE Generador_IA SHALL incluir referencia a dicha efeméride en el contenido de la planificación generada
2. THE Generador_IA SHALL considerar la estación del año actual según el calendario del hemisferio sur (verano: dic-feb, otoño: mar-may, invierno: jun-ago, primavera: sep-nov) al generar contenido de actividades
3. WHEN existe al menos una efeméride dentro de los próximos 7 días en los Datos_Estáticos, THE Sistema SHALL generar chips de sugerencia en la pantalla Home basados en dichas efemérides próximas
4. IF no existe ninguna efeméride dentro de los próximos 7 días, THEN THE Sistema SHALL mostrar chips de sugerencia basados en la estación del año actual

### Requirement 13: Diseño Visual Mobile-First

**User Story:** Como docente de nivel inicial, quiero que la app sea fácil de usar desde mi celular, para poder planificar rápidamente entre clase y clase.

#### Acceptance Criteria

1. THE Sistema SHALL renderizar todos los elementos interactivos (botones, campos de texto, chips) con altura mínima de 56px para facilitar la interacción táctil
2. THE Sistema SHALL utilizar la paleta de colores definida: fondo #FBF9F5, verde primario #4A7856, mostaza #E9B44C para acciones principales, lavanda #9B89B3 exclusivamente para adaptaciones/inclusión
3. THE Sistema SHALL aplicar tipografía Quicksand con peso bold para títulos y medium para cuerpo de texto
4. THE Sistema SHALL utilizar formas redondeadas (rounded-xl) en cards e inputs, y forma pill en botones y chips
5. WHEN la Usuaria toca un botón de acción, THE Sistema SHALL mostrar un cambio visual de escala o luminosidad durante la duración del toque, retornando al estado original al soltar

### Requirement 14: Pantalla Home

**User Story:** Como docente de nivel inicial, quiero ver una pantalla de inicio clara y acogedora al abrir la app, para sentirme guiada hacia la creación de mi planificación.

#### Acceptance Criteria

1. WHEN la Usuaria accede a la pantalla Home, THE Sistema SHALL mostrar un saludo personalizado que incluya el nombre de la Usuaria registrado en su perfil
2. THE Sistema SHALL mostrar un toggle visible con opciones "Voz" y "Texto" en formato pill para alternar el modo de ingreso de consigna, con "Texto" seleccionado por defecto
3. THE Sistema SHALL mostrar el botón "CREAR" en color mostaza (#E9B44C) con ancho completo del contenedor y altura mínima de 56px como acción principal de la pantalla
4. THE Sistema SHALL mostrar chips de sugerencias temáticas debajo del campo de consigna, con un mínimo de 2 y un máximo de 5 chips visibles
5. WHEN existe una efeméride dentro de los próximos 7 días, THE Sistema SHALL mostrar un banner informativo sobre dicha efeméride en la pantalla Home
