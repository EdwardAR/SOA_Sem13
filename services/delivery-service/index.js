const express = require('express');
const app = express();
app.use(express.json());
const PORT = 3003;

const repartidores = {
  1: { id: 1, nombre: 'Luis Ramírez', estado: 'Libre' },
  2: { id: 2, nombre: 'Ana Torres', estado: 'Libre' },
  3: { id: 3, nombre: 'Pedro Gómez', estado: 'Libre' },
  4: { id: 4, nombre: 'Carmen Castillo', estado: 'Libre' },
  5: { id: 5, nombre: 'José Martínez', estado: 'Libre' },
  6: { id: 6, nombre: 'Lucía Fernández', estado: 'Libre' },
  7: { id: 7, nombre: 'Diego Rojas', estado: 'Libre' },
  8: { id: 8, nombre: 'Valentina Muñoz', estado: 'Libre' },
  9: { id: 9, nombre: 'Sofía Herrera', estado: 'Ocupado' },
  10: { id: 10, nombre: 'Mateo Vargas', estado: 'Ocupado' }
};

app.get('/repartidores/disponibles', (req, res) => {
  const disponibles = Object.values(repartidores).filter(r => r.estado === 'Libre');
  res.json(disponibles);
});

app.post('/repartidores/:id/asignar', (req, res) => {
  const repartidor = repartidores[req.params.id];
  if (!repartidor) return res.status(404).json({ error: 'Repartidor no encontrado' });
  if (repartidor.estado === 'Ocupado') return res.status(409).json({ error: 'Repartidor ya está ocupado' });

  repartidor.estado = 'Ocupado';
  res.json({
    repartidorId: repartidor.id,
    nombre: repartidor.nombre,
    estado: repartidor.estado,
    mensaje: `Repartidor ${repartidor.nombre} asignado correctamente`
  });
});

app.listen(PORT, () => {
  console.log(`Servicio de Repartidores corriendo en puerto ${PORT}`);
});
