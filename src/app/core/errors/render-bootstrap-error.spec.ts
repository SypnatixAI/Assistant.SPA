import { renderBootstrapError } from './render-bootstrap-error';

describe('renderBootstrapError', () => {
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
    expect(isolatedDocument.body.textContent).not.toContain(
      'Application content',
    );
  });
});
