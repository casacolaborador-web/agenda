/* Polyfill mínimo para URLSearchParams (compatibilidade legada) */
(function () {
  if (typeof window !== 'undefined' && typeof window.URLSearchParams === 'undefined') {
    function SimpleURLSearchParams(init) {
      this._pairs = [];
      if (init && typeof init === 'object') { for (var k in init) if (Object.prototype.hasOwnProperty.call(init, k)) this.append(k, init[k]); }
      else if (typeof init === 'string') {
        init.replace(/^\?/, '').split('&').forEach(function (p) {
          if (!p) return; var i = p.indexOf('=');
          var key = i >= 0 ? p.slice(0, i) : p;
          var val = i >= 0 ? p.slice(i + 1) : '';
          this.append(decodeURIComponent(key), decodeURIComponent(val));
        }, this);
      }
    }
    SimpleURLSearchParams.prototype.append = function (k, v) { this._pairs.push([String(k), String(v)]); };
    SimpleURLSearchParams.prototype.toString = function () {
      return this._pairs.map(function (kv) { return encodeURIComponent(kv[0]) + '=' + encodeURIComponent(kv[1]); }).join('&');
    };
    window.URLSearchParams = SimpleURLSearchParams;
  }
})();

// ================== CONFIG ==================
const apiUrl = 'https://script.google.com/a/macros/hmv.org.br/s/AKfycbwEosf-kEKHJ10S2KbCb4AlIT8NJP3E19HMsDGH-xytwLiMsGWQmekFTMRTOW2jAKqN/exec';

// ================== Utils ==================
function formEncode(obj) { const out=[]; for(const k in obj){ if(!Object.prototype.hasOwnProperty.call(obj,k)) continue; out.push(encodeURIComponent(k)+'='+encodeURIComponent(String(obj[k])));} return out.join('&'); }
function withQuery(base, paramsObj) { const qs = formEncode(paramsObj); return qs ? `${base}?${qs}` : base; }
function padHora(h){ const m=/^(\d{1,2}):(\d{1,2})$/.exec((h||'').trim()); if(!m) return ''; let hh=Math.min(23,Math.max(0,parseInt(m[1],10))); let mm=Math.min(59,Math.max(0,parseInt(m[2],10))); return String(hh).padStart(2,'0')+':'+String(mm).padStart(2,'0'); }
function isElegivel(slot){ const status=String(slot.reserva||'').toUpperCase(); const livres=(slot.vagas_totais||0)-(slot.reservas||0); return status!=='INDISPONIVEL'&&status!=='BLOQUEADO'&&livres>0; }

