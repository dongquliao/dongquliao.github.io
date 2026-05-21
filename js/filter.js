// 筛选和排序逻辑
import { appState } from './state.js';
import { CONFIG } from './config.js';

export function matchesSearch(song, search) {
    if (!search) return true;
    const s = search.toLowerCase();
    if (song.title?.toLowerCase().includes(s)) return true;
    if (song.artist?.toLowerCase().includes(s)) return true;
    if (song.album?.toLowerCase().includes(s)) return true;
    if (song.composer?.toLowerCase().includes(s)) return true;
    if (song.artist_list) {
        for (let a of song.artist_list) {
            if (a?.toLowerCase().includes(s)) return true;
        }
    }
    if (song.composer_list) {
        for (let c of song.composer_list) {
            if (c?.toLowerCase().includes(s)) return true;
        }
    }
    return false;
}

export function filterSongs() {
    let songs = appState.allSongs;
    if (appState.currentCategory !== 'all') {
        songs = songs.filter(s => s.category === appState.currentCategory);
    }
    if (appState.currentSearch) {
        songs = songs.filter(s => matchesSearch(s, appState.currentSearch));
    }
    return songs;
}

export function sortSongs(songs) {
    return [...songs].sort((a, b) => {
        let aVal = a[appState.currentSortBy] || '';
        let bVal = b[appState.currentSortBy] || '';
        
        // 年份排序（数字）
        if (appState.currentSortBy === 'year') {
            aVal = parseInt(aVal) || 0;
            bVal = parseInt(bVal) || 0;
        }
        
        // 播放次数排序（数字）
        if (appState.currentSortBy === 'play_count') {
            aVal = a.play_count || 0;
            bVal = b.play_count || 0;
        }
        
        // 时长排序（数字，使用 duration_seconds）
        if (appState.currentSortBy === 'duration_seconds') {
            aVal = a.duration_seconds || 0;
            bVal = b.duration_seconds || 0;
        }
        
        // 字符串排序
        if (typeof aVal === 'string' && typeof bVal === 'string') {
            aVal = aVal.toLowerCase();
            bVal = bVal.toLowerCase();
        }
        
        if (appState.currentSortOrder === 'asc') {
            return aVal > bVal ? 1 : -1;
        } else {
            return aVal < bVal ? 1 : -1;
        }
    });
}

export function updateFilteredAndSort() {
    const filtered = filterSongs();
    const sorted = sortSongs(filtered);
    appState.setFilteredSongs(sorted);
    appState.resetDisplayCount();
    return sorted;
}