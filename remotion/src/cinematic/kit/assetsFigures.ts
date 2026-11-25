import {KitCtx, Pal, paper, circ, ell, rect, poly, path, limb, ln, dot, stroke, g, flame, halo, lotus, sw, f1, rnd, tree, cloud, ground, mountains} from "./paper";
import {figure, attr} from "./figures";

export type Group = "figure" | "object" | "place" | "nature" | "legacy";
export type Asset = {id: string; group: Group; tags: string[]; draw: (c: KitCtx) => string; weight?: number};

const flip = (m: string) => g("translate(600 0) scale(-1 1)", m);

export const FIGURES: Asset[] = [
  {id: "devi_shakti", group: "figure", tags: ["देवी", "दुर्गा", "माता", "माँ", "शक्ति", "शक्तिपीठ", "सती", "काली", "पार्वती", "अम्बा", "चामुंडा", "devi", "durga", "mata", "shakti", "kali", "sati", "parvati", "लाज", "संतान", "वरदान", "भवानी"], draw: ({t, pal, seed}) => {
    const cx = 300, b = 462;
    const wp: [number, number, string][] = [[100, 150, "trishul"], [150, 82, "sword"], [210, 40, "chakra"], [390, 40, "conch"], [450, 82, "bow"], [500, 150, "gada"]];
    const arms = wp.flatMap(([x, y, k]) => [...limb(cx + (x < cx ? -40 : 40), 270, x, y + 110, 16, pal.skin[0], pal.cream, x < cx ? -10 : 10), ...attr(k as any, x, y + 110, 0.62, pal, t)]);
    return paper(pal, halo(cx, 190, 138, pal, t, 20), arms, ...lotus(cx, b + 4, 330, pal, pal.accent), figure({cx, base: b - 16, s: 0.86, pose: "sit", skin: pal.skin[0], cloth: pal.accent, cloth2: pal.cloth[1], crown: "mukut", arms: "bless", right: "flower", sash: pal.gold, eyes: seed % 2 ? "open" : "closed", t}, pal));
  }},
  {id: "shiva_dhyan", group: "figure", tags: ["शिव", "महादेव", "शंकर", "भोलेनाथ", "कैलाश", "नीलकंठ", "तांडव", "भैरव", "रुद्र", "shiva", "mahadev", "shankar", "bhairav", "rudra", "neelkanth", "त्रिशूल", "जटा"], draw: ({t, pal}) => {
    const cx = 300, b = 462;
    const ganga = path(`M${f1(cx - 6)},122Q${f1(cx - 70)},150 ${f1(cx - 64)},250Q${f1(cx - 60)},320 ${f1(cx - 104)},392L${f1(cx - 88)},398Q${f1(cx - 38)},324 ${f1(cx - 44)},250Q${f1(cx - 46)},176 ${f1(cx + 2)},134Z`, pal.sky, 2.4);
    return paper(pal, mountains(pal, b - 6, 5, true, 0, 600, 150), halo(cx, 196, 128, pal, t, 18), ganga, ...attr("trishul", 470, 380, 1.05, pal, t),
      figure({cx, base: b, s: 0.88, pose: "sit", skin: "#9fb7d6", cloth: pal.cloth[2], cloth2: "#caa46a", crown: "jata", arms: "rest", eyes: "closed", t}, pal),
      stroke(`M${f1(cx - 44)},252Q${f1(cx - 20 + sw(t, 0.9, 6))},292 ${f1(cx)},262Q${f1(cx + 24)},232 ${f1(cx + 44)},256`, pal.ink, 7), dot(cx + 44, 256, 8, pal.ink));
  }},
  {id: "krishna_flute", group: "figure", tags: ["कृष्ण", "गोपाल", "बाँसुरी", "मुरली", "कान्हा", "राधा", "द्वारका", "गोविंद", "मोहन", "krishna", "kanha", "murali", "dwarka", "govind", "गीता", "अर्जुन", "सुदामा"], draw: ({t, pal}) => {
    const cx = 300, b = 466;
    return paper(pal, halo(cx, 162, 112, pal, t, 14), tree(150, b, 0.8, pal, "banyan"), ground(pal, b - 8),
      figure({cx, base: b, s: 0.9, pose: "stand", skin: "#4ba3c7", cloth: pal.cloth[0], cloth2: "#f2c230", crown: "feather", arms: "hold", sash: pal.accent2, t}, pal),
      attr("flute", cx + 6, 192, 1.02, pal, t), ...Array.from({length: 4}, (_, i) => circ(130 + i * 120, 120 + sw(t, 0.4, 14, i), 8, pal.accent2, 1.6)));
  }},
  {id: "hanuman_gada", group: "figure", tags: ["हनुमान", "बजरंग", "संकटमोचन", "मारुति", "पवनपुत्र", "hanuman", "bajrang", "संजीवनी", "लंका", "वानर"], draw: ({t, pal}) => {
    const cx = 290, b = 466;
    const mtn = [path("M418,120L470,40L526,120L508,150L430,150Z", pal.leaf[0], 2.6), path("M470,40L486,70L470,62L456,76Z", pal.cream, 1.6), rect(444, 140, 84, 14, pal.cloth[3], 4, 2)];
    const tail = path(`M${cx + 56},${b - 150}Q${cx + 190},${b - 120} ${cx + 150},${b - 280}Q${cx + 136},${b - 330} ${cx + 100},${b - 300}Q${cx + 130},${b - 290} ${cx + 128},${b - 250}Q${cx + 130},${b - 160} ${cx + 52},${b - 130}Z`, "#e08a1e", 2.6);
    return paper(pal, cloud(120, 110, 1, pal.paper[0]), tail, ground(pal, b - 8), mtn,
      figure({cx, base: b, s: 0.92, pose: "stand", skin: "#e8a23a", cloth: "#d9561e", cloth2: "#c4361c", crown: "mukut", arms: "up", right: "none", left: "gada", sash: pal.gold, t}, pal));
  }},
  {id: "ganesha_modak", group: "figure", tags: ["गणेश", "गणपति", "विनायक", "गजानन", "ganesh", "ganpati", "vinayak", "मोदक", "विघ्न", "मूषक"], draw: ({t, pal}) => {
    const cx = 300, b = 462;
    return paper(pal, halo(cx, 190, 140, pal, t, 18), ...lotus(cx, b + 4, 340, pal, pal.accent2),
      ell(cx, b - 150, 98, 92, "#e8742e", 3), figure({cx, base: b - 18, s: 0.86, pose: "sit", skin: "#e8742e", cloth: "#c63b6f", cloth2: pal.cloth[1], crown: "ganesha", arms: "hold", right: "none", left: "none", sash: pal.gold, eyes: "open", t}, pal),
      ell(cx + 150, b - 28, 46, 14, pal.gold, 2.4), ...[-16, 0, 16].map((d) => ell(cx + 150 + d, b - 42, 11, 9, pal.paper[1], 1.8)));
  }},
  {id: "rama_bow", group: "figure", tags: ["राम", "श्रीराम", "अयोध्या", "रघुवंश", "सीता", "लक्ष्मण", "रावण", "rama", "ayodhya", "ram", "sita", "वनवास", "रामायण", "शबरी"], draw: ({t, pal}) => {
    const cx = 270, b = 466;
    return paper(pal, halo(cx, 164, 112, pal, t, 14), tree(500, b, 1, pal, "pine"), ground(pal, b - 8),
      figure({cx, base: b, s: 0.9, pose: "stand", skin: "#5a8fd0", cloth: "#f2b632", cloth2: "#f4efe0", crown: "mukut", arms: "hold", right: "bow", left: "none", sash: pal.accent, t}, pal),
      path(`M${cx + 56},${196}L${cx + 270},${186}L${cx + 258},${180}L${cx + 280},${186}L${cx + 258},${192}L${cx + 270},${186}Z`, pal.paper[4], 2));
  }},
  {id: "rishi_tapasya", group: "figure", tags: ["ऋषि", "मुनि", "तपस्या", "आश्रम", "गुरु", "ध्यान", "संत", "साधु", "योगी", "rishi", "muni", "tapasya", "ashram", "guru", "yogi", "sant", "वशिष्ठ", "विश्वामित्र", "दधीचि", "वाल्मीकि"], draw: ({t, pal}) => {
    const cx = 330, b = 466;
    return paper(pal, tree(140, b, 0.95, pal, "banyan"), halo(cx, 206, 118, pal, t, 14), ground(pal, b - 8),
      figure({cx, base: b - 6, s: 0.86, pose: "sit", skin: pal.skin[1], cloth: "#f4efe0", cloth2: "#f4efe0", crown: "jata", arms: "rest", beard: true, sash: pal.accent, eyes: "closed", t}, pal),
      ...attr("kamandal", 480, b - 18, 1, pal, t));
  }},
  {id: "warrior_sword", group: "figure", tags: ["वीर", "योद्धा", "सेनापति", "सैनिक", "तलवार", "शिवाजी", "महाराणा", "राजपूत", "मराठा", "warrior", "veer", "sword", "soldier", "बाजीप्रभु", "पृथ्वीराज", "रक्षा", "बलिदान"], draw: ({t, pal}) => {
    const cx = 300, b = 466;
    const cape = path(`M${cx - 40},${b - 300}Q${cx - 150 + sw(t, 0.7, 10)},${b - 220} ${cx - 120 + sw(t, 0.7, 14)},${b - 40}L${cx - 40},${b - 60}Z`, pal.accent, 2.6);
    return paper(pal, cloud(460, 90, 0.9, pal.paper[0]), mountains(pal, b - 6, 9, false, 0, 600, 130), ground(pal, b - 8), cape,
      figure({cx, base: b, s: 0.9, pose: "stand", skin: pal.skin[0], cloth: pal.cloth[1], cloth2: pal.cloth[3] || "#3a4a2b", crown: "pagdi", arms: "up", right: "sword", left: "shield", moustache: true, sash: pal.gold, t}, pal));
  }},
  {id: "rani_veer", group: "figure", tags: ["रानी", "राजकुमारी", "पद्मिनी", "हाड़ी", "रानी", "लक्ष्मीबाई", "दुर्गावती", "rani", "queen", "jauhar", "जौहर", "सती", "वीरांगना"], draw: ({t, pal}) => {
    const cx = 300, b = 466;
    return paper(pal, halo(cx, 160, 108, pal, t, 14), ground(pal, b - 8),
      figure({cx, base: b, s: 0.9, pose: "stand", skin: pal.skin[0], cloth: pal.accent, cloth2: pal.cloth[0], crown: "queen", arms: "bless", right: "sword", sash: pal.gold, t}, pal),
      ...attr("diya", 150, b - 60, 1, pal, t));
  }},
  {id: "bhakt_thali", group: "figure", tags: ["भक्त", "पूजा", "आरती", "श्रद्धा", "दर्शन", "पुजारी", "प्रार्थना", "मन्नत", "bhakt", "puja", "aarti", "darshan", "devotee", "भक्ति", "प्रसाद", "चढ़ावा"], draw: ({t, pal}) => {
    const cx = 300, b = 466;
    return paper(pal, cloud(140, 100, 0.9, pal.paper[0]), ground(pal, b - 8),
      figure({cx: cx - 60, base: b, s: 0.84, pose: "stand", skin: pal.skin[1], cloth: pal.cloth[2], cloth2: "#f4efe0", crown: "pagdi", arms: "namaste", moustache: true, t}, pal),
      ell(cx + 130, b - 40, 74, 18, pal.gold, 3), ...attr("diya", cx + 100, b - 50, 0.9, pal, t), ...attr("diya", cx + 160, b - 52, 0.9, pal, t + 0.3), ...lotus(cx + 130, b - 56, 60, pal));
  }},
  {id: "vishnu_chakra", group: "figure", tags: ["विष्णु", "नारायण", "लक्ष्मी", "चक्र", "शंख", "विष्णु", "vishnu", "narayan", "chakra", "वामन", "परशुराम", "नरसिंह"], draw: ({t, pal}) => {
    const cx = 300, b = 466;
    return paper(pal, halo(cx, 160, 120, pal, t, 18), ...lotus(cx, b + 2, 280, pal, pal.accent2),
      figure({cx, base: b - 20, s: 0.84, pose: "stand", skin: "#3e7fd1", cloth: "#f4c430", cloth2: "#f4c430", crown: "mukut", arms: "wide", right: "chakra", left: "conch", sash: pal.accent, t}, pal));
  }},
];
