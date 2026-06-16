const express = require('express');
const app = express();
app.use(express.json());
const PORT = 3004;

app.post('/pagos/procesar', (req, res) => {
  const { monto, tarjeta } = req.body;

  if (!monto || monto <= 0) {
    return res.json({ status: 'rechazado', motivo: 'Monto inválido' });
  }

  if (!tarjeta || !tarjeta.numero || !tarjeta.cvv) {
    return res.json({ status: 'rechazado', motivo: 'Datos de tarjeta incompletos' });
  }

  res.json({ status: 'aprobado', mensaje: 'Pago procesado exitosamente' });
});

app.listen(PORT, () => {
  console.log(`Servicio de Pagos corriendo en puerto ${PORT}`);
});
