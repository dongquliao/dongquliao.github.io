// 渲染逻辑
import { appState } from './state.js';
import { escapeHtml } from './utils.js';
import { CONFIG } from './config.js';
import { updateCover } from './cover.js';

let currentSelectedRow = null;

// 列宽配置（百分比）
const COLUMN_WIDTHS = {
    normal: {
        0: 22, 1: 18, 2: 22, 3: 15, 4: 5, 5: 5, 6: 7
    },
    vocaloid: {
        0: 19, 1: 16, 2: 18, 3: 14, 4: 5, 5: 5, 6: 7, 7: 5
    }
};

function setColumnWidths(isVocaloid) {
    const table = document.getElementById('songTable');
    if (!table) return;
    
    const colWidths = isVocaloid ? COLUMN_WIDTHS.vocaloid : COLUMN_WIDTHS.normal;
    const colCount = isVocaloid ? 8 : 7;
    
    const oldColgroup = table.querySelector('colgroup');
    if (oldColgroup) oldColgroup.remove();
    
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
    
    setColumnWidths(isVocaloid);
    
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

// 存储当前打开的弹窗的歌曲信息，用于双击打开歌词
let currentMobileSong = null;

// 手机端显示详情弹窗
function showMobileDetail(song, onShowLyrics) {
    if (!song) return;
    
    currentMobileSong = song;
    
    let modal = document.getElementById('mobileDetailModal');
    if (!modal) {
        // 创建弹窗
        modal = document.createElement('div');
        modal.id = 'mobileDetailModal';
        modal.className = 'mobile-detail-modal';
        modal.innerHTML = `
            <div class="mobile-detail-content">
                <span class="mobile-detail-close">&times;</span>
                <div class="mobile-detail-cover" id="mobileDetailCover"></div>
                <div class="mobile-detail-info" id="mobileDetailInfo"></div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // 关闭事件
        modal.querySelector('.mobile-detail-close').onclick = () => {
            modal.style.display = 'none';
            currentMobileSong = null;
        };
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
                currentMobileSong = null;
            }
        };
        
        // 弹窗内容区域双击打开歌词
        const contentDiv = modal.querySelector('.mobile-detail-content');
        contentDiv.ondblclick = (e) => {
            e.stopPropagation();
            if (currentMobileSong) {
                modal.style.display = 'none';
                onShowLyrics(currentMobileSong);
                currentMobileSong = null;
            }
        };
    }
    
    // 填充封面
    const coverDiv = document.getElementById('mobileDetailCover');
    if (song.cover_url) {
        coverDiv.innerHTML = `<img src="${song.cover_url}" alt="封面">`;
    } else {
        coverDiv.innerHTML = '<div class="no-cover">暂无封面</div>';
    }
    
    // 填充信息
    const infoDiv = document.getElementById('mobileDetailInfo');
    const isVocaloid = (appState.currentCategory === 'ボカロ');
    // 手机端调校信息不加特殊样式，直接显示纯文本
    const tuneHtml = (isVocaloid && song.tune) ? `<p><strong>调校：</strong><span>${escapeHtml(song.tune)}</span></p>` : '';
    const playCountHtml = (song.play_count && song.play_count > 0) ? `<p><strong>播放次数：</strong><span>${song.play_count.toLocaleString()}</span></p>` : '';
    
    infoDiv.innerHTML = `
        <p><strong>标题：</strong><span>${escapeHtml(song.title || '?')}</span></p>
        <p><strong>艺术家：</strong><span>${escapeHtml(song.artist || '—')}</span></p>
        <p><strong>专辑：</strong><span>${escapeHtml(song.album || '—')}</span></p>
        <p><strong>作曲：</strong><span>${escapeHtml(song.composer || '—')}</span></p>
        <p><strong>年份：</strong><span>${song.year || '—'}</span></p>
        ${tuneHtml}
        ${playCountHtml}
    `;
    
    modal.style.display = 'flex';
}

export function renderTable(onSelectSong, onShowLyrics) {
    renderTableHeader();
    const tbody = document.getElementById('songTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    const isVocaloid = (appState.currentCategory === 'ボカロ');
    const displaySongs = appState.getDisplaySongs();
    const fullSongs = appState.filteredSongs;
    
    // 检测是否为手机端
    const isMobile = window.innerWidth <= 768;
    
    displaySongs.forEach((song, index) => {
        const row = tbody.insertRow();
        row.className = 'song-row';
        
        if (isMobile) {
            // 手机端：单击显示详情弹窗
            row.onclick = () => showMobileDetail(song, onShowLyrics);
            // 卡片本身也支持双击直接查看歌词
            row.ondblclick = (e) => {
                e.stopPropagation();
                onShowLyrics(song);
            };
        } else {
            // PC端：原有逻辑
            row.onclick = () => onSelectSong(song, row, true);
            row.ondblclick = () => onShowLyrics(song);
        }
        
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
        
        // 标题列 - 手机端显示封面
        let cell = row.insertCell(0);
        if (isMobile) {
            // 显示封面小图
            if (song.cover_url) {
                cell.innerHTML = `<img src="${song.cover_url}" alt="封面" style="width:48px;height:48px;object-fit:cover;border-radius:6px;">`;
            } else {
                cell.innerHTML = '<div class="no-cover-small" style="width:48px;height:48px;background:#e0e0e0;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:10px;color:#999;">无图</div>';
            }
        } else {
            cell.innerHTML = `<strong>${escapeHtml(song.title || '?')}</strong>`;
            cell.setAttribute('data-label', '标题');
        }
        
        // 艺术家列 - 手机端显示 "艺术家 - 标题"
        cell = row.insertCell(1);
        if (isMobile) {
            cell.innerHTML = `<span class="mobile-artist">${escapeHtml(song.artist || '?')}</span> - <strong>${escapeHtml(song.title || '?')}</strong>`;
        } else {
            cell.innerHTML = escapeHtml(song.artist || '—');
            cell.setAttribute('data-label', '艺术家');
        }
        
        // 专辑列
        cell = row.insertCell(2);
        cell.innerHTML = escapeHtml(song.album || '—');
        if (!isMobile) cell.setAttribute('data-label', '专辑');
        
        // 作曲列
        cell = row.insertCell(3);
        cell.innerHTML = escapeHtml(song.composer || '—');
        if (!isMobile) cell.setAttribute('data-label', '作曲');
        
        // 年份列
        cell = row.insertCell(4);
        cell.innerHTML = song.year || '—';
        if (!isMobile) cell.setAttribute('data-label', '年份');
        
        // 时长列
        cell = row.insertCell(5);
        cell.innerHTML = song.duration || '—';
        if (!isMobile) cell.setAttribute('data-label', '时长');
        
        // 播放次数列
        cell = row.insertCell(6);
        cell.innerHTML = playCountText;
        if (!isMobile) cell.setAttribute('data-label', CONFIG.PLAY_COUNT.LABEL);
        
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
            if (!isMobile) cell.setAttribute('data-label', '调校');
        }
    });
    
    // 更新统计显示（PC端）
    const statsDiv = document.getElementById('statsInCard');
    if (statsDiv && !isMobile) {
        statsDiv.innerHTML = `显示 ${displaySongs.length} / ${appState.filteredSongs.length} 首歌曲（双击查看歌词）`;
    } else if (statsDiv && isMobile) {
        statsDiv.style.display = 'none';
    }
    
    // 更新加载更多按钮显示
    const loadingMore = document.getElementById('loadingMore');
    if (loadingMore) {
        if (appState.hasMore()) {
            loadingMore.style.display = 'block';
            loadingMore.innerHTML = '加载更多...';
            loadingMore.id = 'loadingSentinel';
        } else {
            loadingMore.style.display = 'none';
        }
    }
    
    // ========== PC端选择逻辑 ==========
    if (!isMobile) {
        if (displaySongs.length === 0) {
            if (typeof onSelectSong === 'function') {
                onSelectSong(null, null, false);
            }
            return;
        }
        
        if (!appState.isManuallySelected) {
            const firstRow = tbody.querySelector('.song-row');
            const firstSong = displaySongs[0];
            if (firstRow && firstSong) {
                onSelectSong(firstSong, firstRow, false);
            }
            return;
        }
        
        if (appState.isManuallySelected && appState.currentSelectedSong) {
            const songStillInFullList = fullSongs.some(s => 
                s.title === appState.currentSelectedSong?.title && 
                s.artist === appState.currentSelectedSong?.artist
            );
            
            if (!songStillInFullList) {
                appState.clearManualFlag();
                const firstRow = tbody.querySelector('.song-row');
                const firstSong = displaySongs[0];
                if (firstRow && firstSong) {
                    onSelectSong(firstSong, firstRow, false);
                }
                return;
            }
            
            const songInDisplay = displaySongs.find(s => 
                s.title === appState.currentSelectedSong?.title && 
                s.artist === appState.currentSelectedSong?.artist
            );
            
            if (songInDisplay) {
                const rows = tbody.querySelectorAll('.song-row');
                const index = displaySongs.findIndex(s => s === songInDisplay);
                if (rows[index]) {
                    onSelectSong(songInDisplay, rows[index], false);
                }
            } else if (appState.currentSelectedSong) {
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