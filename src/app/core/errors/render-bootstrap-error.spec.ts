import { renderBootstrapError } from './render-bootstrap-error';
import { TECHNICAL_ERROR_CONTENT } from './technical-error-content';

describe('renderBootstrapError', () => {
  function render(): Document {
    const isolatedDocument = document.implementation.createHTMLDocument();
    isolatedDocument.body.textContent = 'Application content';
    renderBootstrapError(isolatedDocument);

    return isolatedDocument;
  }

  it('Given_ApplicationBootstrapFailure_When_renderBootstrapErrorIsCalled_Then_TechnicalMessageReplacesPage', () => {
    // Given
    const isolatedDocument = document.implementation.createHTMLDocument();
    isolatedDocument.body.textContent = 'Application content';

    // When
    renderBootstrapError(isolatedDocument);

    // Then
    expect(isolatedDocument.body.querySelector('h1')?.textContent).toContain(
      'erreur technique',
    );
    expect(isolatedDocument.body.textContent).not.toContain('Application content');
  });

  /**
   * Ces deux tests sont la garantie qu'il n'existe qu'une page d'erreur
   * technique : le repli de démarrage doit porter la même coquille et le même
   * contenu que `TechnicalErrorPage`.
   */
  it('Given_ApplicationBootstrapFailure_When_renderBootstrapErrorIsCalled_Then_TheSharedPageShellIsUsed', () => {
    // Given
    const isolatedDocument = render();

    // When
    const page = isolatedDocument.body.querySelector('main.technical-error-page');
    const panel = page?.querySelector('section.error-panel');

    // Then
    expect(page).not.toBeNull();
    expect(panel?.getAttribute('aria-labelledby')).toBe('technical-error-title');
    expect(isolatedDocument.getElementById('technical-error-title')).not.toBeNull();
  });

  it('Given_ApplicationBootstrapFailure_When_renderBootstrapErrorIsCalled_Then_TheSharedContentIsDisplayed', () => {
    // Given
    const isolatedDocument = render();

    // When
    const body = isolatedDocument.body;
    const retryButton = body.querySelector('button');
    const supportLink = body.querySelector('a');

    // Then
    expect(body.querySelector('h1')?.textContent).toBe(TECHNICAL_ERROR_CONTENT.title);
    expect(body.querySelector('.eyebrow')?.textContent).toBe(
      TECHNICAL_ERROR_CONTENT.eyebrow,
    );
    expect(body.querySelector('.error-description')?.textContent).toBe(
      TECHNICAL_ERROR_CONTENT.description,
    );
    expect(retryButton?.type).toBe('button');
    expect(retryButton?.textContent).toContain(TECHNICAL_ERROR_CONTENT.retryLabel);
    expect(supportLink?.getAttribute('href')).toBe(TECHNICAL_ERROR_CONTENT.supportHref);
  });

  it('Given_ApplicationBootstrapFailure_When_renderBootstrapErrorIsCalled_Then_NoTechnicalDetailLeaks', () => {
    // Given
    const isolatedDocument = render();

    // When
    const text = isolatedDocument.body.textContent ?? '';

    // Then
    expect(text).not.toContain('Error');
    expect(text).not.toContain('http');
    expect(text).not.toContain('/api/');
  });
});
