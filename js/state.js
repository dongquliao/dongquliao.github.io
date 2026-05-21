// 应用状态管理
import { CONFIG } from './config.js';

class AppState {
    constructor() {
        this.allSongs = [];
        this.filteredSongs = [];
        this.currentCategory = 'all';
        this.currentSearch = '';
        this.currentSortBy = 'title';
        this.currentSortOrder = 'asc';
        this.currentSelectedSong = null;
        this.currentDisplayCount = CONFIG.PAGE_SIZE;
        this.isLoadingMore = false;
        this.statsData = null;
        this.totalDurationStr = '';
        
        // 图表缩放状态
        this.composerZoomLevel = 1;
        this.composerPanOffset = 0;
        this.virtualZoomLevel = 1;
        this.virtualPanOffset = 0;
        this.singerZoomLevel = 1;
        this.singerPanOffset = 0;
        
        // 新增：手动选择标志
        // true: 用户手动点击选择了一首歌
        // false: 还没有手动选择过，或者列表内容变化后需要清除
        this.isManuallySelected = false;
    }
    
    setAllSongs(songs) {
        this.allSongs = songs;
    }
    
    setFilteredSongs(songs) {
        this.filteredSongs = songs;
    }
    
    setCurrentCategory(category) {
        this.currentCategory = category;
    }
    
    setCurrentSearch(search) {
        this.currentSearch = search;
    }
    
    setSort(field, order) {
        this.currentSortBy = field;
        this.currentSortOrder = order;
    }
    
    setSelectedSong(song, isManual = false) {
        this.currentSelectedSong = song;
        if (isManual) {
            this.isManuallySelected = true;
        }
    }
    
    // 重置手动选择状态（列表内容变化时调用）
    resetManualSelection() {
        this.isManuallySelected = false;
    }
    
    // 清除手动选择标志（不改变当前选中的歌曲，但标记为未手动选择）
    clearManualFlag() {
        this.isManuallySelected = false;
    }
    
    // 检查是否应该自动选择第一首歌
    shouldAutoSelect() {
        return !this.isManuallySelected;
    }
    
    resetDisplayCount() {
        this.currentDisplayCount = CONFIG.PAGE_SIZE;
    }
    
    increaseDisplayCount() {
        this.currentDisplayCount = Math.min(this.currentDisplayCount + CONFIG.PAGE_SIZE, this.filteredSongs.length);
    }
    
    setLoadingMore(loading) {
        this.isLoadingMore = loading;
    }
    
    setStatsData(data) {
        this.statsData = data;
    }
    
    setTotalDurationStr(str) {
        this.totalDurationStr = str;
    }
    
    getDisplaySongs() {
        return this.filteredSongs.slice(0, this.currentDisplayCount);
    }
    
    hasMore() {
        return this.currentDisplayCount < this.filteredSongs.length;
    }
}

export const appState = new AppState();