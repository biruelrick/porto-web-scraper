// src/index.js
import { scrapeData } from './scrapers/myTargetSite.js';

(async () => {
  const results = await scrapeData();

  console.log('✅ Dados extraídos:', results);
})();
