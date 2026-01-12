import { scrapeData } from '../services/scrapeServiceV2.js';

export const getData = async (req, res) => {
  const { category } = req.query;
  if (!category) {
    return res.status(400).json({ error: 'Missing "category" query parameter' });
  }

  try {
    const data = await scrapeData(category);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to scrape data',
      message: error.message
    });
  }
};