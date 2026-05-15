// ============================================================
// CortaJá — Configurações Globais
// ============================================================

const CONFIG = {
  // ⚠️ Troque pela URL completa da sua implantação Apps Script
  API_URL: 'https://script.google.com/macros/s/AKfycbxsZPsDSee9cfvEnQWOvrWuBi2QzpQBYdRnLDg3P_3SoJQaNIKiA_m9d5EhrF5D1dlx/exec',

  // ⚠️ Troque pelo seu usuário do GitHub
  BASE_URL: 'https://SEU_USUARIO.github.io/cortaja',

  // Chave Pix padrão (pode ser sobrescrita por estabelecimento)
  CHAVE_PIX_PADRAO: '61991944143',

  // Valor da taxa de agendamento
  TAXA_AGENDAMENTO: 0.99,

  // Tempo de reserva em minutos
  TEMPO_RESERVA: 10,

  // Antecedência mínima em horas
  ANTECEDENCIA_MINIMA: 2,
};

// ============================================================
// API Helper
// ============================================================

async function api(params) {
  try {
    const url = new URL(CONFIG.API_URL);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const res = await fetch(url.toString());
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('Erro na API:', err);
    return { erro: 'Falha na comunicação com o servidor' };
  }
}

// ============================================================
// Utilitários gerais
// ============================================================

function formatarData(dateStr) {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function formatarMoeda(valor) {
  return 'R$ ' + Number(valor).toFixed(2).replace('.', ',');
}

function dataHoje() {
  return new Date().toISOString().split('T')[0];
}

function mostrarToast(msg, tipo = 'sucesso') {
  const t = document.createElement('div');
  t.className = `toast toast-${tipo}`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3000);
}

function mostrarLoading(show = true) {
  const el = document.getElementById('loading-overlay');
  if (el) el.style.display = show ? 'flex' : 'none';
}
