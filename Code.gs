// ============================================================
// CortaJá — Apps Script Backend
// Cole TODO este código no Apps Script da sua planilha
// Depois: Implantar → Nova Implantação → Web App
// ============================================================

const SHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  const params = e.parameter || {};
  const action = params.action;
  let result;

  try {
    switch (action) {
      // ── ADMIN ──────────────────────────────────────────────
      case 'listarEstabelecimentos':   result = listarEstabelecimentos(); break;
      case 'salvarEstabelecimento':    result = salvarEstabelecimento(params); break;
      case 'atualizarEstabelecimento': result = atualizarEstabelecimento(params); break;
      case 'deletarEstabelecimento':   result = deletarEstabelecimento(params); break;

      // ── RESPONSÁVEL ────────────────────────────────────────
      case 'getEstabelecimento':       result = getEstabelecimento(params); break;
      case 'salvarCabeleireiro':       result = salvarCabeleireiro(params); break;
      case 'listarCabeleireiros':      result = listarCabeleireiros(params); break;
      case 'deletarCabeleireiro':      result = deletarCabeleireiro(params); break;
      case 'salvarServico':            result = salvarServico(params); break;
      case 'listarServicos':           result = listarServicos(params); break;
      case 'deletarServico':           result = deletarServico(params); break;
      case 'salvarProduto':            result = salvarProduto(params); break;
      case 'listarProdutos':           result = listarProdutos(params); break;
      case 'deletarProduto':           result = deletarProduto(params); break;
      case 'listarAgendamentosResponsavel': result = listarAgendamentosResponsavel(params); break;
      case 'confirmarPagamento':       result = confirmarPagamento(params); break;
      case 'cancelarAgendamento':      result = cancelarAgendamento(params); break;

      // ── CLIENTE ────────────────────────────────────────────
      case 'getInfoSalao':             result = getInfoSalao(params); break;
      case 'getHorariosDisponiveis':   result = getHorariosDisponiveis(params); break;
      case 'criarAgendamento':         result = criarAgendamento(params); break;
      case 'verificarPagamento':       result = verificarPagamento(params); break;

      // ── SISTEMA ────────────────────────────────────────────
      case 'limparReservasExpiradas':  result = limparReservasExpiradas(); break;

      default:
        result = { erro: 'Ação não encontrada: ' + action };
    }
  } catch (err) {
    result = { erro: err.message };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// UTILITÁRIOS
// ============================================================

function gerarId() {
  return Utilities.getUuid().replace(/-/g, '').substring(0, 12).toUpperCase();
}

function getSheet(nome) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(nome);
  if (!sheet) throw new Error('Aba não encontrada: ' + nome);
  return sheet;
}

function sheetParaObjetos(sheet) {
  const dados = sheet.getDataRange().getValues();
  if (dados.length < 2) return [];
  const headers = dados[0];
  return dados.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i]; });
    return obj;
  });
}

function gerarLinkDashboard(id) {
  // Troque pela URL do seu GitHub Pages
  return 'https://SEU_USUARIO.github.io/cortaja/dashboard.html?id=' + id;
}

function gerarLinkBooking(id) {
  return 'https://SEU_USUARIO.github.io/cortaja/booking.html?id=' + id;
}

// ============================================================
// ESTABELECIMENTOS
// ============================================================

function listarEstabelecimentos() {
  const sheet = getSheet('estabelecimentos');
  return sheetParaObjetos(sheet);
}

function salvarEstabelecimento(p) {
  const sheet = getSheet('estabelecimentos');
  const id = gerarId();
  const linkDash = gerarLinkDashboard(id);
  const linkBook = gerarLinkBooking(id);
  const agora = new Date().toISOString();

  sheet.appendRow([
    id,
    p.nome || '',
    p.responsavel || '',
    p.telefone || '',
    p.email || '',
    p.logo_url || '',
    p.horario_abertura || '08:00',
    p.horario_fechamento || '18:00',
    p.chave_pix || '',
    linkDash,
    linkBook,
    agora,
    'ativo'
  ]);

  return { sucesso: true, id, link_dashboard: linkDash, link_booking: linkBook };
}

function atualizarEstabelecimento(p) {
  const sheet = getSheet('estabelecimentos');
  const dados = sheet.getDataRange().getValues();
  const headers = dados[0];
  const idIdx = headers.indexOf('id');

  for (let i = 1; i < dados.length; i++) {
    if (dados[i][idIdx] === p.id) {
      const campos = ['nome','responsavel','telefone','email','logo_url',
                      'horario_abertura','horario_fechamento','chave_pix','status'];
      campos.forEach(campo => {
        const col = headers.indexOf(campo);
        if (col >= 0 && p[campo] !== undefined) {
          sheet.getRange(i + 1, col + 1).setValue(p[campo]);
        }
      });
      return { sucesso: true };
    }
  }
  return { erro: 'Estabelecimento não encontrado' };
}

