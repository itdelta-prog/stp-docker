import { calculateMedian } from '../utils/calculateMedianHelper.js';
import { parsePriceRange } from '../utils/priceHelper.js';
import { launchBrowser, closeBrowser } from '../utils/puppeteerHelper.js';

async function getFirstProductPrice(page) {
    const priceText =  await page.evaluate(() => {
      const firstProduct = document.querySelector('.c-product');
      if (!firstProduct) return null;

      const priceEl = firstProduct.querySelector('.c-product__price');

      return priceEl?.textContent.trim() || null;
  });

  return  parsePriceRange(priceText);
}

export const scrapeData = async (category, providedBrowser = null, maxRetries = 3) => {
  let browser;
  let page;
  let shouldCloseBrowser;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const url = category;

      ({ browser, page, shouldCloseBrowser } = providedBrowser
        ? { browser: providedBrowser, page: await providedBrowser.newPage(), shouldCloseBrowser: false }
        : await (async () => {
          const { browser, page } = await launchBrowser(url);
          return { browser, page, shouldCloseBrowser: true }
        })()
      );

      await page.setRequestInterception(true);
      page.on('request', request => {
        const resourceType = request.resourceType();
        if (
          resourceType === 'image' ||
          resourceType === 'font'
        ) {
          request.abort();
        } else request.continue();
      });

      // Close "Accept cookies modal"
    try {
      await page.waitForSelector('button[aria-label="Souhlasit a zavřít"]', { timeout: 5000 });
      await page.click('button[aria-label="Souhlasit a zavřít"]');
    } catch (e) {}

      //Parsing

      await page.waitForSelector('li.e-badge--top', { timeout: 20000 });

      // Extract top product info (name, price, sellers count, reviews)
      const topProductData = await page.evaluate(() => {
          const topBadge = document.querySelector('li.e-badge--top');
          const productInfo = topBadge?.closest('.c-product__info');

          if(!productInfo) return null;

          const link = productInfo?.querySelector('.c-product__link');
          const productName = link?.textContent?.trim() || null;

          const priceText = productInfo?.querySelector('.c-product__price')
            .textContent
            .trim();

          const sellersTop = (() => {
            const el = productInfo?.querySelector('.c-product__shops');
            const match = el.textContent?.replace(/\s/g, '').match(/\d+/);
            return match ? Number(match[0]) : null;
          })();

          const reviewsTopText = productInfo?.querySelector('.c-product__review-count span')
            ?.textContent
            .trim();

          const reviewsTop = Number(reviewsTopText?.replace(/[^\d]/g, ''));

          return {
            productName,
            priceText,
            sellersTop,
            reviewsTop
          }
      });

      // Parse the price range string
      const { priceAvg: priceTop } = parsePriceRange(topProductData.priceText);

      // Get total number of products from the ::after pseudo-element content
      const productsTotal = await page.evaluate(() => {
          const titleCategoryHeader = document.querySelector('.l-category-search__heading');
          const content = window
            .getComputedStyle(titleCategoryHeader, '::after')
            .getPropertyValue('content');

          // The content will come in the format "\" (1 962 produktů)"\", so we clean it up
          const cleaned = content
                .replace(/^"(.*)"$/, '$1')
                .replace(/[^\d]/g, '');

          return Number(cleaned);
      });

      // Get total number of products from the ::after pseudo-element content
      const sellersCounts = await page.evaluate(() => {
        const products = Array.from(
          document.querySelectorAll('.c-product:not(.c-product--advisor)'))
          .slice(0, 10);

        return products.map(productEl => {
          const shopsEl = productEl.querySelector('.c-product__shops');
          if (!shopsEl) return 0;

          const digits = shopsEl
            .textContent
            .replace(/[^\d]/g, '');

          return digits ? Number(digits) : 0;
        })
      });

      const medianSellersTop10 = calculateMedian(sellersCounts);

      // Get the highest review count among the first top 3 products
      const maxReviewsTop3 = await page.evaluate (() => {
          const products = Array.from(
            document.querySelectorAll('.c-product:not(.c-product--advisor)'))
            .filter(product => product.querySelector('li.e-badge--top') !== null)
            .slice(0, 3);

          const reviewCounts = products.map(product => {
            const reviewEl = product?.querySelector('.c-product__review-count span');
            if (!reviewEl) return 0;

            const digits =  reviewEl.textContent.replace(/[^\d]/g, '');
            return digits ? Number(digits) : 0;
          });

          return Math.max(...reviewCounts);
      });

      const sortLinks = await page.$$('.c-ordering__link');

      // To avoid race conditions, always combine click() and waitForNavigation()
      // in a Promise.all() if navigation is expected.

      await Promise.all([
        page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
        sortLinks[1].click()
      ]);

      await new Promise(r => setTimeout(r, 2000));

      await page.waitForSelector('.c-product', { timeout: 20000 });

      const {priceMin: firstProductPriceMin} = await getFirstProductPrice(page);


      await Promise.all([
        page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
        sortLinks[3].click()
      ]);

      await new Promise(r => setTimeout(r, 2000));

      await page.waitForSelector('.c-product', { timeout: 20000 });

      const { priceMax: firstProductPriceMax } = await getFirstProductPrice(page);

      const result = {
        category: category.replace(/^https:\/\//, '').split('.')[0],
        topProduct: topProductData.productName,
        priceTop: priceTop,
        productsTotal: productsTotal,
        sellersTop: topProductData.sellersTop,
        medianSellersTop10: medianSellersTop10,
        reviewsTop: topProductData.reviewsTop,
        maxReviewsTop3: maxReviewsTop3,
        priceMin: firstProductPriceMin,
        priceMax: firstProductPriceMax
      };

      // if not needed null values
      // const result = Object.fromEntries(
      //   Object.entries(rawResult).filter(([_, value]) => Boolean(value))
      // );

      await page.close();
      if (shouldCloseBrowser) {
        await closeBrowser(browser);
      }

      return result;

    } catch (error) {
      console.warn(`Attempt ${attempt} failed: ${error.message}`);

      if(page && !page.isClosed) {
        await page.close().catch(() => {});
      }

      if (shouldCloseBrowser && browser) {
        await closeBrowser(browser).catch(() => {});
      }

      if (attempt === maxRetries) throw error;

      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }
};