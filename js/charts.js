// 图表逻辑
import { appState } from './state.js';

let charts = {};

// 确保 ChartZoom 插件已注册
if (typeof ChartZoom !== 'undefined' && ChartZoom) {
    Chart.register(ChartZoom);
    console.log('ChartZoom 插件已注册');
}

// 确保 Hammer.js 可用
if (typeof Hammer === 'undefined') {
    console.warn('Hammer.js not loaded, drag panning may not work');
}

export function destroyCharts() {
    for (let key in charts) {
        if (charts[key]) {
            charts[key].destroy();
        }
    }
    charts = {};
}

export function renderAllCharts(stats) {
    destroyCharts();
    
    // 类别饼图
    const categoryCtx = document.getElementById('categoryChart')?.getContext('2d');
    if (categoryCtx) {
        charts.categoryChart = new Chart(categoryCtx, {
            type: 'pie',
            data: { 
                labels: ['AI', 'ボカロ', '人声', '纯音乐'], 
                datasets: [{ 
                    data: [stats.categoryCount.AI, stats.categoryCount.ボカロ, stats.categoryCount.人声, stats.categoryCount.纯音乐], 
                    backgroundColor: ['#667eea', '#48bb78', '#ed8936', '#a0aec0'] 
                }] 
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: true, 
                plugins: { legend: { position: 'bottom' } } 
            }
        });
    }
    
    // 年份柱状图 - 修复平移功能（使用 Hammer.js）
    const years = Object.keys(stats.yearCount);
    const yearData = years.map(y => stats.yearCount[y]);
    const yearCanvas = document.getElementById('yearChart');
    const yearCtx = yearCanvas?.getContext('2d');
    
    if (yearCtx) {
        charts.yearChart = new Chart(yearCtx, {
            type: 'bar',
            data: { 
                labels: years, 
                datasets: [{ 
                    label: '歌曲数', 
                    data: yearData, 
                    backgroundColor: '#667eea' 
                }] 
            },
            options: {
                responsive: true, 
                maintainAspectRatio: true,
                scales: { 
                    x: { 
                        title: { display: true, text: '年份' }, 
                        grid: { display: false },
                        ticks: { autoSkip: true, maxRotation: 45, minRotation: 0 }
                    }, 
                    y: { 
                        beginAtZero: true, 
                        min: 0, 
                        title: { display: true, text: '歌曲数' },
                        ticks: { stepSize: 1, precision: 0 }
                    } 
                },
                plugins: {
                    legend: { display: false },
                    zoom: {
                        pan: { 
                            enabled: true, 
                            mode: 'x',
                            threshold: 10,
                            modifierKey: null
                        },
                        zoom: { 
                            wheel: { 
                                enabled: true, 
                                speed: 0.1,
                                modifierKey: 'ctrl'
                            }, 
                            mode: 'x',
                            drag: { enabled: false }
                        },
                        limits: {
                            x: { min: 'original', max: 'original' }
                        }
                    }
                }
            }
        });
        
        // 使用 Hammer.js 为 canvas 添加拖拽支持
        if (yearCanvas && typeof Hammer !== 'undefined') {
            // 移除已有的 Hammer 实例
            if (yearCanvas.hammer) {
                yearCanvas.hammer.destroy();
            }
            
            const hammer = new Hammer(yearCanvas);
            hammer.get('pan').set({ direction: Hammer.DIRECTION_HORIZONTAL, threshold: 5 });
            yearCanvas.hammer = hammer;
            
            // 让 zoom 插件识别 Hammer 事件
            if (charts.yearChart && charts.yearChart.options.plugins.zoom) {
                charts.yearChart.update();
            }
        }
    }
    
    // P主图表
    updateComposerChart();
    // 歌姬图表
    updateVirtualChart();
    // 歌手图表
    updateSingerChart();
    
    // 设置自定义拖拽（用于 P主、歌姬、歌手图表）
    setupChartDrag('composerChart', updateComposerChart, 'composer');
    setupChartDrag('virtualSingerChart', updateVirtualChart, 'virtual');
    setupChartDrag('singerChart', updateSingerChart, 'singer');
}

