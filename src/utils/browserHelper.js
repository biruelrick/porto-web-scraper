// src/utils/browserHelper.js
import puppeteer from 'puppeteer';

/**
 * Launches a browser instance with debug options
 * @returns {Promise<puppeteer.Browser>}
 */
export async function launchBrowser() {
  return puppeteer.launch({
    headless: false, // 👉 mostra o navegador
    slowMo: 50,      // 👉 insere delay entre as ações (50ms)
    defaultViewport: { width: 1440, height: 900 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
}
