import {KitCtx, Pal, paper, circ, ell, rect, poly, path, limb, ln, dot, stroke, g, flame, halo, lotus, sw, f1, rnd, tree, cloud, ground, mountains, stars} from "./paper";
import {attr} from "./figures";
import type {Asset} from "./assetsFigures";

const FONT = "'PF Display','Rozha One','Mukta',serif";

export const OBJECTS: Asset[] = [
  {id: "om_sun", group: "object", tags: ["ॐ", "om", "मंत्र", "नाद", "ध्वनि", "ओंकार", "प्रणव", "जप", "मंत्र", "ब्रह्म", "ज्ञान"], draw: ({t, pal}) =>
    paper(pal, halo(300, 250, 190, pal, t, 24), circ(300, 250, 150, pal.accent, 3.5), circ(300, 250, 128, pal.paper[0], 2.5),
      `<text x="300" y="312" text-anchor="middle" font-family="${FONT}" font-size="190" fill="${pal.accent2}">ॐ</text>`)},
  {id: "lotus_pond", group: "object", tags: ["कमल", "lotus", "पद्म", "पुष्प", "फूल", "सरोवर", "तालाब", "कुंड", "pond", "सरस्वती", "लक्ष्मी"], draw: ({t, pal}) => {
    const w = (n: number) => sw(t, 0.5, 3, n);
    return paper(pal, path("M20,380Q300,330 580,380L580,480Q300,500 20,480Z", pal.sky, 3), ...[0, 1, 2, 3].map((i) => ell(90 + i * 140, 420 + (i % 2) * 22, 56, 15, pal.leaf[i % 3], 2.4)),
      ...lotus(300, 360 + w(0), 300, pal, pal.accent), ...lotus(130, 410 + w(1), 150, pal, pal.accent2), ...lotus(470, 404 + w(2), 170, pal, pal.accent2),
      ...[0, 1, 2].map((i) => stroke(`M${60 + i * 180},470q40,-12 80,0`, pal.cream, 2.4)));
  }},
  {id: "diya_row", group: "object", tags: ["दीप", "दिया", "दीपक", "दीपावली", "ज्योति", "diya", "deep", "जोत", "अखंड", "रोशनी", "प्रकाश"], draw: ({t, pal}) => {
    const xs = [90, 195, 300, 405, 510];
    return paper(pal, rect(40, 420, 520, 22, pal.cloth[3] || pal.paper[4], 6, 2.6), ...xs.flatMap((x, i) => attr("diya", x, 404 - (i === 2 ? 80 : 0), i === 2 ? 1.6 : 1.1, pal, t + i * 0.37)),
      ...[0, 1, 2, 3, 4, 5, 6].map((i) => circ(70 + i * 76, 260 + sw(t, 0.6, 12, i), 3 + (i % 3), "#ffe9a8", 1)));
  }},
  {id: "kalash", group: "object", tags: ["कलश", "नारियल", "kalash", "मंगल", "जल", "अभिषेक", "आम", "पूर्णकुंभ", "कुंभ", "स्थापना", "घट"], draw: ({t, pal}) =>
    paper(pal, ...halo(300, 250, 170, pal, t, 18), path("M210,470L390,470L380,440L220,440Z", pal.paper[3], 3),
      path("M222,440Q150,340 240,296L240,272L360,272L360,296Q450,340 378,440Z", pal.accent, 3),
      stroke("M232,350Q300,372 368,350", pal.gold, 7), stroke("M226,392Q300,414 374,392", pal.gold, 7), rect(236, 262, 128, 14, pal.gold, 5, 2.4),
      ...[-54, -18, 18, 54].map((d, i) => path(`M${300 + d},262Q${300 + d * 1.6},${220 - (i % 2) * 18} ${300 + d * 1.2},${190}Q${300 + d * 0.6},${220} ${300 + d},262Z`, pal.leaf[i % 3], 2.2)),
      circ(300, 196, 40, pal.paper[0], 3), path("M300,156Q316,176 300,200Q284,176 300,156Z", pal.leaf[1], 1.8), circ(300, 196, 12, pal.accent2, 2))},
  {id: "conch_shankh", group: "object", tags: ["शंख", "conch", "shankh", "शंखनाद", "नाद", "युद्ध घोष", "विजय"], draw: ({t, pal}) =>
    paper(pal, halo(300, 250, 170, pal, t, 16), ...attr("conch", 300, 330, 3.3, pal, t), ...Array.from({length: 3}, (_, i) => stroke(`M${470 + i * 26},${150 + i * 6}Q${510 + i * 26},${200} ${470 + i * 26},${260 - i * 6}`, pal.gold, 4, `opacity="${0.8 - i * 0.2}"`)))},
  {id: "damru_drum", group: "object", tags: ["डमरू", "damru", "ढोल", "नगाड़ा", "dhol", "drum", "ढोलक", "नगाड़े", "ताल", "तांडव"], draw: ({t, pal}) => {
    const r = sw(t, 1.2, 8);
    return paper(pal, g(`rotate(${f1(r)} 300 260)`, paper(pal, path("M170,160Q300,230 430,160L430,180Q330,250 430,340L430,360Q300,290 170,360L170,340Q270,250 170,180Z", pal.accent, 3.4), ell(300, 260, 24, 38, pal.gold, 2.6),
      path("M170,160Q300,200 430,160L430,180Q300,220 170,180Z", pal.paper[0], 2.6), path("M170,340Q300,300 430,340L430,360Q300,320 170,360Z", pal.paper[0], 2.6), stroke("M300,260Q250,330 190,396", pal.gold, 3), circ(190, 396, 12, pal.accent2, 2), stroke("M300,260Q350,330 410,396", pal.gold, 3), circ(410, 396, 12, pal.accent2, 2))));
  }},
  {id: "bow_arrows", group: "object", tags: ["धनुष", "बाण", "तीर", "bow", "arrow", "अर्जुन", "कर्ण", "एकलव्य", "निशाना", "लक्ष्य", "द्रोण"], draw: ({t, pal}) =>
    paper(pal, circ(300, 250, 160, pal.paper[1], 3), circ(300, 250, 118, pal.cream, 2.6), circ(300, 250, 76, pal.accent, 2.6), circ(300, 250, 34, pal.gold, 2.6),
      ...attr("bow", 120, 250, 1.4, pal, t), path(`M${150},${248}L${486},${248}L${470},${240}L${500},${250}L${470},${258}L${486},${250}Z`.replace("486},248L", "486},248L"), pal.paper[4], 2), poly([[150, 244], [128, 238], [136, 250], [128, 262], [150, 256]], pal.accent2, 2))},
  {id: "swords_shield", group: "object", tags: ["तलवार", "ढाल", "shield", "sword", "युद्ध", "लड़ाई", "war", "अस्त्र", "शस्त्र", "हथियार", "भाला", "कवच", "आक्रमण"], draw: ({t, pal}) =>
    paper(pal, g("rotate(-38 300 260)", paper(pal, ...attr("sword", 300, 400, 1.55, pal, t))), g("rotate(38 300 260)", paper(pal, ...attr("sword", 300, 400, 1.55, pal, t))),
      ...attr("shield", 300, 270, 2.2, pal, t), circ(300, 270, 28, pal.accent2, 2.4))},
  {id: "mandala_yantra", group: "object", tags: ["यंत्र", "मंडल", "yantra", "mandala", "तंत्र", "साधना", "सिद्धि", "रहस्य", "ब्रह्मांड", "श्रीयंत्र", "चक्र"], draw: ({t, pal}) => {
    const n = 12, rot = t * 14;
    const petals = Array.from({length: n}, (_, i) => { const a = (i / n) * 360; return g(`rotate(${f1(a + rot)} 300 250)`, `<path d="M300,250C268,190 270,120 300,76C330,120 332,190 300,250Z" fill="${i % 2 ? pal.accent : pal.gold}" stroke="${pal.cream}" stroke-width="3"/>`); }).join("");
    const tri = (up: boolean, r: number, col: string) => poly(up ? [[300, 250 - r], [300 + r * 0.87, 250 + r / 2], [300 - r * 0.87, 250 + r / 2]] : [[300, 250 + r], [300 + r * 0.87, 250 - r / 2], [300 - r * 0.87, 250 - r / 2]], col, 3);
    return paper(pal, circ(300, 250, 196, pal.paper[1], 3.5), petals, circ(300, 250, 98, pal.paper[0], 3), tri(true, 78, pal.accent2), tri(false, 78, pal.accent), tri(true, 42, pal.gold), circ(300, 250, 12, pal.cream, 2));
  }},
  {id: "temple_bell", group: "object", tags: ["घंटी", "घंटा", "bell", "घंटियाँ", "मंदिर घंटी", "बजना", "गूंज", "घंटानाद"], draw: ({t, pal}) => {
    const r = sw(t, 0.9, 12);
    return paper(pal, rect(60, 40, 480, 24, pal.cloth[3] || pal.paper[4], 8, 3), g(`rotate(${f1(r)} 300 64)`, paper(pal, rect(292, 64, 16, 66, pal.paper[4], 4, 2),
      path("M200,360Q206,210 300,150Q394,210 400,360Q300,392 200,360Z", pal.gold, 3.4), path("M196,362Q300,400 404,362L404,384Q300,424 196,384Z", pal.accent2, 3), stroke("M226,300Q300,326 374,300", pal.cream, 4), stroke("M216,334Q300,360 384,334", pal.cream, 4), circ(300 - r * 1.6, 428, 20, pal.gold, 3))));
  }},
  {id: "scroll_granth", group: "object", tags: ["ग्रंथ", "पुराण", "वेद", "शास्त्र", "पोथी", "कथा", "शिलालेख", "scroll", "veda", "purana", "granth", "लिखा", "इतिहास", "लेख", "वचन", "शपथ"], draw: ({t, pal}) =>
    paper(pal, path("M100,150Q300,120 500,150L500,390Q300,360 100,390Z", pal.paper[0], 3.4), rect(76, 130, 40, 280, pal.paper[3], 20, 3), rect(484, 130, 40, 280, pal.paper[3], 20, 3),
      ...[0, 1, 2, 3, 4, 5].map((i) => ln(150, 190 + i * 32, 450, 190 + i * 32 - 4, i % 3 ? pal.ink : pal.accent, 5)),
      circ(450, 360, 24, pal.accent, 2.6), stroke("M440,360l8,8l14,-16", pal.cream, 4))},
  {id: "throne_crown", group: "object", tags: ["सिंहासन", "मुकुट", "राज्य", "crown", "throne", "राजतिलक", "राजा", "सम्राट", "छत्र", "साम्राज्य", "राज"], draw: ({t, pal}) =>
    paper(pal, path("M140,470L460,470L450,440L150,440Z", pal.paper[3], 3), path("M170,440L430,440L420,300L180,300Z", pal.accent, 3.4), path("M150,300L450,300L440,260L160,260Z", pal.gold, 3),
      path("M200,260L200,100Q300,40 400,100L400,260Z", pal.accent2, 3.4), path("M222,260L222,116Q300,66 378,116L378,260Z", pal.paper[0], 2.6),
      path("M236,196L262,150L284,184L300,128L316,184L338,150L364,196L360,224L240,224Z", pal.gold, 3), ...[0, 1, 2].map((i) => circ(262 + i * 38, 210, 7, pal.accent, 1.6)),
      ...[170, 430].map((x) => path(`M${x - 14},300L${x - 14},200Q${x},180 ${x + 14},200L${x + 14},300Z`, pal.gold, 2.6)))},
  {id: "havan_kund", group: "object", tags: ["यज्ञ", "हवन", "अग्नि", "havan", "yagya", "agni", "कुंड", "आहुति", "ज्वाला", "वेदी", "अग्निकुंड", "यज्ञशाला"], draw: ({t, pal}) =>
    paper(pal, path("M110,470L490,470L450,400L150,400Z", pal.paper[3], 3), path("M150,400L450,400L420,350L180,350Z", pal.paper[1], 3), ...flame(300, 330, 3.1, t, pal, 0), ...flame(220, 350, 1.8, t, pal, 2), ...flame(380, 350, 1.9, t, pal, 4),
      ...[0, 1, 2, 3, 4, 5].map((i) => circ(120 + i * 70 + sw(t, 0.5, 14, i), 120 + ((t * 40 + i * 50) % 200) * -0.2 + 60, 3, "#ffd36a", 0.5)))},
  {id: "mala_rudraksha", group: "object", tags: ["माला", "रुद्राक्ष", "जप", "mala", "rudraksha", "japa", "तप", "मनके", "जाप", "तपस्या"], draw: ({t, pal}) => {
    const n = 20, beads = Array.from({length: n}, (_, i) => { const a = (i / n) * Math.PI * 2 - Math.PI / 2; return circ(300 + Math.cos(a) * 150, 240 + Math.sin(a) * 150, 22, i % 5 === 0 ? pal.gold : pal.cloth[3] || "#6b4a2a", 2.8); });
    return paper(pal, beads, stroke("M300,392L300,450", pal.accent, 6), path("M300,388Q330,430 300,470Q270,430 300,388Z", pal.accent2, 2.6), circ(300, 392, 20, pal.gold, 3));
  }},
  {id: "daan_pot", group: "object", tags: ["धन", "खजाना", "सोना", "पोटली", "treasure", "gold", "दान", "चावल", "भेंट", "अन्न", "अनाज", "दक्षिणा", "सिक्के", "दरिद्र"], draw: ({t, pal}) =>
    paper(pal, ground(pal, 440), path("M180,440Q140,300 230,250L230,226L370,226L370,250Q460,300 420,440Z", pal.accent, 3.4), rect(222, 214, 156, 20, pal.gold, 6, 2.6),
      ...Array.from({length: 7}, (_, i) => circ(210 + i * 30, 214 - (i % 3) * 10 - 10, 20, pal.gold, 2.6)), ...Array.from({length: 5}, (_, i) => stroke(`M${230 + i * 36},180l0,0`, pal.ink, 1)),
      ...[0, 1, 2].map((i) => circ(440 + i * 34, 448 - (i % 2) * 14, 16, pal.gold, 2.2)), `<text x="300" y="360" text-anchor="middle" font-family="${FONT}" font-size="96" fill="${pal.cream}">₹</text>`)},
  {id: "dhwaja_flag", group: "object", tags: ["ध्वज", "पताका", "झंडा", "flag", "dhwaja", "भगवा", "विजय", "ध्वजा", "निशान", "केसरिया"], draw: ({t, pal}) => {
    const w = (k: number) => sw(t, 1.1, 14, k);
    const flagD = `M170,70Q${240 + w(0)},${40 + w(1)} ${310 + w(1)},${80}T${460 + w(2)},${86}L${420 + w(2)},${150}L${470 + w(3)},${214}Q${390 + w(1)},${176} ${310 + w(0)},${216}T170,${200}Z`;
    return paper(pal, ground(pal, 468), rect(150, 60, 20, 410, pal.paper[4], 8, 3), circ(160, 54, 18, pal.gold, 3), path(flagD, "#f08c1c", 3.4), circ(300 + w(1) * 0.6, 140, 30, pal.cream, 2.4), circ(300 + w(1) * 0.6, 140, 14, pal.accent, 1.8));
  }},
  {id: "vajra_storm", group: "object", tags: ["वज्र", "बिजली", "इंद्र", "vajra", "lightning", "thunder", "गर्जना", "आँधी", "तूफान", "बारिश", "storm", "rain", "वर्षा", "मेघ", "प्रलय", "बादल"], draw: ({t, pal}) => {
    const on = (Math.sin(t * 7) > 0.2) ? 1 : 0.6;
    return paper(pal, ...cloud(190, 150, 1.5, pal.paper[3]), ...cloud(400, 130, 1.3, pal.paper[2]), ...cloud(300, 210, 1.7, pal.paper[3]),
      `<g opacity="${on}">${paper(pal, poly([[320, 230], [250, 340], [296, 340], [262, 470], [366, 316], [316, 316], [350, 230]], pal.gold, 3.4))}</g>`,
      ...Array.from({length: 14}, (_, i) => ln(70 + i * 36, 260 + ((t * 300 + i * 70) % 200), 60 + i * 36, 276 + ((t * 300 + i * 70) % 200), pal.sky, 3)));
  }},
];