function updateComposerChart() {
    const stats = appState.statsData;
    if (!stats) return;
    
    const composers = Object.entries(stats.composerCount).sort((a, b) => b[1] - a[1]);
    const composerData = composers.map(c => c[1]);
    const totalItems = composers.length;
    
    let visibleCount = Math.max(10, Math.floor(totalItems / appState.composerZoomLevel));
    visibleCount = Math.min(totalItems, visibleCount);
    
    const startIdx = Math.max(0, Math.min(totalItems - visibleCount, appState.composerPanOffset));
    const endIdx = Math.min(totalItems, startIdx + visibleCount);
    const displayComposers = composers.slice(startIdx, endIdx);
    const displayData = composerData.slice(startIdx, endIdx);
    
    const maxInView = Math.max(...displayData, 0);
    let xMax = Math.max(5, Math.ceil(maxInView * 1.1));
    
    const canvas = document.getElementById('composerChart');
    if (!canvas) return;
    
    if (charts.composerChart) {
        charts.composerChart.data.labels = displayComposers.map(c => c[0]);
        charts.composerChart.data.datasets[0].data = displayData;
        charts.composerChart.options.scales.x.max = xMax;
        charts.composerChart.update();
    } else {
        const composerCtx = canvas.getContext('2d');
        charts.composerChart = new Chart(composerCtx, {
            type: 'bar',
            data: { 
                labels: displayComposers.map(c => c[0]), 
                datasets: [{ label: '歌曲数', data: displayData, backgroundColor: '#48bb78' }] 
            },
            options: {
                responsive: true, 
                maintainAspectRatio: true, 
                indexAxis: 'y',
                scales: {
                    x: { min: 0, max: xMax, title: { display: true, text: '歌曲数' }, ticks: { stepSize: 1 } },
                    y: { title: { display: true, text: 'P主' }, ticks: { autoSkip: false, font: { size: 10 } }, grid: { display: false } }
                },
                plugins: { legend: { position: 'right' } }
            }
        });
    }
    canvas.style.height = Math.max(400, visibleCount * 30) + 'px';
}

function updateVirtualChart() {
    const stats = appState.statsData;
    if (!stats) return;
    
    const virtualSingers = Object.entries(stats.virtualSingerCount).sort((a, b) => b[1] - a[1]);
    const virtualData = virtualSingers.map(v => v[1]);
    const totalItems = virtualSingers.length;
    
    let visibleCount = Math.max(10, Math.floor(totalItems / appState.virtualZoomLevel));
    visibleCount = Math.min(totalItems, visibleCount);
    
    const startIdx = Math.max(0, Math.min(totalItems - visibleCount, appState.virtualPanOffset));
    const endIdx = Math.min(totalItems, startIdx + visibleCount);
    const displaySingers = virtualSingers.slice(startIdx, endIdx);
    const displayData = virtualData.slice(startIdx, endIdx);
    
    const maxInView = Math.max(...displayData, 0);
    let xMax = Math.max(5, Math.ceil(maxInView * 1.1));
    
    const canvas = document.getElementById('virtualSingerChart');
    if (!canvas) return;
    
    if (charts.virtualSingerChart) {
        charts.virtualSingerChart.data.labels = displaySingers.map(v => v[0]);
        charts.virtualSingerChart.data.datasets[0].data = displayData;
        charts.virtualSingerChart.options.scales.x.max = xMax;
        charts.virtualSingerChart.update();
    } else {
        const virtualCtx = canvas.getContext('2d');
        charts.virtualSingerChart = new Chart(virtualCtx, {
            type: 'bar',
            data: { 
                labels: displaySingers.map(v => v[0]), 
                datasets: [{ label: '歌曲数', data: displayData, backgroundColor: '#ed8936' }] 
            },
            options: {
                responsive: true, 
                maintainAspectRatio: true, 
                indexAxis: 'y',
                scales: {
                    x: { min: 0, max: xMax, title: { display: true, text: '歌曲数' }, ticks: { stepSize: 1 } },
                    y: { title: { display: true, text: '歌姬' }, ticks: { autoSkip: false, font: { size: 10 } }, grid: { display: false } }
                },
                plugins: { legend: { position: 'right' } }
            }
        });
    }
    canvas.style.height = Math.max(400, visibleCount * 30) + 'px';
}

