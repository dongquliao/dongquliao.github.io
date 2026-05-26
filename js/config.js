// 配置常量
export const CONFIG = {
    DATA_URL: 'https://dongquliaomusicdb-jsonandcovers.oss-cn-beijing.aliyuncs.com/data/music_data.json',
    PAGE_SIZE: 100,
    
    // 播放次数显示配置
    PLAY_COUNT: {
        ENABLED: true,           // 是否启用播放次数显示
        HIDE_ZERO: true,         // 是否隐藏播放次数为0的显示（显示为"—"）
        LABEL: '播放次数',        // 列标题（改为"播放次数"）
        SORTABLE: true           // 是否可排序
    },
    
    COMPOSER_ALIAS_MAP: {
        'ハチ': 'ハチ / 米津玄師',
        '米津玄師': 'ハチ / 米津玄師',
        'kemu': 'kemu / 堀江晶太',
        '堀江晶太': 'kemu / 堀江晶太',
        'バルーン': 'バルーン / 須田景凪',
        '須田景凪': 'バルーン / 須田景凪',
        '蝶々P': '蝶々P / 一之瀬ユウ',
        '一之瀬ユウ': '蝶々P / 一之瀬ユウ',
        'はりーP': 'はりーP / 針原翼',
        '針原翼': 'はりーP / 針原翼',
        'こんにちは谷田さん': 'こんにちは谷田さん / キタニタツヤ',
        'キタニタツヤ': 'こんにちは谷田さん / キタニタツヤ',
        'ねこぼーろ': 'ねこぼーろ / ササノマリイ',
        'ササノマリイ': 'ねこぼーろ / ササノマリイ',
        '有機酸': '有機酸 / 神山羊',
        '神山羊': '有機酸 / 神山羊',
        'john': 'john / TOOBOE',
        'TOOBOE': 'john / TOOBOE',
        'トーマ': 'トーマ / Gyoson',
        'Gyoson': 'トーマ / Gyoson',
        'mao sasagawa': 'mao sasagawa / 笹川真生',
        '笹川真生': 'mao sasagawa / 笹川真生',
        'ぽりふぉ': 'ぽりふぉ / PolyphonicBranch',
        'PolyphonicBranch': 'ぽりふぉ / PolyphonicBranch',
        'risou': 'risou / 澤田空海理',
        '澤田空海理': 'risou / 澤田空海理',
        'kaoling': 'kaoling / 大越香里',
        '大越香里': 'kaoling / 大越香里',
        'もじゃ': 'もじゃ / 大柴広己',
        '大柴広己': 'もじゃ / 大柴広己',
        'KBShinya': 'KBShinya / 塔库 / 禹歌',
        '塔库': 'KBShinya / 塔库 / 禹歌',
        '禹歌': 'KBShinya / 塔库 / 禹歌',
        '著小生zoki': '著小生zoki / 鱼子酱',
        '鱼子酱': '著小生zoki / 鱼子酱',
        '米库喵': '米库喵 / 恩雅NYA',
        '恩雅NYA': '米库喵 / 恩雅NYA',
        'TSAR': 'TSAR / 崔瀚普',
        '崔瀚普': 'TSAR / 崔瀚普',
        '籽三': '籽三 / 兰音Reine',
        '兰音Reine': '籽三 / 兰音Reine'
    },
    
    SPECIAL_P_COMPOSERS: new Set(['许嵩', 'Bo Peep', 'JMJ'])
};