function deletarEstabelecimento(p) {
  const sheet = getSheet('estabelecimentos');
  const dados = sheet.getDataRange().getValues();
  const idIdx = dados[0].indexOf('id');
  for (let i = 1; i < dados.length; i++) {
    if (dados[i][idIdx] === p.id) {
      sheet.deleteRow(i + 1);
      return { sucesso: true };
    }
  }
  return { erro: 'Não encontrado' };
}

function getEstabelecimento(p) {
  const sheet = getSheet('estabelecimentos');
  const lista = sheetParaObjetos(sheet);
  const est = lista.find(e => e.id === p.id);
  if (!est) return { erro: 'Estabelecimento não encontrado' };
  return est;
}

// ============================================================
// CABELEIREIROS
// ============================================================

function salvarCabeleireiro(p) {
  const sheet = getSheet('cabeleireiros');
  const id = gerarId();
  sheet.appendRow([id, p.id_estabelecimento, p.nome, p.foto_url || '', p.especialidades || '', 'ativo']);
  return { sucesso: true, id };
}

function listarCabeleireiros(p) {
  const lista = sheetParaObjetos(getSheet('cabeleireiros'));
  return lista.filter(c => c.id_estabelecimento === p.id_estabelecimento && c.status === 'ativo');
}

function deletarCabeleireiro(p) {
  const sheet = getSheet('cabeleireiros');
  const dados = sheet.getDataRange().getValues();
  const idIdx = dados[0].indexOf('id');
  for (let i = 1; i < dados.length; i++) {
    if (dados[i][idIdx] === p.id) { sheet.deleteRow(i + 1); return { sucesso: true }; }
  }
  return { erro: 'Não encontrado' };
}

// ============================================================
// SERVIÇOS
// ============================================================

function salvarServico(p) {
  const sheet = getSheet('servicos');
  const id = gerarId();
  sheet.appendRow([id, p.id_estabelecimento, p.nome_servico, p.preco || 0, p.duracao_minutos || 30, 'ativo']);
  return { sucesso: true, id };
}

function listarServicos(p) {
  const lista = sheetParaObjetos(getSheet('servicos'));
  return lista.filter(s => s.id_estabelecimento === p.id_estabelecimento && s.status === 'ativo');
}

function deletarServico(p) {
  const sheet = getSheet('servicos');
  const dados = sheet.getDataRange().getValues();
  const idIdx = dados[0].indexOf('id');
  for (let i = 1; i < dados.length; i++) {
    if (dados[i][idIdx] === p.id) { sheet.deleteRow(i + 1); return { sucesso: true }; }
  }
  return { erro: 'Não encontrado' };
}

// ============================================================
// PRODUTOS
// ============================================================

function salvarProduto(p) {
  const sheet = getSheet('produtos');
  const id = gerarId();
  sheet.appendRow([id, p.id_estabelecimento, p.nome, p.descricao || '', p.preco || 0, p.foto_url || '', 'ativo']);
  return { sucesso: true, id };
}

function listarProdutos(p) {
  const lista = sheetParaObjetos(getSheet('produtos'));
  return lista.filter(p2 => p2.id_estabelecimento === p.id_estabelecimento && p2.status === 'ativo');
}

function deletarProduto(p) {
  const sheet = getSheet('produtos');
  const dados = sheet.getDataRange().getValues();
  const idIdx = dados[0].indexOf('id');
  for (let i = 1; i < dados.length; i++) {
    if (dados[i][idIdx] === p.id) { sheet.deleteRow(i + 1); return { sucesso: true }; }
  }
  return { erro: 'Não encontrado' };
}

// ============================================================
// AGENDAMENTOS
// ============================================================

function getHorariosDisponiveis(p) {
  const est = getEstabelecimento({ id: p.id_estabelecimento });
  if (est.erro) return est;

  const abertura = est.horario_abertura || '08:00';
  const fechamento = est.horario_fechamento || '18:00';
  const data = p.data;

  // Gera slots de 30 em 30 minutos
  const slots = [];
  let [hA, mA] = abertura.split(':').map(Number);
  let [hF, mF] = fechamento.split(':').map(Number);
  const agora = new Date();
  const limite = new Date(agora.getTime() + 2 * 60 * 60 * 1000); // +2h

  while (hA * 60 + mA < hF * 60 + mF) {
    const horario = String(hA).padStart(2,'0') + ':' + String(mA).padStart(2,'0');

    // Verifica se já passou do limite de 2h
    const [dY, dM, dD] = data.split('-').map(Number);
    const slotDate = new Date(dY, dM - 1, dD, hA, mA);
    const passou = slotDate < limite;

    slots.push({ horario, bloqueado: passou });
    mA += 30;
    if (mA >= 60) { hA++; mA -= 60; }
  }

  // Busca agendamentos existentes para essa data/estabelecimento
  const agendamentos = sheetParaObjetos(getSheet('agendamentos'))
    .filter(a => a.id_estabelecimento === p.id_estabelecimento && a.data === data);

  // Limpa reservas expiradas antes de retornar
  limparReservasExpiradas();

  slots.forEach(slot => {
    const ag = agendamentos.find(a => {
      const hAg = typeof a.horario === 'string' ? a.horario : String(a.horario);
      return hAg === slot.horario;
    });
    if (ag) {
      if (ag.status === 'confirmado') slot.status = 'confirmado';
      else if (ag.status === 'selecionando') slot.status = 'selecionando';
      else slot.status = 'disponivel';
    } else {
      slot.status = slot.bloqueado ? 'bloqueado' : 'disponivel';
    }
  });

  return { slots, data, abertura, fechamento };
}

