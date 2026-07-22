
// ═══════════════════════════════════════════════════════════════
// LogiTrack SAC — Admin Pages (Clientes, Motoristas, Conferentes, Usuários)
// Supabase — assíncrono
// ═══════════════════════════════════════════════════════════════

// ── Generic CRUD Factory ───────────────────────────────────────
function makeCRUDPage(config) {
  return {
    page: 1, perPage: 15, search: '',
    async load() { this.page=1; this.search=''; await this.render(); },
    async getFiltered() {
      let arr = (await DB.getAll(config.dbKey)).filter(r=>r.ativo!==false);
      if(this.search) {
        const s=this.search.toLowerCase();
        arr=arr.filter(r=>config.searchFields.some(f=>(r[f]||'').toLowerCase().includes(s)));
      }
      return arr.sort((a,b)=>(a.nome||'').localeCompare(b.nome||''));
    },
    async render() {
      const all=await this.getFiltered();
      const start=(this.page-1)*this.perPage, slice=all.slice(start,start+this.perPage);
      const tbody=document.getElementById(config.tbodyId);
      const countEl=document.getElementById(config.countId);
      if(countEl) countEl.textContent=`${all.length} registro${all.length!==1?'s':''}`;
      if(!tbody) return;
      if(!slice.length){tbody.innerHTML=`<tr><td colspan="${config.cols.length+1}" style="text-align:center;padding:32px;color:var(--text-muted)">Nenhum registro encontrado</td></tr>`;renderPagination(config.paginationId,0,1,this.perPage,()=>{});return;}
      tbody.innerHTML=slice.map(r=>`<tr>${config.cols.map(col=>typeof col==='function'?`<td>${col(r)}</td>`:`<td>${r[col]||'—'}</td>`).join('')}<td><div class="td-actions"><button class="btn btn-ghost btn-icon btn-sm" title="Editar" onclick="${config.ns}.editar('${r.id}')">${Icons.svg('edit',14)}</button><button class="btn btn-ghost btn-icon btn-sm" title="Excluir" style="color:var(--danger)" onclick="${config.ns}.excluir('${r.id}')">${Icons.svg('trash',14)}</button></div></td></tr>`).join('');
      renderPagination(config.paginationId,all.length,this.page,this.perPage,p=>{this.page=p;this.render();});
    },
    novo() { this._openModal(null); },
    async editar(id) { const r=await DB.find(config.dbKey,id); if(r) this._openModal(r); },
    _openModal(r) {
      const titleEl=document.getElementById(config.modalTitleId);
      if(titleEl) titleEl.textContent=r?'Editar '+config.entityName:'Novo '+config.entityName;
      const idEl=document.getElementById(config.formIdField);
      if(idEl) idEl.value=r?.id||'';
      config.fillModal(r||{});
      Modal.open(config.modalId);
    },
    async salvar() {
      const id=document.getElementById(config.formIdField)?.value;
      const data=config.getFormData();
      if(config.validate && !config.validate(data)) return;
      if(id) {
        await DB.update(config.dbKey,id,data);
        await logAction('EDICAO',config.entityName,id);
        Toast.success(config.entityName+' atualizado com sucesso!');
      } else {
        const created = await DB.insert(config.dbKey,data);
        await logAction('CRIACAO',config.entityName,created?created.id:'');
        Toast.success(config.entityName+' cadastrado com sucesso!');
      }
      Modal.close(config.modalId);
      await this.render();
    },
    excluir(id) {
      var self=this;
      DB.find(config.dbKey,id).then(function(r){
        confirmDialog('Excluir '+config.entityName,`Deseja excluir "${r?.nome||id}"?`, async ()=>{
          await DB.update(config.dbKey,id,{ativo:false});
          await logAction('EXCLUSAO',config.entityName,id);
          Toast.success(config.entityName+' removido.');
          await self.render();
        });
      });
    },
  };
}

// ── Clientes ───────────────────────────────────────────────────
const ClientesPage = Object.assign(makeCRUDPage({
  dbKey: DB.KEYS.CLIENTES, ns: 'ClientesPage', entityName: 'Cliente',
  tbodyId:'cli-tbody', countId:'cli-count', paginationId:'cli-pagination',
  modalId:'modal-cliente', modalTitleId:'cli-modal-title', formIdField:'cli-id',
  searchFields:['nome','cnpj','email','cidade'],
  cols:[r=>`<strong>${r.nome}</strong>`, 'cnpj', 'contato', 'telefone', 'cidade', r=>`<span class="badge ${r.ativo?'badge-resolvida':'badge-cancelada'}">${r.ativo?'Ativo':'Inativo'}</span>`],
  fillModal(r) {
    const set=(id,v)=>{const e=document.getElementById(id);if(e)e.value=v||'';};
    set('cli-nome',r.nome); set('cli-cnpj',r.cnpj); set('cli-contato',r.contato);
    set('cli-telefone',r.telefone); set('cli-email',r.email); set('cli-cidade',r.cidade);
  },
  getFormData() {
    const g=id=>document.getElementById(id)?.value||'';
    return {nome:g('cli-nome'),cnpj:g('cli-cnpj'),contato:g('cli-contato'),telefone:g('cli-telefone'),email:g('cli-email'),cidade:g('cli-cidade'),ativo:true};
  },
  validate(d) { if(!d.nome.trim()){Toast.warning('Nome obrigatório');return false;} return true; },
}), {
  async load() {
    this.page=1; this.search='';
    const si=document.getElementById('cli-search');
    if(si) si.addEventListener('input',()=>{this.search=si.value;this.page=1;this.render();});
    await this.render();
  }
});

