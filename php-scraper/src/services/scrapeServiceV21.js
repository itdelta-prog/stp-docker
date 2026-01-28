import { calculateMedian } from "../utils/calculateMedianHelper.js";
import { parsePriceRange } from "../utils/priceHelper.js";
import { launchBrowser, closeBrowser } from "../utils/puppeteerHelper.js";

async function getFirstProductPrice(page) {
  const priceText = await page.evaluate(() => {
    const firstProduct = document.querySelector(".c-product");
    if (!firstProduct) return null;

    const priceEl = firstProduct.querySelector(".c-product__price");

    return priceEl?.textContent.trim() || null;
  });

  return parsePriceRange(priceText);
}

const newPageLoadAttempt = async (browser, category) => {
  const page = await browser.newPage();
  await page.setRequestInterception(true);
  page.on("request", (request) => {
    const resourceType = request.resourceType();
    if (resourceType === "image" || resourceType === "font") {
      request.abort();
    } else request.continue();
  });
  await page.goto(category, { waitUntil: "domcontentloaded" });
  return page;
};

export const scrapeData = async (category, maxRetries = 3) => {
  if (!category || typeof category !== "string") {
    throw new Error("Invalid category URL");
  }

  let browser;
  let page;
  const { page: currPage, browser: currBrowser } = await launchBrowser(category);
  page = currPage;
  browser = currBrowser;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 1) {
        page = await newPageLoadAttempt(browser, category);
      }
      // Close "Accept cookies modal"
      try {
        await page.waitForSelector('button[aria-label="Souhlasit a zavřít"]', {
          timeout: 5000,
        });
        await page.click('button[aria-label="Souhlasit a zavřít"]');
      } catch (e) {
        console.warn("Cookies modal not found:", e);
      }
      break;
    } catch (error) {
      console.error(`Attempt ${attempt} - Error loading page:`, error);
      await page.close();
      await closeBrowser(browser);
      if (attempt === maxRetries) {
        throw new Error("Failed to load page after multiple attempts");
      }
    }
  }

  //Parsing
  let topProductData = [];
  try {
    await page.waitForSelector("li.e-badge--top", { timeout: 10000 });

    // Extract top product info (name, price, sellers count, reviews)
    topProductData = await page.evaluate(() => {
      const topBadges = Array.from(
        document?.querySelectorAll("li.e-badge--top") ?? [],
      );
      return (
        topBadges
          .map((badge) => {
            const topNumberText = badge.textContent.trim();
            const topNumberMatch = topNumberText.match(/\d+/);
            const topNumber = topNumberMatch ? Number(topNumberMatch[0]) : null;

            if (!topNumber) {
              return null;
            }

            const productInfo = badge?.closest(".c-product__info");

            if (!productInfo) return null;

            const link = productInfo?.querySelector(".c-product__link");
            const productName = link?.textContent?.trim() || null;

            const priceText = productInfo
              ?.querySelector(".c-product__price")
              .textContent.trim();

            const reviewsPercentage =
              productInfo
                .querySelector(".c-rating-widget__value")
                ?.textContent?.trim() ?? "";
            const reviewNumMatch = reviewsPercentage.match(/\d+/);
            const reviewNum = reviewNumMatch ? Number(reviewNumMatch[0]) : null;

            const sellersTop = (() => {
              const el = productInfo?.querySelector(".c-product__shops");
              const match = el.textContent?.replace(/\s/g, "").match(/\d+/);
              return match ? Number(match[0]) : 1;
            })();

            const reviewsTopText = productInfo
              ?.querySelector(".c-product__review-count span")
              ?.textContent.trim();

            const reviewsTop = Number(reviewsTopText?.replace(/[^\d]/g, ""));

            return {
              topNumber,
              productName,
              priceText,
              sellersTop,
              reviewsTop,
              reviewNum,
            };
          })
          ?.filter(Boolean)
          .sort((a, b) => a.topNumber - b.topNumber) ?? []
      );
    });
  } catch (e) {
    topProductData = [];
  }

  const topBadgesWithPrice = topProductData.map((data) => {
    return {
      ...data,
      ...parsePriceRange(data.priceText),
    };
  });
  // Parse the price range string

  // Get total number of products from the ::after pseudo-element content
  const productsTotal = await page.evaluate(() => {
    const titleCategoryHeader = document.querySelector(
      ".l-category-search__heading",
    );
    const content = window
      .getComputedStyle(titleCategoryHeader, "::after")
      .getPropertyValue("content");

    // The content will come in the format "\" (1 962 produktů)"\", so we clean it up
    const cleaned = content.replace(/^"(.*)"$/, "$1").replace(/[^\d]/g, "");

    return Number(cleaned);
  });

  const sortLinks = await page.$$(".c-ordering__link");

  // To avoid race conditions, always combine click() and waitForNavigation()
  // in a Promise.all() if navigation is expected.

  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 20000 })
          .then(res => {
            console.log(`[DONE] Navigation event fired. Status: ${res ? res.status() : 'N/A'}`);
            return res;
          }),
        
    // Action promise
    sortLinks[1].click().then(() => console.log(`[INFO] Click executed successfully.`))
  ]);
  await new Promise(r => setTimeout(r, 2000));

  await page.waitForSelector(".c-product", { timeout: 20000 });

  const { priceMin: firstProductPriceMin } = await getFirstProductPrice(page);
  

  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 20000 })
          .then(res => {
            console.log(`[DONE] Navigation event fired. Status: ${res ? res.status() : 'N/A'}`);
            return res;
          }),
        
    // Action promise
    sortLinks[3].click().then(() => console.log(`[INFO] Click executed successfully.`))
  ]);
  await new Promise(r => setTimeout(r, 2000));

  await page.waitForSelector(".c-product", { timeout: 20000 });

  const { priceMax: firstProductPriceMax } = await getFirstProductPrice(page);

  const formattedTopBadges = topBadgesWithPrice.map((data) => {
    const topStr = `TOP ${data.topNumber}`
    return {
      name: data.productName,
      priceMin: data.priceMin,
      priceMax: data.priceMax,
      reviewsNumber: data.reviewsTop,
      reviewsPercentage: data.reviewNum,
      sellers: data.sellersTop,
      position: topStr,
    };
  });

  const maxLenOfTops = Math.min(5, formattedTopBadges?.length ?? 0)

  const result = {
    category: category.replace(/^https:\/\//, "").split(".")[0],
    categoryProductsTotal: productsTotal,
    categoryPriceMin: firstProductPriceMin,
    categoryPriceMax: firstProductPriceMax,
    productsTop:
      formattedTopBadges?.length > 0 ? formattedTopBadges.slice(0, maxLenOfTops) : [],
  };

  await page.close();
  await closeBrowser(browser);
  return result;
};
