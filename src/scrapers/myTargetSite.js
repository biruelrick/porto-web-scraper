// src/scrapers/myTargetSite.js
// *******************************************************************************
// IMPORTS
// *******************************************************************************
import { launchBrowser } from '../utils/browserHelper.js';
import { config } from '../config.js';

/**
 * Automates the login process into Porto Seguro's Corretor Online Portal,
 * including SUSEP selection and dashboard access.
 */
export async function scrapeData() {
  // ─────────────────────────────────────────────────────────────
  // 1. INICIALIZAÇÃO DO BROWSER COM STEALTH, USER-AGENT E PROXY
  // ─────────────────────────────────────────────────────────────
  const browser = await launchBrowser();
  const page = await browser.newPage();

  try {
    console.log('🌐 1) Acessando página principal...');
    await page.goto(config.LOGIN_URL, { waitUntil: 'networkidle2' });
    console.log('📍 1) Página atual:', page.url());

    // ─────────────────────────────────────────────────────────────
    // 2. ACESSAR O MODAL DE LOGIN
    // ─────────────────────────────────────────────────────────────
    console.log('🔐 2) Aguardando botão "Entrar"...');
    await page.waitForSelector('button[onclick="openLogin();"]', { visible: true });
    await page.click('button[onclick="openLogin();"]');

// ─────────────────────────────────────────────────────────────
// 3. PREENCHER USUÁRIO E SENHA
// ─────────────────────────────────────────────────────────────
    console.log('👤 3) Preenchendo usuário e senha...');
    await page.waitForSelector('#logonPrincipal', { visible: true });
    await page.type('#logonPrincipal', config.USERNAME, { delay: 50 });
    await page.type('input[name="password"]', config.PASSWORD, { delay: 50 });

    // dispara o clique E aguarda a nova tela carregar (networkidle2 ou o select)
    await page.click('#inputLogin');
    //   page.waitForNavigation({ waitUntil: 'networkidle2' }),

    console.log('🔐 3) Login aceito e página recarregada. Aguardando SUSEP...');

    // ─────────────────────────────────────────────────────────────
    // 4. SELEÇÃO DA SUSEP 72885J
    // ─────────────────────────────────────────────────────────────
    await page.waitForSelector('select[name="susep"]', { visible: true, timeout: 30000 });
    await page.select('select[name="susep"]', '72885J');
    const selected = await page.$eval('select[name="susep"]', el => el.value);
    console.log('✅ 4) SUSEP selecionada:', selected);

    // ─────────────────────────────────────────────────────────────
    // 5. CONFIRMAÇÃO DO LOGIN APÓS SUSEP
    // ─────────────────────────────────────────────────────────────
    await page.waitForSelector('#btnAvancarSusep', { visible: true });
    await page.click('#btnAvancarSusep');
    await page.screenshot({ path: 'screenshot-pos-susep.png', fullPage: true });
    console.log('📸 5) Screenshot salvo após clicar em "Entrar" com SUSEP');

    await page.waitForFunction(() => {
      const loaderText = document.querySelector('.ps-loader span');
      return !loaderText || loaderText.innerText.trim() !== 'Carregando';
    }, { timeout: 20000 });

    await page.waitForSelector('header', { timeout: 10000 });
    console.log('✅ 5) Portal principal carregado com sucesso.');
    console.log('📍 5) Página atual:', page.url());

    // ─────────────────────────────────────────────────────────────
    // 6. FECHA O MODAL DE PROPAGANDA SE EXISTENTE
    // ─────────────────────────────────────────────────────────────
    console.log('🧹 6) Verificando presença de modal de propaganda...');
    const modalCloseBtn = await page.$('span[data-testid="icon-close"]');
    if (modalCloseBtn) {
      await page.click('span[data-testid="icon-close"]');
      console.log('✅ 6) Modal de propaganda fechado.');
    } else {
      console.log('ℹ️ 6) Nenhum modal de propaganda detectado.');
    }

    // ─────────────────────────────────────────────────────────────
    // 7. ACESSAR O MENU "COBRANÇA"
    // ─────────────────────────────────────────────────────────────
    console.log('🧭 7) Aguardando menu "Cobrança"...');
    await page.waitForSelector('a[data-gtm-name="cobranca"]', { visible: true, timeout: 60000 });
    page.click('a[data-gtm-name="cobranca"]');
    // page.waitForNavigation({ waitUntil: 'networkidle2' })
    console.log('✅ 7) Redirecionado para tela de Cobrança.');
    console.log('📍 7) Página atual:', page.url());

    // ─────────────────────────────────────────────────────────────
    // 8. ACESSAR "CONSULTA DE PARCELAS" DENTRO DO IFRAME #centro
    // ─────────────────────────────────────────────────────────────
    console.log('🧭 8) Aguardando carregamento do iframe "#centro"...');
    await page.waitForSelector('iframe#centro', { visible: true, timeout: 30000 });
    const iframeElementHandle = await page.$('iframe#centro');
    const targetFrame = await iframeElementHandle.contentFrame();

    if (!targetFrame) throw new Error('❌ 8) Frame interno do iframe#centro não foi acessado.');
    console.log('✅ 8) Frame interno carregado. Procurando menu "Consulta de parcelas"...');

    await targetFrame.waitForFunction(() => {
      return Array.from(document.querySelectorAll('.menu-item.c-p'))
        .some(el => el.textContent?.includes('Consulta de parcelas'));
    }, { timeout: 20000 });

    console.log('🔍 8) Menu "Consulta de parcelas" encontrado. Clicando...');
    await targetFrame.evaluate(() => {
      const el = Array.from(document.querySelectorAll('.menu-item.c-p'))
        .find(el => el.textContent?.includes('Consulta de parcelas'));
      if (el) el.click();
    });

    console.log('⏳ 8) Aguardando carregamento da view de "Consulta de parcelas"...');
    await targetFrame.waitForFunction(() => {
      const h2 = document.querySelector('h2');
      return h2 && h2.textContent.toLowerCase().includes('consulta de parcelas');
    }, { timeout: 15000 });

    console.log('✅ 8) View de "Consulta de parcelas" carregada com sucesso.');
    console.log('🛑 8) Navegador mantido aberto para inspeção manual.');

    await page.waitForTimeout(60000); // 1 minuto parado

  } catch (err) {
    console.error('❌ Erro:', err.message);
  } finally {
    // ─────────────────────────────────────────────────────────────
    // 9. FECHAMENTO DO BROWSER
    // ─────────────────────────────────────────────────────────────
    await browser.close();
    // console.log('👋 9) Navegador fechado.');
  }
}
