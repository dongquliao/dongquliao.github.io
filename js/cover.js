// 封面卡片逻辑
import { escapeHtml } from './utils.js';

export function updateCover(song) {
    const coverImageDiv = document.getElementById('coverImage');
    const coverInfo = document.getElementById('coverInfo');
    
    if (!coverImageDiv || !coverInfo) return;
    
    // 处理没有歌曲的情况
    if (!song) {
        coverImageDiv.innerHTML = '<div class="no-cover">无封面图片</div>';
        coverInfo.innerHTML = '<p><strong>当前歌曲</strong><br>—</p>';
        return;
    }
    
    if (song.cover_url) {
        coverImageDiv.innerHTML = `<img src="${song.cover_url}" alt="封面">`;
    } else {
        coverImageDiv.innerHTML = '<div class="no-cover">无封面图片</div>';
    }
    
    coverInfo.innerHTML = `
        <p><strong>当前歌曲</strong></p>
        <p><strong>标题：</strong><span>${escapeHtml(song.title || '?')}</span></p>
        <p><strong>艺术家：</strong><span>${escapeHtml(song.artist || '?')}</span></p>
        <p><strong>专辑：</strong><span>${escapeHtml(song.album || '?')}</span></p>
        <p><strong>作曲：</strong><span>${escapeHtml(song.composer || '?')}</span></p>
        <p><strong>年份：</strong><span>${song.year || '?'}</span></p>
    `;
}

export function setupStickyCover() {
    const coverCard = document.getElementById('coverCard');
    const coverWrapper = document.getElementById('coverWrapper');
    if (!coverCard || !coverWrapper) return;
    
    const originalTop = coverWrapper.offsetTop;
    const cardWidth = coverCard.clientWidth;
    
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        if (scrollTop + 20 >= originalTop) {
            coverCard.classList.add('sticky');
            coverCard.style.width = cardWidth + 'px';
        } else {
            coverCard.classList.remove('sticky');
            coverCard.style.width = '';
        }
    });
}