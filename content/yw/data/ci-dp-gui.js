// 词语积累 · 词语归类。每类：{ id, name（这一类叫什么）, w（词）, vs（可以拿来当「不同的那个」的类）, note（容易归错的词，讲解时提醒） }
// 出题：从一类里取三个词，再从 vs 里的一类取一个词。vs 只列和这一类完全不沾边的类：
// 动物不和大自然比（虫子也在大自然里），树不和水果比（桃树、梨树会结果），节日不和节气比清明、冬至（两边都算），这些词都没收。
const sp = (s) => s.trim().split(/\s+/);

// 一年级上册：单个字，全是这一册会写的字
export const G1A = [
  { id: 'num', name: '数字', w: sp('一 二 三 四 五 六 七 八 九 十'), vs: ['body', 'animal', 'nature', 'fang'] },
  { id: 'body', name: '身体的部位', w: sp('口 耳 目 手 牙 头'), vs: ['num', 'animal', 'nature', 'fang'] },
  { id: 'animal', name: '动物', w: sp('马 牛 羊 鸟 虫'), vs: ['num', 'body', 'fang'] },
  { id: 'nature', name: '大自然里的东西', w: sp('日 月 山 水 火 石 土 云 雨 风'), vs: ['num', 'body', 'fang'] },
  { id: 'fang', name: '表示方向、位置的字', w: sp('上 下 左 右 东 西'), vs: ['num', 'body', 'animal', 'nature'] },
];

// 一年级下册：两个字的词
export const G1B = [
  { id: 'fruit', name: '水果', w: sp('苹果 香蕉 西瓜 桃子 葡萄 草莓'), vs: ['veg', 'animal', 'wenju'], note: { 西瓜: '「西瓜」名字里有「瓜」，可它是水果' } },
  { id: 'veg', name: '蔬菜', w: sp('白菜 萝卜 黄瓜 土豆 青菜 菠菜'), vs: ['fruit', 'animal', 'color'], note: { 黄瓜: '「黄瓜」名字里有「瓜」，可它是做菜吃的蔬菜，不是水果' } },
  { id: 'animal', name: '小动物', w: sp('小猫 小狗 小鸡 小鸭 小兔 小马 小牛 小羊'), vs: ['fruit', 'wenju', 'family', 'traffic'] },
  { id: 'wenju', name: '学习用品', w: sp('铅笔 尺子 橡皮 毛笔 书包'), vs: ['fruit', 'animal', 'traffic', 'family'] },
  { id: 'color', name: '颜色', w: sp('红色 白色 黄色 绿色 蓝色 黑色'), vs: ['season', 'fruit', 'veg'] },
  { id: 'season', name: '季节', w: sp('春天 夏天 秋天 冬天'), vs: ['weather', 'color'] },
  { id: 'weather', name: '天气', w: sp('晴天 雨天 阴天 雪天'), vs: ['season', 'color'], note: { 晴天: '「晴天」说的是天气，不是季节', 雨天: '「雨天」说的是天气，不是季节', 阴天: '「阴天」说的是天气，不是季节', 雪天: '「雪天」说的是天气，不是季节' } },
  { id: 'family', name: '家里的人', w: sp('爸爸 妈妈 爷爷 奶奶 哥哥 姐姐 弟弟 妹妹'), vs: ['animal', 'body', 'wenju'] },
  { id: 'body', name: '身体的部位', w: sp('眼睛 耳朵 鼻子 嘴巴 眉毛 头发'), vs: ['family', 'wenju', 'fruit'] },
  { id: 'traffic', name: '交通工具', w: sp('汽车 火车 飞机 轮船'), vs: ['animal', 'wenju', 'fruit'] },
];

// 二年级上册
export const G2A = [
  { id: 'bird', name: '鸟', w: sp('燕子 麻雀 喜鹊 老鹰 大雁 黄鹂 白鹭'), vs: ['insect', 'flower'] },
  { id: 'insect', name: '昆虫（小虫子）', w: sp('蜜蜂 蝴蝶 蜻蜓 蚂蚁 蟋蟀 知了'), vs: ['bird', 'flower'] },
  { id: 'tree', name: '树', w: sp('松树 柳树 杨树 枫树 桃树 梨树 榕树'), vs: ['flower'], note: { 桃树: '「桃树」是树，「桃花」才是花', 梨树: '「梨树」是树，「梨花」才是花' } },
  { id: 'flower', name: '花', w: sp('荷花 菊花 梅花 桃花 兰花 杏花'), vs: ['tree', 'bird', 'insect'], note: { 桃花: '「桃花」是花，「桃树」才是树' } },
  { id: 'ball', name: '球', w: sp('足球 篮球 排球 网球'), vs: ['music', 'wenju'] },
  { id: 'music', name: '乐器', w: sp('钢琴 笛子 二胡 古筝 琵琶'), vs: ['ball', 'wenju'] },
  { id: 'job', name: '做什么工作的人', w: sp('老师 医生 警察 工人 农民 司机 厨师'), vs: ['place', 'furniture'] },
  { id: 'place', name: '地方', w: sp('学校 医院 公园 商店 银行 车站'), vs: ['job', 'furniture'] },
  { id: 'furniture', name: '家具', w: sp('桌子 沙发 衣柜 书柜 床铺'), vs: ['wenju', 'place', 'job'] },
  { id: 'wenju', name: '学习用品', w: sp('铅笔 橡皮 尺子 毛笔'), vs: ['furniture', 'ball', 'music'] },
  { id: 'jie', name: '节日', w: sp('春节 中秋 端午 元宵'), vs: ['season'], note: { 春节: '「春节」是节日，「春天」才是季节' } },
  { id: 'season', name: '季节', w: sp('春天 夏天 秋天 冬天'), vs: ['jie'], note: { 春天: '「春天」是季节，「春节」才是节日' } },
  { id: 'mood', name: '心情', w: sp('高兴 难过 生气 害怕 伤心 着急'), vs: ['action'] },
  { id: 'action', name: '动作', w: sp('跑步 跳绳 游泳 唱歌 跳舞 拍球'), vs: ['mood'] },
];