async function getJSON(url, params){
  const qs = new URLSearchParams(params||{}); qs.append('_ts',Date.now());
  const ctrl = new AbortController(); const t=setTimeout(()=>ctrl.abort(),12000);
  try{
    const resp = await fetch(`${url}?${qs}`, { signal: ctrl.signal });
    if(!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return await resp.json();
  } finally { clearTimeout(t); }
}
async function postForm(url, dataObj){
  const body = new URLSearchParams();
  for(const k in dataObj){ body.append(k, dataObj[k]); }
  const resp = await fetch(url, { method:'POST', body });
  if(!resp.ok) throw new Error(`HTTP ${resp.status}`);
  return resp.json();
}

// ================== DOM refs ==================
const container = document.getElementById('agenda-container');
const seletorData = document.getElementById('seletor-data');
const diaSemanaSpan = document.getElementById('dia-semana');
const menuAtividades = document.getElementById('menu-atividades');

const modalAgendamento = document.getElementById('modal-agendamento');
const modalDetalhes   = document.getElementById('modal-detalhes');
const inputMatricula  = document.getElementById('input-matricula');
const inputEmail      = document.getElementById('input-email');
const btnCancelar     = document.getElementById('btn-cancelar-agendamento');
const btnConfirmar    = document.getElementById('btn-confirmar');
const modalMensagem   = document.getElementById('modal-mensagem');

const btnAdminLogin        = document.getElementById('btn-admin-login');
const btnGerenciarAgenda   = document.getElementById('btn-gerenciar-agenda');
const btnConsultarReservas = document.getElementById('btn-consultar-reservas');

const modalAdminLogin     = document.getElementById('modal-admin-login');
const inputAdminPassword  = document.getElementById('input-admin-password');
const adminLoginMensagem  = document.getElementById('admin-login-mensagem');

const modalAdminGerenciar = document.getElementById('modal-admin-gerenciar');
const btnAdminAdicionar   = document.getElementById('btn-admin-adicionar');
const btnAdminDashboard   = document.getElementById('btn-admin-dashboard');
const btnAdminLogout      = document.getElementById('btn-admin-logout');
const btnFecharAdminGerenciar = document.getElementById('btn-fechar-admin-gerenciar');

const modalAdminAdicionar   = document.getElementById('modal-admin-adicionar');
const formAdicionarHorario  = document.getElementById('form-adicionar-horario');

const modalConsulta          = document.getElementById('modal-consulta');
const inputConsultaMatricula = document.getElementById('input-consulta-matricula');
const consultaViewInicial    = document.getElementById('consulta-view-inicial');
const consultaViewResultados = document.getElementById('consulta-view-resultados');
const consultaMensagem       = document.getElementById('consulta-mensagem');
const btnFecharConsulta      = document.getElementById('btn-fechar-consulta');
const btnBuscarReservas      = document.getElementById('btn-buscar-reservas');
const btnVoltarConsulta      = document.getElementById('btn-voltar-consulta');
const listaAgendamentos      = document.getElementById('lista-agendamentos');

// Admin adicionar
const adminSelectProfissional = document.getElementById('admin-select-profissional');
const adminSelectAtividade    = document.getElementById('admin-select-atividade');
const quickMassageContainer   = document.getElementById('quick-massage-container');
const quickMassageHorariosGrid= document.getElementById('quick-massage-horarios');
const horarioUnicoContainer   = document.getElementById('horario-unico-container');
const vagasContainerUnico     = document.getElementById('vagas-container-unico');
const adminInputVagas         = document.getElementById('admin-input-vagas');
const adminInputHorario       = document.getElementById('admin-input-horario');
const btnConfirmarAdicionarFinal = document.getElementById('btn-confirmar-adicionar-final');
const btnCancelarAdicionarFinal  = document.getElementById('btn-cancelar-adicionar-final');
const adminAddMensagem        = document.getElementById('admin-add-mensagem');
const adminSelectData         = document.getElementById('admin-select-data');

// Dashboard
const modalAdminDashboard = document.getElementById('modal-admin-dashboard');
const dashSelectDate      = document.getElementById('dash-select-date');
const dashSelectMonth     = document.getElementById('dash-select-month');
const dashInfo            = document.getElementById('dash-info');
const dashActivityTable   = document.getElementById('dash-activity-table');
const dashProfTable       = document.getElementById('dash-prof-table');
const dashAPTable         = document.getElementById('dash-ap-table');
const btnDashClose        = document.getElementById('btn-dash-close');
const btnDashExport       = document.getElementById('btn-dash-export');
const dashViewDayBtn      = document.getElementById('dash-view-day');
const dashViewMonthBtn    = document.getElementById('dash-view-month');

// ================== Estado ==================
let todosOsAgendamentos = [];
let agendamentoAtual = {};
let isAdmin = false;
let isSubmittingAdmin = false;
let atividadeSelecionada = 'TODAS';
let dashView = 'day'; // 'day' | 'month'
const ADMIN_PASSWORD = 'C@saAdmin#123';

const professionalRules = {
  'Ana': { activities: ['Fit Class (Ballet Fit)', 'Funcional Dance', 'Power Gap'], type: 'aula', defaultVagas: 15 },
  'Carlos': { activities: ['Funcional', 'Mat Pilates', 'Ritmos / Zumba', 'Jump'], type: 'aula', defaultVagas: 15 },
  'Luis': { activities: ['Quick Massage'], type: 'quick_massage', defaultVagas: 1 },
  'Maria Eduarda': { activities: ['Quick Massage'], type: 'quick_massage', defaultVagas: 1 },
  'Rafael': { activities: ['Quick Massage', 'Reiki'], type: 'mixed', defaultVagas: 1 }
  'José': { activities: ['Yoga'], type: 'aula', defaultVagas: 12 }
};

const quickMassageHours = [
  '08:15','08:30','08:45','09:00','09:15','09:30','09:45','10:00','10:15','10:30','10:45','11:00','11:15','11:30','11:45','12:00','12:15','12:30',
  '12:45','13:00','13:15','13:30','13:45','14:00','14:15','14:30','14:45','15:00','15:15','15:30','15:45','16:00','16:15','16:30','16:45','17:00',
  '17:15','17:30','17:45','18:00','18:15','18:30','18:45'
];

// ================== Helpers UI ==================
function abrirModal(m){ m.classList.remove('hidden'); setTimeout(()=>m.style.opacity=1,10); }
function fecharModal(m){ m.style.opacity=0; setTimeout(()=>m.classList.add('hidden'),300); }
function atualizarDiaDaSemana(dataString){
  if(!dataString){ diaSemanaSpan.textContent=''; return; }
  const [Y,M,D]=dataString.split('-').map(Number);
  const data=new Date(Y,M-1,D);
  const opcoes={weekday:'long', timeZone:'UTC'};
  let dia=data.toLocaleDateString('pt-BR',opcoes);
  dia=dia.charAt(0).toUpperCase()+dia.slice(1);
  diaSemanaSpan.textContent=`(${dia})`;
}

/* === animação de acordeão robusta === */
function expandPanel(panel){
  if (!panel) return;
  panel.classList.add('open');
  panel.style.overflow = 'hidden';
  panel.style.maxHeight = panel.scrollHeight + 'px';
  const onEnd = (e)=>{
    if (e.target !== panel) return;
    panel.style.maxHeight = 'none';
    panel.removeEventListener('transitionend', onEnd);
  };
  panel.addEventListener('transitionend', onEnd);
}
function collapsePanel(panel){
  if (!panel) return;
  panel.style.maxHeight = panel.scrollHeight + 'px';
  panel.offsetHeight;
  panel.classList.remove('open');
  panel.style.maxHeight = '0px';
}
function initializeAccordions(){
  container.querySelectorAll('.atividade-content').forEach(sec=>{
    sec.classList.remove('open');
    sec.style.maxHeight = '0px';
    sec.style.overflow = 'hidden';
  });
  container.querySelectorAll('.prof-content').forEach(sec=>{
    sec.classList.remove('open');
    sec.style.maxHeight = '0px';
    sec.style.overflow = 'hidden';
  });
  container.querySelectorAll('.titulo-atividade').forEach(t=>t.classList.remove('ativo'));
  container.querySelectorAll('.titulo-profissional').forEach(t=>t.classList.remove('ativo'));
}

// ================== Admin adicionar helpers (definidos antes dos listeners que os usam) ==================
function updateActivitySelector(prof){
  const rule=professionalRules[prof];
  if (!adminSelectAtividade) return;
  adminSelectAtividade.innerHTML='<option value="" disabled selected>Selecione a Modalidade</option>';
  adminSelectAtividade.disabled=false;
  if(rule){ rule.activities.forEach(function(a){ const op=document.createElement('option'); op.value=a; op.textContent=a; adminSelectAtividade.appendChild(op); }); }
}
function renderQuickMassageGrid(){
  if (!quickMassageHorariosGrid) return;
  quickMassageHorariosGrid.innerHTML='';
  quickMassageHours.forEach(function(h){
    const id='qm-' + h.replace(':','-');
    quickMassageHorariosGrid.innerHTML +=
      '<div class="horario-item">' +
        '<label for="' + id + '" class="horario-label">' + h + '</label>' +
        '<input type="checkbox" id="' + id + '" data-horario="' + h + '" class="qm-checkbox">' +
      '</div>';
  });
}
function toggleAdminInputs(){
  if (!adminSelectProfissional || !adminSelectAtividade) return;
  const prof=adminSelectProfissional.value;
  const atividade=adminSelectAtividade.value;
  const rule=professionalRules[prof];

  if (quickMassageContainer) quickMassageContainer.classList.add('hidden');
  if (horarioUnicoContainer) horarioUnicoContainer.classList.add('hidden');
  if (vagasContainerUnico) vagasContainerUnico.classList.add('hidden');
  if (btnConfirmarAdicionarFinal) btnConfirmarAdicionarFinal.disabled=true;

  if(!prof||!atividade) return;

  const isQuick = atividade==='Quick Massage';
  const isReiki = atividade==='Reiki';
  const isAula = rule && rule.type==='aula';

  if (btnConfirmarAdicionarFinal) btnConfirmarAdicionarFinal.disabled=false;

  if(isQuick){
    if (quickMassageContainer) quickMassageContainer.classList.remove('hidden');
    renderQuickMassageGrid();
    if (adminInputHorario) adminInputHorario.required=false;
    if (adminInputVagas) adminInputVagas.required=false;
  } else if (isAula || isReiki){
    if (horarioUnicoContainer) horarioUnicoContainer.classList.remove('hidden');
    if (adminInputHorario) adminInputHorario.required=true;
    const defaultVagas = isReiki ? 1 : (rule ? rule.defaultVagas : 1);
    if (adminInputVagas) adminInputVagas.value = defaultVagas;
    if(!isReiki){ if (vagasContainerUnico) vagasContainerUnico.classList.remove('hidden'); if (adminInputVagas) adminInputVagas.required=true; }
  }
}

// ================== Agenda (carregar e filtrar) ==================
async function carregarAgenda(){
  const hoje=new Date();
  const yyyy=hoje.getFullYear();
  const mm=String(hoje.getMonth()+1).padStart(2,'0');
  const dd=String(hoje.getDate()).padStart(2,'0');
  const dataPadrao=`${yyyy}-${mm}-${dd}`;

  if (seletorData) seletorData.min = `${yyyy}-${mm}-${dd}`;
  if (adminSelectData) adminSelectData.min = seletorData.min;

  const dataSelecionada=(seletorData && seletorData.value) ? seletorData.value : dataPadrao;
  if (seletorData) seletorData.value=dataSelecionada;
  atualizarDiaDaSemana(dataSelecionada);
  await renderizarAgendaParaData(dataSelecionada);
}

async function renderizarAgendaParaData(dataISO){
  if (!container) return;
  container.innerHTML='<p class="loading">Carregando agenda...</p>';
  const dataApi=(dataISO||'').split('-').reverse().join('/');

  try{
    const result = await getJSON(apiUrl, { action:'getSchedule', date:dataApi });
    if(result.status==="success"){
      todosOsAgendamentos = (result.data || []).filter(isElegivel);
      construirMenuAtividades(todosOsAgendamentos);
      if (atividadeSelecionada !== 'TODAS' && !getTodasAtividades(todosOsAgendamentos).includes(atividadeSelecionada)) {
        atividadeSelecionada = 'TODAS';
      }
      container.innerHTML = criarHTMLAgendaFiltrada(todosOsAgendamentos, atividadeSelecionada);
      initializeAccordions();
    } else {
      container.innerHTML = '<p class="alerta-erro">Erro ao carregar: ' + (result.message || 'Resposta inválida.') + '</p>';
      if (menuAtividades) menuAtividades.innerHTML = '';
    }
  }catch(error){
    console.error('Erro de comunicação:', error);
    container.innerHTML = '<p class="alerta-erro">Falha ao carregar agenda: ' + error.message + '</p>';
    if (menuAtividades) menuAtividades.innerHTML = '';
  }
}

// Helpers do filtro por atividade
function getTodasAtividades(agendamentos){
  const set = new Set();
  agendamentos.forEach(s=> set.add(s.atividade));
  return Array.from(set).sort((a,b)=>a.localeCompare(b,'pt-BR'));
}
function construirMenuAtividades(agendamentos){
  if (!menuAtividades) return;
  const atividades = getTodasAtividades(agendamentos);
  const dispPorAtividade = atividades.reduce((acc,atv)=>(acc[atv]=0,acc),{});
  agendamentos.forEach(s=>{
    const livres = (s.vagas_totais - s.reservas);
    if (livres > 0) dispPorAtividade[s.atividade] = (dispPorAtividade[s.atividade]||0) + 1;
  });

  let html='';
  const btn=(nome,active,qtd)=>(
    '<button class="chip-atividade '+(active?'ativo':'')+'" data-atividade="'+nome+'">'+
    nome + (qtd!=null?(' <span class="badge">'+qtd+'</span>'):'') + '</button>'
  );
  const totalDisp = Object.values(dispPorAtividade).reduce((a,b)=>a+b,0);
  html += btn('TODAS', atividadeSelecionada==='TODAS', totalDisp);
  atividades.forEach(a=> html += btn(a, atividadeSelecionada===a, dispPorAtividade[a]));
  menuAtividades.innerHTML = html;
}

// =============== HTML agenda filtrada (ACORDEÃO ATIVIDADE → PROFISSIONAL) ===============
function criarHTMLAgendaFiltrada(agendamentos, atividadeFiltro){
  const map = {};
  agendamentos.forEach(s=>{
    if (atividadeFiltro !== 'TODAS' && s.atividade !== atividadeFiltro) return;
    if (!map[s.atividade]) map[s.atividade] = {};
    if (!map[s.atividade][s.profissional]) map[s.atividade][s.profissional] = [];
    map[s.atividade][s.profissional].push(s);
  });

  const atividades = Object.keys(map).sort((a,b)=>a.localeCompare(b,'pt-BR'));
  if (!atividades.length) return '<p class="alerta-info">Não há horários para esta atividade nesta data.</p>';

  let html='';
  atividades.forEach(atividade=>{
    html += '<div class="bloco-atividade">' +
              '<h3 class="titulo-atividade">' + atividade + '</h3>' +
              '<div class="atividade-content">';

    const profs = Object.keys(map[atividade]).sort((a,b)=>a.localeCompare(b,'pt-BR'));
    profs.forEach(prof=>{
      const slots = map[atividade][prof].slice().sort((a,b)=> a.horario.localeCompare(b.horario));

      // grade de horários
      let grade='';
      slots.forEach(s=>{
        const vagasLivres = s.vagas_totais - s.reservas;
        const isQM = s.atividade.indexOf('Quick Massage') !== -1 || s.atividade.indexOf('Reiki') !== -1;
        const vagasTxt = isQM ? 'Vaga' : (vagasLivres + '/' + s.vagas_totais + ' Vagas');
        const dataApi = (seletorData && seletorData.value) ? seletorData.value.split('-').reverse().join('/') : '';
        // X pequeno para excluir (visível apenas no modo admin)
        let btnExcluirHtml = '';
        if (isAdmin) {
          btnExcluirHtml = '<button aria-label="Excluir horário" title="Excluir horário" class="btn-admin-excluir status-admin-excluir" data-id-linha="' + s.id_linha + '">×</button>';
        }

        grade +=
          '<div class="slot-horario status-disponivel"' +
              ' data-id-linha="'+s.id_linha+'"' +
              ' data-data="'+dataApi+'"' +
              ' data-horario="'+s.horario+'"' +
              ' data-atividade="'+s.atividade+'"' +
              ' data-profissional="'+s.profissional+'"' +
              ' data-vagas-total="'+s.vagas_totais+'"' +
              ' data-vagas-livres="'+vagasLivres+'">' +
            '<span class="horario-label">'+s.horario+'</span>' +
            '<span class="vagas-label">'+vagasTxt+'</span>' +
            btnExcluirHtml +
          '</div>';
      });
      if (!grade.trim()) return;

      html += '<div class="prof-bloco">' +
                '<h4 class="titulo-profissional">' + prof + '</h4>' +
                '<div class="prof-content">' +
                  '<div class="slots-grid">'+ grade + (isAdmin
                    ? ('<div class="slot-horario status-admin-adicionar" '+
                       'data-data="'+((seletorData && seletorData.value)?seletorData.value.split('-').reverse().join('/') : '')+'" '+
                       'data-profissional="'+prof+'" data-atividade="'+atividade+'">'+
                       '<span class="adicionar-label">+ Adicionar Slot</span></div>')
                    : '') +
                  '</div>' +
                '</div>' +
              '</div>';
    });

    html +=   '</div>' + // fecha .atividade-content
            '</div>';
  });

  return html;
}

// ================== Usuário – reservar ==================
function abrirModalReserva(dadosSlot){
  agendamentoAtual = {
    idLinha: dadosSlot.idLinha,
    data: dadosSlot.data,
    horario: dadosSlot.horario,
    atividade: dadosSlot.atividade,
    profissional: dadosSlot.profissional
  };
  if (modalDetalhes) {
    modalDetalhes.innerHTML =
      '<li><strong>Data:</strong> ' + agendamentoAtual.data + '</li>' +
      '<li><strong>Horário:</strong> ' + agendamentoAtual.horario + '</li>' +
      '<li><strong>Atividade:</strong> ' + agendamentoAtual.atividade + '</li>' +
      '<li><strong>Profissional:</strong> ' + agendamentoAtual.profissional + '</li>';
  }
  if (inputMatricula) inputMatricula.value=''; if (modalMensagem) modalMensagem.textContent='';
  abrirModal(modalAgendamento);
}

async function confirmarAgendamento(){
  if (!inputMatricula) return;
  const matricula=inputMatricula.value.trim();
  const email=(inputEmail?.value||'').trim();
  if(!matricula){ if (modalMensagem){ modalMensagem.textContent='A matrícula é obrigatória.'; modalMensagem.style.color='red'; } return; }
  if (btnConfirmar) btnConfirmar.disabled=true;
  if (modalMensagem){ modalMensagem.textContent='Processando...'; modalMensagem.style.color='var(--cinza-texto)'; }

  try{
    const result = await postForm(apiUrl, { action:'bookSlot', id_linha: agendamentoAtual.idLinha, matricula, email });
    if (modalMensagem){ modalMensagem.textContent=result.message || 'Reserva efetuada.'; modalMensagem.style.color='var(--verde-moinhos)'; }
    await carregarAgenda(); setTimeout(()=> fecharModal(modalAgendamento), 1200);
  }catch(err){
    if (modalMensagem){ modalMensagem.textContent = err.message || 'Erro ao reservar.'; modalMensagem.style.color='red'; }
  }finally{ if (btnConfirmar) btnConfirmar.disabled=false; }
}

// ================== Admin – login/logout ==================
function toggleAdminView(on){
  isAdmin = on;
  if(on){
    if (btnAdminLogin) { btnAdminLogin.textContent='Logout Admin'; btnAdminLogin.classList.remove('btn-cinza'); btnAdminLogin.classList.add('btn-vermelho'); }
    if (btnGerenciarAgenda) btnGerenciarAgenda.classList.remove('hidden');
    if(!document.querySelector('.aviso-admin') && container){
      container.insertAdjacentHTML('beforebegin','<p class="aviso-admin">MODO ADMIN. Clique em "×" para remover slots.</p>');
    }
  }else{
    if (btnAdminLogin) { btnAdminLogin.textContent='Login Admin'; btnAdminLogin.classList.remove('btn-vermelho'); btnAdminLogin.classList.add('btn-cinza'); }
    if (btnGerenciarAgenda) btnGerenciarAgenda.classList.add('hidden');
    const aviso=document.querySelector('.aviso-admin'); if(aviso) aviso.remove();
  }
  if (container) container.innerHTML = criarHTMLAgendaFiltrada(todosOsAgendamentos, atividadeSelecionada);
  initializeAccordions();
}
function handleAdminLoginClick(){ if(isAdmin){toggleAdminView(false);return;} abrirModal(modalAdminLogin); if (inputAdminPassword) inputAdminPassword.value=''; if (adminLoginMensagem) adminLoginMensagem.textContent=''; }
function confirmarAdminLogin(){ if(inputAdminPassword && inputAdminPassword.value.trim()===ADMIN_PASSWORD){ toggleAdminView(true); fecharModal(modalAdminLogin); } else { if (adminLoginMensagem){ adminLoginMensagem.textContent='Senha incorreta.'; adminLoginMensagem.style.color='red'; } } }

// ================== Admin – excluir ==================
async function handleAdminDelete(idLinha){
  if(!idLinha) return;
  if(!confirm('Excluir permanentemente a linha ' + idLinha + '?')) return;
  try{
    // desabilita visualmente (melhora percepção)
    const btns = document.querySelectorAll('.status-admin-excluir[data-id-linha="'+idLinha+'"]');
    btns.forEach(b=>{ b.disabled = true; b.textContent = '...'; });

    const result = await postForm(apiUrl, { action:'deleteSchedule', id_linha:idLinha });
    alert(result.message||'Excluído.');
    await carregarAgenda();
  }catch(err){ alert('Erro ao excluir: ' + (err.message||err)); }
}

// ================== Admin – adicionar ==================
if (formAdicionarHorario) formAdicionarHorario.addEventListener('keydown', e=>{ if (e.key === 'Enter') e.preventDefault(); });

async function handleAdminAdicionar(e){
  if (e && e.preventDefault) e.preventDefault();
  if (isSubmittingAdmin) return;
  isSubmittingAdmin = true;

  const data = (adminSelectData && adminSelectData.value) ? adminSelectData.value.split('-').reverse().join('/') : '';
  const profissional = adminSelectProfissional ? adminSelectProfissional.value : '';
  const atividade = adminSelectAtividade ? adminSelectAtividade.value : '';
  let horariosParaEnviar = [];

  if (btnConfirmarAdicionarFinal) btnConfirmarAdicionarFinal.disabled=true;
  if (adminAddMensagem) { adminAddMensagem.textContent='Enviando dados...'; adminAddMensagem.style.color='var(--cinza-texto)'; }

  if(atividade==='Quick Massage' && quickMassageHorariosGrid){
    const cbs = quickMassageHorariosGrid.querySelectorAll('.qm-checkbox');
    cbs.forEach(cb=>{ if(cb.checked){ horariosParaEnviar.push({ Horario: cb.dataset.horario, Vagas: 1, Reserva: '' }); } });
  } else {
    const norm = adminInputHorario ? padHora(adminInputHorario.value) : '';
    if(!norm){
      if (adminAddMensagem){ adminAddMensagem.textContent='Horário inválido. Use o formato HH:MM (ex.: 08:30).'; adminAddMensagem.style.color='red'; }
      if (btnConfirmarAdicionarFinal) btnConfirmarAdicionarFinal.disabled=false;
      isSubmittingAdmin = false; return;
    }
    if (adminInputHorario) adminInputHorario.value = norm;
    let vagas = adminInputVagas ? parseInt(adminInputVagas.value.trim(),10) : 1;
    if(atividade==='Reiki') vagas = 1;
    if(isNaN(vagas) || vagas<1){
      if (adminAddMensagem){ adminAddMensagem.textContent='Preencha Vagas com um número válido (>=1).'; adminAddMensagem.style.color='red'; }
      if (btnConfirmarAdicionarFinal) btnConfirmarAdicionarFinal.disabled=false;
      isSubmittingAdmin = false; return;
    }
    horariosParaEnviar.push({ Horario: norm, Vagas: vagas, Reserva: '' });
  }

  if(horariosParaEnviar.length===0){
    if (adminAddMensagem){ adminAddMensagem.textContent='Selecione/preencha pelo menos um horário.'; adminAddMensagem.style.color='orange'; }
    if (btnConfirmarAdicionarFinal) btnConfirmarAdicionarFinal.disabled=false;
    isSubmittingAdmin = false; return;
  }

  try{
    const result = await postForm(apiUrl, { action:'addMultiple', data, profissional, atividade, horariosJson: JSON.stringify(horariosParaEnviar) });
    if (adminAddMensagem){ adminAddMensagem.textContent=result.message; adminAddMensagem.style.color='var(--verde-moinhos)'; }
    await renderizarAgendaParaData(seletorData ? seletorData.value : '');
    setTimeout(()=> fecharModal(modalAdminAdicionar), 1000);
  }catch(err){
    console.error('Erro ao adicionar agendamento:', err);
    if (adminAddMensagem){ adminAddMensagem.textContent = 'Erro: ' + err.message; adminAddMensagem.style.color='red'; }
  }finally{
    if (btnConfirmarAdicionarFinal) btnConfirmarAdicionarFinal.disabled=false;
    isSubmittingAdmin = false;
  }
}

// ================== Consulta – minhas reservas ==================
async function handleBuscarReservas(){
  if (!inputConsultaMatricula) return;
  const matricula=inputConsultaMatricula.value.trim();
  if(!matricula){ if (consultaMensagem){ consultaMensagem.textContent='Informe sua matrícula.'; consultaMensagem.style.color='red'; } return; }
  if (consultaMensagem){ consultaMensagem.textContent='Buscando...'; consultaMensagem.style.color='var(--cinza-texto)'; }
  if (listaAgendamentos) listaAgendamentos.innerHTML='';

  try{
    const url = withQuery(apiUrl, { action:'getMyBookings', matricula });
    const resp = await fetch(url);
    if(!resp.ok) throw new Error('HTTP ' + resp.status);
    const result = await resp.json();
    if (consultaMensagem) consultaMensagem.textContent='';
    if (consultaViewInicial) consultaViewInicial.classList.add('hidden');
    if (consultaViewResultados) consultaViewResultados.classList.remove('hidden');

    if(result.status==='success'){
      if (listaAgendamentos) listaAgendamentos.innerHTML = renderizarReservas(result.data, matricula);
    } else {
      if (listaAgendamentos) listaAgendamentos.innerHTML = '<p style="text-align:center;color:red;">' + (result.message || 'Erro ao buscar.') + '</p>';
    }
  }catch(err){
    if (consultaMensagem) { consultaMensagem.textContent='Erro ao buscar: ' + err.message; consultaMensagem.style.color='red'; }
  }
}
function renderizarReservas(reservas, matricula){
  reservas.sort(function(a,b){
    const da=a.data.split('/'); const db=b.data.split('/');
    const A=new Date(da[2],da[1]-1,da[0]); const B=new Date(db[2],db[1]-1,db[0]);
    if(A.getTime()!==B.getTime()) return A-B;
    return a.horario.localeCompare(b.horario);
  });
  if(!reservas||reservas.length===0) return '<p style="text-align:center;">Nenhuma reserva futura encontrada para ' + matricula + '.</p>';
  let html='<ul>';
  reservas.forEach(function(r){
    html += '<li class="item-reserva">' +
      '<span>' + r.data + ' | ' + r.horario + ' | <strong>' + r.atividade + '</strong> com ' + r.profissional + '</span>' +
      '<button class="btn-cancelar-reserva btn-modal btn-vermelho" data-booking-id="' + r.id + '" data-slot-id="' + r.slotId + '" data-matricula="' + matricula + '">Cancelar</button>' +
    '</li>';
  });
  html+='</ul>'; return html;
}
async function handleCancelBooking(event){
  const t=event.target;
  if(!t.classList.contains('btn-cancelar-reserva')) return;
  const bookingId = t.getAttribute('data-booking-id');
  const slotId    = t.getAttribute('data-slot-id');
  const matricula = t.getAttribute('data-matricula');
  if(!confirm('Cancelar ' + t.previousElementSibling.textContent + '?')) return;
  t.disabled=true; t.textContent='Cancelando...';
  try{
    const result = await postForm(apiUrl, { action:'cancelBooking', bookingId, slotId, matricula });
    alert(result.message||'Cancelado.'); handleBuscarReservas(); carregarAgenda();
  }catch(err){ alert('Erro ao cancelar: ' + err.message); }
  finally{ t.disabled=false; t.textContent='Cancelar'; }
}
function voltarConsulta(){ if (consultaViewInicial) consultaViewInicial.classList.remove('hidden'); if (consultaViewResultados) consultaViewResultados.classList.add('hidden'); if (consultaMensagem) consultaMensagem.textContent=''; }

// ================== Funções auxiliares para o DASHBOARD ==================
function formatNum(n){ return (n||0).toLocaleString('pt-BR'); }

function buildTable(headers, rows, footer){
  let html = '<table class="dash-table"><thead><tr>';
  headers.forEach(h=> html += '<th>' + h + '</th>');
  html += '</tr></thead><tbody>';
  if(!rows.length){
    html += '<tr><td colspan="' + headers.length + '" style="text-align:center;color:#6c757d;">Sem dados</td></tr>';
  } else {
    rows.forEach(r=>{
      html += '<tr>';
      r.forEach((cell,i)=>{ const cls=(i>=headers.length-3)?' class="number"':''; html += '<td'+cls+'>' + cell + '</td>'; });
      html += '</tr>';
    });
  }
  html += '</tbody>';
  if (footer && footer.length){
    html += '<tfoot><tr>';
    footer.forEach((cell,i)=>{ const cls=(i>=headers.length-3)?' class="number"':''; html += '<td'+cls+'>' + cell + '</td>'; });
    html += '</tr></tfoot>';
  }
  html += '</table>';
  return html;
}

function toISODate(d){
  const z = (n)=> String(n).padStart(2,'0');
  return `${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())}`;
}
function monthRange(yyyyMM){
  const [y, m] = yyyyMM.split('-').map(n => parseInt(n, 10));
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 0);
  return { start, end };
}