function updateSingerChart() {
    const stats = appState.statsData;
    if (!stats) return;
    
    const singers = Object.entries(stats.realSingerCount).sort((a, b) => b[1] - a[1]);
    const singerData = singers.map(s => s[1]);
    const totalItems = singers.length;
    
    let visibleCount = Math.max(10, Math.floor(totalItems / appState.singerZoomLevel));
    visibleCount = Math.min(totalItems, visibleCount);
    
    const startIdx = Math.max(0, Math.min(totalItems - visibleCount, appState.singerPanOffset));
    const endIdx = Math.min(totalItems, startIdx + visibleCount);
    const displaySingers = singers.slice(startIdx, endIdx);
    const displayData = singerData.slice(startIdx, endIdx);
    
    const maxInView = Math.max(...displayData, 0);
    let xMax = Math.max(5, Math.ceil(maxInView * 1.1));
    
    const canvas = document.getElementById('singerChart');
    if (!canvas) return;
    
    if (charts.singerChart) {
        charts.singerChart.data.labels = displaySingers.map(s => s[0]);
        charts.singerChart.data.datasets[0].data = displayData;
        charts.singerChart.options.scales.x.max = xMax;
        charts.singerChart.update();
    } else {
        const singerCtx = canvas.getContext('2d');
        charts.singerChart = new Chart(singerCtx, {
            type: 'bar',
            data: { 
                labels: displaySingers.map(s => s[0]), 
                datasets: [{ label: '歌曲数', data: displayData, backgroundColor: '#a855f7' }] 
            },
            options: {
                responsive: true, 
                maintainAspectRatio: true, 
                indexAxis: 'y',
                scales: {
                    x: { min: 0, max: xMax, title: { display: true, text: '歌曲数' }, ticks: { stepSize: 1 } },
                    y: { title: { display: true, text: '歌手' }, ticks: { autoSkip: false, font: { size: 10 } }, grid: { display: false } }
                },
                plugins: { legend: { position: 'right' } }
            }
        });
    }
    canvas.style.height = Math.max(400, visibleCount * 30) + 'px';
}

function setupChartDrag(containerId, updateFunc, zoomVar) {
    const canvas = document.getElementById(containerId);
    if (!canvas) return;
    
    let isDragging = false;
    let startY = 0;
    let startPan = 0;
    
    // 滚轮缩放
    canvas.addEventListener('wheel', (e) => {
        if (e.ctrlKey) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            if (zoomVar === 'composer') {
                appState.composerZoomLevel = appState.composerZoomLevel * delta;
                appState.composerZoomLevel = Math.max(0.5, appState.composerZoomLevel);
                updateComposerChart();
            } else if (zoomVar === 'virtual') {
                appState.virtualZoomLevel = appState.virtualZoomLevel * delta;
                appState.virtualZoomLevel = Math.max(0.5, appState.virtualZoomLevel);
                updateVirtualChart();
            } else if (zoomVar === 'singer') {
                appState.singerZoomLevel = appState.singerZoomLevel * delta;
                appState.singerZoomLevel = Math.max(0.5, appState.singerZoomLevel);
                updateSingerChart();
            }
        }
    });
    
    // 鼠标拖拽平移
    canvas.addEventListener('mousedown', (e) => {
        isDragging = true;
        startY = e.clientY;
        if (zoomVar === 'composer') startPan = appState.composerPanOffset;
        else if (zoomVar === 'virtual') startPan = appState.virtualPanOffset;
        else if (zoomVar === 'singer') startPan = appState.singerPanOffset;
        canvas.style.cursor = 'grabbing';
        e.preventDefault();
    });
    
    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const deltaY = startY - e.clientY;
        let totalItems, visibleCount, maxPanOffset;
        const stats = appState.statsData;
        
        if (zoomVar === 'composer') {
            totalItems = Object.keys(stats?.composerCount || {}).length;
            visibleCount = Math.max(10, Math.min(totalItems, Math.floor(totalItems / appState.composerZoomLevel)));
            maxPanOffset = Math.max(0, totalItems - visibleCount);
            appState.composerPanOffset = Math.min(maxPanOffset, Math.max(0, startPan + Math.round(deltaY / 8)));
            updateComposerChart();
        } else if (zoomVar === 'virtual') {
            totalItems = Object.keys(stats?.virtualSingerCount || {}).length;
            visibleCount = Math.max(10, Math.min(totalItems, Math.floor(totalItems / appState.virtualZoomLevel)));
            maxPanOffset = Math.max(0, totalItems - visibleCount);
            appState.virtualPanOffset = Math.min(maxPanOffset, Math.max(0, startPan + Math.round(deltaY / 8)));
            updateVirtualChart();
        } else if (zoomVar === 'singer') {
            totalItems = Object.keys(stats?.realSingerCount || {}).length;
            visibleCount = Math.max(10, Math.min(totalItems, Math.floor(totalItems / appState.singerZoomLevel)));
            maxPanOffset = Math.max(0, totalItems - visibleCount);
            appState.singerPanOffset = Math.min(maxPanOffset, Math.max(0, startPan + Math.round(deltaY / 8)));
            updateSingerChart();
        }
    });
    
    window.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            canvas.style.cursor = 'grab';
        }
    });
    
    canvas.style.cursor = 'grab';
}

