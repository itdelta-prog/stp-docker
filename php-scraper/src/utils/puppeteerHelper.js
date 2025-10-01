import puppeteer from 'puppeteer';

export const launchBrowser = async (url) => {
  const browser = await puppeteer.launch({ headless: 'new',  args: ['--no-sandbox']});
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  return { browser, page };
};

export const closeBrowser = async (browser) => {
  if (browser) await browser.close();
};