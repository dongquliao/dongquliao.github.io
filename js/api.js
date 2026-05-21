// 数据获取
import { CONFIG } from './config.js';

export async function fetchMusicData() {
    try {
        const response = await fetch(CONFIG.DATA_URL);
        const data = await response.json();
        return data;
    } catch (e) {
        console.error('Failed to fetch music data:', e);
        throw e;
    }
}