// Busca dados da API entre duas datas ISO (YYYY-MM-DD) inclusive
async function fetchAgendaBetween(startISO, endISO){
  const start = new Date(startISO);
  const end   = new Date(endISO);
  const items = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate()+1)) {
    const dataBR = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
    try{
      const result = await getJSON(apiUrl, { action:'getSchedule', date:dataBR });
      if (result.status === 'success' && Array.isArray(result.data)) {
        const elegiveis = result.data.filter(isElegivel);
        for (const s of elegiveis) items.push(s);
      }
    }catch(e){
      console.warn('Falha ao carregar', dataBR, e.message);
    }
  }
  return items;
}

function agregaResumo(slots){
  const byAtv = {}, byProf = {}, byAP = {};
  slots.forEach(s=>{
    const keyAtv = s.atividade, keyProf = s.profissional, keyAP = keyAtv + '|' + keyProf;
    if(!byAtv[keyAtv]) byAtv[keyAtv] = { tot:0, res:0 };
    if(!byProf[keyProf]) byProf[keyProf] = { tot:0, res:0 };
    if(!byAP[keyAP]) byAP[keyAP] = { atv: keyAtv, prof: keyProf, tot:0, res:0 };
    byAtv[keyAtv].tot += s.vagas_totais; byAtv[keyAtv].res += s.reservas;
    byProf[keyProf].tot += s.vagas_totais; byProf[keyProf].res += s.reservas;
    byAP[keyAP].tot += s.vagas_totais; byAP[keyAP].res += s.reservas;
  });

  const rowsAtv = Object.keys(byAtv).sort((a,b)=>a.localeCompare(b,'pt-BR'))
    .map(k=>{ const o=byAtv[k]; return [k, formatNum(o.tot), formatNum(o.res), formatNum(o.tot - o.res)]; });
  const rowsProf = Object.keys(byProf).sort((a,b)=>a.localeCompare(b,'pt-BR'))
    .map(k=>{ const o=byProf[k]; return [k, formatNum(o.tot), formatNum(o.res), formatNum(o.tot - o.res)]; });
  const rowsAP = Object.keys(byAP).sort((a,b)=>a.localeCompare(b,'pt-BR'))
    .map(k=>{ const o=byAP[k]; return [o.atv + ' × ' + o.prof, formatNum(o.tot), formatNum(o.res), formatNum(o.tot - o.res)]; });

  const sumTot = rowsAtv.reduce((a,r)=> a + parseInt((r[1]+'').replace(/\./g,''),10),0);
  const sumRes = rowsAtv.reduce((a,r)=> a + parseInt((r[2]+'').replace(/\./g,''),10),0);
  const sumDisp = rowsAtv.reduce((a,r)=> a + parseInt((r[3]+'').replace(/\./g,''),10),0);

  const profTot = rowsProf.reduce((a,r)=> a + parseInt((r[1]+'').replace(/\./g,''),10),0);
  const profRes = rowsProf.reduce((a,r)=> a + parseInt((r[2]+'').replace(/\./g,''),10),0);
  const profDisp= rowsProf.reduce((a,r)=> a + parseInt((r[3]+'').replace(/\./g,''),10),0);

  return { rowsAtv, rowsProf, rowsAP, sumTot, sumRes, sumDisp, profTot, profRes, profDisp };
}

