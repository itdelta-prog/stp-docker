import puppeteer from 'puppeteer-extra';
import dotenv from 'dotenv';
import StealthPlugin from 'puppeteer-extra-plugin-stealth'

dotenv.config();
puppeteer.use(StealthPlugin());

export const launchBrowser = async (url) => {
  const browser = await puppeteer.launch({ 
    headless: "new", 
    args: [
    '--no-sandbox',
    '--proxy-server=http://brd.superproxy.io:33335',
    '--ignore-certificate-errors '
  ] });
  return { browser };
};

export const closeBrowser = async (browser) => {
  if (browser) await browser.close();
};