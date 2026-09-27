import type { GarmentKind } from "./garments";
import type { Locale } from "./i18n";

export type Localized = { en: string; ar: string };

export type Gender = "women" | "men" | "unisex";
export type Category = "tops" | "bottoms" | "dresses" | "outerwear";

export type ColorOption = { name: Localized; hex: string };

export type Product = {
  id: string;
  slug: string;
  name: Localized;
  description: Localized;
  material: Localized;
  kind: GarmentKind;
  category: Category;
  gender: Gender;
  price: number;
  /** Original price when on sale. */
  compareAt?: number;
  rating: number;
  reviews: number;
  colors: ColorOption[];
  sizes: string[];
  tags: ("new" | "bestseller")[];
  /** Sort key for "newest". */
  added: number;
};

const C = {
  black: { name: { en: "Black", ar: "أسود" }, hex: "#1f2328" },
  ink: { name: { en: "Ink Navy", ar: "كحلي" }, hex: "#1e2a44" },
  white: { name: { en: "Off White", ar: "أبيض عاجي" }, hex: "#ece8e1" },
  sand: { name: { en: "Sand", ar: "رملي" }, hex: "#d6c7a1" },
  camel: { name: { en: "Camel", ar: "جملي" }, hex: "#b08254" },
  olive: { name: { en: "Olive", ar: "زيتوني" }, hex: "#5f6b3a" },
  rust: { name: { en: "Rust", ar: "صدئي" }, hex: "#b4532a" },
  sky: { name: { en: "Sky Blue", ar: "أزرق سماوي" }, hex: "#8fb3d9" },
  cobalt: { name: { en: "Cobalt", ar: "كوبالت" }, hex: "#2f5fd0" },
  denim: { name: { en: "Mid Denim", ar: "دنيم متوسط" }, hex: "#3d5f8f" },
  darkDenim: { name: { en: "Dark Denim", ar: "دنيم داكن" }, hex: "#26334d" },
  rose: { name: { en: "Rose", ar: "وردي" }, hex: "#c24d74" },
  wine: { name: { en: "Wine", ar: "نبيذي" }, hex: "#6d1f35" },
  sage: { name: { en: "Sage", ar: "أخضر مريمي" }, hex: "#8fa58a" },
  emerald: { name: { en: "Emerald", ar: "زمردي" }, hex: "#0f6e5c" },
  charcoal: { name: { en: "Charcoal", ar: "فحمي" }, hex: "#3b3f45" },
  heather: { name: { en: "Heather Grey", ar: "رمادي" }, hex: "#9ea3a8" },
  chocolate: { name: { en: "Chocolate", ar: "بني شوكولاتة" }, hex: "#5a3b2a" },
  lilac: { name: { en: "Lilac", ar: "ليلكي" }, hex: "#b7a3d4" },
} satisfies Record<string, ColorOption>;

const TOPS = ["XS", "S", "M", "L", "XL", "XXL"];
const WAIST = ["28", "30", "32", "34", "36", "38"];

