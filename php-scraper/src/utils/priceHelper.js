export const parsePriceRange = (raw) => {
    if (!raw) return { priceMin: null, priceMax: null, priceAvg: null }

    const cleanedRaw = raw
        .replace(/\s/g, '') // Убираем пробелы
        .replace(/[^\d–-]/g, ''); // Оставляем только тире и цифры

    const [minStr, maxStr] = cleanedRaw.split(/[–-]/);
    const priceMin = Number(minStr);
    const priceMax = maxStr !== undefined ? Number(maxStr) : priceMin;
    const priceAvg = (priceMin + priceMax) / 2;

    return { priceMin, priceMax, priceAvg }
}