async function atualizarDashboard(){
  if (dashView === 'day') {
    const dataISO = dashSelectDate ? dashSelectDate.value : null;
    if(!dataISO){ if (dashActivityTable) dashActivityTable.innerHTML=''; if (dashProfTable) dashProfTable.innerHTML=''; if (dashAPTable) dashAPTable.innerHTML=''; if (dashInfo) dashInfo.textContent='—'; return; }
    const dataBR = dataISO.split('-').reverse().join('/');
    const slotsDia = todosOsAgendamentos.filter(s=> s.data === dataBR).filter(isElegivel);

    const { rowsAtv, rowsProf, rowsAP, sumTot, sumRes, sumDisp, profTot, profRes, profDisp } = agregaResumo(slotsDia);

    if (dashActivityTable) dashActivityTable.innerHTML = buildTable(['Atividade','Total','Reservas','Disponíveis'], rowsAtv);
    if (dashProfTable) dashProfTable.innerHTML     = buildTable(['Profissional','Total','Reservas','Disponíveis'], rowsProf, ['TOTAL', formatNum(profTot), formatNum(profRes), formatNum(profDisp)]);
    if (dashAPTable) dashAPTable.innerHTML       = buildTable(['Atividade × Profissional','Total','Reservas','Disponíveis'], rowsAP);

    const label = new Intl.DateTimeFormat('pt-BR', { weekday:'long', day:'2-digit', month:'2-digit', year:'numeric' }).format(new Date(dataISO));
    if (dashInfo) dashInfo.textContent = `Dia: ${label} • Total: ${formatNum(sumTot)} • Reservas: ${formatNum(sumRes)} • Disponíveis: ${formatNum(sumDisp)}`;
  } else {
    const yM = dashSelectMonth ? dashSelectMonth.value : null;
    if(!yM){ if (dashActivityTable) dashActivityTable.innerHTML=''; if (dashProfTable) dashProfTable.innerHTML=''; if (dashAPTable) dashAPTable.innerHTML=''; if (dashInfo) dashInfo.textContent='—'; return; }
    const { start, end } = monthRange(yM);

    if (dashInfo) dashInfo.textContent = 'Mês: carregando...';
    const items = await fetchAgendaBetween(toISODate(start), toISODate(end));
    const { rowsAtv, rowsProf, rowsAP, sumTot, sumRes, sumDisp, profTot, profRes, profDisp } = agregaResumo(items);

    if (dashActivityTable) dashActivityTable.innerHTML = buildTable(['Atividade','Total','Reservas','Disponíveis'], rowsAtv);
    if (dashProfTable) dashProfTable.innerHTML     = buildTable(['Profissional','Total','Reservas','Disponíveis'], rowsProf, ['TOTAL', formatNum(profTot), formatNum(profRes), formatNum(profDisp)]);
    if (dashAPTable) dashAPTable.innerHTML       = buildTable(['Atividade × Profissional','Total','Reservas','Disponíveis'], rowsAP);

    const label = new Intl.DateTimeFormat('pt-BR', { month:'long', year:'numeric' }).format(start);
    if (dashInfo) dashInfo.textContent = `Mês: ${label} • Total: ${formatNum(sumTot)} • Reservas: ${formatNum(sumRes)} • Disponíveis: ${formatNum(sumDisp)}`;
  }
}

