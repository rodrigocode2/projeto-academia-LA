/* ==========================================================================
   L.A FITNESS — exercícios e GIFs
   Ligado ao acervo local que está na pasta do site:
     videos/  → os GIFs animados    (1.000 arquivos)
     images/  → os thumbs 180x180   (1.000 arquivos)
     data/    → exercises.json      (o catálogo com nomes)

   COMO FUNCIONA
   1. O site tenta ler data/exercises.json (catálogo completo).
   2. Se conseguir, monta a lista dos 1.324 exercícios com nome e GIF.
   3. Se não, usa a lista de reserva abaixo.
   4. O GIF sai de videos/ID-mediaID.gif — local, sem depender de internet.

   Mídia © Gym visual — https://gymvisual.com/ (ver NOTICE.md do dataset)
   ========================================================================== */

const LA_PASTA_VIDEOS  = 'videos/';
const LA_PASTA_IMAGES  = 'images/';
const LA_CATALOGO_JSON = 'data/exercises.json';

/* O catalogo vem SO da pasta local: data/exercises.json.
   Sem internet, sem depender de repositorio externo. */

/* ==========================================================================
   CATÁLOGO — carregado do data/exercises.json
   ========================================================================== */

/* ==========================================================================
   CATÁLOGO — do data/exercises.json
   Le a pasta local. Se o navegador bloquear (arquivo aberto por duplo clique),
   avisa com clareza em vez de dizer apenas "nenhum catálogo".
   ========================================================================== */

let LA_CATALOGO = null;
let LA_CATALOGO_ERRO = '';

function laCarregarCatalogo() {
  if (LA_CATALOGO) return Promise.resolve(LA_CATALOGO);

  if (typeof fetch !== 'function') {
    LA_CATALOGO_ERRO = 'Este navegador não consegue ler o catálogo.';
    return Promise.resolve(null);
  }

  /* a pagina foi aberta como arquivo local? então o navegador vai bloquear */
  const local = (location.protocol === 'file:');

  return fetch(LA_CATALOGO_JSON)
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function (lista) {
      if (!Array.isArray(lista) || !lista.length) throw new Error('lista vazia');
      LA_CATALOGO = lista.map(function (e) {
        return {
          id: e.id,
          nome: e.name,
          grupo: e.body_part,
          equipamento: e.equipment,
          alvo: e.target,
          gif: e.gif_url,
          imagem: e.image
        };
      });
      if (typeof window !== 'undefined') window.LA_DATASET = LA_CATALOGO;
      return LA_CATALOGO;
    })
    .catch(function (e) {
      LA_CATALOGO_ERRO = local
        ? 'O site foi aberto direto pelo arquivo, e o navegador bloqueia a leitura da pasta. ' +
          'Abra por um servidor local — no VS Code, botão direito no admin.html e "Open with Live Server".'
        : ('Não consegui ler data/exercises.json: ' + (e && e.message ? e.message : 'erro'));
      console.warn('Catálogo:', LA_CATALOGO_ERRO);
      return null;
    });
}

/* ==========================================================================
   CAMINHOS — do acervo local
   ========================================================================== */

function laGifLocal(gifUrl) {
  /* o JSON traz "videos/0025-EIeI8Vf.gif" — já é o caminho certo */
  if (gifUrl) return gifUrl;

  /* se vier só o nome do arquivo, monta */
  if (gifUrl && gifUrl.indexOf('.gif') !== -1) {
    return LA_PASTA_VIDEOS + gifUrl.split('/').pop();
  }
  return null;
}

function laThumbLocal(imgUrl) {
  if (!imgUrl) return null;
  return imgUrl;
}

/* ==========================================================================
   BUSCA — por nome, para o admin montar treino
   ========================================================================== */

function laBuscarExercicios(termo, grupo) {
  if (!LA_CATALOGO || !LA_CATALOGO.length) return [];

  const t = laNormalizar(termo || '');
  const g = (grupo || '').toLowerCase();

  return LA_CATALOGO.filter(function (e) {
    if (g && String(e.grupo || '').toLowerCase() !== g) return false;
    if (!t) return true;
    return laNormalizar(e.nome).includes(t) ||
           laNormalizar(e.alvo || '').includes(t) ||
           laNormalizar(e.equipamento || '').includes(t);
  });
}

function laGruposMusculares() {
  if (!LA_CATALOGO) return [];
  const vistos = {};
  LA_CATALOGO.forEach(function (e) { if (e.grupo) vistos[e.grupo] = true; });
  return Object.keys(vistos).sort();
}

/* ==========================================================================
   ENCAIXE POR NOME — os 20 da ficha apontam para o GIF certo
   ========================================================================== */

const LA_NOMES_EN = {
  'supino reto com barra': 'barbell bench press',
  'supino inclinado com halteres': 'dumbbell incline bench press',
  'crucifixo na maquina': 'cable crossover',
  'puxada frontal': 'cable lat pulldown',
  'remada curvada': 'barbell bent over row',
  'remada baixa': 'cable seated row',
  'rosca direta': 'barbell curl',
  'rosca alternada': 'dumbbell alternate biceps curl',
  'triceps pulley na corda': 'cable pushdown',
  'triceps testa': 'barbell lying triceps extension',
  'desenvolvimento com halteres': 'dumbbell shoulder press',
  'elevacao lateral': 'dumbbell lateral raise',
  'agachamento livre': 'barbell full squat',
  'leg press': 'leg press',
  'cadeira extensora': 'leg extension',
  'mesa flexora': 'lying leg curl',
  'panturrilha em pe': 'standing calf raise',
  'abdominal na polia': 'cable crunch',
  'prancha': 'plank',
  'abdominal crunch': 'crunch'
};