// 三年级：按意思分（表示动作、声音、颜色、心情的词；描写四季的词）
export const G3A = [
  { id: 'kan', name: '表示「看」的词', w: sp('观看 眺望 注视 张望 仰望 观察'), vs: ['shuo', 'ting', 'zou'] },
  { id: 'shuo', name: '表示「说」的词', w: sp('告诉 回答 叫喊 讲述 议论 嘱咐'), vs: ['kan', 'ting', 'zou'] },
  { id: 'ting', name: '表示「听」的词', w: sp('倾听 聆听'), vs: [] },
  { id: 'zou', name: '表示腿脚动作的词', w: sp('奔跑 散步 漫步 行走 跳跃 攀登'), vs: ['kan', 'shuo', 'ting'] },
  { id: 'sound', name: '表示声音的词', w: sp('哗哗 叮咚 轰隆 滴答 扑通 呼呼'), vs: ['color', 'mood'] },
  { id: 'color', name: '表示颜色的词', w: sp('雪白 碧绿 金黄 火红 蔚蓝 乌黑'), vs: ['sound', 'mood'] },
  { id: 'mood', name: '表示心情的词', w: sp('激动 难过 兴奋 着急 害怕 愤怒'), vs: ['sound', 'color', 'zou'] },
  { id: 'chun', name: '描写春天的词', w: sp('春暖花开 鸟语花香 春回大地 万物复苏 柳绿花红'), vs: ['xia', 'qiu', 'dong'] },
  { id: 'xia', name: '描写夏天的词', w: sp('烈日炎炎 骄阳似火 酷暑难耐'), vs: ['chun', 'qiu', 'dong'] },
  { id: 'qiu', name: '描写秋天的词', w: sp('秋高气爽 硕果累累 五谷丰登 天高云淡 金风送爽'), vs: ['chun', 'xia', 'dong'] },
  { id: 'dong', name: '描写冬天的词', w: sp('白雪皑皑 冰天雪地 寒风刺骨 天寒地冻 滴水成冰'), vs: ['chun', 'xia', 'qiu'] },
];

// 四年级：节日和节气、古代诗人和现代作家、学科和乐器
export const G4A = [
  { id: 'jie', name: '传统节日', w: sp('春节 元宵 端午 中秋 重阳 七夕'), vs: ['jieqi'], note: { 立春: '「立春」是二十四节气，不是节日' } },
  { id: 'jieqi', name: '二十四节气', w: sp('立春 立夏 立秋 立冬 春分 秋分 夏至 惊蛰 谷雨 白露 霜降 小满 芒种 大暑 小寒 大寒'), vs: ['jie'] },
  { id: 'poet', name: '古代诗人', w: sp('李白 杜甫 王维 陆游 苏轼 杜牧 高鼎 李绅'), vs: ['writer'] },
  { id: 'writer', name: '现代作家', w: sp('鲁迅 老舍 冰心 巴金 茅盾'), vs: ['poet'] },
  { id: 'subject', name: '学校里的科目', w: sp('语文 数学 英语 科学 美术'), vs: ['music', 'sport'] },
  { id: 'music', name: '乐器', w: sp('钢琴 笛子 二胡 古筝 琵琶 唢呐'), vs: ['subject', 'sport'] },
  { id: 'sport', name: '体育运动', w: sp('跳远 跳高 赛跑 游泳 滑冰 射箭'), vs: ['subject', 'music'] },
  { id: 'scenic', name: '中国的名胜', w: sp('长城 故宫 天坛 黄山 泰山 西湖'), vs: ['poet', 'writer'] },
];

// 五六年级：意思更细的动作词、描写人的词
export const G5A = [
  { id: 'kan', name: '表示「看」的词', w: sp('眺望 凝视 俯视 仰望 瞻仰 环顾 注视 端详 打量'), vs: ['shuo', 'xiang', 'ting', 'zou'] },
  { id: 'shuo', name: '表示「说」的词', w: sp('嘱咐 吩咐 叙述 议论 争辩 询问 诉说'), vs: ['kan', 'xiang', 'ting', 'zou'] },
  { id: 'xiang', name: '表示「想」的词', w: sp('思考 琢磨 回忆 思索 考虑 盘算'), vs: ['kan', 'shuo', 'ting', 'zou'] },
  { id: 'ting', name: '表示「听」的词', w: sp('倾听 聆听'), vs: [] },
  { id: 'zou', name: '表示「走」的词', w: sp('漫步 徘徊 踱步 跋涉 散步 行走'), vs: ['kan', 'shuo', 'xiang', 'ting'] },
  { id: 'pinzhi', name: '描写品质的词', w: sp('勇敢 诚实 善良 勤劳 谦虚 正直'), vs: ['waimao'] },
  { id: 'waimao', name: '描写外貌的词', w: sp('苗条 魁梧 瘦小 白净 清秀 黝黑'), vs: ['pinzhi'] },
];
