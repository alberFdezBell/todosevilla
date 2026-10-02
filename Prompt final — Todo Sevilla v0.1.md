# TODO SEVILLA — DESARROLLO DE LA PRIMERA VERSIÓN

Quiero que desarrolles desde cero la primera versión funcional de **Todo Sevilla**.

Todo Sevilla será una web moderna que funcionará como unas **Páginas Amarillas modernas, rápidas e intuitivas para descubrir negocios de Sevilla**, organizada principalmente por barrios.

El proyecto debe ser una aplicación real y desplegable en producción, no una simple maqueta o landing page.

La aplicación debe incluir:

- Web pública.
- Panel de administración privado.
- Base de datos persistente.
- Docker.
- Desarrollo local.
- CI/CD mediante GitHub Actions.
- Tests.
- Build de producción.
- Imagen Docker versionada.
- Registro de imágenes.
- Despliegue mediante Portainer.
- Healthchecks.
- Rollback.
- Notificaciones de Telegram.
- SEO.
- Páginas legales.
- Documentación completa.

---

# 1. OBJETIVO DEL PROYECTO

La idea principal es crear un directorio local de negocios de Sevilla.

La estructura conceptual será:

```text
Sevilla
├── Barrio
│   ├── Negocio
│   ├── Negocio
│   └── ...
├── Barrio
│   ├── Negocio
│   └── ...
└── ...
```

La prioridad inicial será:

**Sevilla → Barrio → Negocio**

La arquitectura debe permitir incorporar posteriormente:

- categorías
- búsqueda avanzada
- cuentas de negocios
- reclamación de negocios
- reseñas
- favoritos
- estadísticas
- publicidad
- perfiles de empresas
- etc.

Pero NO quiero que estas funcionalidades futuras compliquen innecesariamente la primera versión.

---

# 2. PRINCIPIOS IMPORTANTES

Prioriza, en este orden:

1. Arquitectura sólida.
2. Persistencia de datos.
3. Administración funcional.
4. Web pública funcional.
5. Seguridad.
6. SEO.
7. Docker.
8. CI/CD.
9. Documentación.
10. Facilidad de mantenimiento.

Si tienes que elegir entre una funcionalidad llamativa y mejorar la fiabilidad de la aplicación, elige la fiabilidad.

No quiero una arquitectura excesivamente compleja.

---

# 3. STACK TECNOLÓGICO

Puedes elegir el stack que consideres más apropiado.

Debe cumplir:

- Aplicación dockerizable.
- Desarrollo local sencillo.
- Producción mediante Docker.
- Compatible con Portainer.
- Base de datos persistente.
- Configuración mediante variables de entorno.
- Buen soporte para SEO.
- Buen rendimiento.
- Código mantenible.
- No depender de servicios externos innecesarios.
- Fácil de hacer backups.
- Fácil de actualizar.

Preferiblemente utiliza:

- PostgreSQL como base de datos.
- Docker.
- GitHub Actions para CI/CD.

Si eliges una tecnología diferente, justifica la decisión en `README.md`.

Antes de finalizar, documenta el stack completo y explica por qué se ha elegido cada tecnología.

---

# 4. ESTRUCTURA GENERAL

La aplicación tendrá dos grandes zonas:

```text
TODO SEVILLA
│
├── Web pública
│   └── /sevilla
│
└── Administración
    └── /admin
```

La web pública será accesible desde Internet.

El panel `/admin` debe estar protegido y pensado para acceso únicamente desde la red local.

---

# 5. WEB PÚBLICA `/sevilla`

La ruta principal será:

```text
/sevilla
```

Debe tener un diseño:

- moderno
- limpio
- rápido
- mobile-first
- responsive
- accesible
- intuitivo

La interfaz estará en español.

No quiero una interfaz genérica de plantilla.

Debe sentirse como una plataforma local de Sevilla.

---

# 6. PORTADA `/sevilla`

La portada debe incluir como mínimo:

## Cabecera

- Logo/nombre "Todo Sevilla".
- Navegación.
- Acceso al buscador.
- Enlaces relevantes.
- Diseño responsive.

## Buscador principal

El usuario debe poder buscar negocios y barrios.

Ejemplos:

