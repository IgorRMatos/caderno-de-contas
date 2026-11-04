import { createHash } from 'node:crypto';
import type { Plugin } from 'vite';

/**
 * D12 — CSP verificável só no build (nunca no dev, que precisa de eval/websocket do HMR).
 * Calcula o hash sha256 do script de tema inline (D7) e monta a meta CSP com
 * `connect-src 'none'`, tornando "nenhum dado sai" verificável no HTML final.
 */
export function cspPlugin(): Plugin {
  return {
    name: 'caderno:csp',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        const scriptMatch = html.match(/<script id="theme-script">([\s\S]*?)<\/script>/);
        if (!scriptMatch) {
          throw new Error('cspPlugin: script#theme-script não encontrado no index.html (D7).');
        }
        const scriptContent = scriptMatch[1] ?? '';
        const hash = createHash('sha256').update(scriptContent, 'utf8').digest('base64');

        const csp = [
          "default-src 'self'",
          `script-src 'self' 'sha256-${hash}'`,
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data:",
          "font-src 'self'",
          "connect-src 'none'",
          "object-src 'none'",
          "base-uri 'none'",
          "form-action 'none'",
        ].join('; ');

        return html.replace(
          '</head>',
          `    <meta http-equiv="Content-Security-Policy" content="${csp}" />\n  </head>`,
        );
      },
    },
  };
}

/**
 * Preload das 2 fontes críticas de LCP (D14): Fraunces (variável, cobre 700 e
 * demais pesos num só arquivo) e Source Sans 3 400, só subset latin (o mais
 * provável no primeiro paint). Resolve o nome final com hash via `ctx.bundle`,
 * então só roda no build.
 */
export function fontPreloadPlugin(): Plugin {
  const alvos = [
    { contains: 'fraunces-latin-opsz-normal', excludes: 'latin-ext' },
    { contains: 'source-sans-3-latin-400-normal', excludes: 'latin-ext' },
  ];

  return {
    name: 'caderno:font-preload',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        if (!ctx.bundle) return html;

        const links: string[] = [];
        for (const alvo of alvos) {
          for (const asset of Object.values(ctx.bundle)) {
            if (asset.type !== 'asset') continue;
            const names = asset.originalFileNames ?? [];
            const match = names.some(
              (n) => n.includes(alvo.contains) && !n.includes(alvo.excludes),
            );
            if (match) {
              links.push(
                `    <link rel="preload" href="/${asset.fileName}" as="font" type="font/woff2" crossorigin />`,
              );
              break;
            }
          }
        }

        if (links.length === 0) return html;
        return html.replace('</head>', `${links.join('\n')}\n  </head>`);
      },
    },
  };
}
