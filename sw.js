/* ==========================================================================
   L.A FITNESS — SERVICE WORKER (PWA)
   Faz o site abrir sem internet e instalavel na tela do celular.

   ESTRATEGIA
     - O site (html, css, js): rede primeiro, cache como reserva.
       Assim uma correcao nova aparece assim que houver internet.
     - As midias (gifs, fotos, videos): cache primeiro.
       Sao muitos arquivos e quase nunca mudam.
     - Sem internet: serve o que estiver em cache.

   ATENCAO: se voce editar um arquivo e a mudanca nao aparecer,
   suba a VERSAO abaixo (ex.: 'v2') para o cache antigo ser descartado.
   ========================================================================== */

const VERSAO = 'la-fitness-v2';

const ESSENCIAIS = [
  'index.html',
  'admin.html',
  'css/style.css',
  'css/admin.css',
  'js/dados.js',
  'js/site.js',
  'js/splash.js',
  'js/app-nav.js',
  'js/aluno.js',
  'js/shell.js',
  'js/entrada.js',
  'js/bot.js',
  'js/treinos.js',
  'js/dataset.js',
  'js/modelos-treino.js',
  'js/montar-treino.js',
  'js/loja.js',
  'js/conversas.js',
  'js/mural.js',
  'js/aluno-extra.js',
  'js/admin.js',
  'js/app-admin.js',
  'js/app-admin-msg.js',
  'img/logo.png',
  'img/logo-la.png',
  'manifest.json',
  'img/icone-512.png',
  'img/icone-192.png',
  'js/app-admin-catraca.js',
  'js/app-admin-fin.js',
  'js/emojis.js',
  'js/financeiro.js',
  'setup.html',
  'data/exercises.json'
];

/* ---------------- instalacao ---------------- */
self.addEventListener('install', function (evento) {
  evento.waitUntil(
    caches.open(VERSAO).then(function (cache) {
      /* um arquivo que falte nao pode derrubar a instalacao toda */
      return Promise.all(ESSENCIAIS.map(function (url) {
        return cache.add(url).catch(function () {
          console.warn('[sw] nao consegui guardar:', url);
        });
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

/* ---------------- ativacao: limpa versoes antigas ---------------- */
self.addEventListener('activate', function (evento) {
  evento.waitUntil(
    caches.keys().then(function (nomes) {
      return Promise.all(nomes.map(function (n) {
        if (n !== VERSAO) return caches.delete(n);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

/* ---------------- busca ---------------- */
self.addEventListener('fetch', function (evento) {
  const req = evento.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  /* so cuida do proprio site; o resto passa direto (fontes, mapas) */
  if (url.origin !== location.origin) return;

  const ehMidia = /\.(gif|jpg|jpeg|png|webp|mp4|webm|svg)$/i.test(url.pathname);
  const ehCodigo = /\.(html|css|js|json)$/i.test(url.pathname) || url.pathname.endsWith('/');

  /* MIDIA: cache primeiro */
  if (ehMidia) {
    evento.respondWith(
      caches.match(req).then(function (guardado) {
        if (guardado) return guardado;
        return fetch(req).then(function (resp) {
          if (resp && resp.ok) {
            const copia = resp.clone();
            caches.open(VERSAO).then(function (c) { c.put(req, copia); });
          }
          return resp;
        }).catch(function () {
          /* sem internet e sem cache: devolve vazio em vez de quebrar */
          return new Response('', { status: 404 });
        });
      })
    );
    return;
  }

  /* CODIGO: rede primeiro, cache como reserva */
  if (ehCodigo) {
    evento.respondWith(
      fetch(req).then(function (resp) {
        if (resp && resp.ok) {
          const copia = resp.clone();
          caches.open(VERSAO).then(function (c) { c.put(req, copia); });
        }
        return resp;
      }).catch(function () {
        return caches.match(req).then(function (guardado) {
          return guardado || caches.match('index.html');
        });
      })
    );
  }
});

/* ---------------- aviso de atualizacao ---------------- */
self.addEventListener('message', function (evento) {
  if (evento.data === 'atualizar') self.skipWaiting();
});
