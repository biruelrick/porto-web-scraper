// src/scrapers/myTargetSite.js
import { launchBrowser } from '../utils/browserHelper.js';
import { config } from '../config.js';

/**
 * Logs into the Porto Seguro portal and navigates after login
 * @returns {Promise<void>}
 */
export async function scrapeData() {
  const browser = await launchBrowser();
  const page = await browser.newPage();

  try {
    console.log('🌐 Acessando página de login...');
    await page.goto(config.LOGIN_URL, { waitUntil: 'networkidle2' });

    // Aguarda o campo de usuário aparecer
    await page.waitForSelector('#logonPrincipal', { visible: true });

    // Preenche usuário e senha
    await page.type('#logonPrincipal', config.USERNAME, { delay: 50 });
    await page.type('input[name="password"]', config.PASSWORD, { delay: 50 });

    // Clica no botão "Entrar"
    await Promise.all([
      page.click('#inputLogin'),
      page.waitForNavigation({ waitUntil: 'networkidle2' })
    ]);

    console.log('✅ Login realizado com sucesso.');

    // Aqui você pode continuar a navegação pós-login
    // ex: await page.click('#menuX'); await page.waitForSelector('#tabelaY');

  } catch (error) {
    console.error('❌ Falha ao realizar login:', error);
  } finally {
    await browser.close();
  }
}
