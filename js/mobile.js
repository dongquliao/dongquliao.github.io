// 手机端优化功能
export function initMobileOptimizations() {
    if (window.innerWidth > 768) return;
    
    console.log('📱 手机端模式已启用');
    
    // 隐藏统计按钮（CSS 已经隐藏，这里再确保一下）
    const statsBtn = document.getElementById('statsBtn');
    if (statsBtn) {
        statsBtn.style.display = 'none';
    }
    
    // 优化搜索：手机键盘更友好
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.setAttribute('enterkeyhint', 'search');
        searchInput.setAttribute('autocomplete', 'off');
        searchInput.setAttribute('inputmode', 'search');
    }
    
    // 优化分类标签：触摸滚动更顺畅
    const categoryTabs = document.querySelector('.category-tabs');
    if (categoryTabs) {
        categoryTabs.style.webkitOverflowScrolling = 'touch';
    }
    
    // 隐藏封面卡片
    const coverSection = document.querySelector('.cover-section');
    if (coverSection) {
        coverSection.style.display = 'none';
    }
    
    // 移除粘性封面监听
    const coverCard = document.getElementById('coverCard');
    if (coverCard) {
        coverCard.classList.remove('sticky');
    }
    
    // 添加触摸反馈
    addTouchFeedback();
}

function addTouchFeedback() {
    const clickableElements = document.querySelectorAll('.category-tab, .song-row, .chart-tab-btn, .zoom-btn');
    
    clickableElements.forEach(el => {
        el.removeEventListener('touchstart', handleTouchStart);
        el.removeEventListener('touchend', handleTouchEnd);
        el.removeEventListener('touchcancel', handleTouchEnd);
        
        el.addEventListener('touchstart', handleTouchStart);
        el.addEventListener('touchend', handleTouchEnd);
        el.addEventListener('touchcancel', handleTouchEnd);
    });
}

function handleTouchStart(e) {
    e.currentTarget.style.opacity = '0.7';
    e.currentTarget.style.transition = 'opacity 0.1s';
}

function handleTouchEnd(e) {
    e.currentTarget.style.opacity = '1';
}

export function refreshTouchFeedback() {
    addTouchFeedback();
}