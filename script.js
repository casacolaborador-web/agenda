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

// helpers fetch com cache-buster e melhor erro
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

// ================== Agenda (carregar e filtrar) ==================
async function carregarAgenda(){
  const hoje=new Date();
  const yyyy=hoje.getFullYear();
  const mm=String(hoje.getMonth()+1).padStart(2,'0');
  const dd=String(hoje.getDate()).padStart(2,'0');
  const dataPadrao=`${yyyy}-${mm}-${dd}`;

  seletorData.min = `${yyyy}-${mm}-${dd}`;
  adminSelectData.min = seletorData.min;

  const dataSelecionada=seletorData.value||dataPadrao;
  seletorData.value=dataSelecionada;
  atualizarDiaDaSemana(dataSelecionada);
  await renderizarAgendaParaData(dataSelecionada);
}

async function renderizarAgendaParaData(dataISO){
  container.innerHTML='<p class="loading">Carregando agenda...</p>';
  const dataApi=dataISO.split('-').reverse().join('/');

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
      menuAtividades.innerHTML = '';
    }
  }catch(error){
    console.error('Erro de comunicação:', error);
    container.innerHTML = '<p class="alerta-erro">Falha ao carregar agenda: ' + error.message + '</p>';
    menuAtividades.innerHTML = '';
  }
}

// Helpers do filtro por atividade
function getTodasAtividades(agendamentos){
  const set = new Set();
  agendamentos.forEach(s=> set.add(s.atividade));
  return Array.from(set).sort((a,b)=>a.localeCompare(b,'pt-BR'));
}
function construirMenuAtividades(agendamentos){
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
        const dataApi = seletorData.value.split('-').reverse().join('/');

        // botão Excluir agora como X (×) pequeno
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
                       'data-data="'+seletorData.value.split('-').reverse().join('/')+'" '+
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
  modalDetalhes.innerHTML =
    '<li><strong>Data:</strong> ' + agendamentoAtual.data + '</li>' +
    '<li><strong>Horário:</strong> ' + agendamentoAtual.horario + '</li>' +
    '<li><strong>Atividade:</strong> ' + agendamentoAtual.atividade + '</li>' +
    '<li><strong>Profissional:</strong> ' + agendamentoAtual.profissional + '</li>';
  inputMatricula.value=''; modalMensagem.textContent='';
  abrirModal(modalAgendamento);
}

async function confirmarAgendamento(){
  const matricula=inputMatricula.value.trim();
  const email=(inputEmail?.value||'').trim();
  if(!matricula){ modalMensagem.textContent='A matrícula é obrigatória.'; modalMensagem.style.color='red'; return; }
  btnConfirmar.disabled=true;
  modalMensagem.textContent='Processando...'; modalMensagem.style.color='var(--cinza-texto)';

  try{
    const result = await postForm(apiUrl, { action:'bookSlot', id_linha: agendamentoAtual.idLinha, matricula, email });
    modalMensagem.textContent=result.message || 'Reserva efetuada.'; modalMensagem.style.color='var(--verde-moinhos)';
    await carregarAgenda(); setTimeout(()=> fecharModal(modalAgendamento), 1200);
  }catch(err){
    modalMensagem.textContent = err.message || 'Erro ao reservar.'; modalMensagem.style.color='red';
  }finally{ btnConfirmar.disabled=false; }
}

// ================== Admin – login/logout ==================
function toggleAdminView(on){
  isAdmin = on;
  if(on){
    btnAdminLogin.textContent='Logout Admin';
    btnAdminLogin.classList.remove('btn-cinza'); btnAdminLogin.classList.add('btn-vermelho');
    btnGerenciarAgenda.classList.remove('hidden');
    if(!document.querySelector('.aviso-admin')){
      container.insertAdjacentHTML('beforebegin','<p class="aviso-admin">MODO ADMIN. Clique em "Excluir" (×) para remover slots.</p>');
    }
  }else{
    btnAdminLogin.textContent='Login Admin';
    btnAdminLogin.classList.remove('btn-vermelho'); btnAdminLogin.classList.add('btn-cinza');
    btnGerenciarAgenda.classList.add('hidden');
    const aviso=document.querySelector('.aviso-admin'); if(aviso) aviso.remove();
  }
  container.innerHTML = criarHTMLAgendaFiltrada(todosOsAgendamentos, atividadeSelecionada);
  initializeAccordions();
}
function handleAdminLoginClick(){ if(isAdmin){toggleAdminView(false);return;} abrirModal(modalAdminLogin); inputAdminPassword.value=''; adminLoginMensagem.textContent=''; }
function confirmarAdminLogin(){ if(inputAdminPassword.value.trim()===ADMIN_PASSWORD){ toggleAdminView(true); fecharModal(modalAdminLogin); } else { adminLoginMensagem.textContent='Senha incorreta.'; adminLoginMensagem.style.color='red'; } }

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
// ... restante do código permanece igual ao original (funções de adicionar, dashboard, reservas etc.)
// Para não repetir tudo aqui, mantenha o resto do seu script original após essa seção.
// (Se quiser, eu já envio o arquivo completo novamente com o conteúdo inteiro — aqui mostrei as partes alteradas para o X.)
//
// ================== Listeners e inicialização ==================
// (mantém os listeners: clique, login admin, menu, etc.)
// ... (o restante do arquivo continua idêntico à versão anterior)
//
seletorData.addEventListener('change', function(){ atividadeSelecionada='TODAS'; carregarAgenda(); });
btnCancelar.addEventListener('click', function(){ fecharModal(modalAgendamento); });
btnConfirmar.addEventListener('click', confirmarAgendamento);
btnAdminLogin.addEventListener('click', handleAdminLoginClick);
document.getElementById('btn-cancelar-admin-login').addEventListener('click', function(){ fecharModal(modalAdminLogin); });
document.getElementById('btn-confirmar-admin-login').addEventListener('click', confirmarAdminLogin);
btnGerenciarAgenda.addEventListener('click', function(){ abrirModal(modalAdminGerenciar); });
btnFecharAdminGerenciar.addEventListener('click', function(){ fecharModal(modalAdminGerenciar); });
btnAdminLogout.addEventListener('click', function(){ fecharModal(modalAdminGerenciar); toggleAdminView(false); });
btnAdminDashboard.addEventListener('click', function(){ fecharModal(modalAdminGerenciar); openDashboard(); });

