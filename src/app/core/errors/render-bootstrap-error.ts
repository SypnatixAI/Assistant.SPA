export function renderBootstrapError(document: Document): void {
  const main = document.createElement('main');
  const section = document.createElement('section');
  const title = document.createElement('h1');
  const message = document.createElement('p');

  main.className = 'page-shell';
  section.className = 'page-card';
  title.textContent = 'Une erreur technique est survenue';
  message.textContent =
    'AssistantCore ne peut pas démarrer pour le moment. Rechargez la page ou réessayez plus tard.';
  section.append(title, message);
  main.append(section);
  document.body.replaceChildren(main);
}
