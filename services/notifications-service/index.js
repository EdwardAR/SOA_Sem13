const express = require('express');
const app = express();
app.use(express.json());
const PORT = 3005;

app.post('/notificaciones/enviar', (req, res) => {
  const { email, mensaje } = req.body;

  if (!email || !mensaje) {
    return res.status(400).json({ enviado: false, mensaje: 'Faltan datos requeridos' });
  }

  console.log(`[NOTIFICACIÓN] Email enviado a ${email}: "${mensaje}"`);
  res.json({ enviado: true, mensaje: 'Notificación enviada correctamente' });
});

app.listen(PORT, () => {
  console.log(`Servicio de Notificaciones corriendo en puerto ${PORT}`);
});
