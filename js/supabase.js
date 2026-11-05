/* ==========================================================================
   L.A FITNESS — ponte com o Supabase
   O site inteiro conversa com o banco por aqui.
   Se o banco nao responder, o site cai no navegador e continua funcionando.
   ========================================================================== */

const LA_DB_URL = 'https://jpodytaqzdadberficri.supabase.co';
const LA_DB_CHAVE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impwb2R5dGFxemRhZGJlcmZpY3JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM4OTA1NTUsImV4cCI6MjEwOTQ2NjU1NX0.B2zbSKMOKQUMvc1hG7FIlFiUfj9ZWDIHerwEx-7a67k';

/* o cliente e criado aqui, sem depender de CDN: usamos fetch direto na API */
const LADB = {
  url: LA_DB_URL,
  chave: LA_DB_CHAVE,
  pronto: false,
  aviso: null,

  /* ---------- chamada crua a API REST do Supabase ---------- */
  async pedir(tabela, opcoes) {
    const o = opcoes || {};
    const url = this.url + '/rest/v1/' + tabela + (o.query || '');
    const cab = {
      'apikey': this.chave,
      'Authorization': 'Bearer ' + this.chave,
      'Content-Type': 'application/json'
    };
    if (o.prefer) cab['Prefer'] = o.prefer;

    const r = await fetch(url, {
      method: o.method || 'GET',
      headers: cab,
      body: o.corpo ? JSON.stringify(o.corpo) : undefined
    });

    if (!r.ok) {
      const txt = await r.text();
      throw new Error('[' + r.status + '] ' + txt.slice(0, 200));
    }
    if (r.status === 204) return [];
    const t = await r.text();
    return t ? JSON.parse(t) : [];
  },

  /* ---------- pergunta basica: o banco existe e responde? ---------- */
  async conferir() {
    try {
      await this.pedir('la_conteudo', { query: '?id=eq.1&select=id' });
      this.pronto = true;
      this.aviso = null;
      console.log('[LADB] banco conectado');
      return true;
    } catch (e) {
      this.pronto = false;
      this.aviso = String(e.message || e);
      console.warn('[LADB] sem banco, usando o navegador:', this.aviso);
      return false;
    }
  },

  /* ---------- le ---------- */
  async ler(tabela, query) {
    return this.pedir(tabela, { query: query || '?select=*' });
  },

  /* ---------- grava (insere ou atualiza) ---------- */
  async gravar(tabela, linhas, conflito) {
    const q = conflito ? ('?on_conflict=' + conflito) : '';
    return this.pedir(tabela, {
      method: 'POST',
      query: q,
      corpo: linhas,
      prefer: 'resolution=merge-duplicates,return=representation'
    });
  },

  /* ---------- apaga ---------- */
  async apagar(tabela, query) {
    return this.pedir(tabela, { method: 'DELETE', query: query });
  }
};

window.LADB = LADB;
