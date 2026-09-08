import { TECHNICAL_ERROR_CONTENT, TECHNICAL_ERROR_ICONS } from './technical-error-content';

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

/**
 * Affiche la page d'erreur technique alors qu'Angular n'a pas pu démarrer.
 *
 * Ce repli existe parce qu'à ce moment il n'y a ni routeur, ni composant, ni
 * injection : la route `/technical-error` est inatteignable, et y renvoyer le
 * navigateur relancerait le démarrage défaillant en boucle. Il rend donc la
 * même page que `TechnicalErrorPage`, avec le même contenu et les mêmes styles
 * globaux, pour que l'utilisateur voie un seul écran d'erreur technique quel
 * que soit l'environnement et quel que soit le moment de la panne.
 */
export function renderBootstrapError(document: Document): void {
  const page = createElement(document, 'main', 'technical-error-page');
  const panel = createElement(document, 'section', 'error-panel');
  panel.setAttribute('aria-labelledby', 'technical-error-title');

  panel.append(
    createBrand(document),
    createContent(document),
    createFooter(document),
  );
  page.append(panel);
  document.body.replaceChildren(page);
}

function createBrand(document: Document): HTMLElement {
  const brand = createElement(document, 'header', 'brand');
  const mark = createElement(document, 'span', 'brand-mark');
  const name = document.createElement('span');

  mark.setAttribute('aria-hidden', 'true');
  mark.textContent = 'O';
  name.textContent = TECHNICAL_ERROR_CONTENT.brandName;
  brand.append(mark, name);

  return brand;
}

function createContent(document: Document): HTMLElement {
  const content = createElement(document, 'div', 'error-content');
  const icon = createElement(document, 'div', 'status-icon');
  const eyebrow = createElement(document, 'p', 'eyebrow');
  const title = document.createElement('h1');
  const description = createElement(document, 'p', 'error-description');

  icon.setAttribute('aria-hidden', 'true');
  icon.append(createIcon(document, TECHNICAL_ERROR_ICONS.warning));
  eyebrow.textContent = TECHNICAL_ERROR_CONTENT.eyebrow;
  title.id = 'technical-error-title';
  title.textContent = TECHNICAL_ERROR_CONTENT.title;
  description.textContent = TECHNICAL_ERROR_CONTENT.description;
  content.append(icon, eyebrow, title, description, createActions(document));

  return content;
}

/**
 * Le démarrage a échoué avant toute navigation : il n'y a pas de destination à
 * réessayer, seulement un rechargement complet de l'application.
 */
function createActions(document: Document): HTMLElement {
  const actions = createElement(document, 'div', 'actions');
  const retry = document.createElement('button');
  const support = document.createElement('a');

  retry.type = 'button';
  retry.append(
    createIcon(document, TECHNICAL_ERROR_ICONS.retry),
    document.createTextNode(TECHNICAL_ERROR_CONTENT.retryLabel),
  );
  retry.addEventListener('click', () => {
    document.defaultView?.location.reload();
  });
  support.href = TECHNICAL_ERROR_CONTENT.supportHref;
  support.textContent = TECHNICAL_ERROR_CONTENT.supportLabel;
  actions.append(retry, support);

  return actions;
}

function createFooter(document: Document): HTMLElement {
  const footer = document.createElement('footer');
  const dot = createElement(document, 'span', 'status-dot');

  dot.setAttribute('aria-hidden', 'true');
  footer.append(dot, document.createTextNode(TECHNICAL_ERROR_CONTENT.footer));

  return footer;
}

function createIcon(document: Document, path: string): SVGSVGElement {
  const svg = document.createElementNS(SVG_NAMESPACE, 'svg');
  const shape = document.createElementNS(SVG_NAMESPACE, 'path');

  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  shape.setAttribute('d', path);
  svg.append(shape);

  return svg;
}

function createElement(
  document: Document,
  tagName: string,
  className: string,
): HTMLElement {
  const element = document.createElement(tagName);
  element.className = className;

  return element;
}