export function refreshCharts() {
    if (!appState.statsData) return;
    updateComposerChart();
    updateVirtualChart();
    updateSingerChart();
}

// 导出 zoom 相关函数供全局调用
export function zoomIn(chartId) {
    if (chartId === 'composerChart') {
        appState.composerZoomLevel = appState.composerZoomLevel * 1.2;
        updateComposerChart();
    } else if (chartId === 'virtualSingerChart') {
        appState.virtualZoomLevel = appState.virtualZoomLevel * 1.2;
        updateVirtualChart();
    } else if (chartId === 'singerChart') {
        appState.singerZoomLevel = appState.singerZoomLevel * 1.2;
        updateSingerChart();
    } else if (chartId === 'yearChart') {
        if (charts.yearChart) charts.yearChart.zoom(1.2);
    }
}

export function zoomOut(chartId) {
    if (chartId === 'composerChart') {
        appState.composerZoomLevel = Math.max(0.5, appState.composerZoomLevel / 1.2);
        const totalItems = Object.keys(appState.statsData?.composerCount || {}).length;
        const visibleCount = Math.max(5, Math.min(totalItems, Math.floor(25 / appState.composerZoomLevel)));
        appState.composerPanOffset = Math.min(Math.max(0, appState.composerPanOffset), totalItems - visibleCount);
        updateComposerChart();
    } else if (chartId === 'virtualSingerChart') {
        appState.virtualZoomLevel = Math.max(0.5, appState.virtualZoomLevel / 1.2);
        const totalItems = Object.keys(appState.statsData?.virtualSingerCount || {}).length;
        const visibleCount = Math.max(5, Math.min(totalItems, Math.floor(25 / appState.virtualZoomLevel)));
        appState.virtualPanOffset = Math.min(Math.max(0, appState.virtualPanOffset), totalItems - visibleCount);
        updateVirtualChart();
    } else if (chartId === 'singerChart') {
        appState.singerZoomLevel = Math.max(0.5, appState.singerZoomLevel / 1.2);
        const totalItems = Object.keys(appState.statsData?.realSingerCount || {}).length;
        const visibleCount = Math.max(5, Math.min(totalItems, Math.floor(25 / appState.singerZoomLevel)));
        appState.singerPanOffset = Math.min(Math.max(0, appState.singerPanOffset), totalItems - visibleCount);
        updateSingerChart();
    } else if (chartId === 'yearChart') {
        if (charts.yearChart) charts.yearChart.zoom(0.8);
    }
}

export function resetZoom(chartId) {
    if (chartId === 'composerChart') {
        appState.composerZoomLevel = 1;
        appState.composerPanOffset = 0;
        updateComposerChart();
    } else if (chartId === 'virtualSingerChart') {
        appState.virtualZoomLevel = 1;
        appState.virtualPanOffset = 0;
        updateVirtualChart();
    } else if (chartId === 'singerChart') {
        appState.singerZoomLevel = 1;
        appState.singerPanOffset = 0;
        updateSingerChart();
    } else if (chartId === 'yearChart') {
        if (charts.yearChart) charts.yearChart.resetZoom();
    }
}