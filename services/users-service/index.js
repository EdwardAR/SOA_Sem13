const express = require('express');
const app = express();
const PORT = 3001;

const usuarios = {
  1: { id: 1, nombre: 'Carlos Pérez', email: 'carlos@email.com', direccion: 'Av. Principal 123' },
  2: { id: 2, nombre: 'María López', email: 'maria@email.com', direccion: 'Calle Lima 456' }
};

app.get('/usuarios', (req, res) => {
  res.json(Object.values(usuarios));
});

app.get('/usuarios/:id', (req, res) => {
  const usuario = usuarios[req.params.id];
  if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(usuario);
});

app.get('/usuarios/:id/direccion', (req, res) => {
  const usuario = usuarios[req.params.id];
  if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json({ direccion: usuario.direccion });
});

app.listen(PORT, () => {
  console.log(`Servicio de Usuarios corriendo en puerto ${PORT}`);
});
