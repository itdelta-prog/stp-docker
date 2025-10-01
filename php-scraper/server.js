import express from 'express';
import { getData } from './src/controllers/scrapeController.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/api/get-data', getData);

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});