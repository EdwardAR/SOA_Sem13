const STEP_DELAY = 500;
const statusLabels = {
  online: 'Todos los servicios activos',
  offline: 'Error de conexión con servicios',
  checking: 'Verificando servicios...'
};

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('orderForm');
  const submitBtn = document.getElementById('submitBtn');
  const resetBtn = document.getElementById('resetBtn');
  const responseCard = document.getElementById('responseCard');
  const responseBody = document.getElementById('responseBody');
  const timeline = document.getElementById('timeline');
  const stepCounter = document.getElementById('stepCounter');
  const themeToggle = document.getElementById('themeToggle');

  // Theme toggle
  const savedTheme = localStorage.getItem('deliveryjs-theme') || 'dark';
  document.body.className = savedTheme === 'light' ? 'light-theme' : 'dark-theme';
  themeToggle.textContent = savedTheme === 'light' ? '&#9790;' : '&#9788;';
  themeToggle.addEventListener('click', () => {
    const isLight = document.body.classList.contains('light-theme');
    document.body.className = isLight ? 'dark-theme' : 'light-theme';
    localStorage.setItem('deliveryjs-theme', isLight ? 'dark' : 'light');
    themeToggle.innerHTML = isLight ? '&#9788;' : '&#9790;';
  });

  resetBtn.addEventListener('click', () => resetForm());
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    createOrder();
  });

  checkHealth();

  async function createOrder() {
    const usuarioId = document.getElementById('usuarioId').value;
    const restauranteId = document.getElementById('restauranteId').value;
    const itemId = document.getElementById('itemId').value;
    const cardNumber = document.getElementById('cardNumber').value.trim();
    const cardCvv = document.getElementById('cardCvv').value.trim();

    if (!cardNumber || !cardCvv) {
      showError('Completa todos los datos de la tarjeta');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.classList.add('loading');
    submitBtn.querySelector('span:last-child').textContent = 'Procesando...';
    responseCard.style.display = 'none';
    resetTimeline();

    const body = { usuarioId: Number(usuarioId), restauranteId: Number(restauranteId), itemId: Number(itemId), tarjeta: { numero: cardNumber, cvv: cardCvv } };

    const steps = timeline.querySelectorAll('.timeline-step');
    let currentStep = 0;

    function advanceStep() {
      if (currentStep > 0) {
        const prev = steps[currentStep - 1];
        prev.classList.remove('active');
        prev.classList.add('completed');
        const svc = prev.querySelector('.arch-service');
        if (svc) svc.classList.remove('active');
      }
      if (currentStep < steps.length) {
        const step = steps[currentStep];
        step.classList.add('active');
        const stepNum = step.dataset.step;
        step.querySelector('.step-status').className = 'step-status status-active';
        step.querySelector('.step-status').textContent = 'Procesando...';
        stepCounter.textContent = `${currentStep} / ${steps.length} pasos`;
        const serviceEl = document.querySelector(`.arch-service[data-service="${getServiceForStep(stepNum)}"]`);
        if (serviceEl) serviceEl.classList.add('active');
        currentStep++;
        if (currentStep < steps.length) {
          setTimeout(advanceStep, STEP_DELAY);
        }
      }
    }

    setTimeout(advanceStep, 200);

    try {
      const res = await fetch('/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();

      // Complete remaining steps
      while (currentStep < steps.length) {
        const step = steps[currentStep];
        step.classList.add('active');
        currentStep++;
        stepCounter.textContent = `${currentStep} / ${steps.length} pasos`;
      }

      // Mark all as completed
      steps.forEach(s => {
        s.classList.remove('active');
        s.classList.add('completed');
        s.querySelector('.step-status').className = 'step-status status-success';
        s.querySelector('.step-status').textContent = 'Completado';
      });
      stepCounter.textContent = `${steps.length} / ${steps.length} pasos`;

      if (res.ok) {
        showSuccess(data);
      } else {
        showError(data.error || 'Error desconocido', data.detalle);
        // Mark the failing step
        const failedIdx = findFailedStep(data);
        if (failedIdx >= 0 && failedIdx < steps.length) {
          steps[failedIdx].classList.remove('active', 'completed');
          steps[failedIdx].classList.add('error');
          steps[failedIdx].querySelector('.step-status').className = 'step-status status-error';
          steps[failedIdx].querySelector('.step-status').textContent = 'Error';
          // Mark subsequent steps as pending
          for (let i = failedIdx + 1; i < steps.length; i++) {
            steps[i].classList.remove('active', 'completed', 'error');
            steps[i].querySelector('.step-status').className = 'step-status status-pending';
            steps[i].querySelector('.step-status').textContent = 'Cancelado';
          }
          stepCounter.textContent = `${failedIdx} / ${steps.length} pasos`;
        }
      }
    } catch (err) {
      showError('Error de conexión — verifica que todos los servicios estén corriendo (puertos 3000-3005)');
    } finally {
      submitBtn.disabled = false;
      submitBtn.classList.remove('loading');
      submitBtn.querySelector('span:last-child').textContent = 'Crear Pedido';
    }
  }

  function getServiceForStep(step) {
    const map = { 1: 'users', 2: 'restaurants', 3: 'payments', 4: 'restaurants', 5: 'delivery', 6: 'notifications' };
    return map[step] || '';
  }

  function findFailedStep(data) {
    if (!data.error) return -1;
    const err = (data.error + ' ' + JSON.stringify(data.detalle || '')).toLowerCase();
    if (err.includes('usuario')) return 0;
    if (err.includes('menú') || err.includes('menu') || err.includes('item')) return 1;
    if (err.includes('pago') || err.includes('payment') || err.includes('rechazado')) return 2;
    if (err.includes('repartidor') || err.includes('delivery')) return 4;
    return 2;
  }

  function showSuccess(data) {
    responseCard.style.display = 'block';
    document.getElementById('responseBadge').textContent = 'Éxito';
    document.getElementById('responseBadge').style.cssText = 'background: var(--success-bg); color: var(--success); border-color: rgba(34,197,94,0.3);';
    const p = data.pedido || {};
    responseBody.innerHTML = `
      <div class="response-success">
        <h3>${data.mensaje || 'Pedido creado exitosamente'}</h3>
        <div class="response-detail">
          <div class="detail-item"><div class="detail-label">Cliente</div><div class="detail-value">${p.usuario || '-'}</div></div>
          <div class="detail-item"><div class="detail-label">Restaurante</div><div class="detail-value">${p.restaurante || '-'}</div></div>
          <div class="detail-item"><div class="detail-label">Artículo</div><div class="detail-value">${p.item || '-'}</div></div>
          <div class="detail-item"><div class="detail-label">Precio</div><div class="detail-value">$${(p.precio || 0).toFixed(2)}</div></div>
          <div class="detail-item"><div class="detail-label">Estado</div><div class="detail-value">${p.estado || '-'}</div></div>
          <div class="detail-item"><div class="detail-label">Repartidor</div><div class="detail-value">${p.repartidor || '-'}</div></div>
        </div>
        <pre>${JSON.stringify(data, null, 2)}</pre>
      </div>`;
    responseCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function showError(msg, detalle) {
    responseCard.style.display = 'block';
    document.getElementById('responseBadge').textContent = 'Error';
    document.getElementById('responseBadge').style.cssText = 'background: var(--error-bg); color: var(--error); border-color: rgba(239,68,68,0.3);';
    responseBody.innerHTML = `
      <div class="response-error">
        <h3>${msg}</h3>
        ${detalle ? `<pre>${JSON.stringify(detalle, null, 2)}</pre>` : ''}
      </div>`;
    responseCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function resetTimeline() {
    const steps = timeline.querySelectorAll('.timeline-step');
    steps.forEach(s => {
      s.className = 'timeline-step';
      s.querySelector('.step-status').className = 'step-status status-pending';
      s.querySelector('.step-status').textContent = 'Pendiente';
    });
    document.querySelectorAll('.arch-service').forEach(el => el.classList.remove('active'));
    stepCounter.textContent = `0 / ${steps.length} pasos`;
    responseCard.style.display = 'none';
  }

  function resetForm() {
    document.getElementById('usuarioId').value = '1';
    document.getElementById('restauranteId').value = '1';
    document.getElementById('itemId').value = '1';
    document.getElementById('cardNumber').value = '4111111111111111';
    document.getElementById('cardCvv').value = '123';
    resetTimeline();
  }

  async function checkHealth() {
    const dot = document.getElementById('statusDot');
    const label = document.getElementById('statusLabel');
    dot.className = 'status-dot';
    label.textContent = statusLabels.checking;
    try {
      const res = await fetch('/pedidos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      // Any response means the orchestrator is alive
      dot.className = 'status-dot online';
      label.textContent = statusLabels.online;
    } catch {
      dot.className = 'status-dot offline';
      label.textContent = statusLabels.offline;
    }
  }
});
