const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  await p.goto('https://qoya-furniture.vercel.app/collections', { waitUntil: 'networkidle' });
  console.log('=== nav + category links ===');
  const links = await p.$$eval('a[href^="/collections"]', as => as.map(a => a.getAttribute('href') + ' :: ' + a.textContent.trim().replace(/\s+/g, ' ')).slice(0, 40));
  console.log(links.join('\n'));
  await p.screenshot({ path: 'C:/Users/sheri/AppData/Local/Temp/opencode/shots/collections-baseline.png', fullPage: true });
  console.log('saved baseline screenshot');
  await b.close();
})();
