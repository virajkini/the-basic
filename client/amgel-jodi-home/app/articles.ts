import type { Metadata } from "next";

const siteUrl = "https://amgeljodi.com";

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
    title: "Arranged Marriage Benefits in India for Modern Families",
    description:
      "Why arranged marriage still works for Indian families seeking clarity, compatibility, and support across cities like Mumbai, Bangalore, and Chennai.",
    eyebrow: "Marriage",
    image:
      "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1600&q=80",
    publishedAt: "2026-03-25",
    updatedAt: "2026-03-25",
    keywords: [
      "arranged marriage",
      "India",
      "GSB Konkani",
      "Vardika",
      "Mumbai",
      "Bangalore",
      "Chennai",
    ],
    paragraphs: [
      "Modern arranged marriage in India works best when it blends family wisdom with personal choice. Instead of leaving everything to chance, families help shortlist people with similar values, life goals, and cultural fit. That reduces noise and makes conversations more serious from the start. For GSB Konkani families living across Mumbai, Bangalore, and Chennai, this structure often saves time and emotional energy.",
      "The biggest benefit is clarity. Expectations around work, lifestyle, elders, and long-term plans come up early, not after months of confusion. Even rituals like the Vardika meeting become less about pressure and more about understanding both people and both families. Good arranged marriage systems do not replace chemistry. They create a safer, more focused path to find it."
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
    title: "GSB Konkani Wedding Traditions That Still Feel Beautiful Today",
    description:
      "From Vardika to Lagna, a quick guide to the wedding traditions GSB Konkani families still cherish across generations.",
    eyebrow: "Traditions",
    image:
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1600&q=80",
    publishedAt: "2026-03-25",
    updatedAt: "2026-03-25",
    keywords: [
      "GSB Konkani wedding",
      "Vardika",
      "Lagna",
      "Amgele",
      "Karkala",
      "Mulki",
    ],
    paragraphs: [
      "GSB Konkani weddings stay memorable because they are rich in meaning without losing warmth. Families still value early rituals like Vardika, where intentions become visible and both sides begin to know each other better. By the time the Lagna arrives, the ceremony feels less like a performance and more like a community blessing. That emotional continuity is what makes these weddings stand out.",
      "Whether the family roots are in Karkala, Mulki, Udupi, or Mumbai, the details often remain familiar: elders guiding the flow, food that carries memory, and customs that make Amgele and their families feel grounded. Traditions do evolve, but the heart of a GSB Konkani wedding remains the same. It celebrates not only two people, but also continuity, belonging, and respect."
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
