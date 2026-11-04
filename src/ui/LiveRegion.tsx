import { anuncio } from '../state/anuncio.js';

export function LiveRegion() {
  return (
    <div id="anuncio" class="sr-only" aria-live="polite" aria-atomic="true">
      {anuncio.value}
    </div>
  );
}
