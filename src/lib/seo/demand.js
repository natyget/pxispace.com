import { getServerApiBaseUrl } from '@/lib/apiBase';
import { ssrFetchJson } from '@/lib/ssrFetch';

// The demand votes of one city (contract: "Demand votes"): the areas and genres to pick from, and the top lines.
// Null when the API did not answer or has nothing to pick from, so the hub leaves the block out rather than offer
// a vote it cannot count.
const text = (value) => typeof value === 'string' && value.trim() !== '';

export async function fetchCityDemand(cityCode) {
  if (!cityCode) return null;
  const url = `${getServerApiBaseUrl()}/api/public/demand?city=${encodeURIComponent(cityCode)}`;
  const { status, data } = await ssrFetchJson(url, { revalidate: 300, logTag: 'demand' });
  if (status !== 200 || !data || !Array.isArray(data.areas) || !Array.isArray(data.genres) || !Array.isArray(data.top)) {
    return null;
  }
  const areas = data.areas.filter(text);
  const genres = data.genres.filter(text);
  if (!areas.length || !genres.length) return null;
  const top = data.top.filter((row) => row && text(row.area) && text(row.genre) && Number.isFinite(row.count));
  return { areas, genres, top };
}