```text
cafetería triana
peluquería
farmacia
bar pepe
Triana
Nervión
Macarena
```

## Descubrimiento

Mostrar una selección aleatoria o pseudoaleatoria de negocios activos.

Por ejemplo:

```text
Descubre negocios de Sevilla

[ Negocio ]
[ Negocio ]
[ Negocio ]
[ Negocio ]
```

La selección debe cambiar razonablemente entre visitas.

## Barrios

Mostrar acceso a los barrios disponibles.

## Información de Todo Sevilla

Explicar brevemente qué es Todo Sevilla.

## Estadísticas

Mostrar, si resulta apropiado:

```text
X barrios
X negocios
```

No inventar datos.

---

# 7. BUSCADOR

El buscador debe permitir buscar:

- nombre del negocio
- barrio
- descripción
- categoría si existe

Debe soportar búsquedas parciales.

Ejemplos:

```text
"cafe"
```

debe poder encontrar negocios cuyo nombre contenga algo equivalente a "cafe".

También:

```text
"Triana"
```

debe encontrar negocios de Triana y el barrio.

No es necesario implementar Elasticsearch u otro buscador externo.

Para esta primera versión puede utilizarse PostgreSQL.

La búsqueda debe estar correctamente indexada si resulta necesario.

---

# 8. BARRIOS

Debe existir una página de listado de barrios.

Por ejemplo:

```text
/sevilla/barrios
```

Cada barrio debe mostrar:

- nombre
- descripción
- imagen si existe
- número de negocios
- enlace

Cada barrio debe tener una página individual.

Por ejemplo:

```text
/sevilla/triana
```

Utilizar slugs amigables.

---

# 9. NEGOCIOS

Cada negocio tendrá una página individual.

Ejemplo:

```text
/sevilla/triana/nombre-del-negocio
```

El modelo debe contemplar como mínimo:

```text
id
nombre
slug
descripción
barrio
dirección
teléfono
email
web
horario
imagen/logo
activo
fecha_creación
fecha_actualización
```

Puedes añadir otros campos si son razonables.

Los campos vacíos NO deben mostrarse en la web pública.

---

# 10. CATEGORÍAS

Aunque la prioridad sean los barrios, diseña el modelo para soportar categorías.

Ejemplos:

```text
Restaurantes
Bares
Peluquerías
Tiendas
Servicios
Salud
```

Un negocio puede tener una o varias categorías si consideras que es la mejor arquitectura.

Desde administración se deben poder gestionar.

La interfaz pública puede incluir categorías en esta primera versión si resulta coherente.

---

# 11. ADMINISTRACIÓN `/admin`

Debe existir un panel de administración completo:

```text
/admin
```

No quiero una simple página con botones.

Debe permitir administrar los datos reales de la aplicación.

---

# 12. SEGURIDAD DE `/admin`

MUY IMPORTANTE:

No quiero que la seguridad consista simplemente en que `/admin` sea una URL poco conocida.

El panel debe estar preparado para restringirse a la red local.

La solución puede ser:

- reverse proxy
- restricción por IP
- firewall
- configuración de red Docker
- autenticación
- combinación de varias

Documenta claramente cómo funciona.

Si implementas autenticación:

- nunca guardes passwords en código
- nunca guardes secretos en Git
- utiliza variables de entorno/secrets
- utiliza hashing seguro

El panel debe tener protección frente a accesos no autorizados.

---

# 13. DASHBOARD ADMIN

La portada de `/admin` debe mostrar información útil.

Por ejemplo:

```text
Barrios: 12
Negocios: 248
Activos: 231
Inactivos: 17
```

Y accesos:

```text
+ Crear barrio
+ Crear negocio

Gestionar barrios
Gestionar negocios
Gestionar categorías
```

No hacen falta gráficos complejos.

---

# 14. ADMINISTRACIÓN DE BARRIOS

Desde `/admin` debo poder:

- listar barrios
- crear barrios
- editar barrios
- eliminar barrios
- activar/desactivar barrios

Un barrio tendrá como mínimo:

```text
nombre
slug
descripción
imagen
activo
```

El slug debe generarse automáticamente pero poder modificarse manualmente.

No debe poder eliminarse accidentalmente un barrio que tenga negocios asociados.