// ── Motoristas ─────────────────────────────────────────────────
const MotoristasPage = Object.assign(makeCRUDPage({
  dbKey: DB.KEYS.MOTORISTAS, ns: 'MotoristasPage', entityName: 'Motorista',
  tbodyId:'mot-tbody', countId:'mot-count', paginationId:'mot-pagination',
  modalId:'modal-motorista', modalTitleId:'mot-modal-title', formIdField:'mot-id',
  searchFields:['nome','cpf','placa','veiculo'],
  cols:[r=>`<strong>${r.nome}</strong>`, 'cpf', 'telefone', r=>`<span class="td-code">${r.placa||'—'}</span>`, 'veiculo', r=>`<span class="badge ${r.ativo?'badge-resolvida':'badge-cancelada'}">${r.ativo?'Ativo':'Inativo'}</span>`],
  fillModal(r) {
    const set=(id,v)=>{const e=document.getElementById(id);if(e)e.value=v||'';};
    set('mot-nome',r.nome); set('mot-cpf',r.cpf); set('mot-cnh',r.cnh);
    set('mot-telefone',r.telefone); set('mot-placa',r.placa); set('mot-veiculo',r.veiculo);
  },
  getFormData() {
    const g=id=>document.getElementById(id)?.value||'';
    return {nome:g('mot-nome'),cpf:g('mot-cpf'),cnh:g('mot-cnh'),telefone:g('mot-telefone'),placa:g('mot-placa'),veiculo:g('mot-veiculo'),ativo:true};
  },
  validate(d) { if(!d.nome.trim()){Toast.warning('Nome obrigatório');return false;} return true; },
}), {
  async load() {
    this.page=1; this.search='';
    const si=document.getElementById('mot-search');
    if(si) si.addEventListener('input',()=>{this.search=si.value;this.page=1;this.render();});
    await this.render();
  }
});

// ── Conferentes ────────────────────────────────────────────────
const ConferentesPage = Object.assign(makeCRUDPage({
  dbKey: DB.KEYS.CONFERENTES, ns: 'ConferentesPage', entityName: 'Conferente',
  tbodyId:'conf-tbody', countId:'conf-count', paginationId:'conf-pagination',
  modalId:'modal-conferente', modalTitleId:'conf-modal-title', formIdField:'conf-id',
  searchFields:['nome','matricula','turno'],
  cols:[r=>`<strong>${r.nome}</strong>`, 'matricula', 'turno', r=>`<span class="badge ${r.ativo?'badge-resolvida':'badge-cancelada'}">${r.ativo?'Ativo':'Inativo'}</span>`],
  fillModal(r) {
    const set=(id,v)=>{const e=document.getElementById(id);if(e)e.value=v||'';};
    set('conf-nome',r.nome); set('conf-matricula',r.matricula); set('conf-turno',r.turno);
  },
  getFormData() {
    const g=id=>document.getElementById(id)?.value||'';
    return {nome:g('conf-nome'),matricula:g('conf-matricula'),turno:g('conf-turno'),ativo:true};
  },
  validate(d) { if(!d.nome.trim()){Toast.warning('Nome obrigatório');return false;} return true; },
}), {
  async load() {
    this.page=1; this.search='';
    const si=document.getElementById('conf-search');
    if(si) si.addEventListener('input',()=>{this.search=si.value;this.page=1;this.render();});
    await this.render();
  }
});

