# DeliveryJS

Simulación de microservicios para pedidos y reparto de comida con Node.js + Express. Un orquestador central coordina 5 microservicios independientes (usuarios, restaurantes, repartidores, pagos y notificaciones) ejecutando un flujo secuencial de 6 pasos para procesar un pedido, desde la validación del cliente hasta la notificación de envío. Incluye un panel web con visualización en tiempo real del flujo, formulario interactivo y notificaciones con sonido al completar el proceso.

<div align="center">
  <img width="1368" height="903" alt="image" src="https://github.com/user-attachments/assets/ca41f7ed-62a7-44bd-b7c1-3959464c8033" />

  <br><br>

  <img width="1333" height="905" alt="image" src="https://github.com/user-attachments/assets/c729863d-c7a5-47fc-9b75-46f6612442bc" />
</div>


## Arquitectura

Orquestador central que coordina 5 microservicios. No hay comunicación directa entre servicios.

```
Cliente → Orquestador (3000) → Usuarios (3001)
                             → Restaurantes (3002)
                             → Pagos (3004)
                             → Restaurantes (3002)
                             → Repartidores (3003)
                             → Notificaciones (3005)
```

| Servicio | Puerto |
|---|---|
| Orquestador | 3000 |
| Usuarios | 3001 |
| Restaurantes | 3002 |
| Repartidores | 3003 |
| Pagos | 3004 |
| Notificaciones | 3005 |

## Instalación

```bash
cd deliveryjs
npm install
```

## Ejecución

### Todos los servicios (recomendado)

```bash
npm run dev
```

### Terminales separadas

Abrir 6 terminales y ejecutar:

| Terminal | Comando |
|---|---|
| 1 | `node orchestrator/index.js` |
| 2 | `node services/users-service/index.js` |
| 3 | `node services/restaurants-service/index.js` |
| 4 | `node services/delivery-service/index.js` |
| 5 | `node services/payments-service/index.js` |
| 6 | `node services/notifications-service/index.js` |

## Uso

Abrir `http://localhost:3000`, completar el formulario y hacer clic en **Crear Pedido**. El panel muestra la arquitectura, el flujo paso a paso con estados en tiempo real, y la respuesta final con sonido de notificación al completarse.

### curl

```bash
curl -X POST http://localhost:3000/pedidos \
  -H "Content-Type: application/json" \
  -d '{"usuarioId":1,"restauranteId":1,"itemId":1,"tarjeta":{"numero":"4111111111111111","cvv":"123"}}'
```

## Flujo de orquestación

1. Validar usuario — `GET /usuarios/:id`
2. Consultar menú — `GET /restaurantes/:id/menu`
3. Procesar pago — `POST /pagos/procesar`
4. Marcar pedido — `POST /restaurantes/:id/pedido`
5. Asignar repartidor — `GET /repartidores/disponibles` → `POST /repartidores/:id/asignar`
6. Enviar notificación — `POST /notificaciones/enviar`

Si algún paso falla, el orquestador responde con el error y no continúa.