Implementa una protección y explica el comportamiento.

---

# 15. ADMINISTRACIÓN DE NEGOCIOS

Desde `/admin` debo poder:

- listar negocios
- crear negocios
- editar negocios
- eliminar negocios
- activar/desactivar negocios
- asignar barrio
- asignar categorías

El formulario debe estar bien organizado.

Debe haber validación:

- en frontend
- en backend

Nunca confíes únicamente en la validación del navegador.

---

# 16. ADMINISTRACIÓN DE CATEGORÍAS

Si implementas categorías, desde `/admin` debo poder:

- crear
- editar
- eliminar
- activar/desactivar
- asignar categorías

---

# 17. BASE DE DATOS

Utiliza preferiblemente PostgreSQL.

Debe existir:

- esquema
- migraciones
- seed opcional
- persistencia mediante Docker volume
- variables de entorno

Los datos NO deben estar dentro de la imagen Docker.

Debe ser posible hacer:

```text
docker compose down
docker compose up
```

sin perder datos.

Documenta:

- backup
- restauración
- migraciones
- estructura de datos

---

# 18. DATOS DE PRODUCCIÓN

Separar completamente:

```text
Código
↓
imagen Docker

Datos
↓
Docker volume
↓
PostgreSQL
```

Actualizar la aplicación NO debe borrar la base de datos.

Las migraciones deben ejecutarse de forma controlada.

---

# 19. DOCKER

Todo debe poder ejecutarse mediante Docker.

Debe existir una configuración de producción apropiada.

Debe existir una configuración cómoda para desarrollo local.

La imagen debe poder reconstruirse desde cero.

No depender de archivos mágicos que existan solamente en el servidor.

---

# 20. HEALTHCHECK

La aplicación debe disponer de un healthcheck real.

No basta con que Docker diga:

```text
container: running
```

Debe comprobar que la aplicación responde correctamente.

Documenta cómo comprobarlo.

---

# 21. MANEJO DE ERRORES

Implementa correctamente:

```text
404
500
negocio inexistente
barrio inexistente
errores de base de datos
```

No mostrar stack traces ni secretos al usuario.

Los detalles técnicos deben quedar en logs.

---

# 22. LOGS

Los logs deben ser útiles.

Nunca incluir:

- passwords
- tokens
- secretos
- información sensible innecesaria

Documenta cómo consultarlos desde Docker y Portainer.

---

# 23. SEO

Presta especial atención al SEO porque Todo Sevilla será un directorio local.

Implementa:

- URLs amigables
- títulos dinámicos
- meta descriptions
- canonical
- Open Graph
- sitemap.xml
- robots.txt
- HTML semántico
- datos estructurados apropiados
- buen rendimiento
- páginas indexables

Las páginas de barrios y negocios deben tener contenido específico.

---

# 24. ACCESIBILIDAD

Implementa buenas prácticas:

- HTML semántico
- labels
- navegación por teclado
- focus visible
- contraste adecuado
- alt de imágenes
- mensajes de error claros
- botones correctamente identificados

---

# 25. PÁGINAS LEGALES

Crear como mínimo:

```text
/aviso-legal
/privacidad
/terminos-y-condiciones
/contacto
```

El contenido debe estar preparado para una web española.

NO inventes datos del titular.

Utiliza placeholders:

```text
[NOMBRE DEL TITULAR]
[NIF]
[DOMICILIO]
[EMAIL]
```

Documenta qué datos debo completar antes de publicar.

---

# 26. COOKIES

Por ahora:

**NO implementar cookies no esenciales.**

No añadir:

- Google Analytics
- trackers
- marketing
- publicidad
- cookies innecesarias

Si alguna tecnología utilizada genera cookies, documentarlo.

No crear un banner de cookies sin necesidad.

---

# 27. SEED DE DESARROLLO

Puedes incluir datos ficticios para desarrollo.

Si incluyes negocios:

- identificarlos claramente como datos de demostración
- no presentar negocios reales inventados como si fueran datos oficiales

---

# 28. TESTS

Implementa tests razonables.

Como mínimo:

- crear barrio
- crear negocio
- relación negocio/barrio
- búsqueda
- negocio inactivo no aparece
- barrio inexistente
- negocio inexistente
- validaciones
- endpoints/API si existe

No busques una cobertura artificial del 100%.

Prioriza detectar errores reales.

---

# 29. CALIDAD DEL CÓDIGO

El código debe ser:

- modular
- legible
- mantenible
- tipado cuando sea apropiado
- con nombres claros
- sin duplicación innecesaria

Evita abstracciones innecesarias.

---

# 30. `.gitignore`

Crear un `.gitignore` profesional.

Debe ignorar como mínimo:

```text
.env
node_modules
build
dist
logs
temporales
IDE
sistema operativo
backups
dumps
certificados privados
secretos
archivos generados
```

Adapta el contenido al stack elegido.

---

# 31. `.env.example`

Crear:

```text
.env.example
```

Debe documentar todas las variables necesarias.

Nunca incluir secretos reales.

Por ejemplo:

```text
DATABASE_URL=
ADMIN_PASSWORD=
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
REGISTRY=
...
```

---

# 32. CI/CD — ARQUITECTURA OBLIGATORIA

Esta parte es MUY IMPORTANTE.

La arquitectura de despliegue debe separar:

1. Código fuente.
2. Compilación.
3. Tests.
4. Artefacto de producción.
5. Registro de imágenes.
6. Despliegue.
7. Healthcheck.
8. Rollback.

## REGLA FUNDAMENTAL

**PORTAINER NO DEBE DESPLEGAR DIRECTAMENTE CADA COMMIT DE `main`.**

Un:

```text
git push
```

NO debe provocar directamente un despliegue de producción.

El flujo debe ser equivalente a:

```text
GitHub
  ↓
GitHub Actions
  ↓
lint
  ↓
tests
  ↓
build
  ↓
comprobaciones
  ↓
¿TODO OK?
  ↓
crear imagen Docker versionada
  ↓
publicar imagen en Registry
  ↓
actualizar producción
  ↓
Portainer
  ↓
deploy
  ↓
healthcheck
  ↓
OK → producción nueva
KO → rollback
```

---

# 33. GITHUB ACTIONS

Utiliza GitHub Actions.

El pipeline debe ejecutar como mínimo:

```text
checkout
↓
instalar dependencias
↓
lint
↓
tests
↓
build
↓
Docker build
↓
comprobaciones
```

Si algo falla:

```text
BUILD FALLIDO
```

La versión NO debe considerarse apta para producción.

---

# 34. VERSIONADO DE IMÁGENES

NO utilizar únicamente:

```text
latest
```

como mecanismo de control de versiones.

Cada build válido debe producir una versión identificable.

Puede ser, por ejemplo:

```text
todo-sevilla:abc1234
```

o:

```text
todo-sevilla:v1.0.0
```

o una estrategia equivalente.

Debe ser posible saber exactamente qué versión está ejecutándose.

---

# 35. DOCKER REGISTRY

Utiliza un Docker Registry apropiado.

Preferiblemente una solución sencilla integrada con GitHub, como:

```text
GitHub Container Registry (GHCR)
```

si resulta apropiado.

El pipeline debe:

1. Ejecutar tests.
2. Construir la imagen.
3. Etiquetarla con una versión identificable.
4. Publicarla en el Registry.
5. Solo después iniciar el proceso de despliegue.

No publicar como versión válida de producción una imagen cuyo build haya fallado.

---

# 36. PORTAINER

Portainer será el sistema que ejecutará la aplicación en producción.

Pero Portainer NO debe simplemente vigilar `main` y desplegar cualquier cambio.

Portainer debe desplegar una **versión concreta y validada**.

La arquitectura debe garantizar:

```text
commit incorrecto
↓
CI falla
↓
NO se crea versión válida
↓
NO se actualiza producción
```

Mientras que:

```text
commit correcto
↓
CI OK
↓
imagen versionada
↓
Registry
↓
Portainer
↓
deploy
```

---

# 37. MECANISMO DE ACTUALIZACIÓN DE PORTAINER

Puedes elegir la implementación concreta.

Por ejemplo:

- API de Portainer
- webhook
- GitOps
- Stack parametrizado
- Docker Registry
- tags
- releases
- otro mecanismo apropiado