// ── Usuários ───────────────────────────────────────────────────
const UsuariosPage = {
  page:1, perPage:15, search:'',
  async load() {
    this.page=1; this.search='';
    const si=document.getElementById('usr-search');
    if(si) si.addEventListener('input',()=>{this.search=si.value;this.page=1;this.render();});
    await this.render();
  },
  async getFiltered() {
    let users=await DB.getAll(DB.KEYS.USERS);
    if(this.search){ const s=this.search.toLowerCase(); users=users.filter(u=>u.nome.toLowerCase().includes(s)||u.email.toLowerCase().includes(s)); }
    return users;
  },
  async render() {
    const all=await this.getFiltered();
    const slice=all.slice((this.page-1)*this.perPage,(this.page)*this.perPage);
    const tbody=document.getElementById('usr-tbody');
    const countEl=document.getElementById('usr-count');
    if(countEl) countEl.textContent=`${all.length} usuário${all.length!==1?'s':''}`;
    if(!tbody) return;
    if(!slice.length){tbody.innerHTML=`<tr><td colspan="5" style="text-align:center;padding:32px;color:var(--text-muted)">Nenhum usuário encontrado</td></tr>`;return;}
    const perfilColors={ADMINISTRADOR:'badge-critica',SUPERVISOR:'badge-andamento',OPERADOR:'badge-aberta'};
    tbody.innerHTML=slice.map(u=>`<tr>
      <td><div style="display:flex;align-items:center;gap:10px"><div class="avatar">${getInitials(u.nome)}</div><div><div style="font-weight:500">${u.nome}</div><div style="font-size:11px;color:var(--text-muted)">${u.email}</div></div></div></td>
      <td><span class="badge ${perfilColors[u.perfil]||'badge-aberta'}">${u.perfil}</span></td>
      <td><span class="badge ${u.ativo?'badge-resolvida':'badge-cancelada'}">${u.ativo?'Ativo':'Inativo'}</span></td>
      <td style="font-size:12px">${fmtDate(u.createdAt)}</td>
      <td><div class="td-actions">
        <button class="btn btn-ghost btn-icon btn-sm" title="Editar" onclick="UsuariosPage.editar('${u.id}')">${Icons.svg('edit',14)}</button>
        <button class="btn btn-ghost btn-icon btn-sm" title="${u.ativo?'Desativar':'Ativar'}" onclick="UsuariosPage.toggleAtivo('${u.id}')">${Icons.svg(u.ativo?'x':'check',14)}</button>
      </div></td>
    </tr>`).join('');
    renderPagination('usr-pagination',all.length,this.page,this.perPage,p=>{this.page=p;this.render();});
  },
  novo() {
    document.getElementById('usr-modal-title').textContent='Novo Usuário';
    document.getElementById('usr-id').value='';
    ['usr-nome','usr-email','usr-senha','usr-perfil'].forEach(id=>{const e=document.getElementById(id);if(e)e.value='';});
    document.getElementById('usr-perfil').value='OPERADOR';
    document.getElementById('usr-senha-row').style.display='';
    var permEl=document.getElementById('usr-pode-resolucao'); if(permEl) permEl.checked=false;
    Modal.open('modal-usuario');
  },
  async editar(id) {
    const u=await DB.find(DB.KEYS.USERS,id);
    if(!u) return;
    document.getElementById('usr-modal-title').textContent='Editar Usuário';
    document.getElementById('usr-id').value=id;
    const set=(eid,v)=>{const e=document.getElementById(eid);if(e)e.value=v||'';};
    set('usr-nome',u.nome); set('usr-email',u.email); set('usr-perfil',u.perfil);
    var permEl=document.getElementById('usr-pode-resolucao');
    if(permEl) permEl.checked=!!(u.podeAlterarResolucao);
    document.getElementById('usr-senha-row').style.display='none'; // não exibe senha na edição
    Modal.open('modal-usuario');
  },
  async salvar() {
    const id=document.getElementById('usr-id').value;
    const g=eid=>document.getElementById(eid)?.value||'';
    const nome=g('usr-nome'), email=g('usr-email'), perfil=g('usr-perfil'), senha=g('usr-senha');
    if(!nome.trim()||!email.trim()){Toast.warning('Nome e e-mail obrigatórios');return;}

    const all=await DB.getAll(DB.KEYS.USERS);
    if(all.some(u=>u.email===email&&u.id!==id)){Toast.error('E-mail já cadastrado');return;}

    var permEl=document.getElementById('usr-pode-resolucao');

    if(id) {
      const changes={nome,email,perfil};
      if(senha) changes.senhaHash = await sha256Hex(senha);
      if(permEl) changes.podeAlterarResolucao=permEl.checked;
      await DB.update(DB.KEYS.USERS,id,changes);
      invalidateUsuarioAtualCache();
      Toast.success('Usuário atualizado!');
    } else {
      if(!senha){Toast.warning('Senha obrigatória para novo usuário');return;}
      var novoUser={nome,email,senhaHash:await sha256Hex(senha),perfil,ativo:true};
      if(permEl && permEl.checked) novoUser.podeAlterarResolucao=true;
      await DB.insert(DB.KEYS.USERS,novoUser);
      Toast.success('Usuário criado com sucesso!');
    }
    Modal.close('modal-usuario');
    await this.render();
  },
  async toggleAtivo(id) {
    const u=await DB.find(DB.KEYS.USERS,id);
    const cur=Session.get();
    if(cur && cur.id===id){Toast.error('Você não pode desativar sua própria conta');return;}
    await DB.update(DB.KEYS.USERS,id,{ativo:!u?.ativo});
    invalidateUsuarioAtualCache();
    Toast.success(`Usuário ${u?.ativo?'desativado':'ativado'}`);
    await this.render();
  },
};

