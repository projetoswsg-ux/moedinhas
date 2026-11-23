const INDICE_URL = 'data/artigos.json';
const ARTIGO_BASE = 'data/artigos/';

// helper
function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(props).forEach(([k, v]) => {
    if (k === 'className') node.className = v;
    else if (k === 'innerHTML') node.innerHTML = v;
    else node.setAttribute(k, v);
  });
  children.forEach(c => node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c));
  return node;
}

// ===== RENDERIZADORES =====
const renderers = {
  titulo: s => el(`h${s.nivel || 2}`, { innerHTML: s.texto }),

  paragrafo: s => el('p', { innerHTML: s.html }),

  lista: s => {
    const list = el(s.ordenada ? 'ol' : 'ul');
    s.itens.forEach(i => list.appendChild(el('li', { innerHTML: i })));
    return list;
  },

  tabela: s => {
    const wrap = el('div', { className: 'table-wrapper' });
    if (s.titulo) wrap.appendChild(el('p', { className: 'table-caption', innerHTML: s.titulo }));
    const table = el('table', { className: 'currency-table' });
    const thead = el('thead');
    const hr = el('tr');
    s.colunas.forEach(c => hr.appendChild(el('th', { innerHTML: c })));
    thead.appendChild(hr);
    const tbody = el('tbody');
    s.linhas.forEach(linha => {
      const tr = el('tr');
      linha.forEach(c => tr.appendChild(el('td', { innerHTML: c })));
      tbody.appendChild(tr);
    });
    table.append(thead, tbody);
    wrap.appendChild(table);
    return wrap;
  },

  galeria: s => {
    const g = el('div', { className: 'image-gallery' });
    s.itens.forEach(i => {
      const card = el('div', { className: 'gallery-item' });
      card.appendChild(el('i', { className: `fas ${i.icone}` }));
      card.appendChild(el('div', { className: 'gallery-caption', innerHTML: i.legenda }));
      g.appendChild(card);
    });
    return g;
  },

  'linha-do-tempo': s => {
    const tl = el('ul', { className: 'timeline' });
    s.itens.forEach(i => {
      const li = el('li');
      li.appendChild(el('span', { className: 'tl-date', innerHTML: i.data }));
      li.appendChild(el('span', { className: 'tl-event', innerHTML: i.evento }));
      tl.appendChild(li);
    });
    return tl;
  }
};

// ===== INFOBOX / FICHA TÉCNICA =====
function buildFicha(ficha) {
  const box = el('aside', { className: 'infobox' });
  box.appendChild(el('div', { className: 'infobox-title', innerHTML: ficha.titulo }));

  if (ficha.selo) {
    const seal = el('div', { className: 'hologram-seal' });
    const inner = el('div', { className: 'seal-inner' });
    inner.appendChild(el('i', { className: `fas ${ficha.selo.icone} seal-currency-icon` }));
    inner.appendChild(el('div', { className: 'seal-value', innerHTML: ficha.selo.valor }));
    inner.appendChild(el('div', { className: 'seal-label', innerHTML: ficha.selo.rotulo }));
    seal.appendChild(inner);
    box.appendChild(seal);
  }

  ficha.campos.forEach(c => {
    const row = el('div', { className: 'infobox-row' + (c.obrigatorio ? ' obrigatorio' : '') });
    row.appendChild(el('div', { className: 'infobox-label', innerHTML: c.label }));
    row.appendChild(el('div', { className: 'infobox-data', innerHTML: c.valor }));
    box.appendChild(row);
  });

  return box;
}

// ===== REFERÊNCIAS =====
function buildReferencias(refs) {
  if (!refs || !refs.length) return null;
  const sec = el('section', { className: 'referencias', id: 'referencias' });
  sec.appendChild(el('h2', { innerHTML: 'Referências' }));
  const ol = el('ol', { className: 'ref-list' });
  refs.forEach(r => {
    const li = el('li', { id: r.id, innerHTML: r.texto });
    ol.appendChild(li);
  });
  sec.appendChild(ol);
  return sec;
}

// ===== MONTAGEM DO ARTIGO =====
function buildArticle(a) {
  const frag = document.createDocumentFragment();

  // header
  const header = el('header', { className: 'article-header' });
  header.appendChild(el('h1', { innerHTML: a.titulo }));
  const sub = el('div', { className: 'article-subhead' });
  if (a.subtitulo?.idioma)
    sub.appendChild(el('span', { innerHTML: `<i class="fas fa-language"></i> ${a.subtitulo.idioma}` }));
  if (a.subtitulo?.visualizacoes != null)
    sub.appendChild(el('span', { innerHTML: `<i class="fas fa-eye"></i> ${a.subtitulo.visualizacoes} visualizações` }));
  if (a.subtitulo?.destaque)
    sub.appendChild(el('span', { className: 'badge', innerHTML: '<i class="fas fa-star"></i> Artigo em destaque' }));
  header.appendChild(sub);
  frag.appendChild(header);

  // ficha lateral
  if (a.ficha) frag.appendChild(buildFicha(a.ficha));

  // conteúdo
  const content = el('div', { className: 'content-section' });
  a.secoes.forEach(s => {
    const fn = renderers[s.tipo];
    if (fn) content.appendChild(fn(s));
  });

  // referências (dentro do conteúdo, com clearfix)
  const refs = buildReferencias(a.referencias);
  if (refs) content.appendChild(refs);

  // rodapé
  if (a.rodape) {
    const footer = el('div', { className: 'article-footer' });
    const cats = el('div', { className: 'categories' });
    (a.rodape.categorias || []).forEach(c => cats.appendChild(el('a', { href: '#', innerHTML: c })));
    footer.appendChild(cats);
    if (a.rodape.ultimaEdicao)
      footer.appendChild(el('div', { innerHTML: `<i class="fas fa-edit"></i> Última edição em ${a.rodape.ultimaEdicao}` }));
    content.appendChild(footer);
  }

  frag.appendChild(content);
  return frag;
}

// ===== INICIALIZAÇÃO =====
async function init() {
  const app = document.getElementById('app');
  const slug = new URLSearchParams(location.search).get('slug');

  if (!slug) {
    app.innerHTML = '<p>Nenhum artigo especificado. Volte ao <a href="index.html">índice</a>.</p>';
    return;
  }

  try {
    const res = await fetch(`${ARTIGO_BASE}${slug}.json`);
    if (!res.ok) throw new Error(`Artigo "${slug}" não encontrado`);
    const artigo = await res.json();

    document.title = `${artigo.titulo} · Numismática Wiki`;
    app.replaceChildren(buildArticle(artigo));
    window.scrollTo(0, 0);
  } catch (e) {
    console.error(e);
    app.innerHTML = `<div class="erro"><h2>Artigo não encontrado</h2>
      <p>${e.message}</p>
      <p><a href="index.html">← Voltar ao índice</a></p></div>`;
  }
}

document.addEventListener('DOMContentLoaded', init);
