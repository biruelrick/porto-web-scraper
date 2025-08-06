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
  // 1. INICIALIZAÇÃO DO BROWSER
  // ─────────────────────────────────────────────────────────────
  const browser = await launchBrowser();
  const page = await browser.newPage();

  try {
    console.log('🌐 Acessando página principal...');
    await page.goto(config.LOGIN_URL, { waitUntil: 'networkidle2' });
    console.log('📍 Página atual:', page.url());

    // ─────────────────────────────────────────────────────────────
    // 2. ACESSAR O MODAL DE LOGIN
    // ─────────────────────────────────────────────────────────────
    await page.waitForSelector('button[onclick="openLogin();"]', { visible: true });
    await page.click('button[onclick="openLogin();"]');

    // ─────────────────────────────────────────────────────────────
    // 3. PREENCHER USUÁRIO E SENHA
    // ─────────────────────────────────────────────────────────────
    await page.waitForSelector('#logonPrincipal', { visible: true });
    await page.type('#logonPrincipal', config.USERNAME, { delay: 50 });
    await page.type('input[name="password"]', config.PASSWORD, { delay: 50 });

    await page.waitForSelector('#inputLogin', { visible: true });
    await page.click('#inputLogin');

    console.log('🔐 Login aceito. Aguardando SUSEP...');

    // ─────────────────────────────────────────────────────────────
    // 4. SELEÇÃO DA SUSEP 72885J
    // ─────────────────────────────────────────────────────────────
    await page.waitForSelector('select[name="susep"]', { visible: true });
    await page.focus('select[name="susep"]');
    await page.select('select[name="susep"]', '72885J');

    const selected = await page.$eval('select[name="susep"]', el => el.value);
    console.log('✅ SUSEP selecionada:', selected);

    // ─────────────────────────────────────────────────────────────
    // 5. CONFIRMAÇÃO DO LOGIN APÓS SUSEP
    // ─────────────────────────────────────────────────────────────
    await page.waitForSelector('#btnAvancarSusep', { visible: true });
    await page.click('#btnAvancarSusep');

    // 💡 Captura um screenshot após o clique em "Entrar" com SUSEP
    await page.screenshot({ path: 'screenshot-pos-susep.png', fullPage: true });

    console.log('📸 Screenshot salvo após clicar em "Entrar" com SUSEP');

    // Aguarda o fim do carregamento (sumir o texto "Carregando" do modal)
    await page.waitForFunction(() => {
      const loaderText = document.querySelector('.ps-loader span');
      return !loaderText || loaderText.innerText.trim() !== 'Carregando';
    }, { timeout: 20000 });

    console.log('✅ Modal de carregamento finalizado.');

    // Aguarda o header da dashboard
    await page.waitForSelector('header', { timeout: 10000 });
    console.log('✅ Portal principal carregado com sucesso.');
    console.log('📍 Página atual:', page.url());

    // ─────────────────────────────────────────────────────────────
    // 6. FECHA O MODAL DE PROPAGANDA SE EXISTENTE
    // ─────────────────────────────────────────────────────────────
    console.log('🧹 Verificando presença de modal de propaganda...');

    const modalCloseBtn = await page.$('span[data-testid="icon-close"]');
    if (modalCloseBtn) {
      await page.click('span[data-testid="icon-close"]');
      console.log('✅ Modal de propaganda fechado.');
      await page.waitForTimeout(500);
    } else {
      console.log('ℹ️ Nenhum modal de propaganda detectado.');
    }

    // ─────────────────────────────────────────────────────────────
    // 7. ACESSAR O MENU "COBRANÇA"
    // ─────────────────────────────────────────────────────────────
    console.log('🧭 Aguardando menu "Cobrança"...');
    await page.waitForSelector('a[data-gtm-name="cobranca"]', { visible: true });
    await Promise.all([
      page.click('a[data-gtm-name="cobranca"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
    ]);

    console.log('✅ Redirecionado para tela de Cobrança.');
    console.log('📍 Página atual:', page.url());


    // ─────────────────────────────────────────────────────────────
    // 8. ACESSAR "CONSULTA DE PARCELAS"
    // ─────────────────────────────────────────────────────────────
    console.log('🧭 Aguardando item de menu "Consulta de parcelas"...');

    // Aguarda até o menu ser renderizado via Angular
    await page.waitForFunction(() => {
      return Array.from(document.querySelectorAll('.menu-item.c-p'))
        .some(el => el.textContent.includes('Consulta de parcelas'));
    }, { timeout: 20000 });

    console.log('🔍 Menu encontrado. Acessando...');


    // Executa o clique diretamente via evaluate
    await page.evaluate(() => {
      const item = Array.from(document.querySelectorAll('.menu-item.c-p'))
        .find(el => el.textContent.includes('Consulta de parcelas'));
      if (item) item.click();
    });

    console.log('✅ Consulta de parcelas acessada.');

    /*
     * ⏸️ Importante: aqui paramos intencionalmente para inspeção visual.
     * O browser NÃO será fechado para que você possa analisar a interface.
     */
    console.log('🛑 Navegador mantido aberto para inspeção manual.');


    // ─────────────────────────────────────────────────────────────
    // 6. PRONTO PARA SCRAPING OU NAVEGAÇÃO ADICIONAL
    // ─────────────────────────────────────────────────────────────
    // Exemplo:
    // await page.click('nav a[href="/meus-clientes"]');
    // await page.waitForSelector('table#clientes');

  } catch (err) {
    // ─────────────────────────────────────────────────────────────
    // 7. TRATAMENTO DE ERROS
    // ─────────────────────────────────────────────────────────────
    console.error('❌ Erro durante login com SUSEP:', err.message);

  } finally {
    // ─────────────────────────────────────────────────────────────
    // 8. FECHAMENTO DO BROWSER
    // ─────────────────────────────────────────────────────────────
    await browser.close();
  }
}
