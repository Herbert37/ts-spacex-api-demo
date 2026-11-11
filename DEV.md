# Guía técnica del proyecto

## 1. Finalidad

Orbit / Space Data Lab es una aplicación frontend educativa y demostrativa. Su objetivo es comparar el consumo de dos arquitecturas de API sobre el mismo dominio funcional: información de lanzamientos de SpaceX.

- **REST/OpenAPI:** expone un recurso mediante una ruta HTTP concreta y devuelve una representación amplia del lanzamiento.
- **GraphQL:** expone un punto de entrada único y permite solicitar explícitamente el conjunto de campos que necesita la interfaz.

Ambos contratos son simulados mediante un Postman Mock Server para que la comparación sea estable, reproducible y no dependa de la disponibilidad de servicios públicos externos.

## 2. Arquitectura de la aplicación

```text
src/
├── components/       Componentes visuales reutilizables
├── hooks/            Gestión de estado asíncrono
├── services/         Clientes HTTP y normalización de respuestas
├── types/            Contratos TypeScript
├── App.tsx           Composición de vistas y métricas
├── main.tsx          Punto de entrada React
└── index.css         Tokens visuales y estilos Tailwind
```

### Responsabilidades

- `services/api.ts` encapsula URLs, métodos HTTP, query GraphQL, validación básica y transformación al modelo común `Launch`.
- `hooks/useApiData.ts` evita duplicar la lógica de carga, error, cancelación y actualización.
- `components/SourcePanel.tsx` presenta ambas fuentes con la misma estructura visual, permitiendo una comparación justa.
- `components/LaunchCard.tsx` consume el modelo normalizado sin conocer si los datos provienen de REST o GraphQL.
- `App.tsx` calcula el promedio de latencia, el tamaño de payload y el porcentaje de ahorro.

Este diseño aplica separación de responsabilidades: la vista no conoce los detalles del transporte y los servicios no contienen lógica de presentación.

## 3. Contratos consumidos

### REST/OpenAPI

```http
GET https://ceca21c3-ac8e-47a2-9a2e-bf9eb3aae13f.mock.pstmn.io/v4/launches/rest
```

Devuelve un objeto de lanzamiento con propiedades como `name`, `date_utc`, `rocket`, `success`, `details` y `links`. En un diseño REST tradicional, el recurso puede incluir más información de la que una pantalla concreta necesita.

### GraphQL

```http
POST https://ceca21c3-ac8e-47a2-9a2e-bf9eb3aae13f.mock.pstmn.io/v4/launches/graphql
Content-Type: application/json
```

La aplicación envía:

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

GraphQL permite declarar el shape de la respuesta en la propia consulta. Esto evita que el cliente tenga que descargar campos que no va a renderizar.

## 4. Normalización y tipado

Aunque los payloads tienen estructuras distintas, ambos se convierten al tipo común:

```ts
interface Launch {
  id: string;
  name: string;
  date: string;
  status: "upcoming" | "success" | "failed" | "unknown";
  rocket: string;
  customer: string;
  image: string | null;
  details: string | null;
  webcast: string | null;
}
```

La normalización es importante porque permite que `LaunchCard` sea agnóstica al origen. También centraliza defaults y evita llenar los componentes con comprobaciones específicas de REST o GraphQL.

Actualmente las imágenes se reciben desde un mock con URLs de ejemplo que pueden no estar disponibles. Por decisión de UX, la tarjeta utiliza un icono de cohete como representación estable de la misión en lugar de mostrar imágenes rotas.

## 5. Métricas

Cada servicio toma una marca temporal antes de ejecutar `fetch` y calcula:

```text
latencia = performance.now() después - performance.now() antes
payload KB = tamaño de JSON.stringify(respuesta) / 1024
ahorro = 1 - (payload GraphQL / payload REST)
```

Estas métricas son observaciones del navegador y pueden variar por red, caché, latencia del mock server y carga del dispositivo. No deben interpretarse como una medición universal de REST o GraphQL.

Para una comparación controlada deben mantenerse constantes:

1. Endpoint y región del mock.
2. Número de campos funcionalmente comparados.
3. Tamaño y contenido de los datos.
4. Número de usuarios virtuales.
5. Duración de la prueba.

## 6. Prueba de carga

`load-test.js` usa k6 con 20 usuarios virtuales durante 30 segundos. Cada iteración ejecuta una petición REST y una petición GraphQL, registra duración y bytes, y valida respuestas exitosas.

```bash
k6 run load-test.js
```

Los umbrales de p95 y payload están definidos en el propio script. La prueba ayuda a observar el comportamiento relativo del contrato mock; no sustituye pruebas de rendimiento en infraestructura productiva.

## 7. Conclusiones del análisis

### REST/OpenAPI

**Ventajas**

- Contrato sencillo de descubrir mediante rutas y documentación OpenAPI.
- Uso natural de verbos HTTP, caché y herramientas estándar.
- Integración directa para clientes simples.

**Costes**

- El endpoint puede devolver más datos de los necesarios.
- Las necesidades de varias pantallas pueden producir múltiples rutas o respuestas poco flexibles.
- La forma final de la respuesta depende principalmente del servidor.

### GraphQL

**Ventajas**

- El cliente declara exactamente los campos requeridos.
- Reduce el over-fetching en pantallas pequeñas o móviles.
- Agrupa datos relacionados en una sola operación.
- El esquema funciona como contrato explícito.

**Costes**

- Requiere mayor disciplina de esquema, validación y observabilidad.
- La caché HTTP tradicional no es tan directa como en REST.
- Una query mal diseñada puede ser costosa para el servidor.

### Conclusión práctica

No existe una arquitectura universalmente superior. REST es una opción excelente cuando los recursos y operaciones son estables, cacheables y fáciles de modelar como endpoints. GraphQL aporta más flexibilidad cuando diferentes clientes necesitan distintas proyecciones de los mismos datos.

En este proyecto, GraphQL debería producir un payload menor porque solicita menos campos. Sin embargo, la reducción de bytes no garantiza por sí sola menor latencia: influyen el servidor, la red, la serialización, la caché y la complejidad de resolución. La decisión debe basarse en las métricas observadas y en las necesidades de evolución del producto.

## 8. Flujo local de desarrollo

```bash
npm install
npm run dev
npm run build
```

El build ejecuta TypeScript en modo estricto y después compila la aplicación con Vite. Cualquier cambio en un contrato mock debe reflejarse en `src/services/api.ts`, `src/types/api.ts`, `load-test.js` y la documentación.