Pero debes cumplir estas condiciones:

### Condición 1

Un commit por sí solo NO despliega.

### Condición 2

Un build fallido NO modifica producción.

### Condición 3

Producción ejecuta una versión identificable.

### Condición 4

No depender exclusivamente de `latest`.

### Condición 5

Debe existir rollback.

### Condición 6

La documentación debe explicar todo el proceso.

---

# 38. BUILD FALLIDO

Si GitHub Actions falla:

```text
GitHub
 ↓
CI
 ↓
ERROR
```

entonces:

1. Telegram recibe una notificación.
2. No se publica una versión válida.
3. No se actualiza Portainer.
4. Producción continúa con la versión anterior.

Ejemplo:

```text
🔴 Todo Sevilla

BUILD FALLIDO

Commit: abc1234

Producción NO se ha actualizado.
La versión anterior continúa activa.
```

---

# 39. BUILD CORRECTO

Si todo pasa:

```text
🟢 Todo Sevilla

BUILD CORRECTO

Commit: abc1234
Versión: v1.2.3

La versión ha superado las comprobaciones
y está preparada para producción.
```

Después debe iniciarse el proceso controlado de despliegue.

---

# 40. DESPLIEGUE

Después de publicar la imagen:

```text
Registry
↓
Portainer
↓
Pull imagen versionada
↓
Actualizar Stack
↓
Arrancar
↓
Healthcheck
```

No considerar el despliegue exitoso simplemente porque Docker haya arrancado el contenedor.

---

# 41. HEALTHCHECK POST-DEPLOY

Después de desplegar una versión nueva:

1. Esperar a que los servicios estén disponibles.
2. Ejecutar healthcheck.
3. Verificar que la aplicación responde.
4. Comprobar que la aplicación puede acceder a la base de datos.
5. Si todo está correcto → despliegue exitoso.

---

# 42. DESPLIEGUE FALLIDO

Si el healthcheck falla:

```text
Build OK
↓
Deploy
↓
Healthcheck KO
```

debe:

1. Detectarse el fallo.
2. Notificarse por Telegram.
3. Intentarse rollback cuando sea posible.
4. Restaurar la versión anterior.
5. Verificar que la versión anterior vuelve a funcionar.

Ejemplo:

```text
🔴 Todo Sevilla

DESPLIEGUE FALLIDO

La nueva versión no superó el healthcheck.

Se mantiene/restaura la versión anterior.
```

---

# 43. ROLLBACK

Debe ser posible conocer:

```text
versión actual
versión anterior
```

Debe existir un procedimiento para volver a la versión anterior.

Idealmente el rollback debe poder hacerse sin recompilar la versión anterior.

Documentar:

- rollback automático
- rollback manual
- rollback desde Portainer

---

# 44. TELEGRAM

El sistema debe enviar notificaciones Telegram para:

## Build correcto

```text
🟢 Todo Sevilla

BUILD CORRECTO

Commit: abc123
Versión: v1.2.3
```

## Build fallido

```text
🔴 Todo Sevilla

BUILD FALLIDO

Commit: abc123

Producción NO se ha actualizado.
```

## Producción actualizada

```text
🚀 Todo Sevilla

PRODUCCIÓN ACTUALIZADA

Versión: v1.2.3
```

## Deploy fallido

```text
🔴 Todo Sevilla

DESPLIEGUE FALLIDO

Se mantiene/restaura la versión anterior.
```

Utilizar GitHub Secrets.

Nunca almacenar:

```text
TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID
passwords
tokens
API keys
```

en Git.

---

# 45. FLUJO COMPLETO DE PRODUCCIÓN

El flujo final debe ser:

```text
┌───────────────┐
│    GitHub     │
│     main      │
└───────┬───────┘
        │
        │ git push
        ▼
┌───────────────────┐
│   GitHub Actions  │
│                   │
│ lint              │
│ tests             │
│ build             │
│ Docker build      │
└────────┬──────────┘
         │
       ¿OK?
      /    \
    NO      SÍ
    │        │
    ▼        ▼
Telegram   Docker Image
   🔴      versionada
             │
             ▼
          Registry
             │
             ▼
        Portainer
             │
             ▼
           Deploy
             │
             ▼
         Healthcheck
          /       \
        OK         KO
        │           │
        ▼           ▼
     Telegram    Rollback
       🟢           │
                    ▼
                 Telegram
                    🔴
```

