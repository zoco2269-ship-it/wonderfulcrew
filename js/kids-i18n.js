/* korean-kids 다국어 힌트 — 한국어 단어/가사 -> {en,ja,zh}
   기존 베트남어(vi)는 korean-kids.html 코드에 그대로 유지. 여기선 en/ja/zh 매핑. */
window.KIDS_LANGS = [
  {code:'vi', label:'Tiếng Việt', flag:'🇻🇳'},
  {code:'en', label:'English',    flag:'🇺🇸'},
  {code:'ja', label:'日本語',      flag:'🇯🇵'},
  {code:'zh', label:'中文',        flag:'🇨🇳'}
];
window.KIDS_I18N = {
"코끼리":{en:"elephant",ja:"ぞう",zh:"大象"},"사자":{en:"lion",ja:"ライオン",zh:"狮子"},"강아지":{en:"puppy",ja:"いぬ",zh:"小狗"},"고양이":{en:"cat",ja:"ねこ",zh:"猫"},"토끼":{en:"rabbit",ja:"うさぎ",zh:"兔子"},"곰":{en:"bear",ja:"くま",zh:"熊"},"호랑이":{en:"tiger",ja:"とら",zh:"老虎"},"개구리":{en:"frog",ja:"かえる",zh:"青蛙"},"펭귄":{en:"penguin",ja:"ペンギン",zh:"企鹅"},"말":{en:"horse",ja:"うま",zh:"马"},"돼지":{en:"pig",ja:"ぶた",zh:"猪"},"소":{en:"cow",ja:"うし",zh:"牛"},"닭":{en:"chicken",ja:"にわとり",zh:"鸡"},"원숭이":{en:"monkey",ja:"さる",zh:"猴子"},"여우":{en:"fox",ja:"きつね",zh:"狐狸"},"판다":{en:"panda",ja:"パンダ",zh:"熊猫"},"기린":{en:"giraffe",ja:"キリン",zh:"长颈鹿"},"거북이":{en:"turtle",ja:"かめ",zh:"乌龟"},"벌":{en:"bee",ja:"はち",zh:"蜜蜂"},"나비":{en:"butterfly",ja:"ちょうちょ",zh:"蝴蝶"},
"사과":{en:"apple",ja:"りんご",zh:"苹果"},"바나나":{en:"banana",ja:"バナナ",zh:"香蕉"},"딸기":{en:"strawberry",ja:"いちご",zh:"草莓"},"수박":{en:"watermelon",ja:"すいか",zh:"西瓜"},"포도":{en:"grapes",ja:"ぶどう",zh:"葡萄"},"귤":{en:"tangerine",ja:"みかん",zh:"橘子"},"복숭아":{en:"peach",ja:"もも",zh:"桃子"},"체리":{en:"cherry",ja:"さくらんぼ",zh:"樱桃"},"키위":{en:"kiwi",ja:"キウイ",zh:"猕猴桃"},"파인애플":{en:"pineapple",ja:"パイナップル",zh:"菠萝"},"망고":{en:"mango",ja:"マンゴー",zh:"芒果"},"레몬":{en:"lemon",ja:"レモン",zh:"柠檬"},"코코넛":{en:"coconut",ja:"ココナッツ",zh:"椰子"},
"밥":{en:"rice",ja:"ごはん",zh:"米饭"},"국수":{en:"noodles",ja:"めん",zh:"面条"},"빵":{en:"bread",ja:"パン",zh:"面包"},"치킨":{en:"fried chicken",ja:"チキン",zh:"炸鸡"},"피자":{en:"pizza",ja:"ピザ",zh:"披萨"},"햄버거":{en:"hamburger",ja:"ハンバーガー",zh:"汉堡"},"아이스크림":{en:"ice cream",ja:"アイスクリーム",zh:"冰淇淋"},"사탕":{en:"candy",ja:"あめ",zh:"糖果"},"우유":{en:"milk",ja:"ぎゅうにゅう",zh:"牛奶"},"계란":{en:"egg",ja:"たまご",zh:"鸡蛋"},"치즈":{en:"cheese",ja:"チーズ",zh:"奶酪"},"쿠키":{en:"cookie",ja:"クッキー",zh:"饼干"},
"자동차":{en:"car",ja:"じどうしゃ",zh:"汽车"},"비행기":{en:"airplane",ja:"ひこうき",zh:"飞机"},"버스":{en:"bus",ja:"バス",zh:"公交车"},"자전거":{en:"bicycle",ja:"じてんしゃ",zh:"自行车"},"기차":{en:"train",ja:"でんしゃ",zh:"火车"},"배":{en:"boat",ja:"ふね",zh:"船"},"택시":{en:"taxi",ja:"タクシー",zh:"出租车"},"경찰차":{en:"police car",ja:"パトカー",zh:"警车"},"구급차":{en:"ambulance",ja:"きゅうきゅうしゃ",zh:"救护车"},"소방차":{en:"fire truck",ja:"しょうぼうしゃ",zh:"消防车"},"오토바이":{en:"motorcycle",ja:"バイク",zh:"摩托车"},"헬리콥터":{en:"helicopter",ja:"ヘリコプター",zh:"直升机"},"로켓":{en:"rocket",ja:"ロケット",zh:"火箭"},
"빨강":{en:"red",ja:"あか",zh:"红色"},"주황":{en:"orange",ja:"オレンジ",zh:"橙色"},"노랑":{en:"yellow",ja:"きいろ",zh:"黄色"},"초록":{en:"green",ja:"みどり",zh:"绿色"},"파랑":{en:"blue",ja:"あお",zh:"蓝色"},"보라":{en:"purple",ja:"むらさき",zh:"紫色"},"갈색":{en:"brown",ja:"ちゃいろ",zh:"棕色"},"검정":{en:"black",ja:"くろ",zh:"黑色"},"하양":{en:"white",ja:"しろ",zh:"白色"},"분홍":{en:"pink",ja:"ピンク",zh:"粉色"},
"눈":{en:"eye",ja:"め",zh:"眼睛"},"귀":{en:"ear",ja:"みみ",zh:"耳朵"},"코":{en:"nose",ja:"はな",zh:"鼻子"},"입":{en:"mouth",ja:"くち",zh:"嘴巴"},"손":{en:"hand",ja:"て",zh:"手"},"발":{en:"foot",ja:"あし",zh:"脚"},"이":{en:"tooth",ja:"は",zh:"牙齿"},"팔":{en:"arm",ja:"うで",zh:"手臂"},"다리":{en:"leg",ja:"あし",zh:"腿"},
"해":{en:"sun",ja:"たいよう",zh:"太阳"},"달":{en:"moon",ja:"つき",zh:"月亮"},"별":{en:"star",ja:"ほし",zh:"星星"},"구름":{en:"cloud",ja:"くも",zh:"云"},"비":{en:"rain",ja:"あめ",zh:"雨"},"무지개":{en:"rainbow",ja:"にじ",zh:"彩虹"},"꽃":{en:"flower",ja:"はな",zh:"花"},"나무":{en:"tree",ja:"き",zh:"树"},"불":{en:"fire",ja:"ひ",zh:"火"},"물":{en:"water",ja:"みず",zh:"水"},"산":{en:"mountain",ja:"やま",zh:"山"},
"조개":{en:"shell",ja:"かい",zh:"贝壳"},"문어":{en:"octopus",ja:"たこ",zh:"章鱼"},"야자수":{en:"palm tree",ja:"やしのき",zh:"椰子树"},"파라솔":{en:"parasol",ja:"パラソル",zh:"遮阳伞"},"모래성":{en:"sandcastle",ja:"すなのしろ",zh:"沙堡"},"게":{en:"crab",ja:"かに",zh:"螃蟹"},"물고기":{en:"fish",ja:"さかな",zh:"鱼"},"사슴":{en:"deer",ja:"しか",zh:"鹿"},"버섯":{en:"mushroom",ja:"きのこ",zh:"蘑菇"},"다람쥐":{en:"squirrel",ja:"りす",zh:"松鼠"},"새":{en:"bird",ja:"とり",zh:"鸟"},"얼룩말":{en:"zebra",ja:"シマウマ",zh:"斑马"},"악어":{en:"crocodile",ja:"わに",zh:"鳄鱼"},
"지구":{en:"Earth",ja:"ちきゅう",zh:"地球"},"우주인":{en:"astronaut",ja:"うちゅうひこうし",zh:"宇航员"},"토성":{en:"Saturn",ja:"どせい",zh:"土星"},"혜성":{en:"comet",ja:"すいせい",zh:"彗星"},"비행접시":{en:"UFO",ja:"UFO",zh:"飞碟"},"별똥별":{en:"shooting star",ja:"ながれぼし",zh:"流星"},"빌딩":{en:"building",ja:"ビル",zh:"大楼"},"집":{en:"house",ja:"いえ",zh:"房子"},"신호등":{en:"traffic light",ja:"しんごう",zh:"红绿灯"},"학교":{en:"school",ja:"がっこう",zh:"学校"},"해바라기":{en:"sunflower",ja:"ひまわり",zh:"向日葵"},"등대":{en:"lighthouse",ja:"とうだい",zh:"灯塔"},"불가사리":{en:"starfish",ja:"ひとで",zh:"海星"},"트랙터":{en:"tractor",ja:"トラクター",zh:"拖拉机"},"바닷가":{en:"beach",ja:"うみべ",zh:"海边"},"농장":{en:"farm",ja:"のうじょう",zh:"农场"},
"곰 세 마리가 한 집에 있어":{en:"Three bears live in one house",ja:"3びきのくまが ひとつのいえに いる",zh:"三只小熊住在一个家"},"아빠 곰 엄마 곰 아기 곰":{en:"Papa bear, mama bear, baby bear",ja:"パパぐま ママぐま あかちゃんぐま",zh:"熊爸爸 熊妈妈 熊宝宝"},"아빠 곰은 뚱뚱해":{en:"Papa bear is chubby",ja:"パパぐまは ふとってる",zh:"熊爸爸胖胖的"},"엄마 곰은 날씬해":{en:"Mama bear is slim",ja:"ママぐまは スリム",zh:"熊妈妈瘦瘦的"},"아기 곰은 너무 귀여워":{en:"Baby bear is so cute",ja:"あかちゃんぐまは とてもかわいい",zh:"熊宝宝很可爱"},"으쓱으쓱 잘한다":{en:"Shrug shrug, well done!",ja:"えっへん じょうず！",zh:"得意得意 真棒"},
"나비야 나비야 이리 날아 오너라":{en:"Butterfly, butterfly, come fly here",ja:"ちょうちょ ちょうちょ こっちへ とんでおいで",zh:"蝴蝶呀蝴蝶 飞到这里来"},"노랑 나비 흰 나비 춤을 추며 오너라":{en:"Yellow and white butterflies, come dancing",ja:"きいろいちょう しろいちょう おどりながらおいで",zh:"黄蝴蝶 白蝴蝶 跳着舞飞来"},"봄바람에 꽃잎도 방긋방긋 웃으며":{en:"In spring breeze, petals smile brightly",ja:"はるかぜに はなびらも にっこりわらって",zh:"春风里 花瓣也笑眯眯"},"참새도 짹짹짹 노래하며 춤춘다":{en:"Sparrows chirp, sing and dance too",ja:"すずめも チュンチュン うたっておどる",zh:"麻雀也叽叽喳喳 唱歌跳舞"},
"반짝반짝 작은 별":{en:"Twinkle twinkle little star",ja:"きらきら ちいさなおほしさま",zh:"一闪一闪小星星"},"아름답게 비치네":{en:"Shining so beautifully",ja:"うつくしく かがやいてる",zh:"美丽地闪耀"},"동쪽 하늘에서도":{en:"In the eastern sky too",ja:"ひがしのそらでも",zh:"在东边的天空"},"서쪽 하늘에서도":{en:"In the western sky too",ja:"にしのそらでも",zh:"在西边的天空"},
"머리 어깨 무릎 발 무릎 발":{en:"Head, shoulders, knees, toes, knees, toes",ja:"あたま かた ひざ あし ひざ あし",zh:"头 肩膀 膝盖 脚 膝盖 脚"},"머리 어깨 발 무릎 발":{en:"Head, shoulders, toes, knees, toes",ja:"あたま かた あし ひざ あし",zh:"头 肩膀 脚 膝盖 脚"},"머리 어깨 무릎 귀 코 귀":{en:"Head, shoulders, knees, ears, nose, ears",ja:"あたま かた ひざ みみ はな みみ",zh:"头 肩膀 膝盖 耳朵 鼻子 耳朵"}
};
window.KIDS_UI = {
  vi:{sound:"Bật âm thanh nhé!",tapListen:"Chạm để nghe",pickScene:"Chọn cảnh"},
  en:{sound:"Turn on the sound!",tapListen:"Tap to listen",pickScene:"Pick a scene"},
  ja:{sound:"おとを つけてね！",tapListen:"タップして きく",pickScene:"シーンを えらぶ"},
  zh:{sound:"请打开声音！",tapListen:"点击听发音",pickScene:"选择场景"}
};
window.kidsTr = function(ko, lang){
  if(lang==='vi') return null;
  var e = window.KIDS_I18N[ko];
  return (e && e[lang]) ? e[lang] : null;
};
