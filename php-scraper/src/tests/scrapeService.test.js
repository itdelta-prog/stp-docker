import puppeteer from "puppeteer";
import { performance } from 'perf_hooks';
import { scrapeData } from "../services/scrapeService.js";
import { closeBrowser } from "../utils/puppeteerHelper.js";

const urls = [
    'https://stolni-lampy.heureka.cz/f:28108:1/',
    'https://sekacky.heureka.cz/',
    'https://pneumatiky.heureka.cz/',
    'https://parfemy.heureka.cz',
    'https://chytre-hodinky.heureka.cz',

    'https://plachty.heureka.cz/',
    'https://zahradni-domky.heureka.cz/',
    'https://stolni-lampy.heureka.cz/f:28124:1/',
    'https://kufry-na-naradi.heureka.cz/',
    'https://montazni-voziky.heureka.cz/',

    'https://mazaci-lisy-a-pistole.heureka.cz/',
    'https://kleste-armovaci.heureka.cz/',
    'https://baterie-motocykl.heureka.cz/',
    'https://kufry-motorku.heureka.cz/',
    'https://motorky.heureka.cz/',

    'https://ostatni-detska-kosmetika.heureka.cz/',
    'https://detske-oleje.heureka.cz/',
    'https://panske-holinky.heureka.cz/',
    'https://neoprenove-boty.heureka.cz/',
    'https://panske-sandaly.heureka.cz/',

    'https://panske-sportovni-bundy.heureka.cz/',
    'https://panska-saka.heureka.cz/',
    'https://panske-sortky.heureka.cz/',
    'https://panske-plavky.heureka.cz/',
    'https://panska-pyzama.heureka.cz/',

    'https://bazenove-sprchy.heureka.cz/',
    'https://bazeny.heureka.cz/',
    'https://dekorativni-vazy.heureka.cz/',
    'https://kvetiny.heureka.cz/',
    'https://budiky.heureka.cz/'

];

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
// Serial test
async function runMultipleScrapers(urls) {
    const {browser} = await puppeteer.launch();
    const startTime = performance.now();
    try {
        for (let i = 0; i < urls.length; i++) {
            const url = urls[i];
            try {
                const result = await scrapeData(url, browser);
                console.log(`Result for page ${i + 1}: `, result);
            } catch (err) {
                console.error(`Error durring scrapping page ${i+1} ${url}:`, err);
            }

            if (i < urls.length - 1) {
                await delay(3000);
            }
        }
    } finally {
        await closeBrowser(browser);
        const endTime = performance.now();
        const duration = endTime - startTime;
        console.log(`Total time: ${(duration / 1000).toFixed(2)} s`);
    }
}

runMultipleScrapers(urls);

// Parallel test
// (async () => {
//     const {browser} = await puppeteer.launch();
//     // const results = await scrapeData(urls[0]);
//     const results = await Promise.allSettled(
//         urls.map(url => scrapeData(url, browser))
//     );

//     console.log(results);

//     await closeBrowser(browser);
// })();
