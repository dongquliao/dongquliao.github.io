// 主入口文件
import { appState } from './state.js';
import { fetchMusicData } from './api.js';
import { updateFilteredAndSort } from './filter.js';
import { renderTable } from './render.js';
import { updateCover, setupStickyCover } from './cover.js';
import { setupEventListeners, refreshObserver } from './events.js';
import { setupChartTabs } from './modal.js';
import { calculateStats } from './stats.js';

// 全局处理函数
window.handleSelectSong = (song, row, isManual = false) => {
    if (isManual) {
        appState.setSelectedSong(song, true);
    } else {
        appState.currentSelectedSong = song;
    }
    updateCover(song);
    // 高亮选中行
    document.querySelectorAll('.song-row').forEach(r => r.classList.remove('selected'));
    if (row) row.classList.add('selected');
};

window.handleShowLyrics = (song) => {
    import('./modal.js').then(modal => modal.showLyrics(song));
};

async function init() {
    try {
        // 加载数据
        const data = await fetchMusicData();
        appState.setAllSongs(data.songs);
        
        // 更新页面信息
        const updateInfo = document.getElementById('updateInfo');
        if (updateInfo) {
            updateInfo.innerHTML = `更新于 ${data.update_date} | 共 ${data.total_songs} 首歌`;
        }
        
        // 更新分类计数
        updateCategoryCounts();
        
        // 筛选和排序
        updateFilteredAndSort();
        
        // 渲染表格
        renderTable(window.handleSelectSong, window.handleShowLyrics);
        
        // 预计算统计数据
        appState.setStatsData(calculateStats());
        
        // 设置图表标签页
        setupChartTabs(appState.statsData);
        
        // 设置粘性封面
        setTimeout(setupStickyCover, 100);
        
        // 绑定事件（传入处理函数）
        setupEventListeners(window.handleSelectSong, window.handleShowLyrics);
        
    } catch (e) {
        console.error('初始化失败:', e);
        const updateInfo = document.getElementById('updateInfo');
        if (updateInfo) {
            updateInfo.innerHTML = '加载失败，请确保 OSS 配置正确';
        }
    }
}

function updateCategoryCounts() {
    const counts = { all: appState.allSongs.length };
    appState.allSongs.forEach(song => {
        counts[song.category] = (counts[song.category] || 0) + 1;
    });
    
    const tabs = document.querySelectorAll('.category-tab');
    tabs.forEach(tab => {
        const cat = tab.dataset.category;
        const count = counts[cat] || 0;
        if (cat === 'all') {
            tab.innerHTML = `全部 (${count})`;
        } else {
            tab.innerHTML = `${cat} (${count})`;
        }
    });
}

// 启动应用
init();