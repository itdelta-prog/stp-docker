import puppeteer from 'puppeteer';

export const launchBrowser = async (url) => {
  const browser = await puppeteer.launch({ headless: false, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    return { browser, page };
  } catch (err) {
    console.error('Failed to open page:', err);
    // close.
    await closeBrowser(browser);
    throw err;
  }
};

export const closeBrowser = async (browser) => {
  if (browser) await browser.close();
};