# DeliveryJS

Proyecto de simulación de microservicios para pedidos y reparto de comida usando Node.js + Express.js.

## Arquitectura

El sistema utiliza un **Orquestador** central que coordina la comunicación entre **5 microservicios especializados**. Los microservicios NO se comunican entre sí directamente; toda la lógica de negocio es gestionada exclusivamente por el Orquestador.

```
Cliente → Orquestador (3000) → Usuarios (3001)
                             → Restaurantes (3002)
                             → Pagos (3004)
                             → Restaurantes (3002)
                             → Repartidores (3003)
                             → Notificaciones (3005)
```

## Puertos

| Servicio           | Puerto |
| ------------------ | ------ |
| Orquestador        | 3000   |
| Usuarios           | 3001   |
| Restaurantes       | 3002   |
| Repartidores       | 3003   |
| Pagos              | 3004   |
| Notificaciones     | 3005   |

## Instalación

```bash
cd deliveryjs
npm install
```

## Interfaz web

El proyecto incluye un panel web profesional accesible desde el navegador:

```
http://localhost:3000
```

Muestra la arquitectura de microservicios, un formulario para crear pedidos, y una visualización paso a paso del flujo de orquestación con estados en tiempo real.

## Ejecución

### Método 1 (recomendado) — Terminales separadas

Abrir **6 terminales de PowerShell** (cada uno con `cd deliveryjs`) y ejecutar:

| Terminal | Comando |
|----------|---------|
| 1 | `node orchestrator/index.js` |
| 2 | `node services/users-service/index.js` |
| 3 | `node services/restaurants-service/index.js` |
| 4 | `node services/delivery-service/index.js` |
| 5 | `node services/payments-service/index.js` |
| 6 | `node services/notifications-service/index.js` |

### Método 2 — npm run dev (si no bloquea PowerShell)

Si PowerShell no bloquea npm, también funciona:

```powershell
cd deliveryjs
npm run dev
```

Si da error `npm.ps1 no se puede cargar`, ejecutar antes:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned
cd deliveryjs
npm run dev
```

### Método 3 — Un solo comando con CMD

```cmd
cd deliveryjs
npm run dev
```

## Cómo probar desde la web

1. Asegurarse de que los **6 servicios** estén corriendo (ver Método 1)
2. Abrir `http://localhost:3000` en el navegador
3. Completar el formulario y hacer clic en "Crear Pedido"
4. Observar la animación del flujo paso a paso

## Solución de problemas

### Los selects solo muestran 2 usuarios/restaurantes

Si después de modificar el código los selects del formulario siguen mostrando solo los datos antiguos:

1. **Reinicia TODOS los servicios** — Detén cada terminal con `Ctrl+C` y vuelve a ejecutar los 6 servicios. Los nuevos endpoints `GET /usuarios` y `GET /restaurantes` requieren que los servicios de usuarios y restaurantes se reinicien.

2. **Hard refresh en el navegador** — Presiona `Ctrl+F5` o `Ctrl+Shift+R` para forzar la recarga del HTML/JS sin usar caché del navegador.

3. **Verifica que no hay errores** — Abre la Consola del Navegador (F12 → Console). Si ves `Error al cargar datos`, significa que algún servicio no se inició correctamente o los puertos no coinciden.

## Cómo probar con curl

```bash
curl -X POST http://localhost:3000/pedidos ^
  -H "Content-Type: application/json" ^
  -d "{\"usuarioId\": 1, \"restauranteId\": 1, \"itemId\": 1, \"tarjeta\": {\"numero\": \"4111111111111111\", \"cvv\": \"123\"}}"
```

### Respuesta exitosa esperada

```json
{
  "mensaje": "Pedido creado exitosamente",
  "pedido": {
    "usuario": "Carlos Pérez",
    "restaurante": "Pizza House",
    "item": "Pizza Americana",
    "precio": 25.9,
    "estado": "En camino",
    "repartidor": "Luis Ramírez"
  }
}
```

## Flujo de orquestación

1. **Validar usuario** → GET `/usuarios/:id` (Servicio Usuarios — puerto 3001)
2. **Consultar menú** → GET `/restaurantes/:id/menu` (Servicio Restaurantes — puerto 3002)
3. **Procesar pago** → POST `/pagos/procesar` (Servicio Pagos — puerto 3004)
4. **Marcar pedido** → POST `/restaurantes/:id/pedido` (Servicio Restaurantes — puerto 3002)
5. **Asignar repartidor** → GET `/repartidores/disponibles` + POST `/repartidores/:id/asignar` (Servicio Repartidores — puerto 3003)
6. **Enviar notificación** → POST `/notificaciones/enviar` (Servicio Notificaciones — puerto 3005)
7. **Responder resumen** → Respuesta JSON con estado final

Si algún paso falla, el Orquestador responde con un error claro y no continúa con el flujo.
