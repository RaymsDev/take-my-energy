import { APP_BASE_HREF } from '@angular/common';
import { renderApplication } from '@angular/platform-server';
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import bootstrap from './src/main.server';

// The Express app is exported so that it can be used by serverless Functions.
export function app(): express.Express {
  const server = express();
  const serverDistFolder = dirname(fileURLToPath(import.meta.url));
  const browserDistFolder = resolve(serverDistFolder, '../browser');
  const indexHtml = join(serverDistFolder, 'index.server.html');

  server.set('view engine', 'html');
  server.set('views', browserDistFolder);

  const apiUrl = process.env['API_URL'];
  if (apiUrl) {
    server.use(
      '/api',
      createProxyMiddleware({
        target: apiUrl,
        changeOrigin: true,
      }),
    );
  } else {
    console.warn('[server] API_URL is not set — /api requests will return 502');
    server.use('/api', (_req, res) => {
      res.status(502).json({ error: 'API_URL not configured' });
    });
  }

  // Serve static files from /browser
  server.use(
    express.static(browserDistFolder, {
      maxAge: '1y',
      index: 'index.html',
    }),
  );

  // All regular routes use the Angular engine
  server.get('(.*)', async (req, res, next) => {
    const { protocol, originalUrl, baseUrl, headers } = req;
    try {
      const html = await renderApplication(bootstrap, {
        document: indexHtml,
        url: `${protocol}://${headers.host}${originalUrl}`,
        platformProviders: [{ provide: APP_BASE_HREF, useValue: baseUrl }],
      });
      res.send(html);
    } catch (err) {
      next(err);
    }
  });

  return server;
}

function run(): void {
  const port = process.env['PORT'] || 4000;

  // Start up the Node server
  const server = app();
  server.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

run();
