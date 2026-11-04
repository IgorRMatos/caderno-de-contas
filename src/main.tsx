import { render } from 'preact';
import './styles/fonts.css';
import './styles/tokens.css';
import './styles/components.css';
import './styles/screens.css';

/**
 * T0: só a fundação (build, temas, fontes, CSP). O shell de verdade
 * (cabeçalho, rotas, telas) chega em T6/T7.
 */
function App() {
  return (
    <main class="page">
      <div class="sheet" style={{ minHeight: '70vh' }} />
    </main>
  );
}

render(<App />, document.getElementById('app')!);
