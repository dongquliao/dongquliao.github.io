// 渲染逻辑
import { appState } from './state.js';
import { escapeHtml } from './utils.js';
import { CONFIG } from './config.js';
import { updateCover } from './cover.js';

let currentSelectedRow = null;

// 列宽配置（百分比）
const COLUMN_WIDTHS = {
    // 非ボカロ类别：7列
    normal: {
        0: 22,   // 标题
        1: 18,   // 艺术家
        2: 22,   // 专辑
        3: 15,   // 作曲
        4: 5,    // 年份
        5: 5,    // 时长
        6: 7     // 播放次数
    },
    // ボカロ类别：8列
    vocaloid: {
        0: 19,   // 标题
        1: 16,   // 艺术家
        2: 18,   // 专辑
        3: 14,   // 作曲
        4: 5,    // 年份
        5: 5,    // 时长
        6: 7,    // 播放次数
        7: 5     // 调校
    }
};

function setColumnWidths(isVocaloid) {
    const table = document.getElementById('songTable');
    if (!table) return;
    
    const colWidths = isVocaloid ? COLUMN_WIDTHS.vocaloid : COLUMN_WIDTHS.normal;
    const colCount = isVocaloid ? 8 : 7;
    
    // 移除已有的 colgroup
    const oldColgroup = table.querySelector('colgroup');
    if (oldColgroup) oldColgroup.remove();
    
    // 创建新的 colgroup
    const colgroup = document.createElement('colgroup');
    for (let i = 0; i < colCount; i++) {
        const col = document.createElement('col');
        col.style.width = `${colWidths[i]}%`;
        colgroup.appendChild(col);
    }
    table.insertBefore(colgroup, table.firstChild);
}

export function renderTableHeader() {
    const isVocaloid = (appState.currentCategory === 'ボカロ');
    const headerRow = document.getElementById('tableHeader');
    if (!headerRow) return;
    
    // 设置列宽
    setColumnWidths(isVocaloid);
    
    // 播放次数配置
    const playCountLabel = CONFIG.PLAY_COUNT.LABEL;
    const playCountSortable = CONFIG.PLAY_COUNT.SORTABLE ? `onclick="window.changeSort?.('play_count')"` : '';
    
    if (isVocaloid) {
        headerRow.innerHTML = `
            <th onclick="window.changeSort?.('title')">标题</th>
            <th onclick="window.changeSort?.('artist')">艺术家</th>
            <th onclick="window.changeSort?.('album')">专辑</th>
            <th onclick="window.changeSort?.('composer')">作曲</th>
            <th onclick="window.changeSort?.('year')">年份</th>
            <th onclick="window.changeSort?.('duration_seconds')">时长</th>
            <th ${playCountSortable}>${playCountLabel}</th>
            <th onclick="window.changeSort?.('tune')">调校</th>
        `;
    } else {
        headerRow.innerHTML = `
            <th onclick="window.changeSort?.('title')">标题</th>
            <th onclick="window.changeSort?.('artist')">艺术家</th>
            <th onclick="window.changeSort?.('album')">专辑</th>
            <th onclick="window.changeSort?.('composer')">作曲</th>
            <th onclick="window.changeSort?.('year')">年份</th>
            <th onclick="window.changeSort?.('duration_seconds')">时长</th>
            <th ${playCountSortable}>${playCountLabel}</th>
        `;
    }
}