---

# 46. README.md

Crear un `README.md` completo.

Debe contener:

## Introducción

Qué es Todo Sevilla.

## Funcionalidades

Qué hace esta versión.

## Arquitectura

Diagrama completo.

## Stack

Tecnologías y motivos.

## Estructura

Explicación de carpetas.

## Requisitos

Qué instalar.

## Instalación local

Paso a paso.

## Variables de entorno

Explicación de `.env.example`.

## Base de datos

Configuración y migraciones.

## Desarrollo

Cómo arrancar localmente.

## Administración

Cómo acceder a `/admin`.

## Tests

Cómo ejecutar tests.

## Build

Cómo ejecutar build.

## Docker

Cómo ejecutar Docker.

## CI/CD

Cómo funciona.

## Registry

Cómo se publican las imágenes.

## Portainer

Cómo funciona producción.

## Telegram

Cómo configurarlo.

## Backups

Cómo hacer/restaurar backups.

## Seguridad

Buenas prácticas.

## SEO

Configuración.

## Legal

Qué datos debo completar.

## Troubleshooting

Problemas habituales.

---

# 47. FLUJO.md

Crear:

```text
FLUJO.md
```

Debe ser un tutorial práctico para mí.

Debe explicar desde cero:

## 1. Clonar

```bash
git clone ...
cd todo-sevilla
```

## 2. Instalar dependencias

Comandos exactos.

## 3. Configurar `.env`

Comandos y variables.

## 4. Arrancar desarrollo

Comandos exactos.

Debe indicar URLs como:

```text
http://localhost:XXXX/sevilla
http://localhost:XXXX/admin
```

## 5. Desarrollar

Cómo modificar el proyecto.

## 6. Comprobar

Cómo ejecutar:

```text
lint
tests
build
```

## 7. Git

Explicar:

```bash
git status
git add .
git commit
git push
```

## 8. GitHub Actions

Explicar qué ocurre después del push.

## 9. Build fallido

Explicar:

```text
push
↓
CI
↓
error
↓
Telegram
↓
producción NO cambia
```

## 10. Build correcto

Explicar:

```text
push
↓
CI OK
↓
imagen versionada
↓
Registry
↓
Portainer
```

## 11. Producción

Explicar exactamente cómo se despliega.

## 12. Portainer

Explicar cómo comprobar el Stack.

## 13. Healthcheck

Explicar cómo comprobarlo.

## 14. Rollback

Explicar paso a paso.

---

# 48. PRIMER DESPLIEGUE EN PRODUCCIÓN

Documentar desde cero cómo desplegar Todo Sevilla por primera vez en Portainer.

Debe explicar:

```text
GitHub repository
↓
Docker Registry
↓
Portainer
↓
Stacks
↓
Add Stack
↓
Repository / configuración
↓
variables
↓
volúmenes
↓
deploy
```

Debe explicar:

- repositorio
- branch
- compose
- Registry
- imagen
- variables
- secretos
- volúmenes
- puertos
- red
- healthcheck
- dominio si existe
- reverse proxy si existe
- `/admin`
- base de datos

No asumir que el Stack ya existe.

---

# 49. ACTUALIZACIONES DE PRODUCCIÓN

La documentación debe dejar absolutamente claro:

> **El Stack de Portainer NO se actualiza con cada commit.**

El Stack solamente debe ejecutar imágenes que hayan pasado el proceso de CI.

El flujo será:

```text
desarrollo
↓
git push
↓
GitHub Actions
↓
tests
↓
build
↓
imagen versionada
↓
Registry
↓
Portainer
↓
deploy
```

Si CI falla:

```text
CI FAIL
↓
Telegram
↓
NO Registry de producción
↓
NO Portainer
↓
producción intacta
```

---

# 50. BACKUPS

Documentar:

- backup PostgreSQL
- ubicación recomendada
- restauración
- frecuencia recomendada
- comprobación de backups

No asumir que Docker volumes son backups.

---

# 51. SEGURIDAD

