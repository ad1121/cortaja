// ============================================================
// CortaJá — Configurações Globais (Supabase)
// ============================================================

const CONFIG = {
  SUPABASE_URL: 'https://ctzuxqhimsrnfppmvgcf.supabase.co',
  SUPABASE_KEY: 'sb_publishable_ddmoCodBxO5RgqGv6oU6wg_Wv30KCVS',

  BASE_URL: 'https://ad1121.github.io/cortaja',

  CHAVE_PIX_PADRAO: '61991944143',
  TAXA_AGENDAMENTO: 0.99,
  TEMPO_RESERVA:    10,
  ANTECEDENCIA_MINIMA: 2,
};

// ============================================================
// Supabase REST helper
// ============================================================

const SB = (() => {
  const BASE    = CONFIG.SUPABASE_URL + '/rest/v1';
  const HEADERS = {
    'apikey':        CONFIG.SUPABASE_KEY,
    'Authorization': 'Bearer ' + CONFIG.SUPABASE_KEY,
    'Content-Type':  'application/json',
    'Prefer':        'return=representation',
  };

  async function req(method, path, body, extraHeaders = {}) {
    try {
      const res = await fetch(BASE + path, {
        method,
        headers: { ...HEADERS, ...extraHeaders },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (res.status === 204) return { sucesso: true };
      const data = await res.json();
      if (!res.ok) return { erro: data.message || data.hint || 'Erro ' + res.status };
      return data;
    } catch (err) {
      console.error('Supabase error:', err);
      return { erro: 'Falha na comunicação com o servidor' };
    }
  }

  return {
    // SELECT — retorna array
    select: (table, query = '')          => req('GET',    `/${table}?${query}`),
    // INSERT — retorna array com o item criado
    insert: (table, body)                => req('POST',   `/${table}`, body),
    // UPDATE — retorna array com itens atualizados
    update: (table, query, body)         => req('PATCH',  `/${table}?${query}`, body),
    // DELETE
    delete: (table, query)               => req('DELETE', `/${table}?${query}`),
    // SELECT com Prefer: count para HEAD requests
    count:  (table, query = '')          => req('GET',    `/${table}?${query}`, null, { 'Prefer': 'count=exact' }),
  };
})();

// ============================================================
// ID generator (UUID curto)
// ============================================================
function gerarId() {
  return 'xxxxxxxxxxxxxxxx'.replace(/x/g, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).toUpperCase().substring(0, 12);
}

// ============================================================
// API — mesma interface de antes, agora usando Supabase
// Mantemos a função api() para não precisar alterar as telas
// ============================================================

async function api(params) {
  const p = params;
  try {
    switch (p.action) {

      // ── ESTABELECIMENTOS ──────────────────────────────────

      case 'listarEstabelecimentos': {
        const res = await SB.select('estabelecimentos', 'order=nome.asc');
        return Array.isArray(res) ? res : [];
      }

      case 'getEstabelecimento': {
        const res = await SB.select('estabelecimentos', `id=eq.${p.id}`);
        if (!Array.isArray(res) || !res.length) return { erro: 'Estabelecimento não encontrado' };
        const est = res[0];
        if (!est.dias_semana) est.dias_semana = '1,2,3,4,5';
        return est;
      }

      case 'salvarEstabelecimento': {
        const id = gerarId();
        const linkDash = CONFIG.BASE_URL + '/dashboard.html?id=' + id;
        const linkBook = CONFIG.BASE_URL + '/booking.html?id=' + id;
        const res = await SB.insert('estabelecimentos', {
          id, nome: p.nome||'', responsavel: p.responsavel||'',
          telefone: p.telefone||'', email: p.email||'',
          logo_url: p.logo_url||'', endereco: p.endereco||'',
          horario_abertura:   p.horario_abertura   || '08:00',
          horario_fechamento: p.horario_fechamento || '18:00',
          chave_pix: p.chave_pix || CONFIG.CHAVE_PIX_PADRAO,
          link_dashboard: linkDash, link_booking: linkBook,
          status: 'ativo',
          dias_semana:      p.dias_semana      || '1,2,3,4,5',
          horarios_por_dia: p.horarios_por_dia || '',
        });
        if (res.erro) return res;
        return { sucesso: true, id, link_dashboard: linkDash, link_booking: linkBook };
      }

      case 'atualizarEstabelecimento': {
        const campos = {};
        ['nome','responsavel','telefone','email','logo_url','endereco',
         'horario_abertura','horario_fechamento','chave_pix','status',
         'dias_semana','horarios_por_dia'].forEach(c => {
          if (p[c] !== undefined) campos[c] = p[c];
        });
        const res = await SB.update('estabelecimentos', `id=eq.${p.id}`, campos);
        if (res.erro) return res;
        return { sucesso: true };
      }

      case 'deletarEstabelecimento': {
        const res = await SB.delete('estabelecimentos', `id=eq.${p.id}`);
        if (res.erro) return res;
        return { sucesso: true };
      }

      // ── CABELEIREIROS ─────────────────────────────────────

      case 'listarCabeleireiros': {
        const res = await SB.select('cabeleireiros',
          `id_estabelecimento=eq.${p.id_estabelecimento}&status=eq.ativo&order=nome.asc`);
        return Array.isArray(res) ? res : [];
      }

      case 'salvarCabeleireiro': {
        const id = gerarId();
        const res = await SB.insert('cabeleireiros', {
          id, id_estabelecimento: p.id_estabelecimento,
          nome: p.nome||'', foto_url: p.foto_url||'',
          especialidades: p.especialidades||'',
          email: p.email||'', telefone: p.telefone||'',
          horario_entrada: p.horario_entrada||'',
          horario_saida:   p.horario_saida||'',
          chave_pix: p.chave_pix||'', status: 'ativo',
        });
        if (res.erro) return res;
        return { sucesso: true, id };
      }

      case 'deletarCabeleireiro': {
        const res = await SB.update('cabeleireiros', `id=eq.${p.id}`, { status: 'inativo' });
        if (res.erro) return res;
        return { sucesso: true };
      }

      // ── SERVIÇOS ──────────────────────────────────────────

      case 'listarServicos': {
        const res = await SB.select('servicos',
          `id_estabelecimento=eq.${p.id_estabelecimento}&status=eq.ativo&order=nome_servico.asc`);
        return Array.isArray(res) ? res : [];
      }

      case 'salvarServico': {
        const id = gerarId();
        const res = await SB.insert('servicos', {
          id, id_estabelecimento: p.id_estabelecimento,
          nome_servico: p.nome_servico||'',
          preco: parseFloat(p.preco)||0,
          duracao_minutos: parseInt(p.duracao_minutos)||30,
          status: 'ativo',
        });
        if (res.erro) return res;
        return { sucesso: true, id };
      }

      case 'deletarServico': {
        const res = await SB.update('servicos', `id=eq.${p.id}`, { status: 'inativo' });
        if (res.erro) return res;
        return { sucesso: true };
      }

      // ── PRODUTOS ──────────────────────────────────────────

      case 'listarProdutos': {
        const res = await SB.select('produtos',
          `id_estabelecimento=eq.${p.id_estabelecimento}&status=eq.ativo&order=nome.asc`);
        return Array.isArray(res) ? res : [];
      }

      case 'salvarProduto': {
        const id = gerarId();
        const res = await SB.insert('produtos', {
          id, id_estabelecimento: p.id_estabelecimento,
          nome: p.nome||'', descricao: p.descricao||'',
          preco: parseFloat(p.preco)||0,
          foto_url: p.foto_url||'', status: 'ativo',
        });
        if (res.erro) return res;
        return { sucesso: true, id };
      }

      case 'deletarProduto': {
        const res = await SB.update('produtos', `id=eq.${p.id}`, { status: 'inativo' });
        if (res.erro) return res;
        return { sucesso: true };
      }

      // ── INFO SALÃO (booking) ──────────────────────────────

      case 'getInfoSalao': {
        const [estArr, cabs, servs, prods] = await Promise.all([
          SB.select('estabelecimentos', `id=eq.${p.id}`),
          SB.select('cabeleireiros',    `id_estabelecimento=eq.${p.id}&status=eq.ativo&order=nome.asc`),
          SB.select('servicos',         `id_estabelecimento=eq.${p.id}&status=eq.ativo&order=nome_servico.asc`),
          SB.select('produtos',         `id_estabelecimento=eq.${p.id}&status=eq.ativo&order=nome.asc`),
        ]);
        if (!Array.isArray(estArr) || !estArr.length) return { erro: 'Salão não encontrado' };
        const est = estArr[0];
        if (!est.dias_semana) est.dias_semana = '1,2,3,4,5';
        return {
          estabelecimento: est,
          cabeleireiros:   Array.isArray(cabs)  ? cabs  : [],
          servicos:        Array.isArray(servs) ? servs : [],
          produtos:        Array.isArray(prods) ? prods : [],
        };
      }

      // ── AGENDAMENTOS ──────────────────────────────────────

      case 'listarAgendamentosResponsavel': {
        const res = await SB.select('agendamentos',
          `id_estabelecimento=eq.${p.id_estabelecimento}&order=data.asc,horario.asc`);
        return Array.isArray(res) ? res : [];
      }

      case 'listarAgendamentosCliente': {
        let query = `email_cliente=eq.${encodeURIComponent(p.email_cliente)}&order=data.desc,horario.desc`;
        if (p.id_estabelecimento) query += `&id_estabelecimento=eq.${p.id_estabelecimento}`;
        const [ags, servs, cabs] = await Promise.all([
          SB.select('agendamentos', query),
          p.id_estabelecimento
            ? SB.select('servicos',     `id_estabelecimento=eq.${p.id_estabelecimento}&status=eq.ativo`)
            : Promise.resolve([]),
          p.id_estabelecimento
            ? SB.select('cabeleireiros',`id_estabelecimento=eq.${p.id_estabelecimento}&status=eq.ativo`)
            : Promise.resolve([]),
        ]);
        if (!Array.isArray(ags)) return [];
        return ags.map(a => ({
          ...a,
          nome_servico: (Array.isArray(servs) ? servs : []).find(s => s.id === a.id_servico)?.nome_servico || '',
          nome_prof:    (Array.isArray(cabs)  ? cabs  : []).find(c => c.id === a.id_cabeleireiro)?.nome || '',
        }));
      }

      case 'getHorariosDisponiveis': {
        // Busca configuração do estabelecimento
        const estArr = await SB.select('estabelecimentos', `id=eq.${p.id_estabelecimento}`);
        if (!Array.isArray(estArr) || !estArr.length) return { erro: 'Salão não encontrado' };
        const est = estArr[0];

        // Horário: usa override do dia específico ou padrão do salão
        const abertura   = p.horario_abertura  && p.horario_abertura  !== 'undefined'
          ? p.horario_abertura  : (est.horario_abertura  || '08:00');
        const fechamento = p.horario_fechamento && p.horario_fechamento !== 'undefined'
          ? p.horario_fechamento : (est.horario_fechamento || '18:00');

        const duracao  = parseInt(p.duracao_minutos) || 30;
        const aberMin  = horarioParaMinutos(abertura);
        const fechMin  = horarioParaMinutos(fechamento);
        const agora    = new Date();
        const limite   = new Date(agora.getTime() + CONFIG.ANTECEDENCIA_MINIMA * 60 * 60 * 1000);

        // Gera slots de 15 em 15 min
        const slots = [];
        for (let m = aberMin; m + duracao <= fechMin; m += 15) {
          const hh = String(Math.floor(m / 60)).padStart(2, '0');
          const mm = String(m % 60).padStart(2, '0');
          const horario  = hh + ':' + mm;
          const [dY, dM, dD] = p.data.split('-').map(Number);
          const slotDate = new Date(dY, dM - 1, dD, Math.floor(m / 60), m % 60);
          slots.push({ horario, bloqueado: slotDate < limite });
        }

        // Busca agendamentos ativos do profissional nesse dia
        let queryAg = `id_estabelecimento=eq.${p.id_estabelecimento}&data=eq.${p.data}&status=in.(confirmado,selecionando)`;
        if (p.id_cabeleireiro) queryAg += `&id_cabeleireiro=eq.${p.id_cabeleireiro}`;
        const [ags, servs] = await Promise.all([
          SB.select('agendamentos', queryAg),
          SB.select('servicos', `id_estabelecimento=eq.${p.id_estabelecimento}&status=eq.ativo`),
        ]);

        // Limpa reservas expiradas em background (sem await para não atrasar)
        SB.update('agendamentos',
          `status=eq.selecionando&expira_em=lt.${new Date().toISOString()}`,
          { status: 'expirado' }
        );

        const intervalosOcupados = Array.isArray(ags) ? ags.map(a => {
          const ini  = horarioParaMinutos(a.horario);
          const serv = Array.isArray(servs) ? servs.find(s => s.id === a.id_servico) : null;
          const dur  = serv ? (parseInt(serv.duracao_minutos) || 30) : 30;
          return { inicio: ini, fim: ini + dur, status: a.status };
        }) : [];

        slots.forEach(slot => {
          if (slot.bloqueado) { slot.status = 'bloqueado'; return; }
          const slotMin = horarioParaMinutos(slot.horario);
          const conflito = intervalosOcupados.find(o =>
            slotMin < o.fim && slotMin + duracao > o.inicio
          );
          slot.status = conflito
            ? (conflito.status === 'confirmado' ? 'confirmado' : 'selecionando')
            : 'disponivel';
        });

        return { slots, data: p.data, abertura, fechamento };
      }

      case 'criarAgendamento': {
        // Verifica conflito
        let queryConf = `id_estabelecimento=eq.${p.id_estabelecimento}&data=eq.${p.data}&status=in.(confirmado,selecionando)`;
        if (p.id_cabeleireiro) queryConf += `&id_cabeleireiro=eq.${p.id_cabeleireiro}`;
        const [existentes, servs] = await Promise.all([
          SB.select('agendamentos', queryConf),
          SB.select('servicos', `id_estabelecimento=eq.${p.id_estabelecimento}&status=eq.ativo`),
        ]);
        const serv    = Array.isArray(servs) ? servs.find(s => s.id === p.id_servico) : null;
        const duracao = serv ? (parseInt(serv.duracao_minutos) || 30) : 30;
        const novoIni = horarioParaMinutos(p.horario);
        const novoFim = novoIni + duracao;

        if (Array.isArray(existentes)) {
          for (const ag of existentes) {
            const agServ = Array.isArray(servs) ? servs.find(s => s.id === ag.id_servico) : null;
            const agDur  = agServ ? (parseInt(agServ.duracao_minutos) || 30) : 30;
            const agIni  = horarioParaMinutos(ag.horario);
            if (novoIni < agIni + agDur && novoFim > agIni) return { erro: 'Horário já ocupado' };
          }
        }

        const id     = gerarId();
        const expira = new Date(Date.now() + CONFIG.TEMPO_RESERVA * 60 * 1000).toISOString();
        const res = await SB.insert('agendamentos', {
          id,
          id_estabelecimento: p.id_estabelecimento,
          id_cabeleireiro:    p.id_cabeleireiro    || '',
          id_servico:         p.id_servico         || '',
          nome_cliente:       p.nome_cliente        || '',
          telefone_cliente:   p.telefone_cliente    || '',
          email_cliente:      p.email_cliente       || '',
          data:    p.data,
          horario: p.horario,
          status:  'selecionando',
          valor_taxa: CONFIG.TAXA_AGENDAMENTO,
          expira_em:  expira,
        });
        if (res.erro) return res;
        // Chave pix: do profissional ou padrão do salão ou CONFIG
        const estArr = await SB.select('estabelecimentos', `id=eq.${p.id_estabelecimento}`);
        const chavePix = (Array.isArray(estArr) && estArr[0]?.chave_pix)
          ? estArr[0].chave_pix : CONFIG.CHAVE_PIX_PADRAO;
        return { sucesso: true, id, chave_pix: chavePix, valor: CONFIG.TAXA_AGENDAMENTO, expira_em: expira };
      }

      case 'confirmarPagamento': {
        const res = await SB.update('agendamentos', `id=eq.${p.id}`, { status: 'confirmado' });
        if (res.erro) return res;
        return { sucesso: true };
      }

      case 'cancelarAgendamento': {
        const res = await SB.update('agendamentos', `id=eq.${p.id}`, { status: 'cancelado' });
        if (res.erro) return res;
        return { sucesso: true };
      }

      case 'verificarPagamento': {
        const res = await SB.select('agendamentos', `id=eq.${p.id}`);
        if (!Array.isArray(res) || !res.length) return { erro: 'Não encontrado' };
        return { status: res[0].status, agendamento: res[0] };
      }

      default:
        return { erro: 'Ação não encontrada: ' + p.action };
    }
  } catch (err) {
    console.error('API error:', err);
    return { erro: err.message || 'Erro interno' };
  }
}

// ============================================================
// Utilitários
// ============================================================

function horarioParaMinutos(h) {
  if (!h) return 0;
  const partes = String(h).substring(0, 5).split(':').map(Number);
  return (partes[0] || 0) * 60 + (partes[1] || 0);
}

function formatarData(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = String(dateStr).substring(0, 10).split('-');
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