export const PRODUCTS: Product[] = [
  {
    id: "p01", slug: "essential-crew-tee", kind: "tee", category: "tops", gender: "unisex",
    name: { en: "Essential Crew Tee", ar: "تيشيرت أساسي بياقة دائرية" },
    description: {
      en: "A heavyweight cotton tee with a relaxed shoulder and a clean crew neck. The one you'll reach for every day.",
      ar: "تيشيرت قطني ثقيل بكتف مريح وياقة دائرية أنيقة. القطعة التي ستختارها كل يوم.",
    },
    material: { en: "100% organic cotton, 220 gsm. Machine wash cold.", ar: "قطن عضوي 100٪، 220 غرام. غسيل آلي بماء بارد." },
    price: 29, rating: 4.8, reviews: 412, colors: [C.black, C.white, C.sage, C.rust], sizes: TOPS, tags: ["bestseller"], added: 3,
  },
  {
    id: "p02", slug: "oxford-button-down", kind: "shirt", category: "tops", gender: "men",
    name: { en: "Oxford Button-Down Shirt", ar: "قميص أكسفورد بأزرار" },
    description: {
      en: "Soft-washed oxford cloth with a button-down collar and a single chest pocket. Smart enough for the office, easy enough for weekends.",
      ar: "قماش أكسفورد مغسول بياقة بأزرار وجيب صدر واحد. أنيق للمكتب ومريح لعطلة نهاية الأسبوع.",
    },
    material: { en: "100% cotton oxford. Machine wash, tumble dry low.", ar: "قطن أكسفورد 100٪. غسيل آلي وتجفيف على حرارة منخفضة." },
    price: 59, rating: 4.6, reviews: 188, colors: [C.sky, C.white, C.rust], sizes: TOPS, tags: [], added: 5,
  },
  {
    id: "p03", slug: "cable-knit-sweater", kind: "sweater", category: "tops", gender: "women",
    name: { en: "Ribbed Merino Sweater", ar: "كنزة ميرينو مضلعة" },
    description: {
      en: "Fine-gauge merino with ribbed cuffs and hem. Warm without the bulk and soft enough to wear next to skin.",
      ar: "صوف ميرينو ناعم بأطراف وحواف مضلعة. دافئة دون ثقل وناعمة على البشرة.",
    },
    material: { en: "100% extra-fine merino wool. Hand wash cold, dry flat.", ar: "صوف ميرينو فائق النعومة 100٪. غسيل يدوي بماء بارد وتجفيف مسطح." },
    price: 89, compareAt: 119, rating: 4.7, reviews: 96, colors: [C.white, C.camel, C.lilac, C.charcoal], sizes: TOPS, tags: [], added: 7,
  },
  {
    id: "p04", slug: "cloud-fleece-hoodie", kind: "hoodie", category: "tops", gender: "unisex",
    name: { en: "Cloud Fleece Hoodie", ar: "هودي فليس ناعم" },
    description: {
      en: "Brushed-back fleece, a double-layer hood and a roomy kangaroo pocket. Built for slow mornings.",
      ar: "فليس مصقول من الداخل مع قبعة مزدوجة وجيب أمامي واسع. مصمم للصباحات الهادئة.",
    },
    material: { en: "80% cotton, 20% recycled polyester. Machine wash cold.", ar: "80٪ قطن، 20٪ بوليستر معاد تدويره. غسيل آلي بماء بارد." },
    price: 75, rating: 4.9, reviews: 530, colors: [C.heather, C.cobalt, C.olive, C.black], sizes: TOPS, tags: ["bestseller", "new"], added: 12,
  },
  {
    id: "p05", slug: "suede-trucker-jacket", kind: "jacket", category: "outerwear", gender: "men",
    name: { en: "Suede Trucker Jacket", ar: "جاكيت شامواه" },
    description: {
      en: "A soft suede take on the classic trucker with a notch collar and welt pockets. Gets better with every wear.",
      ar: "جاكيت كلاسيكي من الشامواه الناعم بياقة مسننة وجيوب جانبية. يزداد جمالاً مع كل ارتداء.",
    },
    material: { en: "100% goat suede, cotton lining. Specialist leather clean.", ar: "شامواه ماعز 100٪ مع بطانة قطنية. تنظيف متخصص للجلود." },
    price: 249, rating: 4.8, reviews: 64, colors: [C.chocolate, C.camel, C.charcoal], sizes: TOPS, tags: ["new"], added: 14,
  },
  {
    id: "p06", slug: "double-breasted-wool-coat", kind: "coat", category: "outerwear", gender: "women",
    name: { en: "Double-Breasted Wool Coat", ar: "معطف صوف بصفين من الأزرار" },
    description: {
      en: "A tailored mid-length coat in dense wool with peak lapels and a six-button front.",
      ar: "معطف متوسط الطول مفصل من الصوف الكثيف بطية صدر مدببة وستة أزرار أمامية.",
    },
    material: { en: "70% wool, 30% cashmere. Dry clean only.", ar: "70٪ صوف، 30٪ كشمير. تنظيف جاف فقط." },
    price: 329, compareAt: 399, rating: 4.9, reviews: 51, colors: [C.camel, C.black, C.wine], sizes: TOPS, tags: ["bestseller"], added: 9,
  },
  {
    id: "p07", slug: "linen-midi-dress", kind: "dress", category: "dresses", gender: "women",
    name: { en: "Linen Midi Dress", ar: "فستان ميدي من الكتان" },
    description: {
      en: "A breezy sleeveless midi with a fitted bodice and a softly gathered skirt that moves with you.",
      ar: "فستان ميدي خفيف بلا أكمام بصدر مفصل وتنورة منسدلة تتحرك معك.",
    },
    material: { en: "100% European linen. Machine wash gentle.", ar: "كتان أوروبي 100٪. غسيل آلي لطيف." },
    price: 119, rating: 4.7, reviews: 143, colors: [C.rose, C.emerald, C.sand, C.black], sizes: TOPS.slice(0, 5), tags: ["new"], added: 15,
  },
  {
    id: "p08", slug: "pleated-a-line-skirt", kind: "skirt", category: "bottoms", gender: "women",
    name: { en: "Pleated A-Line Skirt", ar: "تنورة بكسرات على شكل A" },
    description: {
      en: "Knife pleats, a high waistband and a knee-grazing length. Pairs with everything from tees to knits.",
      ar: "كسرات حادة وخصر مرتفع وطول يلامس الركبة. تتناسب مع كل شيء من التيشيرتات إلى الكنزات.",
    },
    material: { en: "Recycled polyester crepe. Machine wash cold.", ar: "كريب بوليستر معاد تدويره. غسيل آلي بماء بارد." },
    price: 69, compareAt: 89, rating: 4.5, reviews: 77, colors: [C.emerald, C.black, C.camel], sizes: TOPS.slice(0, 5), tags: [], added: 6,
  },
  {
    id: "p09", slug: "tailored-wide-trousers", kind: "pants", category: "bottoms", gender: "unisex",
    name: { en: "Tailored Straight Trousers", ar: "بنطال مستقيم مفصل" },
    description: {
      en: "Pressed-crease trousers with a mid rise and a straight leg. Sharp with a blazer, relaxed with a tee.",
      ar: "بنطال بثنية مكوية وخصر متوسط وساق مستقيمة. أنيق مع السترة ومريح مع التيشيرت.",
    },
    material: { en: "Stretch wool blend. Dry clean or cool hand wash.", ar: "مزيج صوف مرن. تنظيف جاف أو غسيل يدوي بارد." },
    price: 95, rating: 4.6, reviews: 120, colors: [C.charcoal, C.sand, C.black], sizes: WAIST, tags: ["bestseller"], added: 4,
  },
  {
    id: "p10", slug: "straight-leg-jeans", kind: "jeans", category: "bottoms", gender: "unisex",
    name: { en: "Straight-Leg Selvedge Jeans", ar: "جينز سيلفيدج بساق مستقيمة" },
    description: {
      en: "Rigid 13oz selvedge denim with a classic five-pocket build. Breaks in to fit you alone.",
      ar: "دنيم سيلفيدج صلب 13 أونصة بتصميم كلاسيكي بخمسة جيوب. يتشكل ليناسبك وحدك.",
    },
    material: { en: "100% cotton selvedge denim. Wash inside out, rarely.", ar: "دنيم سيلفيدج قطن 100٪. يغسل مقلوباً ونادراً." },
    price: 110, rating: 4.8, reviews: 301, colors: [C.denim, C.darkDenim, C.black], sizes: WAIST, tags: ["bestseller"], added: 8,
  },
  {
    id: "p11", slug: "chino-shorts", kind: "shorts", category: "bottoms", gender: "men",
    name: { en: "Everyday Chino Shorts", ar: "شورت تشينو يومي" },
    description: {
      en: "Garment-dyed stretch chino with a 7\" inseam. Your warm-weather default.",
      ar: "تشينو مرن مصبوغ بعد الخياطة بطول 7 بوصات. خيارك الأول للطقس الدافئ.",
    },
    material: { en: "98% cotton, 2% elastane. Machine wash cold.", ar: "98٪ قطن، 2٪ إيلاستين. غسيل آلي بماء بارد." },
    price: 49, compareAt: 65, rating: 4.4, reviews: 88, colors: [C.sand, C.olive, C.ink], sizes: WAIST, tags: [], added: 2,
  },
  {
    id: "p12", slug: "boxy-pocket-tee", kind: "tee", category: "tops", gender: "women",
    name: { en: "Boxy Cropped Tee", ar: "تيشيرت قصير فضفاض" },
    description: {
      en: "A slightly cropped, boxy tee in a smooth slub jersey. Tuck it, knot it or wear it loose.",
      ar: "تيشيرت فضفاض قصير قليلاً من جيرسي ناعم. أدخله أو اعقده أو ارتده بحرية.",
    },
    material: { en: "100% cotton slub jersey. Machine wash cold.", ar: "جيرسي قطن 100٪. غسيل آلي بماء بارد." },
    price: 35, rating: 4.5, reviews: 159, colors: [C.lilac, C.white, C.rose, C.black], sizes: TOPS, tags: ["new"], added: 13,
  },
  {
    id: "p13", slug: "overshirt-flannel", kind: "shirt", category: "tops", gender: "unisex",
    name: { en: "Brushed Flannel Overshirt", ar: "قميص فلانيل خارجي" },
    description: {
      en: "A heavy brushed flannel that layers like a light jacket, with a chest pocket and long cuffs.",
      ar: "فلانيل ثقيل مصقول يُلبس كجاكيت خفيف، مع جيب صدر وأساور طويلة.",
    },
    material: { en: "100% cotton flannel. Machine wash warm.", ar: "فلانيل قطن 100٪. غسيل آلي بماء دافئ." },
    price: 79, rating: 4.7, reviews: 92, colors: [C.olive, C.wine, C.charcoal], sizes: TOPS, tags: ["new"], added: 11,
  },
  {
    id: "p14", slug: "wrap-evening-dress", kind: "dress", category: "dresses", gender: "women",
    name: { en: "Satin Evening Dress", ar: "فستان سهرة من الساتان" },
    description: {
      en: "Liquid satin cut on the bias for a fluid drape, with a softly scooped neckline.",
      ar: "ساتان منسدل مقصوص بشكل مائل لانسيابية رائعة، مع فتحة عنق دائرية ناعمة.",
    },
    material: { en: "100% recycled satin. Dry clean recommended.", ar: "ساتان معاد تدويره 100٪. يُنصح بالتنظيف الجاف." },
    price: 159, compareAt: 199, rating: 4.8, reviews: 58, colors: [C.wine, C.emerald, C.black], sizes: TOPS.slice(0, 5), tags: [], added: 10,
  },
  {
    id: "p15", slug: "quilted-bomber", kind: "jacket", category: "outerwear", gender: "unisex",
    name: { en: "Quilted Bomber Jacket", ar: "جاكيت بومبر مبطن" },
    description: {
      en: "A lightweight insulated bomber with a water-repellent shell. Packs down small for travel.",
      ar: "جاكيت بومبر خفيف معزول بطبقة خارجية طاردة للماء. يُطوى بحجم صغير للسفر.",
    },
    material: { en: "Recycled nylon shell and fill. Machine wash cold.", ar: "طبقة خارجية وحشوة من النايلون المعاد تدويره. غسيل آلي بماء بارد." },
    price: 139, rating: 4.6, reviews: 110, colors: [C.olive, C.black, C.ink], sizes: TOPS, tags: ["new"], added: 16,
  },
  {
    id: "p16", slug: "relaxed-linen-trousers", kind: "pants", category: "bottoms", gender: "women",
    name: { en: "Relaxed Linen Trousers", ar: "بنطال كتان مريح" },
    description: {
      en: "Drawstring-waist linen trousers with a fluid straight leg. Summer's easiest outfit.",
      ar: "بنطال كتان بخصر برباط وساق مستقيمة منسدلة. أسهل إطلالة صيفية.",
    },
    material: { en: "100% linen. Machine wash gentle.", ar: "كتان 100٪. غسيل آلي لطيف." },
    price: 85, rating: 4.5, reviews: 67, colors: [C.white, C.sand, C.sage], sizes: WAIST, tags: [], added: 1,
  },
];

