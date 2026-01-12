import express from 'express';
import { getData } from './src/controllers/scrapeController.js';
import { getData as getDataV2 } from './src/controllers/scrapeControllerV2.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/api/get-data', getData);
app.get('/api/v2/get-data', getDataV2);


app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});