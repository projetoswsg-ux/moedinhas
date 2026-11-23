const INDICE_URL = 'data/artigos.json';

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

function renderCard(a) {
  const card = el('a', { href: `artigo.html?slug=${a.slug}`, className: 'article-card' });
  card.appendChild(el('div', { className: 'card-icon' }, [el('i', { className: `fas ${a.icone || 'fa-book'}` })]));
  const body = el('div', { className: 'card-body' });
  body.appendChild(el('h3', { innerHTML: a.titulo }));
  body.appendChild(el('p', { innerHTML: a.resumo || '' }));
  body.appendChild(el('span', { className: 'card-tag', innerHTML: a.categoria || 'Geral' }));
  card.appendChild(body);
  return card;
}

async function init() {
  const lista = document.getElementById('lista-artigos');
  const busca = document.getElementById('busca');
  const contador = document.getElementById('contador-artigos');

  try {
    const res = await fetch(INDICE_URL);
    if (!res.ok) throw new Error('Índice não encontrado');
    const data = await res.json();
    const artigos = data.artigos || [];

    contador.textContent = artigos.length;

    function render(filtro = '') {
      const f = filtro.toLowerCase().trim();
      const filtrados = f
        ? artigos.filter(a =>
            a.titulo.toLowerCase().includes(f) ||
            (a.categoria || '').toLowerCase().includes(f) ||
            (a.resumo || '').toLowerCase().includes(f))
        : artigos;

      lista.innerHTML = '';
      if (!filtrados.length) {
        lista.appendChild(el('p', { innerHTML: 'Nenhum artigo encontrado.' }));
        return;
      }
      filtrados.forEach(a => lista.appendChild(renderCard(a)));
    }

    render();
    busca.addEventListener('input', e => render(e.target.value));
  } catch (e) {
    lista.innerHTML = `<div class="erro"><p>Erro: ${e.message}</p>
      <p>Se estiver abrindo via <code>file://</code>, rode um servidor local:<br>
      <code>python3 -m http.server</code></p></div>`;
  }
}

document.addEventListener('DOMContentLoaded', init);
