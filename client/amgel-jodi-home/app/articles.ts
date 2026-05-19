import type { Metadata } from "next";

const siteUrl = "https://amgeljodi.com";

export type ArticleSection = {
  heading: string;
  paragraphs: string[];
};

export type Article = {
  slug: string;
  title: string;
  description: string;
  eyebrow: string;
  image: string;
  publishedAt: string;
  updatedAt: string;
  keywords: string[];
  paragraphs: string[];
  sections?: ArticleSection[];
};

export const articles: Article[] = [
  {
    slug: "why-to-marry-gsb-konkani",
    title: "Why Marrying Within the GSB Konkani Community Still Feels Meaningful",
    description:
      "A short take on why GSB Konkani marriages still matter to Amchigelle and Amgele families balancing tradition, culture, and modern compatibility.",
    eyebrow: "Community",
    image:
      "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1600&q=80",
    publishedAt: "2026-03-25",
    updatedAt: "2026-03-25",
    keywords: [
      "GSB Konkani",
      "Amchigelle",
      "Amgele",
      "Lagna",
      "Udupi",
      "Mangalore",
      "Mumbai",
    ],
    paragraphs: [
      "For many GSB Konkani families, marriage is not only about finding a partner. It is also about shared language, food, values, and a rhythm of life that feels instantly familiar. When Amchigelle and Amgele meet through a community-first platform, conversations often move faster because there is less explaining and more understanding. That matters whether a family is rooted in Udupi and Mangalore or now spread across Mumbai and Bangalore.",
      "A community match does not mean old-fashioned thinking. It simply means your Lagna journey begins with a stronger cultural base. The small things matter: festivals celebrated the same way, grandparents who can connect easily, and traditions that feel natural instead of forced. For people who want compatibility with context, GSB Konkani matchmaking still feels practical, warm, and deeply personal."
    ],
  },
  {
    slug: "arranged-marriage-benefits-india",
    title: "Why Starting Your Match Search Early Always Helps",
    description:
      "A clear, reassuring article on why it is better to begin looking for the right partner early, without panic or family pressure.",
    eyebrow: "Guidance",
    image:
      "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1600&q=80",
    publishedAt: "2026-03-25",
    updatedAt: "2026-04-03",
    keywords: [
      "find a match early",
      "marriage timing",
      "partner search",
      "family pressure",
      "matchmaking advice",
      "GSB Konkani",
      "Mumbai",
      "Bangalore",
    ],
    paragraphs: [
      "Starting early does not mean rushing into marriage. It simply means giving yourself enough time to explore, understand people properly, and make a calm decision. Finding the right partner usually takes time because compatibility is not something you can judge in one conversation. The earlier you begin, the more space you give yourself to meet the right person without feeling forced.",
      "Many people delay the process and then suddenly feel pressure from age, relatives, or family expectations. That is when panic starts, and panic rarely helps anyone choose well. A better approach is to begin early, stay open-minded, and treat the process as a journey. You do not need to say yes quickly. You just need to keep moving steadily.",
      "It is also important to remember that everyone does find their match in time. Some people meet the right partner fast. Others take longer because they need more conversations, more clarity, or a better sense of what matters to them. That is normal. The goal is not to compete with anyone else's timeline. The goal is to find the person who feels right for your life.",
      "So do not panic because of family pressure. Listen respectfully, but do not let urgency take over your decision-making. Start exploring early, learn from every conversation, and trust that things will fall into place. When the process is patient and sincere, the right match becomes much easier to recognize."
    ],
  },
  {
    slug: "life-after-marriage-fun",
    title: "Life After Marriage Can Be Fun, Calm, and Surprisingly Simple",
    description:
      "A grounded look at how married life can stay joyful through routines, festivals, travel, and family moments in places like Kumta and Honnavara.",
    eyebrow: "Lifestyle",
    image:
      "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=1600&q=80",
    publishedAt: "2026-03-25",
    updatedAt: "2026-03-25",
    keywords: [
      "life after marriage",
      "GSB Konkani",
      "Kumta",
      "Honnavara",
      "Mangalore",
    ],
    paragraphs: [
      "There is a myth that marriage becomes routine too quickly. In reality, life after marriage often gets better when two people start building small rituals together. A simple breakfast plan, a weekend temple visit, an evening walk, or a short trip to Mangalore, Kumta, or Honnavara can create the kind of joy that lasts longer than grand gestures. The best couples do not chase drama. They build comfort and fun into ordinary days.",
      "For GSB Konkani couples, culture adds its own warmth. Festivals, food, family visits, and shared memories from coastal towns create a feeling of belonging that strengthens the relationship. Married life does not need to be loud to be meaningful. It can be calm, playful, and full of partnership when both people show up with patience, humor, and a little everyday effort."
    ],
  },
  {
    slug: "gsb-konkani-wedding-traditions",
    title: "GSB Konkani Wedding Rituals",
    description:
      "Understand the flow of a typical GSB Vardik, from Nandhi and Phool Muddi to Kanyadaan, Saptapadi, and Ghar Bhorche, so families can plan with clarity and confidence.",
    eyebrow: "Traditions",
    image:
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1600&q=80",
    publishedAt: "2026-03-25",
    updatedAt: "2026-05-16",
    keywords: [
      "GSB Konkani wedding",
      "Vardik",
      "Phool Muddi",
      "Kanyadaan",
      "Saptapadi",
      "Udupi",
      "Mangalore",
    ],
    paragraphs: [
      "A GSB Konkani wedding, often called a Vardik, is more than a single ceremony. It is a sequence of rituals spread across days, each with a purpose rooted in prayer, family bonds, and community blessing. For couples and families preparing for Lagna, knowing the order of events helps with everything practical: outfits, timing, guest flow, and when to expect a break for food or rest.",
      "Most noon weddings (Abhijin Lagnam) run across about one and a half days: an evening on Day 1 centred on Phool Muddi, and the main rituals on Day 2 ending with lunch. Evening weddings (Godhuli Lagnam) are often compressed into a single day. Details vary by family, priest, and region, from coastal Karnataka to Mumbai, but the broad structure below is what many Amchigelle households still follow.",
      "Customs are living traditions. Some families hold every ritual; others adapt steps to venue constraints or modern schedules. Treat this guide as a helpful overview, not a rigid rulebook. Your bhat maam and elders remain the final word on what applies in your home."
    ],
    sections: [
      {
        heading: "Before the wedding: Nandhi",
        paragraphs: [
          "Roughly ten days before the wedding, both the bride’s and groom’s families usually perform Nandhi, a prayer to invoke divine and ancestral blessings so the celebrations proceed smoothly. The pooja honours the gods, ancestors, and the five elements.",
          "A ceremonial plate called shashe poleru is prepared with rice and four coconuts. Married women in the family perform shashe aarthi for the bride (or groom), parents, and the dheddi or dheddo, the younger sibling or cousin who assists through many rituals. The wedding saree and main jewellery may also receive a small blessing on this day.",
          "The shashe poleru is kept in the pooja room, and a lamp is lit daily until after the wedding. The bride often receives glass bangles at Nandhi and wears them through the festivities, a visible sign that the household is preparing for marriage."
        ],
      },
      {
        heading: "Day 1: Welcome and Phool Muddi",
        paragraphs: [
          "Day 1 typically begins in the afternoon with Prarthana at each home, a prayer for an auspicious wedding. The bride’s brother may visit the groom’s family with sweets and flowers to formally invite them to the venue.",
          "When the groom’s party arrives, Yeduru Kansani is the warm welcome at the entrance. Women from both sides stand with thalis offering haldi-kumkum, flowers, beetle leaf and areca nut (veedo), rose water (paneer), and the shashe poleru from Nandhi. A sister holds the kalash-kannadi, a pot with a decorated coconut and a mirror on a chain, so guests may see their reflection, a gesture of goodwill and freshness after travel. Akshat (blessed rice) is exchanged, and the bride’s father may present the groom with a decorated coconut before leading him to the mantap.",
          "Phool Muddi, which means flowers and ring, is the evening’s central ritual, historically close to what many communities now call an engagement. An important pattern in Konkani weddings: until Kanyadaan, the bride and groom rarely share the mantap at the same time. One enters while the other steps aside, each accompanied by a dheddi or dheddo.",
          "The groom and his dheddo are honoured first with a ring from the bride’s parents, new clothes, and aarthi with akshat. The bride and her dheddi follow, receiving flowers instead of a ring. The bride then changes into the saree gifted by her mother-in-law. Dinner, family photos, and rest follow. Day 2 begins early."
        ],
      },
      {
        heading: "Day 2 morning: Udida Mahurat and Ghade Udda",
        paragraphs: [
          "Day 2 often starts around seven in the morning. Udida Mahurat marks the grinding of black gram (udidu) on a stone grinder, symbolically introducing the bride to a staple of Konkani kitchens. Idli breakfast from fresh udidu batter is considered auspicious on ritual days. The groom may take part as well, acknowledging the effort behind everyday food. Today, families often share one grinder at the venue and take turns.",
          "Ghade Udda is specific to the bride: women help her draw water, traditionally from a well, and fill pots. Where wells are unavailable, the priest may designate a decorated vessel to represent the well. Five pots are filled; some families link these to timing during the ceremony. Afterward, the bride prepares for the main wedding saree while her mother may wear a navvari saree."
        ],
      },
      {
        heading: "Kashi Yatra and Mantap Pooja",
        paragraphs: [
          "In Kashi Yatra, the groom playfully pretends to renounce worldly life and leave for Kashi, carrying a bundle and stick while the dheddo holds an umbrella. The bride’s father stops him, asks him to return, and gifts a silver set (thali, plates, and related items) for daily worship, sometimes called the ruppe-sandook.",
          "Before the bride joins the mantap, Mantap Pooja is performed with her mother. The bride, dressed in her main wedding saree with aadvarl (the white shoulder cloth) and family jewellery, prays at the mantap. Her mother ties the daremani, a black-bead and gold chain blessed by married women, around the bride’s neck. She then returns to the dressing room until Varmala."
        ],
      },
      {
        heading: "Varmala, Kanyadaan, and the sacred thread",
        paragraphs: [
          "When the groom returns to the mantap, the dheddo steps aside for the first time as the couple prepare to meet. The bride is escorted by her maternal uncles; in many weddings the final steps onto the stage are ceremonial, with uncles lifting her toward the centre.",
          "An antarpatt (cloth screen) separates bride and groom while priests chant mangal shlokas. When the screen is lowered, they exchange garlands, often with the bride’s father helping her, and the wedding moves into its most solemn phase.",
          "During Kanyadaan, the bride’s father places her hand in the groom’s, and her mother pours milk and water from a kalash that may hold flowers, mishri (sugar crystals), and gold coins. Traditionally one coin returns with the bride’s parents; many priests today suggest two so one remains with the bride.",
          "The groom then ties the kasthali (mangalsutra), a chain of coral and gold, around the bride’s neck, marking their union in the eyes of family and tradition."
        ],
      },
      {
        heading: "Layi Homa, Saptapadi, and becoming man and wife",
        paragraphs: [
          "Layi Homa involves the bride’s mother bringing firewood for the havan. Maternal uncles and brothers line up by age; puffed rice (layi) passes from the youngest upward, and the couple offer it into the fire together, repeated five times. They circle the homa kund, usually two rounds led by the groom and two by the bride, while the groom holds the bride’s thumbs. The eldest uncle may place silver toe rings (sutungulu) on the bride. Uncles and brothers receive cloth gifts; a single shawl may pass shoulder to shoulder and stay with the youngest.",
          "Saptapadi, the seven steps, is when the marriage is formally complete. Seven mounds of rice lie between them; holding right hands, the bride steps forward one mound at a time until she reaches the groom. They finish the homa together as husband and wife. The bride may then receive lagna kapad, a new saree and jewellery from her mother-in-law, and change before the next rituals."
        ],
      },
      {
        heading: "Honti, first meal, and the journey home",
        paragraphs: [
          "Honti Bhorche is the mother’s blessing with coconut, blouse piece, flowers, and haldi-kumkum. The mother-in-law may set the bride’s pallu and complete her bindi from a half-moon to a full circle, signs of married status. Var Ubbarche asks maternal uncle and aunt to lift groom and bride briefly for a few steps, a light-hearted ritual whose meaning varies by family.",
          "The couple sit on a spread saree and feed each other banana, symbolising care in married life. Mishri from Kanyadaan may be tied to the bride’s pallu, representing shared prosperity. Lunch follows, sometimes with the couple feeding each other sweets. Parents often eat last after ensuring guests are served.",
          "The wedding party may visit the bride’s home for kumkum aarthi and honti again, then proceed to the groom’s house. In earlier times a sister or young relative sometimes accompanied the bride for the first few days; today this is less common but still seen in some families."
        ],
      },
      {
        heading: "Ghar Bhorche: entering the new home",
        paragraphs: [
          "Ghar Bhorche covers the rituals when the bride enters her husband’s home. The couple kick a coconut at the threshold; the bride may also kick in a kalash of rice, welcoming abundance. Baagil Dhorche, or blocking the door, is a playful moment when the groom’s sisters demand gifts or promises before allowing entry; once a way to affirm family ties, it is now often light-hearted.",
          "Naav Davarche is the naming ritual: the mother-in-law whispers several sacred names and the bride’s new household name into her ear. Families sometimes play Vokkul (finding a ring in milk or water) or Chandu (tossing a decorated ball), traditions shared with other Indian weddings and meant to ease nerves and build warmth.",
          "Some households also perform Vaina Pooja after the main rituals, a separate ceremony with many vaina offerings distributed to elder women for blessings. Not every GSB family includes this; ask your priest early if it forms part of your plan."
        ],
      },
      {
        heading: "Planning your Vardik with calm",
        paragraphs: [
          "Knowing the sequence helps couples and parents coordinate outfits, makeup, photography, and meal breaks without surprise. Share this outline with your wedding planner and bhat maam, then confirm which rituals your families will observe and how long each block may take at your venue.",
          "Whether your roots are in Udupi, Mangalore, Karkala, Mulki, or a city far from the coast, the heart of a GSB Konkani wedding is the same: prayer, family presence, and the quiet joy of two people stepping into a life built together. Amgel Jodi hopes this guide makes that journey a little easier to navigate."
        ],
      },
    ],
  },
  {
    slug: "gsb-couple-goals-festival-style",
    title: "GSB Couple Goals, Festival Style",
    description:
      "How festivals help GSB couples build connection, family rhythm, and shared memories across homes in Udupi, Mumbai, and Bangalore.",
    eyebrow: "Festivals",
    image:
      "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1600&q=80",
    publishedAt: "2026-03-25",
    updatedAt: "2026-03-25",
    keywords: [
      "GSB couple goals",
      "Amchigelle",
      "Udupi",
      "Mumbai",
      "Bangalore",
    ],
    paragraphs: [
      "Some of the strongest couple memories are made during festivals. For GSB Konkani families, festive days create a natural way to share work, joy, and tradition. Cooking together, dressing for temple visits, welcoming relatives, and keeping little customs alive can turn ordinary celebration into something deeply bonding. This is true whether the couple lives near Udupi or has built a new life in Mumbai or Bangalore.",
      "Healthy couple goals are usually simple. Show up for each other, show respect to both families, and make room for fun. Amchigelle couples who celebrate together often build a stronger sense of partnership because festivals reveal how they handle planning, pressure, and togetherness. Shared traditions do not make love less modern. They often make it steadier and more joyful."
    ],
  },
  {
    slug: "marriage-advice-20s-30s",
    title: "Marriage Advice in Your 20s and 30s Without the Noise",
    description:
      "Practical marriage advice for people in their 20s and 30s thinking seriously about compatibility, timing, and values.",
    eyebrow: "Advice",
    image:
      "https://images.unsplash.com/photo-1511988617509-a57c8a288659?auto=format&fit=crop&w=1600&q=80",
    publishedAt: "2026-03-25",
    updatedAt: "2026-03-25",
    keywords: [
      "marriage advice",
      "20s",
      "30s",
      "GSB Konkani",
      "Mumbai",
      "Bangalore",
      "Chennai",
    ],
    paragraphs: [
      "Your 20s and 30s bring different questions about marriage. In your 20s, you may still be shaping career goals, lifestyle, and independence. In your 30s, clarity often improves, but expectations can become sharper too. The answer is not to rush or delay for the sake of trends. It is to know what matters most: values, emotional steadiness, mutual respect, and daily compatibility.",
      "For GSB Konkani professionals living in Mumbai, Bangalore, or Chennai, the best marriage advice is practical. Ask clear questions early. Understand family expectations without surrendering your own judgment. Look for someone whose life direction fits yours, not just someone who looks good on paper. A good match rarely comes from perfection. It comes from honesty, timing, and shared intent."
    ],
  },
  {
    slug: "why-gsb-community-strong",
    title: "Why the GSB Community Still Feels Strong Across Generations",
    description:
      "A short reflection on why the GSB community remains connected across family networks, festivals, temples, and migration.",
    eyebrow: "Identity",
    image:
      "https://images.unsplash.com/photo-1516302752625-fcc3c50ae61f?auto=format&fit=crop&w=1600&q=80",
    publishedAt: "2026-03-25",
    updatedAt: "2026-03-25",
    keywords: [
      "GSB community",
      "Amchigelle",
      "Karkala",
      "Mulki",
      "Kumta",
      "Honnavara",
    ],
    paragraphs: [
      "The GSB community stays strong because connection is built into everyday life. Temples, family networks, language, food, and a strong sense of shared memory help people stay rooted even when they move far from home. Whether someone grows up in Karkala, Mulki, Kumta, or Honnavara, there is often an immediate cultural familiarity that continues across generations.",
      "For Amchigelle families, that strength also creates trust. Parents and young adults may not agree on everything, but they usually share a common cultural base. That matters in marriage too. Community does not solve every question, but it offers context, support, and a sense of belonging. In a fast-moving world, that kind of cultural steadiness is a real advantage."
    ],
  },
  {
    slug: "udupi-mangalore-marriage-culture",
    title: "What Udupi and Mangalore Marriage Culture Still Teaches Us",
    description:
      "How marriage culture from Udupi and Mangalore continues to shape values, families, and modern matchmaking.",
    eyebrow: "Culture",
    image:
      "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1600&q=80",
    publishedAt: "2026-03-25",
    updatedAt: "2026-03-25",
    keywords: [
      "Udupi",
      "Mangalore",
      "GSB Konkani",
      "Karkala",
      "Mulki",
      "Mumbai",
      "Chennai",
    ],
    paragraphs: [
      "Marriage culture in Udupi and Mangalore still shapes how many families think about partnership, respect, and long-term stability. The values are familiar: involve elders, keep conversations clear, and treat marriage as both personal and family-centered. Even for people now living in Mumbai, Bangalore, or Chennai, these roots often continue to influence what feels right in a match.",
      "What stands out is balance. Families from Udupi, Mangalore, Karkala, and Mulki often value tradition, but they also adapt well to modern education, careers, and urban life. That balance is why GSB Konkani matchmaking remains relevant. It is not about preserving the past exactly as it was. It is about carrying forward what still helps people build strong marriages today."
    ],
  },
];

export function getArticleBySlug(slug: string) {
  return articles.find((article) => article.slug === slug);
}

export function createArticleMetadata(article: Article): Metadata {
  const url = `${siteUrl}/${article.slug}`;

  return {
    title: article.title,
    description: article.description,
    keywords: article.keywords,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "article",
      url,
      title: article.title,
      description: article.description,
      images: [
        {
          url: article.image,
          alt: article.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.description,
      images: [article.image],
    },
  };
}

export function createArticleJsonLd(article: Article) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.description,
    image: [article.image],
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    mainEntityOfPage: `${siteUrl}/${article.slug}`,
    articleSection: article.eyebrow,
    keywords: article.keywords.join(", "),
    author: {
      "@type": "Organization",
      name: "Amgel Jodi",
      url: siteUrl,
    },
    publisher: {
      "@type": "Organization",
      name: "Amgel Jodi",
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/logo.svg`,
      },
    },
  };
}