// Alterna UI e dispara atualização
function setDashView(next){
  dashView = next;
  if (dashView === 'day') {
    if (dashViewDayBtn) { dashViewDayBtn.classList.add('active'); dashViewDayBtn.setAttribute('aria-selected','true'); }
    if (dashViewMonthBtn) { dashViewMonthBtn.classList.remove('active'); dashViewMonthBtn.setAttribute('aria-selected','false'); }

    if (dashSelectDate) dashSelectDate.classList.remove('hidden');
    if (dashSelectDate && dashSelectDate.previousElementSibling) dashSelectDate.previousElementSibling.classList.remove('hidden'); // label Data
    if (dashSelectMonth) dashSelectMonth.classList.add('hidden');
    if (dashSelectMonth && dashSelectMonth.previousElementSibling) dashSelectMonth.previousElementSibling.classList.add('hidden');   // label Mês

    if (dashSelectDate && !dashSelectDate.value) dashSelectDate.value = toISODate(new Date());
  } else {
    if (dashViewMonthBtn) { dashViewMonthBtn.classList.add('active'); dashViewMonthBtn.setAttribute('aria-selected','true'); }
    if (dashViewDayBtn) { dashViewDayBtn.classList.remove('active'); dashViewDayBtn.setAttribute('aria-selected','false'); }

    if (dashSelectMonth) dashSelectMonth.classList.remove('hidden');
    if (dashSelectMonth && dashSelectMonth.previousElementSibling) dashSelectMonth.previousElementSibling.classList.remove('hidden'); // label Mês
    if (dashSelectDate) dashSelectDate.classList.add('hidden');
    if (dashSelectDate && dashSelectDate.previousElementSibling) dashSelectDate.previousElementSibling.classList.add('hidden');     // label Data

    if (dashSelectMonth && !dashSelectMonth.value) {
      const d = new Date();
      dashSelectMonth.value = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    }
  }
  atualizarDashboard();
}