export function renderTable(onSelectSong, onShowLyrics) {
    renderTableHeader();
    const tbody = document.getElementById('songTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    const isVocaloid = (appState.currentCategory === 'ボカロ');
    const displaySongs = appState.getDisplaySongs();
    const fullSongs = appState.filteredSongs;
    
    displaySongs.forEach((song, index) => {
        const row = tbody.insertRow();
        row.className = 'song-row';
        row.onclick = () => onSelectSong(song, row, true);
        row.ondblclick = () => onShowLyrics(song);
        
        // 获取播放次数显示文本
        let playCountText = '—';
        let playCountValue = song.play_count || 0;
        if (CONFIG.PLAY_COUNT.ENABLED && playCountValue > 0) {
            playCountText = playCountValue.toLocaleString();
        } else if (CONFIG.PLAY_COUNT.ENABLED && CONFIG.PLAY_COUNT.HIDE_ZERO) {
            playCountText = '—';
        } else if (CONFIG.PLAY_COUNT.ENABLED) {
            playCountText = '0';
        }
        
        // 标题列
        let cell = row.insertCell(0);
        cell.innerHTML = `<strong>${escapeHtml(song.title || '?')}</strong>`;
        cell.setAttribute('data-label', '标题');
        
        // 艺术家列
        cell = row.insertCell(1);
        cell.innerHTML = escapeHtml(song.artist || '—');
        cell.setAttribute('data-label', '艺术家');
        
        // 专辑列
        cell = row.insertCell(2);
        cell.innerHTML = escapeHtml(song.album || '—');
        cell.setAttribute('data-label', '专辑');
        
        // 作曲列
        cell = row.insertCell(3);
        cell.innerHTML = escapeHtml(song.composer || '—');
        cell.setAttribute('data-label', '作曲');
        
        // 年份列
        cell = row.insertCell(4);
        cell.innerHTML = song.year || '—';
        cell.setAttribute('data-label', '年份');
        
        // 时长列
        cell = row.insertCell(5);
        cell.innerHTML = song.duration || '—';
        cell.setAttribute('data-label', '时长');
        
        // 播放次数列
        cell = row.insertCell(6);
        cell.innerHTML = playCountText;
        cell.setAttribute('data-label', CONFIG.PLAY_COUNT.LABEL);
        
        // 调校列（仅ボカロ类别）
        if (isVocaloid) {
            cell = row.insertCell(7);
            const tuneText = song.tune || '';
            if (tuneText) {
                const badge = document.createElement('span');
                badge.className = 'badge tune-badge';
                badge.textContent = tuneText;
                badge.setAttribute('data-full-tune', tuneText);
                cell.appendChild(badge);
            }
            cell.setAttribute('data-label', '调校');
        }
    });
    
    // 更新统计显示
    const statsDiv = document.getElementById('statsInCard');
    if (statsDiv) {
        statsDiv.innerHTML = `显示 ${displaySongs.length} / ${appState.filteredSongs.length} 首歌曲（双击查看歌词）`;
    }
    
    // 更新加载更多按钮显示
    const loadingMore = document.getElementById('loadingMore');
    if (loadingMore) {
        if (appState.hasMore()) {
            loadingMore.style.display = 'block';
            loadingMore.innerHTML = '加载更多...';
            // 添加哨兵元素的 ID，方便观察者识别
            loadingMore.id = 'loadingSentinel';
        } else {
            loadingMore.style.display = 'none';
        }
    }
    
    // ========== 选择逻辑 ==========
    
    // 情况1：没有歌曲
    if (displaySongs.length === 0) {
        if (typeof onSelectSong === 'function') {
            onSelectSong(null, null, false);
        }
        return;
    }
    
    // 情况2：用户还没有手动选择过 → 自动选中第一首
    if (!appState.isManuallySelected) {
        const firstRow = tbody.querySelector('.song-row');
        const firstSong = displaySongs[0];
        if (firstRow && firstSong) {
            onSelectSong(firstSong, firstRow, false);
        }
        return;
    }
    
    // 情况3：用户已经手动选择过
    if (appState.isManuallySelected && appState.currentSelectedSong) {
        // 先检查：手动选中的歌曲是否还在完整列表中？
        const songStillInFullList = fullSongs.some(s => 
            s.title === appState.currentSelectedSong?.title && 
            s.artist === appState.currentSelectedSong?.artist
        );
        
        if (!songStillInFullList) {
            // 歌曲已经不在了，清除手动状态，自动选中第一首
            appState.clearManualFlag();
            const firstRow = tbody.querySelector('.song-row');
            const firstSong = displaySongs[0];
            if (firstRow && firstSong) {
                onSelectSong(firstSong, firstRow, false);
            }
            return;
        }
        
        // 歌曲还在完整列表中，尝试在已加载部分中找到它
        const songInDisplay = displaySongs.find(s => 
            s.title === appState.currentSelectedSong?.title && 
            s.artist === appState.currentSelectedSong?.artist
        );
        
        if (songInDisplay) {
            // 在已加载部分找到了，恢复高亮
            const rows = tbody.querySelectorAll('.song-row');
            const index = displaySongs.findIndex(s => s === songInDisplay);
            if (rows[index]) {
                onSelectSong(songInDisplay, rows[index], false);
            }
        } else {
            // 歌曲在完整列表中，但不在当前已加载部分
            // 不清除手动状态，保持当前封面不变
            if (appState.currentSelectedSong) {
                updateCover(appState.currentSelectedSong);
            }
        }
    }
}

export function highlightSelectedRow(selectedRow) {
    if (currentSelectedRow) {
        currentSelectedRow.classList.remove('selected');
    }
    if (selectedRow) {
        selectedRow.classList.add('selected');
        currentSelectedRow = selectedRow;
    }
}