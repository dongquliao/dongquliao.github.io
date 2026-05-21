// 事件绑定和初始化
import { appState } from './state.js';
import { updateFilteredAndSort } from './filter.js';
import { renderTable, highlightSelectedRow } from './render.js';
import { updateCover } from './cover.js';
import { showLyrics } from './modal.js';
import { debounce } from './utils.js';
import { zoomIn, zoomOut, resetZoom } from './charts.js';

let observer = null;
let isLoadingMore = false;

// 加载更多函数
async function loadMoreSongs(onSelectSong, onShowLyrics) {
    if (isLoadingMore) return;
    if (!appState.hasMore()) return;
    
    isLoadingMore = true;
    
    const loadingMore = document.getElementById('loadingSentinel');
    if (loadingMore) {
        loadingMore.innerHTML = '正在加载...';
    }
    
    // 模拟延迟，让用户看到加载状态
    await new Promise(resolve => setTimeout(resolve, 100));
    
    appState.increaseDisplayCount();
    renderTable(onSelectSong, onShowLyrics);
    
    isLoadingMore = false;
}

// 设置 IntersectionObserver
function setupIntersectionObserver(onSelectSong, onShowLyrics) {
    // 断开已有的观察者
    if (observer) {
        observer.disconnect();
        observer = null;
    }
    
    // 获取哨兵元素
    const sentinel = document.getElementById('loadingSentinel');
    if (!sentinel) return;
    
    // 创建新的观察者
    observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            // 当哨兵元素进入视口时，加载更多
            if (entry.isIntersecting && appState.hasMore() && !isLoadingMore) {
                loadMoreSongs(onSelectSong, onShowLyrics);
            }
        });
    }, {
        // 提前 200px 就开始加载，提升体验
        rootMargin: '0px 0px 200px 0px',
        threshold: 0
    });
    
    // 开始观察
    observer.observe(sentinel);
}

export function setupEventListeners(onSelectSong, onShowLyrics) {
    // 搜索输入
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce((e) => {
            appState.setCurrentSearch(e.target.value);
            appState.resetManualSelection();
            updateFilteredAndSort();
            renderTable(onSelectSong, onShowLyrics);
            // 重新设置观察者（因为 DOM 更新了）
            setTimeout(() => setupIntersectionObserver(onSelectSong, onShowLyrics), 50);
        }, 300));
    }
    
    // 分类标签
    const categoryTabs = document.querySelectorAll('.category-tab');
    categoryTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            categoryTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            appState.setCurrentCategory(tab.dataset.category);
            appState.resetManualSelection();
            updateFilteredAndSort();
            renderTable(onSelectSong, onShowLyrics);
            // 重新设置观察者
            setTimeout(() => setupIntersectionObserver(onSelectSong, onShowLyrics), 50);
        });
    });
    
    // 统计按钮
    const statsBtn = document.getElementById('statsBtn');
    if (statsBtn) {
        statsBtn.addEventListener('click', () => {
            import('./modal.js').then(modal => modal.openStatsModal());
        });
    }
    
    // 初始设置观察者
    setTimeout(() => setupIntersectionObserver(onSelectSong, onShowLyrics), 100);
}

// 导出重新设置观察者的函数（供外部调用）
export function refreshObserver(onSelectSong, onShowLyrics) {
    setTimeout(() => setupIntersectionObserver(onSelectSong, onShowLyrics), 50);
}

// 暴露给全局（供表头 onclick 使用）
window.changeSort = (field) => {
    if (appState.currentSortBy === field) {
        appState.currentSortOrder = appState.currentSortOrder === 'asc' ? 'desc' : 'asc';
    } else {
        appState.setSort(field, 'asc');
    }
    updateFilteredAndSort();
    renderTable(window.handleSelectSong, window.handleShowLyrics);
    // 重新设置观察者
    setTimeout(() => {
        const sentinel = document.getElementById('loadingSentinel');
        if (sentinel && observer) {
            observer.disconnect();
            setupIntersectionObserver(window.handleSelectSong, window.handleShowLyrics);
        }
    }, 50);
};

window.doubleClickStats = () => {
    if (appState.currentSelectedSong && window.handleShowLyrics) {
        window.handleShowLyrics(appState.currentSelectedSong);
    }
};

window.zoomIn = (chartId) => {
    if (chartId === 'composerChart') {
        appState.composerZoomLevel *= 1.2;
        import('./charts.js').then(charts => charts.refreshCharts(appState.statsData));
    } else if (chartId === 'virtualSingerChart') {
        appState.virtualZoomLevel *= 1.2;
        import('./charts.js').then(charts => charts.refreshCharts(appState.statsData));
    } else if (chartId === 'singerChart') {
        appState.singerZoomLevel *= 1.2;
        import('./charts.js').then(charts => charts.refreshCharts(appState.statsData));
    }
};

window.zoomOut = (chartId) => {
    if (chartId === 'composerChart') {
        appState.composerZoomLevel = Math.max(0.5, appState.composerZoomLevel / 1.2);
        import('./charts.js').then(charts => charts.refreshCharts(appState.statsData));
    } else if (chartId === 'virtualSingerChart') {
        appState.virtualZoomLevel = Math.max(0.5, appState.virtualZoomLevel / 1.2);
        import('./charts.js').then(charts => charts.refreshCharts(appState.statsData));
    } else if (chartId === 'singerChart') {
        appState.singerZoomLevel = Math.max(0.5, appState.singerZoomLevel / 1.2);
        import('./charts.js').then(charts => charts.refreshCharts(appState.statsData));
    }
};

window.resetZoom = (chartId) => {
    if (chartId === 'composerChart') {
        appState.composerZoomLevel = 1;
        appState.composerPanOffset = 0;
        import('./charts.js').then(charts => charts.refreshCharts(appState.statsData));
    } else if (chartId === 'virtualSingerChart') {
        appState.virtualZoomLevel = 1;
        appState.virtualPanOffset = 0;
        import('./charts.js').then(charts => charts.refreshCharts(appState.statsData));
    } else if (chartId === 'singerChart') {
        appState.singerZoomLevel = 1;
        appState.singerPanOffset = 0;
        import('./charts.js').then(charts => charts.refreshCharts(appState.statsData));
    }
};

window.closeStatsModal = () => {
    import('./modal.js').then(modal => modal.closeStatsModal());
};

window.closeLyricModal = () => {
    import('./modal.js').then(modal => modal.closeLyricModal());
};

window.zoomIn = zoomIn;
window.zoomOut = zoomOut;
window.resetZoom = resetZoom;