// Abre modal já com valores padrão
function openDashboard(){
  if (dashSelectDate) dashSelectDate.value = (seletorData && seletorData.value) ? seletorData.value : toISODate(new Date());
  setDashView('day'); // inicia no diário
  abrirModal(modalAdminDashboard);
}

/* ================== EXPORTAÇÃO CSV (Excel) ================== */
// Converte uma tabela HTML (em string) para CSV (pt-BR usa ; como separador no Excel)
function tableHTMLToCSV(html, title){
  const tmp = document.createElement('div');
  tmp.innerHTML = html.trim();
  const table = tmp.querySelector('table');
  if(!table) return '';

  const sep = ';';
  const lines = [];

  // título opcional
  if (title) lines.push(`"${title}"`);

  // header
  const ths = Array.from(table.querySelectorAll('thead th')).map(th => `"${th.textContent.replace(/"/g,'""')}"`);
  if (ths.length) lines.push(ths.join(sep));

  // body
  Array.from(table.querySelectorAll('tbody tr')).forEach(tr=>{
    const tds = Array.from(tr.querySelectorAll('td')).map(td => {
      const txt = td.textContent.replace(/\u00A0/g,' ').trim();
      return `"${txt.replace(/"/g,'""')}"`;
    });
    lines.push(tds.join(sep));
  });

  // footer (se existir)
  const tfoot = table.querySelector('tfoot');
  if (tfoot){
    const fds = Array.from(tfoot.querySelectorAll('td')).map(td => `"${td.textContent.replace(/"/g,'""')}"`);
    lines.push(fds.join(sep));
  }

  return lines.join('\r\n') + '\r\n';
}

