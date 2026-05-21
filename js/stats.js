// 统计计算
import { appState } from './state.js';
import { CONFIG } from './config.js';
import { formatDuration } from './utils.js';

export function calculateStats() {
    let totalSeconds = 0;
    let categoryCount = { AI: 0, ボカロ: 0, 人声: 0, 纯音乐: 0 };
    let yearCount = {};
    let composerCount = {};
    let virtualSingerCount = {};
    let realSingerCount = {};
    let minYear = 3000, maxYear = 0;
    
    // 判断P主集合
    let pComposerSet = new Set();
    for (let name of Object.keys(CONFIG.COMPOSER_ALIAS_MAP)) {
        pComposerSet.add(name);
    }
    
    // 第一遍：识别P主
    for (let song of appState.allSongs) {
        let category = song.category;
        let comment = (song.comment || '').toLowerCase();
        let composerList = song.composer_list || [];
        
        let isPComposer = false;
        if (category === 'ボカロ') {
            if (!(comment.includes('翻调') && !comment.includes('feat.'))) {
                isPComposer = true;
            }
        } else if (category === '人声') {
            if (comment.includes('翻唱') && comment.includes('feat.')) {
                isPComposer = true;
            }
        } else if (category === '纯音乐') {
            if (comment.includes('伴奏') && comment.includes('feat.')) {
                isPComposer = true;
            }
        }
        
        if (isPComposer) {
            for (let c of composerList) {
                if (c && c.trim()) {
                    pComposerSet.add(c);
                }
            }
        }
    }
    
    // 第二遍：统计数据
    for (let song of appState.allSongs) {
        totalSeconds += song.duration_seconds || 0;
        if (categoryCount[song.category] !== undefined) categoryCount[song.category]++;
        
        let year = song.year;
        if (year && year !== '未知' && year !== '' && !isNaN(parseInt(year))) {
            let yearNum = parseInt(year);
            yearCount[year] = (yearCount[year] || 0) + 1;
            if (yearNum < minYear) minYear = yearNum;
            if (yearNum > maxYear) maxYear = yearNum;
        }
        
        let composerList = song.composer_list || [];
        let processedComposers = new Set();
        
        for (let c of composerList) {
            if (!c) continue;
            
            if (CONFIG.SPECIAL_P_COMPOSERS.has(c)) {
                if (song.category === 'ボカロ' && pComposerSet.has(c) && !processedComposers.has(c)) {
                    processedComposers.add(c);
                    composerCount[c] = (composerCount[c] || 0) + 1;
                }
            } else if (pComposerSet.has(c) && !processedComposers.has(c)) {
                processedComposers.add(c);
                composerCount[c] = (composerCount[c] || 0) + 1;
            }
        }
    }
    
    // 合并P主别名
    let mergedComposerCount = {};
    for (let [name, count] of Object.entries(composerCount)) {
        let mergedName = CONFIG.COMPOSER_ALIAS_MAP[name] || name;
        mergedComposerCount[mergedName] = (mergedComposerCount[mergedName] || 0) + count;
    }
    composerCount = mergedComposerCount;
    
    // 歌姬统计
    for (let song of appState.allSongs) {
        if (song.category === 'ボカロ') {
            if (song.vocaloid_artist && song.vocaloid_artist.virtual) {
                for (let v of song.vocaloid_artist.virtual) if (v) virtualSingerCount[v] = (virtualSingerCount[v] || 0) + 1;
            }
            if (song.vocaloid_artist && song.vocaloid_artist.real) {
                for (let r of song.vocaloid_artist.real) if (r) realSingerCount[r] = (realSingerCount[r] || 0) + 1;
            }
        }
        
        if (song.category === '人声' && song.artist_list) {
            for (let a of song.artist_list) if (a) realSingerCount[a] = (realSingerCount[a] || 0) + 1;
        }
    }
    
    // 补全年份空缺
    if (minYear <= maxYear) {
        for (let y = minYear; y <= maxYear; y++) {
            let yearStr = y.toString();
            if (!yearCount[yearStr]) yearCount[yearStr] = 0;
        }
    }
    
    let sortedYearCount = {};
    Object.keys(yearCount).sort((a, b) => parseInt(a) - parseInt(b)).forEach(key => {
        sortedYearCount[key] = yearCount[key];
    });
    
    return {
        totalDuration: formatDuration(totalSeconds),
        categoryCount,
        yearCount: sortedYearCount,
        composerCount,
        virtualSingerCount,
        realSingerCount
    };
}