function laNormalizar(txt) {
  return String(txt || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/* ==========================================================================
   RESERVA — se o catálogo não carregar
   ========================================================================== */

const LA_GIFS_RESERVA = {
  'supino reto com barra':   { gif: 'videos/0025-EIeI8Vf.gif', en: 'Barbell Bench Press' },
  'agachamento livre':       { gif: 'videos/0043-qXTaZnJ.gif', en: 'Barbell Full Squat' },
  'rosca direta':            { gif: 'videos/0031-25GPyDY.gif', en: 'Barbell Curl' },
  'rosca alternada':         { gif: 'videos/0294-NbVPDMW.gif', en: 'Dumbbell Biceps Curl' },
  'elevacao lateral':        { gif: 'videos/0334-DsgkuIt.gif', en: 'Dumbbell Lateral Raise' },
  'mesa flexora':            { gif: 'videos/0060-h8LFzo9.gif', en: 'Lying Leg Curl' },
  'triceps pulley na corda': { gif: 'videos/0201-3ZflifB.gif', en: 'Cable Pushdown' },
  'abdominal crunch':        { gif: 'videos/0001-2gPfomN.gif', en: 'Crunch' }
};

/* ==========================================================================
   GIF DO EXERCÍCIO — procura no catálogo, senão na reserva
   ========================================================================== */

function laGifDoExercicio(exercicio) {
  if (!exercicio) return null;
  const nome = typeof exercicio === 'string' ? exercicio : exercicio.nome;
  const chave = laNormalizar(nome);

  /* 1. pelo catálogo completo */
  if (LA_CATALOGO && LA_CATALOGO.length && LA_NOMES_EN[chave]) {
    const alvo = laNormalizar(LA_NOMES_EN[chave]);
    const achado = LA_CATALOGO.find(function (e) { return laNormalizar(e.nome) === alvo; })
      || LA_CATALOGO.find(function (e) { return laNormalizar(e.nome).includes(alvo); });
    if (achado) {
      return {
        gif: achado.gif,
        thumb: achado.imagem,
        nomeOriginal: achado.nome,
        attribution: '© Gym visual — gymvisual.com · dataset: hasaneyldrm/exercises-dataset (MIT)'
      };
    }
  }

  /* 2. reserva verificada */
  const r = LA_GIFS_RESERVA[chave];
  if (r) {
    return {
      gif: r.gif,
      thumb: r.gif.replace('videos/', 'images/').replace('.gif', '.jpg'),
      nomeOriginal: r.en,
      attribution: '© Gym visual — gymvisual.com · dataset: hasaneyldrm/exercises-dataset (MIT)'
    };
  }

  return null;
}

/* quantos exercícios o catálogo tem */
function laTotalExercicios() {
  return LA_CATALOGO ? LA_CATALOGO.length : Object.keys(LA_GIFS_RESERVA).length;
}

/* ==========================================================================
   APELIDOS E TRADUCAO — o aluno.js procura estes dois nomes.
   Sem eles o GIF nao aparecia e o equipamento saia em ingles.
   ========================================================================== */

/* o aluno.js chama laCarregarDataset(); o dataset.js chama laCarregarCatalogo(). */
function laCarregarDataset() {
  return laCarregarCatalogo();
}

/* variavel global que o aluno.js consulta antes de baixar de novo */
if (typeof window !== 'undefined' && typeof window.LA_DATASET === 'undefined') {
  window.LA_DATASET = null;
}

/* equipamento em ingles -> portugues */
const LA_EQUIP_PT = {
  'body weight': 'peso do corpo',
  'dumbbell': 'halter',
  'barbell': 'barra',
  'cable': 'polia',
  'machine': 'maquina',
  'kettlebell': 'kettlebell',
  'band': 'elastico',
  'resistance band': 'elastico',
  'medicine ball': 'bola medicinal',
  'stability ball': 'bola suica',
  'ez barbell': 'barra W',
  'olympic barbell': 'barra olimpica',
  'smith machine': 'smith',
  'leverage machine': 'maquina articulada',
  'assisted': 'assistido',
  'weighted': 'com carga',
  'bosu ball': 'bosu',
  'hammer': 'martelo',
  'rope': 'corda',
  'roller': 'rolo',
  'trap bar': 'barra hexagonal',
  'sled machine': 'treno',
  'skierg machine': 'skierg',
  'stationary bike': 'bike',
  'stepmill machine': 'escada',
  'elliptical machine': 'eliptica',
  'upper body ergometer': 'ergometro',
  'wheel roller': 'roda abdominal'
};

function laEquipPT(equip) {
  if (!equip) return '';
  const chave = String(equip).toLowerCase().trim();
  return LA_EQUIP_PT[chave] || equip;
}