function downloadCSV(filename, csvString){
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function nomeBaseArquivo(){
  if (dashView === 'day'){
    const d = dashSelectDate ? dashSelectDate.value || toISODate(new Date()) : toISODate(new Date());
    return `dashboard-dia-${d}`;
  } else {
    const m = dashSelectMonth ? dashSelectMonth.value : '';
    return `dashboard-mes-${m}`;
  }
}

function exportarDashboard(){
  const base = nomeBaseArquivo();

  const csvAtv  = dashActivityTable ? tableHTMLToCSV(dashActivityTable.innerHTML, 'Resumo por Atividade') : '';
  const csvProf = dashProfTable ? tableHTMLToCSV(dashProfTable.innerHTML,     'Resumo por Profissional') : '';
  const csvAP   = dashAPTable ? tableHTMLToCSV(dashAPTable.innerHTML,       'Atividade × Profissional') : '';

  if (!csvAtv && !csvProf && !csvAP){
    alert('Não há dados para exportar.');
    return;
  }

  // Dispara três downloads — o Excel abre normalmente .csv
  if (csvAtv)  downloadCSV(`${base}-atividade.csv`, csvAtv);
  if (csvProf) downloadCSV(`${base}-profissional.csv`, csvProf);
  if (csvAP)   downloadCSV(`${base}-atividade-profissional.csv`, csvAP);
}

// ================== Listeners ==================
if (seletorData) seletorData.addEventListener('change', function(){ atividadeSelecionada='TODAS'; carregarAgenda(); });
if (btnCancelar) btnCancelar.addEventListener('click', function(){ fecharModal(modalAgendamento); });
if (btnConfirmar) btnConfirmar.addEventListener('click', confirmarAgendamento);

if (btnAdminLogin) btnAdminLogin.addEventListener('click', handleAdminLoginClick);
const btnCancelAdmin = document.getElementById('btn-cancelar-admin-login');
if (btnCancelAdmin) btnCancelAdmin.addEventListener('click', function(){ fecharModal(modalAdminLogin); });
const btnConfirmAdmin = document.getElementById('btn-confirmar-admin-login');
if (btnConfirmAdmin) btnConfirmAdmin.addEventListener('click', confirmarAdminLogin);
if (btnGerenciarAgenda) btnGerenciarAgenda.addEventListener('click', function(){ abrirModal(modalAdminGerenciar); });
if (btnFecharAdminGerenciar) btnFecharAdminGerenciar.addEventListener('click', function(){ fecharModal(modalAdminGerenciar); });
if (btnAdminLogout) btnAdminLogout.addEventListener('click', function(){ fecharModal(modalAdminGerenciar); toggleAdminView(false); });
if (btnAdminDashboard) btnAdminDashboard.addEventListener('click', function(){ fecharModal(modalAdminGerenciar); openDashboard(); });

if (adminSelectProfissional) adminSelectProfissional.addEventListener('change', function(e){ updateActivitySelector(e.target.value); toggleAdminInputs(); });
if (adminSelectAtividade) adminSelectAtividade.addEventListener('change', toggleAdminInputs);

if (btnAdminAdicionar) btnAdminAdicionar.addEventListener('click', function(){
  if (formAdicionarHorario) formAdicionarHorario.reset();
  if (adminSelectAtividade) adminSelectAtividade.disabled=true;
  toggleAdminInputs();
  if (adminAddMensagem) adminAddMensagem.textContent='';
  fecharModal(modalAdminGerenciar);
  abrirModal(modalAdminAdicionar);
});
if (btnCancelarAdicionarFinal) btnCancelarAdicionarFinal.addEventListener('click', function(){ fecharModal(modalAdminAdicionar); });
if (formAdicionarHorario) formAdicionarHorario.addEventListener('submit', handleAdminAdicionar);

if (btnConsultarReservas) btnConsultarReservas.addEventListener('click', function(){ voltarConsulta(); abrirModal(modalConsulta); });
if (btnFecharConsulta) btnFecharConsulta.addEventListener('click', function(){ fecharModal(modalConsulta); });
if (btnBuscarReservas) btnBuscarReservas.addEventListener('click', handleBuscarReservas);
if (btnVoltarConsulta) btnVoltarConsulta.addEventListener('click', voltarConsulta);
if (modalConsulta) modalConsulta.addEventListener('click', handleCancelBooking);

// Delegação de cliques: acordeões e slots
if (container) container.addEventListener('click', function(ev){
  const atvTitle = ev.target.closest('.titulo-atividade');
  if (atvTitle){
    atvTitle.classList.toggle('ativo');
    const panel = atvTitle.nextElementSibling; // .atividade-content
    if (!panel) return;
    if (panel.classList.contains('open')) collapsePanel(panel); else expandPanel(panel);
    return;
  }
  const profTitle = ev.target.closest('.titulo-profissional');
  if (profTitle){
    profTitle.classList.toggle('ativo');
    const panel = profTitle.nextElementSibling; // .prof-content
    if (!panel) return;
    if (panel.classList.contains('open')) collapsePanel(panel); else expandPanel(panel);
    return;
  }

  const el = ev.target.closest('.slot-horario');
  if(el && el.classList.contains('status-disponivel') && !isAdmin){
    abrirModalReserva(el.dataset);
    return;
  }

  // admin excluir (botão "×")
  if (isAdmin && ev.target.classList.contains('status-admin-excluir')){
    const id=ev.target.getAttribute('data-id-linha'); if(id) handleAdminDelete(id);
    return;
  }

  // admin atalho adicionar
  if (isAdmin && el && el.classList.contains('status-admin-adicionar')){
    const d=el.dataset;
    if (adminSelectData) adminSelectData.value = d.data.split('/').reverse().join('-');
    if (adminSelectProfissional) adminSelectProfissional.value = d.profissional;
    updateActivitySelector(d.profissional);
    if (adminSelectAtividade) adminSelectAtividade.value = d.atividade;
    toggleAdminInputs();
    fecharModal(modalAdminGerenciar);
    abrirModal(modalAdminAdicionar);
  }
});

// clique no menu de atividades
if (menuAtividades) menuAtividades.addEventListener('click', function(e){
  const btn = e.target.closest('.chip-atividade');
  if(!btn) return;
  atividadeSelecionada = btn.getAttribute('data-atividade') || 'TODAS';
  var chips = menuAtividades.querySelectorAll('.chip-atividade');
  for (var i=0;i<chips.length;i++){ chips[i].classList.remove('ativo'); }
  btn.classList.add('ativo');
  if (container) container.innerHTML = criarHTMLAgendaFiltrada(todosOsAgendamentos, atividadeSelecionada);
  initializeAccordions();
});

// Dashboard handlers
if (btnDashClose) btnDashClose.addEventListener('click', function(){ fecharModal(modalAdminDashboard); });
if (dashSelectDate) dashSelectDate.addEventListener('change', atualizarDashboard);
if (dashSelectMonth) dashSelectMonth.addEventListener('change', atualizarDashboard);
if (dashViewDayBtn) dashViewDayBtn.addEventListener('click', ()=> setDashView('day'));
if (dashViewMonthBtn) dashViewMonthBtn.addEventListener('click', ()=> setDashView('month'));
if (btnDashExport) btnDashExport.addEventListener('click', exportarDashboard);

// ================== Start ==================
carregarAgenda();

