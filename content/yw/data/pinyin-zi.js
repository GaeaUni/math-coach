// 拼音板块用的常用字：字 音节 词语（词语里放这个字，出题时把它加点）。
// 都是一年级能认、能说的字；读音逐个用 tools/yw/py.mjs 核对过。
// 行首 # 表示多音字或单念时容易读错（不用于「听音选音节」，其他题有词语语境可以用）。
// 第 4 列是字典里这个字的其他读音（多是不常用的），生成干扰项时避开。
const RAW = `
爸 bà 爸爸
八 bā 八个
怕 pà 害怕
爬 pá 爬山
妈 mā 妈妈
马 mǎ 小马
#大 dà 大小 dài
他 tā 他们
拿 ná 拿走
拉 lā 拉手 lá/lǎ/là
茶 chá 喝茶
沙 shā 沙子 shà
擦 cā 擦桌子
波 bō 水波
婆 pó 外婆
摸 mō 摸一摸
我 wǒ 我们
哥 gē 哥哥
鹅 é 白鹅
饿 è 饿了
渴 kě 口渴
#喝 hē 喝水 hè/yè
河 hé 小河
课 kè 上课
#车 chē 汽车 jū
热 rè 热水
#色 sè 红色 shǎi
#这 zhè 这里 zhèi
#乐 lè 快乐 yuè/yào/lào
特 tè 特别
舌 shé 舌头
衣 yī 衣服 yì
鼻 bí 鼻子
皮 pí 皮球
米 mǐ 大米
笔 bǐ 铅笔
弟 dì 弟弟 tì/tuí
#地 dì 土地
你 nǐ 你好
泥 ní 泥土 nì
力 lì 力气
鸡 jī 小鸡
七 qī 七个
西 xī 西瓜
洗 xǐ 洗手 xiǎn
骑 qí 骑车
气 qì 空气
梯 tī 楼梯
乌 wū 乌鸦 wù
五 wǔ 五个
布 bù 花布
步 bù 跑步
木 mù 木头
目 mù 目光
父 fù 父母 fǔ
土 tǔ 泥土
兔 tù 白兔
读 dú 读书 dòu
路 lù 马路
鹿 lù 小鹿
哭 kū 哭了
虎 hǔ 老虎
湖 hú 湖水
书 shū 看书
猪 zhū 小猪
树 shù 大树
出 chū 出来
入 rù 出入
竹 zhú 竹子
苦 kǔ 苦瓜
鱼 yú 小鱼
雨 yǔ 下雨 yù
女 nǚ 女儿 rǔ
#绿 lǜ 绿色 lù
去 qù 出去
句 jù 句子 gōu
举 jǔ 举手
白 bái 白云
拍 pāi 拍手
买 mǎi 买菜
来 lái 过来
太 tài 太阳
奶 nǎi 奶奶
开 kāi 开门
海 hǎi 大海
菜 cài 青菜
在 zài 现在
晒 shài 晒太阳
爱 ài 爱心
杯 bēi 杯子
北 běi 北京 bèi
美 měi 美丽
飞 fēi 飞机
黑 hēi 黑色
#给 gěi 给你 jǐ
贝 bèi 贝壳
被 bèi 被子 pī
内 nèi 内外 nà
雷 léi 打雷
水 shuǐ 喝水
嘴 zuǐ 嘴巴
吹 chuī 吹风
灰 huī 灰色
对 duì 对错
腿 tuǐ 大腿
岁 suì 三岁
推 tuī 推开
包 bāo 书包
跑 pǎo 跑步 páo
猫 māo 小猫 máo
刀 dāo 小刀
桃 táo 桃花
脑 nǎo 电脑
老 lǎo 老师
高 gāo 高山
#好 hǎo 好人 hào
草 cǎo 小草
早 zǎo 早上
#少 shǎo 多少 shào
找 zhǎo 找人
豆 dòu 土豆
头 tóu 头发
楼 lóu 楼房
狗 gǒu 小狗
口 kǒu 口水
后 hòu 前后
走 zǒu 走路
手 shǒu 小手
肉 ròu 吃肉
舟 zhōu 小舟
牛 niú 小牛
六 liù 六个 lù
球 qiú 皮球
九 jiǔ 九个
秋 qiū 秋天
休 xiū 休息 xǔ
姐 jiě 姐姐
写 xiě 写字
鞋 xié 鞋子
贴 tiē 贴画
铁 tiě 钢铁
别 bié 别人 biè
学 xué 学校
雪 xuě 下雪
月 yuè 月亮
缺 quē 缺少
耳 ěr 耳朵
二 èr 十二
儿 ér 儿子
安 ān 平安
山 shān 高山
三 sān 三个
半 bàn 一半
蓝 lán 蓝天
#看 kàn 看书 kān
饭 fàn 吃饭
伞 sǎn 雨伞
门 mén 开门
本 běn 本子
森 sēn 森林
很 hěn 很好
跟 gēn 跟着
人 rén 大人
#分 fēn 分开 fèn
真 zhēn 真好
林 lín 树林
心 xīn 开心
新 xīn 新年
进 jìn 进来
金 jīn 金色
民 mín 人民
拼 pīn 拼音
您 nín 您好
春 chūn 春天
村 cūn 村子
孙 sūn 孙子 xùn
轮 lún 车轮
滚 gǔn 滚动
吞 tūn 吞下
云 yún 白云
军 jūn 军人
裙 qún 裙子
羊 yáng 小羊 xiáng
帮 bāng 帮忙
#胖 pàng 胖子 pán/pàn
忙 máng 帮忙
方 fāng 方向
房 fáng 房子
糖 táng 白糖
狼 láng 灰狼
张 zhāng 一张
#上 shàng 上下 shǎng
唱 chàng 唱歌
让 ràng 让开
灯 dēng 电灯
风 fēng 大风 fěng
等 děng 等一等
疼 téng 头疼
冷 lěng 冷水
朋 péng 朋友
梦 mèng 做梦
生 shēng 生日
城 chéng 城市
星 xīng 星星
听 tīng 听话
明 míng 明天
冰 bīng 冰块
瓶 píng 花瓶
停 tíng 停下
鹰 yīng 老鹰
青 qīng 青草
晴 qíng 晴天
睛 jīng 眼睛
东 dōng 东西
冬 dōng 冬天
红 hóng 红花 gōng
#空 kōng 天空 kòng/kǒng
#中 zhōng 中间 zhòng
虫 chóng 虫子
农 nóng 农民
龙 lóng 小龙
松 sōng 松树
公 gōng 公园
花 huā 红花
瓜 guā 西瓜
画 huà 画画
家 jiā 回家
下 xià 下雨
虾 xiā 小虾 há
牙 yá 牙齿
鸭 yā 小鸭
果 guǒ 苹果
国 guó 中国
说 shuō 说话 shuì/yuè
桌 zhuō 桌子
多 duō 多少
坐 zuò 坐下
火 huǒ 大火
快 kuài 快乐
坏 huài 坏人 pēi/pī/péi
怪 guài 奇怪
小 xiǎo 小鸟
笑 xiào 笑脸
鸟 niǎo 小鸟
跳 tiào 跳高 táo
叫 jiào 叫人
桥 qiáo 小桥
苗 miáo 禾苗
飘 piāo 飘动
天 tiān 天空
田 tián 田地
点 diǎn 一点
边 biān 河边
面 miàn 面包
年 nián 新年
前 qián 前后
先 xiān 先后
见 jiàn 再见 xiàn
关 guān 关门
欢 huān 欢乐
船 chuán 小船
短 duǎn 长短
酸 suān 酸奶
团 tuán 团圆
江 jiāng 长江
想 xiǎng 想念
香 xiāng 香味
墙 qiáng 墙上
两 liǎng 两个
亮 liàng 亮光
光 guāng 阳光
黄 huáng 黄色
床 chuáng 小床
双 shuāng 一双
窗 chuāng 窗口
知 zhī 知道 zhì
纸 zhǐ 白纸
吃 chī 吃饭
尺 chǐ 尺子 chě
诗 shī 古诗
十 shí 十个
#石 shí 石头 dàn
是 shì 是不是
日 rì 日子
字 zì 写字
#子 zǐ 子女
次 cì 一次
词 cí 生词
四 sì 四个
丝 sī 丝线
医 yī 医生
椅 yǐ 椅子 yī
屋 wū 小屋
叶 yè 树叶 xié
也 yě 也是
圆 yuán 圆形
远 yuǎn 远近 yuàn
音 yīn 拼音
银 yín 银色
运 yùn 运动
影 yǐng 影子
有 yǒu 有人 yòu
#要 yào 我要 yāo
用 yòng 有用
眼 yǎn 眼睛
娃 wá 娃娃
外 wài 外面
碗 wǎn 饭碗
王 wáng 国王 wàng
问 wèn 问题
晚 wǎn 晚上
文 wén 语文
`;

export const ZI = RAW.trim().split('\n').map((line) => {
  const poly = line.startsWith('#');
  const [ch, py, word, alt] = line.replace(/^#/, '').split(' ');
  return { ch, py, word, poly, alt: alt ? alt.split('/') : [] };
});
