// 模态框逻辑
import { appState } from './state.js';
import { escapeHtml } from './utils.js';
import { renderAllCharts, zoomIn, zoomOut, resetZoom } from './charts.js';
import { calculateStats } from './stats.js';

export function openStatsModal() {
    const modal = document.getElementById('statsModal');
    const modalTitle = document.getElementById('modalStatsTitle');
    
    if (!appState.statsData) {
        appState.setStatsData(calculateStats());
    }
    
    modalTitle.innerHTML = `📊 音乐库统计（总时长：${appState.statsData.totalDuration}）`;
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // 重置缩放状态
    appState.composerZoomLevel = 1;
    appState.composerPanOffset = 0;
    appState.virtualZoomLevel = 1;
    appState.virtualPanOffset = 0;
    appState.singerZoomLevel = 1;
    appState.singerPanOffset = 0;
    
    setTimeout(() => renderAllCharts(appState.statsData), 100);
}

export function closeStatsModal() {
    const modal = document.getElementById('statsModal');
    if (modal) modal.style.display = 'none';
    document.body.style.overflow = '';
}

export function showLyrics(song) {
    const modal = document.getElementById('lyricModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    if (!modal || !modalTitle || !modalBody) {
        console.error('歌词模态框元素未找到');
        return;
    }
    
    console.log('打开歌词:', song.title); // 调试日志
    
    modalTitle.innerHTML = `${escapeHtml(song.title)} - ${escapeHtml(song.artist)}`;
    modalBody.innerHTML = (song.lyrics && song.lyrics.trim()) 
        ? `<pre style="white-space: pre-wrap; font-family: inherit; margin: 0;">${escapeHtml(song.lyrics)}</pre>` 
        : '<div class="no-lyrics">这首歌没有歌词文件</div>';
    modal.style.display = 'flex';
}

export function closeLyricModal() {
    const modal = document.getElementById('lyricModal');
    if (modal) modal.style.display = 'none';
}

export function setupChartTabs(statsData) {
    const tabs = document.querySelectorAll('.chart-tab-btn');
    const panels = {
        category: document.getElementById('chartPanelCategory'),
        year: document.getElementById('chartPanelYear'),
        composer: document.getElementById('chartPanelComposer'),
        virtual: document.getElementById('chartPanelVirtual'),
        singer: document.getElementById('chartPanelSinger')
    };
    
    tabs.forEach(tab => {
        // 移除旧的事件监听器
        const newTab = tab.cloneNode(true);
        tab.parentNode.replaceChild(newTab, tab);
        
        newTab.addEventListener('click', () => {
            const chartId = newTab.dataset.chart;
            // 更新按钮状态
            document.querySelectorAll('.chart-tab-btn').forEach(t => t.classList.remove('active'));
            newTab.classList.add('active');
            // 切换面板
            Object.values(panels).forEach(p => { if (p) p.classList.remove('active'); });
            if (panels[chartId]) panels[chartId].classList.add('active');
            
            // 刷新图表
            setTimeout(() => {
                if (chartId === 'composer' || chartId === 'virtual' || chartId === 'singer') {
                    refreshCharts(statsData);
                }
            }, 50);
        });
    });
}