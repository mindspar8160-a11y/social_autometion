import {KitCtx, Pal, paper, circ, ell, rect, poly, path, limb, ln, dot, stroke, g, flame, halo, lotus, sw, f1, rnd, tree, cloud, ground, mountains, stars} from "./paper";
import type {Asset} from "./assetsFigures";

const shikhar = (cx: number, base: number, w: number, h: number, pal: Pal, tiers = 4, col = 0): any[] => {
  const o: any[] = [];
  for (let i = 0; i < tiers; i++) {
    const tw = w * (1 - i * 0.2), th = h / tiers, y = base - i * th;
    o.push(path(`M${f1(cx - tw / 2)},${f1(y)}L${f1(cx + tw / 2)},${f1(y)}L${f1(cx + tw * 0.4)},${f1(y - th)}L${f1(cx - tw * 0.4)},${f1(y - th)}Z`, pal.paper[(i + col) % 5], 3));
  }
  const top = base - h;
  o.push(ell(cx, top - 4, w * 0.2, 9, pal.gold, 2.6), path(`M${f1(cx - 9)},${f1(top - 8)}Q${f1(cx)},${f1(top - 42)} ${f1(cx + 9)},${f1(top - 8)}Z`, pal.gold, 2.4));
  return o;
};
const flagAt = (x: number, y: number, t: number, pal: Pal, k = 0) => [rect(x - 2, y - 56, 4, 58, pal.ink, 0, 1), path(`M${f1(x + 2)},${f1(y - 56)}Q${f1(x + 22 + sw(t, 1.1, 5, k))},${f1(y - 62)} ${f1(x + 40 + sw(t, 1.1, 6, k))},${f1(y - 50)}L${f1(x + 2)},${f1(y - 38)}Z`, "#f08c1c", 2)];

