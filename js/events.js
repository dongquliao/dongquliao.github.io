// 事件绑定和初始化
import { appState } from './state.js';
import { updateFilteredAndSort } from './filter.js';
import { renderTable, highlightSelectedRow } from './render.js';
import { updateCover } from './cover.js';
import { showLyrics } from './modal.js';
import { debounce } from './utils.js';

let observer = null;
let isLoadingMore = false;

// 加载更多函数 - 修复滚动跳转问题
async function loadMoreSongs(onSelectSong, onShowLyrics) {
    if (isLoadingMore) return;
    if (!appState.hasMore()) return;
    
    isLoadingMore = true;
    
    const loadingMore = document.getElementById('loadingSentinel');
    if (loadingMore) {
        loadingMore.innerHTML = '正在加载...';
    }
    
    // 记录当前滚动位置
    const scrollY = window.scrollY;
    
    // 加载更多
    appState.increaseDisplayCount();
    renderTable(onSelectSong, onShowLyrics);
    
    // 恢复滚动位置（微调，防止跳动）
    setTimeout(() => {
        window.scrollTo(0, scrollY);
    }, 10);
    
    isLoadingMore = false;
}

// 设置 IntersectionObserver
function setupIntersectionObserver(onSelectSong, onShowLyrics) {
    if (observer) {
        observer.disconnect();
        observer = null;
    }
    
    const sentinel = document.getElementById('loadingSentinel');
    if (!sentinel) return;
    
    observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && appState.hasMore() && !isLoadingMore) {
                loadMoreSongs(onSelectSong, onShowLyrics);
            }
        });
    }, {
        rootMargin: '0px 0px 200px 0px',
        threshold: 0
    });
    
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
    
    // 统计按钮 - 手机端会被 CSS 隐藏，但保留事件以防万一
    const statsBtn = document.getElementById('statsBtn');
    if (statsBtn) {
        statsBtn.addEventListener('click', () => {
            // 手机端不显示统计图表
            if (window.innerWidth <= 768) return;
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
    // 排序：不重置手动选择标志
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

// 图表缩放相关全局函数（PC端使用）
window.zoomIn = (chartId) => {
    if (chartId === 'composerChart') {
        appState.composerZoomLevel = appState.composerZoomLevel * 1.2;
        import('./charts.js').then(charts => charts.refreshCharts(appState.statsData));
    } else if (chartId === 'virtualSingerChart') {
        appState.virtualZoomLevel = appState.virtualZoomLevel * 1.2;
        import('./charts.js').then(charts => charts.refreshCharts(appState.statsData));
    } else if (chartId === 'singerChart') {
        appState.singerZoomLevel = appState.singerZoomLevel * 1.2;
        import('./charts.js').then(charts => charts.refreshCharts(appState.statsData));
    } else if (chartId === 'yearChart') {
        import('./charts.js').then(charts => {
            if (charts.charts?.yearChart) charts.charts.yearChart.zoom(1.2);
        });
    }
};

window.zoomOut = (chartId) => {
    if (chartId === 'composerChart') {
        appState.composerZoomLevel = Math.max(0.5, appState.composerZoomLevel / 1.2);
        const totalItems = Object.keys(appState.statsData?.composerCount || {}).length;
        const visibleCount = Math.max(5, Math.min(totalItems, Math.floor(25 / appState.composerZoomLevel)));
        appState.composerPanOffset = Math.min(Math.max(0, appState.composerPanOffset), totalItems - visibleCount);
        import('./charts.js').then(charts => charts.refreshCharts(appState.statsData));
    } else if (chartId === 'virtualSingerChart') {
        appState.virtualZoomLevel = Math.max(0.5, appState.virtualZoomLevel / 1.2);
        const totalItems = Object.keys(appState.statsData?.virtualSingerCount || {}).length;
        const visibleCount = Math.max(5, Math.min(totalItems, Math.floor(25 / appState.virtualZoomLevel)));
        appState.virtualPanOffset = Math.min(Math.max(0, appState.virtualPanOffset), totalItems - visibleCount);
        import('./charts.js').then(charts => charts.refreshCharts(appState.statsData));
    } else if (chartId === 'singerChart') {
        appState.singerZoomLevel = Math.max(0.5, appState.singerZoomLevel / 1.2);
        const totalItems = Object.keys(appState.statsData?.realSingerCount || {}).length;
        const visibleCount = Math.max(5, Math.min(totalItems, Math.floor(25 / appState.singerZoomLevel)));
        appState.singerPanOffset = Math.min(Math.max(0, appState.singerPanOffset), totalItems - visibleCount);
        import('./charts.js').then(charts => charts.refreshCharts(appState.statsData));
    } else if (chartId === 'yearChart') {
        import('./charts.js').then(charts => {
            if (charts.charts?.yearChart) charts.charts.yearChart.zoom(0.8);
        });
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
    } else if (chartId === 'yearChart') {
        import('./charts.js').then(charts => {
            if (charts.charts?.yearChart) charts.charts.yearChart.resetZoom();
        });
    }
};

window.closeStatsModal = () => {
    import('./modal.js').then(modal => modal.closeStatsModal());
};

window.closeLyricModal = () => {
    import('./modal.js').then(modal => modal.closeLyricModal());
};