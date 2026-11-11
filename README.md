# Orbit / Space Data Lab

Dashboard comparativo de misiones de SpaceX para observar, en una interfaz real, las diferencias entre una API REST/OpenAPI y una API GraphQL. La aplicación mide en el navegador la latencia y el tamaño aproximado del payload de cada consulta, y muestra las misiones recibidas en tarjetas responsive.

## Demo en vivo

Consulta la aplicación desplegada en Vercel: [spacex-api-performance.vercel.app](https://spacex-api-performance.vercel.app/)

## Arquitectura y stack

- **Vite + React 18 + TypeScript estricto:** desarrollo rápido, componentes tipados y compilación optimizada.
- **Tailwind CSS:** sistema visual oscuro, responsive y basado en utilidades.
- **Lucide React:** iconografía consistente y accesible.
- **k6:** prueba de carga reproducible para comparar las dos operaciones.
- `src/components`: Header, Footer, tarjetas, paneles de fuente y métricas.
- `src/services`: clientes HTTP y normalización de respuestas.
- `src/hooks`: estado reutilizable para loading, error, métricas y reintentos.
- `src/types`: contratos TypeScript compartidos.

## Consumo de APIs

### REST / OpenAPI

**Endpoint:** `GET https://ceca21c3-ac8e-47a2-9a2e-bf9eb3aae13f.mock.pstmn.io/v4/launches/rest`

La respuesta REST entrega recursos completos de lanzamiento, incluidos campos que la vista no necesita (telemetría, fallos, links y datos del cohete). La UI normaliza únicamente los campos necesarios para representar cada misión, pero el tamaño medido corresponde al JSON original descargado.

Ejemplo reducido de respuesta:

```json
{
  "fairings": {
    "reused": true,
    "recovery_attempt": true,
    "recovered": true
  },
  "links": {
    "patch": { "small": "https://images2.imgbox.com/..." },
    "webcast": "https://youtu.be/..."
  },
  "rocket": "5e9d0d95eda69955f709d1eb",
  "success": true,
  "name": "Starlink Group 6-45",
  "date_utc": "2026-10-20T08:00:00.000Z",
  "details": "This mission will launch the next batch of Starlink internet satellites."
}
```

### GraphQL

**Endpoint:** `POST https://ceca21c3-ac8e-47a2-9a2e-bf9eb3aae13f.mock.pstmn.io/v4/launches/graphql`

La consulta selecciona directamente los campos de la tarjeta y evita descargar propiedades innecesarias:

```graphql
query LaunchLatest {
  launchLatest {
    mission_name
    launch_date_utc
    rocket {
      rocket_name
      rocket_type
    }
    details
  }
}
```

El filtrado directo reduce el over-fetching y permite que el contrato de datos de la pantalla sea visible en una sola operación. La respuesta se recibe como `{ "data": { "launchLatest": { ... } } }`.

## Métricas

El dashboard calcula:

- **Latencia:** `performance.now()` antes y después de `fetch`.
- **Payload:** bytes del JSON descargado (`Blob(JSON.stringify(response)).size`) convertido a KB.
- **Ahorro:** `1 - (payloadGraphQL / payloadREST)`.

Los valores dependen de la red, caché y disponibilidad de los servicios. Esta tabla documenta el formato de reporte de una ejecución; los valores del dashboard son los medidos en tiempo real.

| Métrica                  |   REST | GraphQL |
| ------------------------ | -----: | ------: |
| Latencia promedio        | `N ms` |  `N ms` |
| Latencia p95 (k6)        | `N ms` |  `N ms` |
| Payload promedio         | `N KB` |  `N KB` |
| Ahorro de ancho de banda |      — |   `N %` |

## Pruebas de carga con k6

`load-test.js` ejecuta las dos solicitudes simultáneamente por cada iteración, usando 20 usuarios virtuales durante 30 segundos. Registra latencia, tamaño de payload y errores por endpoint.

```bash
k6 run load-test.js
```

El script completo está en [`load-test.js`](./load-test.js). También puede exportarse un resumen para CI:

```bash
k6 run --summary-export=summary.json load-test.js
```

Los umbrales configurados validan que el p95 de cada endpoint sea menor a 2 segundos y que el payload promedio sea menor a 100 KB.

### Ejecución local sin instalar k6

Si no tienes permisos de administrador para instalar k6, el proyecto incluye [`load-test.node.mjs`](./load-test.node.mjs), un runner equivalente basado en `fetch` nativo de Node.js:

```bash
npm run test:load
```

Ejecuta 20 usuarios virtuales durante 30 segundos y muestra para cada API el número de solicitudes, errores, latencia promedio, p95 y payload promedio. Requiere Node.js 20 o superior.

El escenario puede ajustarse desde PowerShell:

```powershell
$env:LOAD_VUS=5
$env:LOAD_DURATION=10
$env:LOAD_TIMEOUT=5000
npm run test:load
```

Si Node muestra `SELF_SIGNED_CERT_IN_CHAIN` por un certificado corporativo o proxy local, puedes habilitar temporalmente la conexión para desarrollo:

```powershell
$env:LOAD_INSECURE_TLS=1
npm run test:load
```

Esta opción desactiva la verificación TLS únicamente para el proceso de la prueba. No debe utilizarse en producción ni en redes no confiables.

Este runner es la alternativa local para desarrollo. `load-test.js` sigue siendo el script oficial para k6 cuando el runtime esté disponible.

El runner no cuenta solicitudes fallidas dentro del promedio de payload. Si todas las solicitudes fallan, muestra `N/D` en lugar de `0.00`, para evitar interpretar un error de red como una respuesta vacía.

## Resultados de la prueba ejecutada

La siguiente ejecución se realizó con **20 usuarios virtuales durante 30 segundos**, utilizando la red móvil y los endpoints del Postman Mock Server:

| Métrica                     |    REST |     GraphQL |
| --------------------------- | ------: | ----------: |
| Solicitudes totales         |   3.380 |       3.380 |
| Solicitudes exitosas        |      60 |          60 |
| Errores HTTP 429            |   3.320 |       3.320 |
| Latencia promedio observada |  512 ms |      529 ms |
| Latencia p95 observada      |  920 ms |    1.006 ms |
| Payload promedio            | 2,22 KB |     0,35 KB |
| Ahorro de payload GraphQL   |       — | **84,23 %** |

### 1. Optimización y ahorro de ancho de banda

GraphQL redujo el payload promedio de **2,22 KB en REST a 0,35 KB**, lo que representa un ahorro estimado de **84,23 %**. El resultado demuestra el beneficio de solicitar únicamente los campos necesarios para la interfaz (`mission_name`, `launch_date_utc`, `rocket` y `details`), evitando el _over-fetching_ de la respuesta REST completa.

Esta reducción es especialmente relevante en redes con restricciones de ancho de banda o dispositivos móviles. La respuesta REST incluye estructuras y metadatos que esta pantalla no renderiza, como información ampliada de cohetes, barcos, paracaídas, fallos y enlaces.

### 2. Concurrencia y limitación de tasa

La prueba generó **3.380 solicitudes por tecnología**. Solo **60 fueron exitosas** y **3.320 recibieron HTTP 429 (`Too Many Requests`)**.

El código 429 indica que el Postman Mock Server aplicó _rate limiting_. Al ejecutar 20 usuarios virtuales en un bucle cerrado, el servicio gratuito interpretó el tráfico como un pico de solicitudes y bloqueó temporalmente las peticiones excedentes. Por lo tanto, estos errores describen una limitación de la infraestructura simulada, no un fallo del contrato REST o GraphQL.

Las solicitudes procesadas mostraron latencias promedio cercanas a **512–529 ms** y p95 entre **920 y 1.006 ms**. Son valores útiles para observar el comportamiento del mock en la nube bajo concurrencia, pero no deben tratarse como una medición definitiva de rendimiento en producción.

### 3. Conclusiones generales

1. **Eficiencia del transporte:** GraphQL redujo el tráfico de red en más de un **84 %** frente a REST al devolver únicamente los campos solicitados.
2. **Límite del entorno de prueba:** un Postman Mock Server gratuito no es adecuado para pruebas de estrés intensivas; sus límites de tasa producen HTTP 429 con 20 usuarios virtuales en bucle cerrado.
3. **Latencia bajo presión:** ambas arquitecturas presentaron latencias similares, aproximadamente entre **510 y 530 ms** en promedio. El factor dominante fue la red hacia el mock y su control de tráfico, no el tamaño del payload.
4. **Siguiente paso recomendado:** para evaluar capacidad real bajo carga, conviene ejecutar los mismos contratos en infraestructura dedicada, por ejemplo un Apollo Server local o servicios desplegados en contenedores, con límites y recursos controlados.

## Instalación y ejecución

Requisitos: Node.js 20+ y [k6](https://k6.io/docs/get-started/installation/).

```bash
npm install
npm run dev
```

Abre la URL que indique Vite (habitualmente `http://localhost:5173`). Para generar una build de producción:

```bash
npm run build
npm run preview
```

## Scripts disponibles

| Comando               | Uso                                |
| --------------------- | ---------------------------------- |
| `npm run dev`         | Servidor de desarrollo Vite        |
| `npm run build`       | Type-check y build de producción   |
| `npm run preview`     | Servir la build localmente         |
| `npm run test:load`   | Benchmark local sin instalar k6    |
| `k6 run load-test.js` | Benchmark concurrente REST/GraphQL |
