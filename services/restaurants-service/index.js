const express = require('express');
const app = express();
app.use(express.json());
const PORT = 3002;

const restaurantes = {
  1: {
    id: 1,
    nombre: 'Pizza House',
    menu: {
      1: { nombre: 'Pizza Americana', precio: 25.90 },
      2: { nombre: 'Pizza Hawaiana', precio: 27.50 }
    }
  },
  2: {
    id: 2,
    nombre: 'Burger Express',
    menu: {
      1: { nombre: 'Hamburguesa Clásica', precio: 18.90 },
      2: { nombre: 'Papas Fritas', precio: 8.50 }
    }
  }
};

let pedidosEnPreparacion = {};

app.get('/restaurantes/:id/menu', (req, res) => {
  const restaurante = restaurantes[req.params.id];
  if (!restaurante) return res.status(404).json({ error: 'Restaurante no encontrado' });
  res.json({ restaurante: restaurante.nombre, menu: restaurante.menu });
});

app.post('/restaurantes/:id/pedido', (req, res) => {
  const restaurante = restaurantes[req.params.id];
  if (!restaurante) return res.status(404).json({ error: 'Restaurante no encontrado' });

  const { itemId } = req.body;
  const item = restaurante.menu[itemId];
  if (!item) return res.status(400).json({ error: 'Item no encontrado en el menú' });

  const pedidoId = Date.now();
  pedidosEnPreparacion[pedidoId] = { restauranteId: req.params.id, item, estado: 'En preparación' };

  res.json({
    pedidoId,
    restaurante: restaurante.nombre,
    item: item.nombre,
    precio: item.precio,
    estado: 'En preparación'
  });
});

app.listen(PORT, () => {
  console.log(`Servicio de Restaurantes corriendo en puerto ${PORT}`);
});