export const WORLD: Asset[] = [
  /* ---------------- places */
  {id: "shaktipeeth_shrine", group: "place", tags: ["शक्तिपीठ", "मंदिर", "shrine", "देवी मंदिर", "पीठ", "माता मंदिर", "सिद्धपीठ", "धाम", "तीर्थ", "स्थान", "temple"], draw: ({t, pal}) => {
    const b = 468;
    return paper(pal, mountains(pal, b - 40, 3, false, 0, 600, 120), path("M30,470L570,470L540,430L60,430Z", pal.paper[3], 3), path("M80,430L520,430L490,394L110,394Z", pal.paper[1], 3),
      ...[-1, 1].flatMap((d) => [...shikhar(300 + d * 168, 394, 90, 150, pal, 3, 1), ...flagAt(300 + d * 168, 238, t, pal, d)]),
      path("M170,394L430,394L430,290L170,290Z", pal.paper[0], 3), ...shikhar(300, 290, 230, 190, pal, 4, 0), ...flagAt(300, 66, t, pal),
      path("M262,394L262,330Q300,296 338,330L338,394Z", "#352618", 3), ...flame(300, 372, 0.8, t, pal), ...[0, 1, 2, 3, 4].map((i) => circ(112 + i * 94, 412, 6, pal.gold, 1.4)));
  }},
  {id: "gopuram_south", group: "place", tags: ["गोपुरम", "दक्षिण", "तमिल", "मदुरै", "रामेश्वरम", "कन्याकुमारी", "लेपाक्षी", "gopuram", "तिरुपति", "कांची", "मीनाक्षी", "केरल", "कर्नाटक", "आंध्र"], draw: ({t, pal}) => {
    const b = 468, tiers = 7;
    const o: any[] = [path("M60,470L540,470L510,440L90,440Z", pal.paper[3], 3)];
    for (let i = 0; i < tiers; i++) {
      const w = 340 - i * 40, y = 440 - i * 48;
      o.push(rect(300 - w / 2, y - 46, w, 46, pal.paper[(i + 1) % 5], 3, 2.8), ...[0, 1, 2, 3].map((k) => rect(300 - w / 2 + 12 + k * (w - 24) / 4, y - 36, (w - 24) / 4 - 10, 28, i % 2 ? pal.accent : pal.paper[2], 3, 1.6)), rect(300 - w / 2 - 8, y - 6, w + 16, 8, pal.gold, 2, 1.8));
    }
    o.push(path("M232,128Q300,80 368,128L352,150L248,150Z", pal.gold, 3), ...[-26, 0, 26].map((d) => path(`M${300 + d - 8},96L${300 + d},60L${300 + d + 8},96Z`, pal.gold, 2)), path("M270,440L270,380Q300,350 330,380L330,440Z", "#352618", 2.8));
    return paper(pal, ...o);
  }},
  {id: "fort_gate", group: "place", tags: ["किला", "दुर्ग", "गढ़", "fort", "चित्तौड़", "पन्हाला", "विशालगढ़", "रणथंभौर", "दरवाज़ा", "किले", "पावनखिंड", "खिंड", "कोट", "बुर्ज", "सिंहगढ़", "रायगढ़", "युद्धभूमि"], draw: ({t, pal}) => {
    const b = 468;
    const crenel = (x: number, y: number, w: number) => Array.from({length: Math.floor(w / 28)}, (_, i) => rect(x + i * 28 + 2, y - 18, 20, 18, pal.paper[2], 0, 2));
    return paper(pal, mountains(pal, b - 30, 7, false, 0, 600, 110), rect(30, 300, 540, 170, pal.paper[1], 0, 3.4), ...crenel(30, 300, 540),
      ...[-1, 1].flatMap((d) => [rect(300 + d * 200 - 46, 190, 92, 280, pal.paper[3], 0, 3.4), ...crenel(300 + d * 200 - 46, 190, 92), path(`M${300 + d * 200 - 50},172L${300 + d * 200},130L${300 + d * 200 + 50},172Z`, pal.accent, 3)]),
      path("M230,470L230,350Q300,270 370,350L370,470Z", "#352618", 3.4), ...[0, 1, 2, 3].map((i) => rect(236 + i * 32, 360 + i * 0, 6, 110, pal.gold, 2, 1)), ...flagAt(300 - 200, 130, t, pal, 0), ...flagAt(300 + 200, 130, t, pal, 2));
  }},
  {id: "ghat_river", group: "place", tags: ["घाट", "गंगा", "नदी", "यमुना", "नर्मदा", "काशी", "ghat", "river", "ganga", "वाराणसी", "प्रयाग", "संगम", "स्नान", "तट", "गोदावरी", "क्षिप्रा", "सरयू"], draw: ({t, pal}) => {
    const wv = (i: number) => stroke(`M${40 + i * 150 + sw(t, 0.4, 14, i)},${440 + (i % 2) * 20}q35,-16 70,0t70,0`, pal.cream, 3);
    return paper(pal, path("M0,330L600,330L600,500L0,500Z", pal.sky, 0.1), ...[0, 1, 2, 3, 4].map((i) => path(`M0,${290 + i * 14}L${600 - i * 40},${290 + i * 14}L${600 - i * 40},${304 + i * 14}L0,${304 + i * 14}Z`, pal.paper[(i + 1) % 5], 2.6)),
      ...shikhar(120, 290, 90, 150, pal, 3, 2), ...shikhar(470, 290, 76, 120, pal, 3, 1), ...[0, 1, 2, 3, 4].map(wv),
      path("M330,420Q380,456 470,420L450,440Q390,462 346,440Z", pal.cloth[3] || "#6b4a2a", 2.6), rect(398, 360, 5, 70, pal.ink, 0, 1.4), path("M402,362L450,404L402,404Z", "#f4efe0", 2),
      ...[0, 1, 2, 3].flatMap((i) => flame(70 + i * 90, 470 + sw(t, 0.5, 4, i), 0.55, t, pal, i)));
  }},
  {id: "himalaya_peaks", group: "place", tags: ["हिमालय", "पर्वत", "कैलाश", "केदारनाथ", "बद्रीनाथ", "हिम", "himalaya", "kailash", "kedarnath", "badrinath", "बर्फ", "शिखर", "चोटी", "पहाड़", "अमरनाथ", "वैष्णो"], draw: ({t, pal}) =>
    paper(pal, ...stars(14, 5, 600, 150, t), circ(470, 90, 46, pal.paper[0], 2.8), mountains(pal, 440, 11, true, 0, 600, 300), mountains(pal, 470, 21, true, -40, 640, 190), ground(pal, 470, 600, pal.paper[0]),
      ...cloud(150, 210, 0.9, pal.cream), ...cloud(420, 240, 0.8, pal.cream))},
  {id: "banyan_grove", group: "place", tags: ["वट", "बरगद", "पीपल", "पेड़", "वृक्ष", "वन", "tree", "forest", "banyan", "जंगल", "बाग", "उपवन", "तपोवन", "अरण्य", "दंडकारण्य"], draw: ({t, pal}) =>
    paper(pal, circ(120, 100, 40, pal.gold, 2.6), ground(pal, 456), ...tree(110, 466, 0.9, pal, "pine"), ...tree(500, 466, 1, pal, "round", 1), ...tree(330, 468, 1.5, pal, "banyan"),
      ...Array.from({length: 6}, (_, i) => circ(60 + i * 92, 240 + sw(t, 0.5, 20, i) + (i % 2) * 60, 3.2, "#fff2a6", 0.5)))},
  {id: "cave_mouth", group: "place", tags: ["गुफा", "cave", "अमरनाथ", "सुरंग", "तहखाना", "रहस्य", "तपोभूमि", "कंदरा", "भूमिगत", "अंधेरा"], draw: ({t, pal}) =>
    paper(pal, path("M20,470Q30,150 300,90Q570,150 580,470Z", pal.paper[4], 3.6), path("M80,470Q100,210 300,160Q500,210 520,470Z", pal.paper[3], 3), path("M150,470Q170,280 300,240Q430,280 450,470Z", "#2a1a10", 3),
      ...flame(300, 440, 1.5, t, pal), ...[0, 1, 2, 3, 4].map((i) => poly([[60 + i * 110, 120 + (i % 2) * 20], [78 + i * 110, 120 + (i % 2) * 20], [69 + i * 110, 170 + (i % 3) * 20]], pal.paper[2], 2)), ...[0, 1, 2].map((i) => circ(240 + i * 60, 340 + sw(t, 0.8, 5, i), 3 + i, "#ffe9a8", 0.5)))},
  {id: "sea_ship", group: "place", tags: ["समुद्र", "सागर", "लहर", "नाव", "जहाज", "sea", "ocean", "boat", "रामसेतु", "लंका", "द्वारका", "समंदर", "तूफान", "मछुआरे", "डूबी", "मंथन"], draw: ({t, pal}) => {
    const w = (i: number, y: number) => path(`M-10,${y + sw(t, 0.5, 6, i)}Q60,${y - 26 + sw(t, 0.7, 6, i)} 130,${y}T270,${y}T410,${y}T550,${y}T690,${y}V520H-10Z`, pal.sky, 2.6);
    return paper(pal, circ(470, 120, 52, pal.gold, 2.8), w(0, 360), g(`translate(0 ${f1(sw(t, 0.6, 8))})`, paper(pal, path("M170,360L430,360Q400,420 340,430L230,430Q190,410 170,360Z", pal.cloth[3] || "#6b4a2a", 3), rect(296, 130, 8, 232, pal.ink, 0, 1.6), path("M304,138Q420,230 386,340L304,340Z", "#f4efe0", 2.8), path("M296,150Q210,240 232,340L296,340Z", pal.accent, 2.8), path("M304,130L346,144L304,156Z", "#f08c1c", 1.6))),
      w(1, 410), w(2, 450));
  }},
  {id: "village_well", group: "place", tags: ["गाँव", "गांव", "कुआँ", "कुआं", "झोपड़ी", "किसान", "खेत", "village", "well", "मिट्टी", "ग्वाला", "बस्ती", "कुटिया", "आँगन", "ग्रामीण"], draw: ({t, pal}) =>
    paper(pal, circ(110, 100, 40, pal.gold, 2.6), ground(pal, 440), ...tree(500, 460, 1.2, pal, "palm"),
      poly([[60, 380], [180, 300], [300, 380]], pal.cloth[3] || "#8a6a3a", 3), rect(84, 380, 192, 80, pal.paper[1], 0, 3), path("M150,460L150,404Q180,384 210,404L210,460Z", "#352618", 2.6),
      path("M360,470L360,420Q420,396 480,420L480,470Z", pal.paper[3], 3), rect(350, 410, 140, 16, pal.paper[4], 6, 2.6), rect(364, 340, 8, 74, pal.ink, 0, 1.4), rect(468, 340, 8, 74, pal.ink, 0, 1.4), rect(360, 332, 120, 12, pal.cloth[3] || "#6b4a2a", 4, 2), ln(420, 344, 420, 384, pal.ink, 2.4), ell(420, 394, 14, 10, pal.accent, 2))},
  {id: "desert_camel", group: "place", tags: ["रेगिस्तान", "मरुस्थल", "ऊँट", "राजस्थान", "जैसलमेर", "desert", "camel", "रेत", "थार", "बीकानेर", "मारवाड़", "जोधपुर", "चारणी", "पाबूजी", "रामदेव"], draw: ({t, pal}) =>
    paper(pal, circ(120, 110, 56, pal.gold, 2.8), path("M-10,400Q150,330 300,400T610,390V520H-10Z", pal.paper[2], 3), path("M-10,450Q200,400 400,450T610,440V520H-10Z", pal.paper[3], 3),
      path("M190,430L190,330Q180,300 200,290Q230,300 250,310Q300,270 340,320Q380,310 404,330L410,430L392,430L388,356L350,356L346,430L322,430L318,360L250,360L246,430Z", pal.cloth[3] || "#b8864a", 3), path("M196,300Q150,280 140,230Q142,214 156,218Q160,250 206,270Z", pal.cloth[3] || "#b8864a", 2.6), circ(150, 224, 12, pal.cloth[3] || "#b8864a", 2.4), ellipseHump(pal), dot(150, 222, 2.4, pal.ink),
      ...tree(520, 440, 0.6, pal, "palm"))},
  {id: "palace_arches", group: "place", tags: ["महल", "दरबार", "हवेली", "palace", "court", "राजमहल", "राज दरबार", "अंतःपुर", "हवा महल", "राजप्रासाद", "जयपुर", "उदयपुर", "मैसूर", "कोठी"], draw: ({t, pal}) => {
    const dome = (x: number, y: number, r: number, c: string) => [path(`M${x - r},${y}Q${x - r},${y - r * 1.5} ${x},${y - r * 1.6}Q${x + r},${y - r * 1.5} ${x + r},${y}Z`, c, 3), rect(x - 3, y - r * 1.6 - 28, 6, 28, pal.gold, 2, 1.6), circ(x, y - r * 1.6 - 30, 6, pal.gold, 1.6)];
    return paper(pal, rect(40, 290, 520, 180, pal.paper[1], 0, 3.4), ...dome(300, 290, 74, pal.accent), ...dome(110, 290, 40, pal.paper[3]), ...dome(490, 290, 40, pal.paper[3]),
      ...[0, 1, 2, 3, 4].map((i) => path(`M${88 + i * 100},470L${88 + i * 100},370Q${118 + i * 100},330 ${148 + i * 100},370L${148 + i * 100},470Z`, i === 2 ? "#352618" : pal.paper[3], 2.8)), rect(40, 280, 520, 14, pal.gold, 3, 2.6),
      ...[0, 1, 2, 3, 4, 5, 6].map((i) => circ(70 + i * 76, 322, 6, pal.gold, 1.4)));
  }},
  /* ---------------- nature + creatures */
  {id: "lion_vahana", group: "nature", tags: ["सिंह", "शेर", "lion", "वाहन", "दहाड़", "शार्दूल", "नरसिंह", "पशुराज", "व्याघ्र", "बाघ", "tiger"], draw: ({t, pal}) => {
    const mane = Array.from({length: 14}, (_, i) => { const a = (i / 14) * Math.PI * 2; return ell(210 + Math.cos(a) * 72, 200 + Math.sin(a) * 66, 34, 28, i % 2 ? pal.cloth[3] || "#a8662a" : "#c9822f", 2.4); });
    return paper(pal, ground(pal, 458), path("M240,440L240,340Q230,300 280,290L420,290Q500,290 520,340L540,430L516,432L500,360L470,360L470,440L446,440L440,370L300,370L300,440Z", "#e0a23e", 3), path("M520,340Q580,300 560,250Q580,330 530,370Z", "#e0a23e", 2.6), circ(558, 252, 10, pal.ink, 1.6),
      mane, circ(210, 200, 58, "#e8b052", 2.8), ell(188, 190, 7, 9, pal.paper[0], 1.4), ell(232, 190, 7, 9, pal.paper[0], 1.4), dot(188, 192, 3.4, pal.ink), dot(232, 192, 3.4, pal.ink), path("M196,222L224,222L210,238Z", pal.accent, 1.8), stroke("M210,238Q210,254 190,256M210,238Q210,254 230,256", pal.ink, 2.4), poly([[170, 150], [182, 128], [194, 152]], "#e8b052", 2), poly([[226, 152], [238, 128], [250, 150]], "#e8b052", 2));
  }},
  {id: "elephant_gaj", group: "nature", tags: ["हाथी", "गज", "elephant", "ऐरावत", "गजेंद्र", "महावत", "हस्ति", "गजराज"], draw: ({t, pal}) => {
    const tr = sw(t, 0.7, 8);
    return paper(pal, ground(pal, 460), path("M150,360Q140,230 270,210Q420,206 470,290Q500,350 470,420L450,420L446,380L400,380L396,420L372,420L366,380L270,380L264,420L238,420L232,386Q186,400 170,390Z", "#9aa6b6", 3.2),
      path(`M168,300Q96,306 90,380Q88,${420 + tr} 110,${440 + tr}L132,${436 + tr}Q118,${410} 130,360Q150,330 180,326Z`, "#9aa6b6", 3), ell(214, 296, 40, 54, "#b4bfce", 2.8), dot(158, 292, 4, pal.ink),
      path("M150,330Q120,366 130,400L146,396Q140,370 160,350Z", pal.cream, 2), rect(240, 192, 190, 38, pal.accent, 10, 2.8), rect(270, 176, 130, 22, pal.gold, 8, 2.4), ...[0, 1, 2, 3].map((i) => circ(262 + i * 42, 211, 8, pal.gold, 1.4)));
  }},
  {id: "peacock_mor", group: "nature", tags: ["मोर", "peacock", "मयूर", "पंख", "कार्तिकेय", "मुरुगन", "स्कंद", "सरस्वती", "बारिश नृत्य"], draw: ({t, pal}) => {
    const n = 11;
    const fan = Array.from({length: n}, (_, i) => { const a = Math.PI + (i / (n - 1)) * Math.PI, x = 300 + Math.cos(a) * (190 + sw(t, 0.6, 4, i)), y = 330 + Math.sin(a) * (230 + sw(t, 0.6, 5, i)); return `<path d="M300,360L${f1(x)},${f1(y)}" stroke="${pal.leaf[0]}" stroke-width="5" opacity=".7"/>` + paper(pal, ell(x, y, 34, 46, pal.leaf[1], 2.6), ell(x, y, 20, 28, "#2fa59a", 2), circ(x, y, 10, pal.gold, 1.6), circ(x, y, 4, pal.accent, 1)); }).join("");
    return paper(pal, ground(pal, 462), fan, ell(300, 370, 52, 74, "#2a7fc0", 3), circ(332, 190, 26, "#2a7fc0", 2.8), dot(340, 186, 3.4, pal.ink), poly([[352, 190], [378, 198], [352, 206]], pal.gold, 1.8), stroke("M326,166Q322,140 332,128M336,166Q342,138 354,130", pal.ink, 2.6), circ(332, 128, 4, pal.gold, 1), circ(354, 129, 4, pal.gold, 1), rect(282, 430, 8, 36, pal.gold, 2, 1.6), rect(312, 430, 8, 36, pal.gold, 2, 1.6));
  }},
  {id: "naga_snake", group: "nature", tags: ["नाग", "सर्प", "साँप", "snake", "naga", "शेषनाग", "वासुकि", "विष", "कालिया", "तक्षक", "फन", "नागदेवता"], draw: ({t, pal}) => {
    const wob = (i: number) => sw(t, 0.8, 10, i);
    const body = `M120,${470}Q60,${400 + wob(0)} 150,${370}Q250,${340 + wob(1)} 190,${300}Q140,${250 + wob(2)} 250,${220}Q330,${200 + wob(3)} 300,${150}`;
    return paper(pal, ground(pal, 470), {d: body, stroke: pal.cream, sw: 66}, {d: body, stroke: pal.leaf[1], sw: 52, noShadow: true}, {d: body, stroke: pal.leaf[0], sw: 14, noShadow: true, op: 0.7},
      path(`M300,160Q230,110 250,60Q300,20 360,30Q420,30 430,80Q420,126 360,160Z`.replace("360,30Q420,30 430,80", "350,30Q410,30 430,84"), pal.leaf[1], 3), ...[0, 1, 2].map((i) => ell(300 + i * 34, 66 + i * 4, 18, 26, pal.leaf[i % 3], 1.8)), dot(312, 80, 5, pal.accent2), dot(354, 82, 5, pal.accent2), dot(312, 80, 2, pal.ink), dot(354, 82, 2, pal.ink),
      stroke("M340,150L340,190M340,190l-10,10M340,190l10,10", pal.accent, 3));
  }},
  {id: "horse_ashwa", group: "nature", tags: ["घोड़ा", "अश्व", "horse", "चेतक", "हय", "सवार", "घुड़सवार", "अश्वमेध", "टाप", "रथ"], draw: ({t, pal}) => {
    const lg = sw(t, 1.4, 10);
    return paper(pal, ground(pal, 464), path(`M160,330Q150,250 220,244L380,236Q440,160 470,110L500,126Q490,190 470,224Q470,260 450,330L440,${460 + lg}L418,${460 + lg}L418,380L400,340L240,350L232,${462 - lg}L210,${462 - lg}L210,370Z`, pal.cream, 3.2),
      path("M470,110Q430,150 410,200Q440,170 470,150Z", pal.ink, 2.4), path("M160,330Q110,360 120,430Q130,360 170,350Z", pal.ink, 2.4), poly([[478, 116], [490, 92], [496, 120]], pal.cream, 1.8), dot(488, 138, 4, pal.ink), rect(330, 236, 100, 18, pal.accent, 6, 2.2), stroke("M444,176Q478,176 486,140", pal.accent2, 4));
  }},
  {id: "crocodile_magar", group: "nature", tags: ["मगरमच्छ", "मगर", "crocodile", "खोडियार", "ग्राह", "घड़ियाल", "नदी वाहन", "मकर", "वरुण", "गंगा वाहन"], draw: ({t, pal}) => {
    const w = sw(t, 0.6, 5);
    return paper(pal, path("M0,380Q150,350 300,380T600,370V500H0Z", pal.sky, 2.6), path(`M90,380Q60,${360 + w} 80,336Q130,330 230,348L420,350Q500,340 560,${300 + w}L520,376Q470,396 410,392L190,398Q130,404 90,380Z`, pal.leaf[1], 3.2),
      ...[0, 1, 2, 3, 4, 5].map((i) => poly([[170 + i * 50, 346 - i * 2], [184 + i * 50, 322 - i * 2], [198 + i * 50, 346 - i * 2]], pal.leaf[0], 1.8)), path("M80,336L28,350L36,366L90,372Z", pal.leaf[1], 2.6), ...[0, 1, 2, 3].map((i) => poly([[40 + i * 12, 356 + i * 2], [46 + i * 12, 372], [52 + i * 12, 358]], pal.cream, 1)), circ(104, 334, 10, pal.paper[0], 2), dot(106, 334, 4, pal.ink),
      stroke("M0,420q40,-14 80,0t80,0t80,0t80,0t80,0t80,0t80,0t80,0", pal.cream, 3), stroke("M0,460q40,-14 80,0t80,0t80,0t80,0t80,0t80,0t80,0t80,0", pal.cream, 3));
  }},
  {id: "garuda_eagle", group: "nature", tags: ["गरुड़", "garuda", "eagle", "गिद्ध", "जटायु", "पक्षी", "bird", "हंस", "सारस", "चील", "उड़ान", "पंख फैलाए", "सम्पाती"], draw: ({t, pal}) => {
    const fl = sw(t, 0.9, 26);
    const wing = (d: number) => path(`M300,250Q${300 + d * 120},${150 + fl} ${300 + d * 270},${110 + fl * 1.6}Q${300 + d * 230},${180 + fl} ${300 + d * 260},${230 + fl}Q${300 + d * 190},${222} ${300 + d * 210},${290}Q${300 + d * 130},${268} ${300 + d * 100},${330}Z`, pal.accent, 3);
    return paper(pal, halo(300, 240, 150, pal, t, 16), wing(-1), wing(1), path("M260,240Q260,170 300,160Q340,170 340,240Q350,330 300,380Q250,330 260,240Z", pal.gold, 3), circ(300, 176, 30, pal.cream, 2.8), poly([[296, 186], [330, 196], [298, 212]], "#f08c1c", 2), dot(310, 174, 4, pal.ink),
      path("M270,380L300,470L330,380Q300,396 270,380Z", pal.accent2, 2.8), ...[0, 1, 2, 3].map((i) => ln(284 + i * 11, 396, 280 + i * 13, 440, pal.ink, 2)));
  }},
  {id: "sun_rays", group: "nature", tags: ["सूर्य", "सूरज", "sun", "सवेरा", "प्रभात", "उदय", "सूर्योदय", "किरण", "कोणार्क", "सविता", "भास्कर", "आदित्य", "दिन", "सुबह"], draw: ({t, pal}) => {
    const n = 20;
    const rays = Array.from({length: n}, (_, i) => { const a = (i / n) * Math.PI * 2 + t * 0.25, r1 = 150, r2 = i % 2 ? 214 : 250; return `<path d="M${f1(300 + Math.cos(a - 0.1) * r1)},${f1(250 + Math.sin(a - 0.1) * r1)}L${f1(300 + Math.cos(a) * r2)},${f1(250 + Math.sin(a) * r2)}L${f1(300 + Math.cos(a + 0.1) * r1)},${f1(250 + Math.sin(a + 0.1) * r1)}Z" fill="${i % 2 ? pal.gold : pal.accent2}" stroke="${pal.cream}" stroke-width="3"/>`; }).join("");
    return paper(pal, rays, circ(300, 250, 140, pal.gold, 3.5), circ(300, 250, 112, "#ffd66b", 2.6), circ(300, 250, 70, pal.paper[0], 2.4), ...[-1, 1].map((d) => circ(300 + d * 28, 238, 6, pal.ink, 0.1)), stroke("M278,272Q300,290 322,272", pal.ink, 4));
  }},
  {id: "moon_night", group: "nature", tags: ["चाँद", "चंद्र", "रात", "moon", "night", "तारे", "अंधकार", "रात्रि", "पूर्णिमा", "चंद्रमा", "आधी रात", "सोम", "सपना", "सपने"], draw: ({t, pal}) =>
    paper(pal, ...stars(26, 8, 600, 400, t), `<g opacity=".55">${halo(300, 220, 150, pal, t, 0).join("")}</g>`.replace(/<path[^>]*>/g, (m) => m), circ(300, 220, 130, pal.cream, 3.4), circ(340, 196, 106, pal.sky, 0.1), circ(250, 180, 14, pal.paper[2], 1.4), circ(262, 270, 10, pal.paper[2], 1.4), circ(214, 240, 8, pal.paper[2], 1.4),
      ground(pal, 470), ...tree(90, 474, 1, pal, "pine"), ...tree(510, 474, 1.1, pal, "pine"))},
  {id: "fire_blaze", group: "nature", tags: ["आग", "ज्वाला", "fire", "जलना", "अग्नि परीक्षा", "दहन", "जौहर", "लपटें", "धधक", "भस्म", "प्रज्वलित", "तेज"], draw: ({t, pal}) =>
    paper(pal, circ(300, 330, 190, "#ffb347", 0.1), ...flame(300, 450, 6.2, t, pal, 0), ...flame(170, 460, 3.8, t, pal, 2), ...flame(430, 460, 4, t, pal, 4), ...flame(70, 470, 2, t, pal, 6), ...flame(530, 470, 2.2, t, pal, 8),
      ...Array.from({length: 12}, (_, i) => circ(120 + i * 32 + sw(t, 0.5, 10, i), 300 - ((t * 60 + i * 41) % 260) + 120, 3 + (i % 3), "#ffd36a", 0.5)))},
];

function ellipseHump(pal: Pal) {
  return path("M300,296Q310,236 340,290Z", pal.cloth[3] || "#b8864a", 2.6);
}
