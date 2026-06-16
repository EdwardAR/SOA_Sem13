const express = require('express');
const app = express();
app.use(express.json());
const PORT = 3000;

const axios = require('axios');

const USERS_URL = 'http://localhost:3001';
const RESTAURANTS_URL = 'http://localhost:3002';
const DELIVERY_URL = 'http://localhost:3003';
const PAYMENTS_URL = 'http://localhost:3004';
const NOTIFICATIONS_URL = 'http://localhost:3005';

// API routes must be before static middleware
app.get('/api/usuarios', async (req, res) => {
  try {
    const response = await axios.get(`${USERS_URL}/usuarios`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

app.get('/api/restaurantes', async (req, res) => {
  try {
    const response = await axios.get(`${RESTAURANTS_URL}/restaurantes`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener restaurantes' });
  }
});

app.use(express.static('public'));

app.post('/pedidos', async (req, res) => {
  const { usuarioId, restauranteId, itemId, tarjeta } = req.body;

  if (!usuarioId || !restauranteId || !itemId || !tarjeta) {
    return res.status(400).json({ error: 'Faltan campos requeridos: usuarioId, restauranteId, itemId, tarjeta' });
  }

  const delay = ms => new Promise(r => setTimeout(r, ms));

  try {
    // Paso 1: Validar usuario
    const usuarioRes = await axios.get(`${USERS_URL}/usuarios/${usuarioId}`);
    const usuario = usuarioRes.data;
    await delay(3000);

    // Paso 2: Obtener menú y precio del restaurante
    const menuRes = await axios.get(`${RESTAURANTS_URL}/restaurantes/${restauranteId}/menu`);
    const item = menuRes.data.menu[itemId];
    if (!item) {
      return res.status(400).json({ error: 'Item no encontrado en el menú del restaurante' });
    }
    await delay(3000);

    // Paso 3: Procesar pago
    const pagoRes = await axios.post(`${PAYMENTS_URL}/pagos/procesar`, {
      monto: item.precio,
      tarjeta
    });

    if (pagoRes.data.status !== 'aprobado') {
      return res.status(402).json({ error: 'Pago rechazado', detalle: pagoRes.data });
    }
    await delay(3000);

    // Paso 4: Marcar pedido como "En preparación" en el restaurante
    await axios.post(`${RESTAURANTS_URL}/restaurantes/${restauranteId}/pedido`, { itemId });
    await delay(3000);

    // Paso 5: Asignar repartidor disponible
    const disponiblesRes = await axios.get(`${DELIVERY_URL}/repartidores/disponibles`);
    const disponibles = disponiblesRes.data;

    if (disponibles.length === 0) {
      return res.status(503).json({ error: 'No hay repartidores disponibles en este momento' });
    }

    const repartidor = disponibles[0];
    await axios.post(`${DELIVERY_URL}/repartidores/${repartidor.id}/asignar`);
    await delay(3000);

    // Paso 6: Enviar notificación
    await axios.post(`${NOTIFICATIONS_URL}/notificaciones/enviar`, {
      email: usuario.email,
      mensaje: `Tu pedido de ${item.nombre} en ${menuRes.data.restaurante} está en camino con ${repartidor.nombre}`
    });

    // Respuesta final
    res.json({
      mensaje: 'Pedido creado exitosamente',
      pedido: {
        usuario: {
          nombre: usuario.nombre,
          email: usuario.email,
          direccion: usuario.direccion
        },
        restaurante: menuRes.data.restaurante,
        item: {
          nombre: item.nombre,
          precio: item.precio
        },
        total: item.precio,
        estado: 'En camino',
        repartidor: {
          nombre: repartidor.nombre,
          id: repartidor.id
        }
      }
    });

  } catch (error) {
    if (error.response) {
      return res.status(error.response.status).json({
        error: `Error en la comunicación con microservicio`,
        detalle: error.response.data
      });
    }
    res.status(500).json({ error: 'Error interno del orquestador', detalle: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Orquestador corriendo en puerto ${PORT}`);
});