Revisar:

- secretos
- passwords
- variables de entorno
- acceso a `/admin`
- SQL injection
- XSS
- CSRF cuando sea relevante
- validación de inputs
- permisos
- logs
- imágenes Docker
- dependencias

No incluir secretos en Git.

---

# 52. ESTRUCTURA FINAL DEL REPOSITORIO

Debe existir como mínimo algo equivalente a:

```text
todo-sevilla/
│
├── README.md
├── FLUJO.md
├── .gitignore
├── .env.example
├── docker-compose.yml
├── Dockerfile
│
├── .github/
│   └── workflows/
│       └── ...
│
├── ...
│
└── ...
```

La estructura exacta dependerá del stack.

---

# 53. COMPROBACIÓN FINAL OBLIGATORIA

Antes de considerar terminado el proyecto debes comprobar realmente:

### Aplicación

- [ ] Compila.
- [ ] Arranca.
- [ ] Docker funciona.
- [ ] PostgreSQL funciona.
- [ ] Migraciones funcionan.
- [ ] Se puede crear barrio.
- [ ] Se puede editar barrio.
- [ ] Se puede eliminar barrio de forma segura.
- [ ] Se puede crear negocio.
- [ ] Se puede editar negocio.
- [ ] Se puede eliminar negocio.
- [ ] Se puede activar/desactivar negocio.
- [ ] Se puede asignar barrio.
- [ ] La búsqueda funciona.
- [ ] Los negocios inactivos no aparecen.
- [ ] Las páginas individuales funcionan.
- [ ] 404 funciona.
- [ ] `/admin` funciona.
- [ ] `/admin` está protegido.

### Docker

- [ ] Docker build funciona.
- [ ] Docker Compose funciona.
- [ ] Los datos persisten.
- [ ] Healthcheck funciona.
- [ ] Los logs son útiles.

### CI/CD

- [ ] GitHub Actions funciona.
- [ ] Lint funciona.
- [ ] Tests funcionan.
- [ ] Build funciona.
- [ ] La imagen Docker se genera.
- [ ] La imagen se versiona.
- [ ] La imagen se publica en Registry.
- [ ] Un build fallido NO actualiza producción.
- [ ] Un build correcto puede iniciar el despliegue.
- [ ] Portainer ejecuta una versión identificable.
- [ ] Healthcheck post-deploy funciona.
- [ ] Rollback está documentado.
- [ ] Telegram funciona.

### Seguridad

- [ ] No hay secretos en Git.
- [ ] `.env` está ignorado.
- [ ] `.env.example` existe.
- [ ] `/admin` no queda expuesto públicamente sin protección.
- [ ] No aparecen secretos en logs.

### Documentación

- [ ] README.md completo.
- [ ] FLUJO.md completo.
- [ ] Primer despliegue documentado.
- [ ] Actualización documentada.
- [ ] Rollback documentado.
- [ ] Backup documentado.
- [ ] Telegram documentado.
- [ ] Portainer documentado.

---

# 54. REGLA FINAL

No quiero que simplemente generes archivos que "parezcan correctos".

Quiero que construyas una primera versión **real, funcional, coherente y desplegable**.

Si tienes capacidad para ejecutar comandos, debes utilizarlos para comprobar el proyecto antes de terminar.

Si encuentras errores:

1. Identifica el problema.
2. Corrígelo.
3. Vuelve a ejecutar las comprobaciones.
4. Continúa hasta que el proyecto sea funcional.

No ocultes errores.

Si alguna decisión técnica no puede implementarse exactamente como se describe, elige la alternativa más sencilla y segura y **documenta claramente la diferencia en `README.md` y `FLUJO.md`**.

La propiedad más importante del sistema de producción es:

> **NINGÚN CAMBIO QUE NO HAYA SUPERADO CORRECTAMENTE EL PIPELINE DE CI/CD DEBE LLEGAR A PRODUCCIÓN.**

Y la segunda propiedad más importante:

> **DEBE SER POSIBLE SABER QUÉ VERSIÓN ESTÁ EJECUTANDO PRODUCCIÓN Y VOLVER A LA VERSIÓN ANTERIOR.**

Construye Todo Sevilla siguiendo estas reglas.