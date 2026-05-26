// 筛选和排序逻辑
import { appState } from './state.js';
import { CONFIG } from './config.js';

/**
 * 解析搜索字符串，支持双引号包裹的短语
 * 例如: '洛天依 "Hello World" COP' => ['洛天依', 'Hello World', 'COP']
 * @param {string} search - 原始搜索字符串
 * @returns {string[]} - 关键词数组（短语作为一个完整关键词）
 */
function parseSearchKeywords(search) {
    if (!search || typeof search !== 'string') return [];
    
    const keywords = [];
    let inQuotes = false;
    let currentKeyword = '';
    
    for (let i = 0; i < search.length; i++) {
        const char = search[i];
        
        if (char === '"') {
            // 遇到引号，切换状态
            if (inQuotes) {
                // 结束引号，添加当前关键词
                if (currentKeyword.trim()) {
                    keywords.push(currentKeyword.trim());
                }
                currentKeyword = '';
            }
            inQuotes = !inQuotes;
        } else if (char === ' ' && !inQuotes) {
            // 不在引号内遇到空格，分割关键词
            if (currentKeyword.trim()) {
                keywords.push(currentKeyword.trim());
            }
            currentKeyword = '';
        } else {
            // 普通字符，添加到当前关键词
            currentKeyword += char;
        }
    }
    
    // 添加最后一个关键词
    if (currentKeyword.trim()) {
        keywords.push(currentKeyword.trim());
    }
    
    return keywords;
}

/**
 * 检查歌曲是否匹配所有关键词
 * @param {Object} song - 歌曲对象
 * @param {string[]} keywords - 关键词数组
 * @returns {boolean} - 是否匹配所有关键词
 */
function matchesAllKeywords(song, keywords) {
    if (keywords.length === 0) return true;
    
    // 构建搜索文本（包含所有可能字段）
    const searchText = [
        song.title || '',
        song.artist || '',
        song.album || '',
        song.composer || '',
        ...(song.artist_list || []),
        ...(song.composer_list || [])
    ].join(' ').toLowerCase();
    
    // 检查每个关键词是否都出现在搜索文本中
    for (let keyword of keywords) {
        if (!searchText.includes(keyword.toLowerCase())) {
            return false;
        }
    }
    return true;
}

export function matchesSearch(song, search) {
    if (!search) return true;
    
    const keywords = parseSearchKeywords(search);
    if (keywords.length === 0) return true;
    
    return matchesAllKeywords(song, keywords);
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