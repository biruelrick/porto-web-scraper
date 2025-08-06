import puppeteer from 'puppeteer';

export async function launchBrowser() {
  return puppeteer.launch({
    headless: false,
    slowMo: 50,
    defaultViewport: { width: 1440, height: 900 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
}