adminSelectProfissional.addEventListener('change', function(e){ updateActivitySelector(e.target.value); toggleAdminInputs(); });
adminSelectAtividade.addEventListener('change', toggleAdminInputs);

btnAdminAdicionar.addEventListener('click', function(){
  formAdicionarHorario.reset();
  adminSelectAtividade.disabled=true;
  toggleAdminInputs();
  adminAddMensagem.textContent='';
  fecharModal(modalAdminGerenciar);
  abrirModal(modalAdminAdicionar);
});
btnCancelarAdicionarFinal.addEventListener('click', function(){ fecharModal(modalAdminAdicionar); });
formAdicionarHorario.addEventListener('submit', handleAdminAdicionar);

btnConsultarReservas.addEventListener('click', function(){ voltarConsulta(); abrirModal(modalConsulta); });
btnFecharConsulta.addEventListener('click', function(){ fecharModal(modalConsulta); });
btnBuscarReservas.addEventListener('click', handleBuscarReservas);
btnVoltarConsulta.addEventListener('click', voltarConsulta);
modalConsulta.addEventListener('click', handleCancelBooking);

// Delegação de cliques: acordeões e slots
container.addEventListener('click', function(ev){
  const atvTitle = ev.target.closest('.titulo-atividade');
  if (atvTitle){
    atvTitle.classList.toggle('ativo');
    const panel = atvTitle.nextElementSibling;
    if (!panel) return;
    if (panel.classList.contains('open')) collapsePanel(panel); else expandPanel(panel);
    return;
  }

  const profTitle = ev.target.closest('.titulo-profissional');
  if (profTitle){
    profTitle.classList.toggle('ativo');
    const panel = profTitle.nextElementSibling;
    if (!panel) return;
    if (panel.classList.contains('open')) collapsePanel(panel); else expandPanel(panel);
    return;
  }

  const el = ev.target.closest('.slot-horario');
  if(el && el.classList.contains('status-disponivel') && !isAdmin){
    abrirModalReserva(el.dataset);
    return;
  }

  // admin excluir (botão X)
  if (isAdmin && ev.target.classList.contains('status-admin-excluir')){
    const id=ev.target.getAttribute('data-id-linha'); if(id) handleAdminDelete(id);
    return;
  }

  if (isAdmin && el && el.classList.contains('status-admin-adicionar')){
    const d=el.dataset;
    adminSelectData.value = d.data.split('/').reverse().join('-');
    adminSelectProfissional.value = d.profissional;
    updateActivitySelector(d.profissional);
    adminSelectAtividade.value = d.atividade;
    toggleAdminInputs();
    fecharModal(modalAdminGerenciar);
    abrirModal(modalAdminAdicionar);
  }
});

menuAtividades.addEventListener('click', function(e){
  const btn = e.target.closest('.chip-atividade');
  if(!btn) return;
  atividadeSelecionada = btn.getAttribute('data-atividade') || 'TODAS';
  var chips = menuAtividades.querySelectorAll('.chip-atividade');
  for (var i=0;i<chips.length;i++){ chips[i].classList.remove('ativo'); }
  btn.classList.add('ativo');
  container.innerHTML = criarHTMLAgendaFiltrada(todosOsAgendamentos, atividadeSelecionada);
  initializeAccordions();
});

btnDashClose.addEventListener('click', function(){ fecharModal(modalAdminDashboard); });
// ... demais listeners do dashboard seguem igual

carregarAgenda();
