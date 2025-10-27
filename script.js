:root{
  --cinza-borda: #e6eef6;
  --cinza-texto: #6c757d;
  --verde-moinhos: #1b8a4a;
}

/* Botões básicos (utilizados pela UI) */
.btn-acao { padding:8px 12px; border-radius:6px; border:0; cursor:pointer; font-weight:600; }
.btn-cinza { background:#f3f4f6; color:#111827; }
.btn-azul  { background:#0b5ed7; color:#fff; }
.btn-vermelho { background:#dc3545; color:#fff; }

.btn-modal { padding:8px 12px; border-radius:6px; border:0; cursor:pointer; margin:4px; }
.btn-modal.btn-cinza { background:#f3f6f8; }
.btn-modal.btn-azul  { background:#0b5ed7; color:#fff; }
.btn-modal.btn-vermelho { background:#e04b4b; color:#fff; }

/* Chips de atividade */
.chip-atividade { padding:6px 10px; border-radius:999px; border:1px solid rgba(0,0,0,0.06); margin-right:6px; cursor:pointer; background:#fff; }
.chip-atividade.ativo { background:#0b5ed7; color:#fff; border-color:transparent; }

/* Slots grid (simplificado) */
.slots-grid { display:flex; flex-wrap:wrap; gap:8px; margin-top:8px; }

/* Reserva list */
.item-reserva { display:flex; justify-content:space-between; align-items:center; padding:8px 6px; border-bottom:1px solid #f1f5f9; }

/* Modal overlay / content (exemplo padrão) */
.modal-overlay { position:fixed; inset:0; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.35); opacity:0; transition:opacity .25s; z-index:1000; }
.modal-overlay.hidden{ display:none; opacity:0; }
.modal-content { background:#fff; padding:18px; border-radius:8px; max-width:520px; width:92%; box-shadow:0 8px 24px rgba(2,6,23,0.2); }

/* Admin aviso */
.aviso-admin { font-weight:600; }

/* Regras para responsividade básicas */
@media (max-width:600px){
  .slots-grid { gap:6px; }
  .slot-horario { min-width:110px; padding:6px; }
  .btn-admin-excluir { top:4px; right:4px; padding:3px 6px; font-size:11px; }
}