export const CATEGORIES: Category[] = ["tops", "bottoms", "dresses", "outerwear"];
export const GENDERS: Gender[] = ["women", "men", "unisex"];

export const productBySlug = (slug: string) => PRODUCTS.find((p) => p.slug === slug);
export const productById = (id: string) => PRODUCTS.find((p) => p.id === id);

export const t = (v: Localized, lang: Locale) => v[lang];

/** Soft backdrop tint for catalogue imagery. */
export const CARD_BG = "#f3f0eb";

export function relatedProducts(p: Product, n = 4) {
  return PRODUCTS.filter((x) => x.id !== p.id)
    .map((x) => ({ x, score: (x.category === p.category ? 2 : 0) + (x.gender === p.gender ? 1 : 0) + x.rating / 10 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map(({ x }) => x);
}

/** Pieces that complete an outfit with `p` in the fitting room. */
export function completeTheLook(p: Product, n = 4) {
  const want: Category[] =
    p.category === "tops" ? ["bottoms", "outerwear"] :
    p.category === "bottoms" ? ["tops", "outerwear"] :
    p.category === "dresses" ? ["outerwear"] : ["tops", "bottoms", "dresses"];
  return PRODUCTS.filter((x) => want.includes(x.category) && (x.gender === p.gender || x.gender === "unisex" || p.gender === "unisex"))
    .sort((a, b) => b.rating - a.rating)
    .slice(0, n);
}