function criarAgendamento(p) {
  const sheet = getSheet('agendamentos');
  const id = gerarId();
  const agora = new Date().toISOString();
  const expira = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min

  // Verifica se já está ocupado
  const existentes = sheetParaObjetos(sheet).filter(a =>
    a.id_estabelecimento === p.id_estabelecimento &&
    a.data === p.data &&
    a.horario === p.horario &&
    (a.status === 'confirmado' || a.status === 'selecionando')
  );
  if (existentes.length > 0) return { erro: 'Horário já ocupado' };

  sheet.appendRow([
    id,
    p.id_estabelecimento,
    p.id_cabeleireiro || '',
    p.id_servico || '',
    p.nome_cliente || '',
    p.telefone_cliente || '',
    p.data,
    p.horario,
    'selecionando',
    '',          // id_pagamento
    0.99,        // valor_taxa
    agora,       // data_criacao
    expira       // expira_em
  ]);

  return {
    sucesso: true,
    id,
    chave_pix: '61991944143',
    valor: 0.99,
    expira_em: expira
  };
}

function confirmarPagamento(p) {
  const sheet = getSheet('agendamentos');
  const dados = sheet.getDataRange().getValues();
  const headers = dados[0];
  const idIdx = headers.indexOf('id');
  const statusIdx = headers.indexOf('status');

  for (let i = 1; i < dados.length; i++) {
    if (dados[i][idIdx] === p.id) {
      sheet.getRange(i + 1, statusIdx + 1).setValue('confirmado');
      return { sucesso: true };
    }
  }
  return { erro: 'Agendamento não encontrado' };
}

function cancelarAgendamento(p) {
  const sheet = getSheet('agendamentos');
  const dados = sheet.getDataRange().getValues();
  const headers = dados[0];
  const idIdx = headers.indexOf('id');
  const statusIdx = headers.indexOf('status');

  for (let i = 1; i < dados.length; i++) {
    if (dados[i][idIdx] === p.id) {
      sheet.getRange(i + 1, statusIdx + 1).setValue('cancelado');
      return { sucesso: true };
    }
  }
  return { erro: 'Não encontrado' };
}

function listarAgendamentosResponsavel(p) {
  const lista = sheetParaObjetos(getSheet('agendamentos'));
  return lista.filter(a => a.id_estabelecimento === p.id_estabelecimento);
}

function verificarPagamento(p) {
  const lista = sheetParaObjetos(getSheet('agendamentos'));
  const ag = lista.find(a => a.id === p.id);
  if (!ag) return { erro: 'Não encontrado' };
  return { status: ag.status, agendamento: ag };
}

// ============================================================
// SISTEMA — Limpeza automática de reservas expiradas
// ============================================================

function limparReservasExpiradas() {
  const sheet = getSheet('agendamentos');
  const dados = sheet.getDataRange().getValues();
  const headers = dados[0];
  const statusIdx = headers.indexOf('status');
  const expiraIdx = headers.indexOf('expira_em');
  const agora = new Date();
  let limpos = 0;

  for (let i = dados.length - 1; i >= 1; i--) {
    if (dados[i][statusIdx] === 'selecionando') {
      const expira = new Date(dados[i][expiraIdx]);
      if (agora > expira) {
        sheet.getRange(i + 1, statusIdx + 1).setValue('expirado');
        limpos++;
      }
    }
  }
  return { sucesso: true, limpos };
}

// ============================================================
// INFO SALÃO (para a tela do cliente)
// ============================================================

function getInfoSalao(p) {
  const est = getEstabelecimento({ id: p.id });
  if (est.erro) return est;
  const cabeleireiros = listarCabeleireiros({ id_estabelecimento: p.id });
  const servicos = listarServicos({ id_estabelecimento: p.id });
  const produtos = listarProdutos({ id_estabelecimento: p.id });
  return { estabelecimento: est, cabeleireiros, servicos, produtos };
}
