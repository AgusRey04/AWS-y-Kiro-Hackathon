# Flujo de Git para Tasks

## Regla de Branching

Cada vez que se empieza a implementar una task del spec, se DEBE crear una nueva rama Git antes de hacer cualquier cambio de código.

### Convención de nombres de rama

- Formato: `task/{task-id}` (ej: `task/2.1`, `task/3.2`)
- Crear la rama desde `main` (o la rama principal activa)

### Proceso

1. Antes de empezar una task: `git checkout -b task/{task-id}`
2. Implementar los cambios en esa rama
3. Al completar la task, los cambios quedan en la rama para revisión o merge

### Commits

- Los mensajes de commit DEBEN estar escritos en español
- Formato sugerido: `feat(task-id): descripción breve del cambio`
- Ejemplo: `feat(2.1): implementar servicio de autenticación con registro y login`
