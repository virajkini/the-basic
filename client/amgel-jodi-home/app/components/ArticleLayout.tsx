import Link from "next/link";
import { Article, createArticleJsonLd } from "../articles";

type ArticleLayoutProps = {
  article: Article;
};

export default function ArticleLayout({ article }: ArticleLayoutProps) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(createArticleJsonLd(article)),
        }}
      />
      <main className="min-h-screen bg-[linear-gradient(180deg,#fffdf8_0%,#fdf8ff_42%,#ffffff_100%)]">
        <section className="relative overflow-hidden border-b border-myColor-100 bg-myColor-950 text-white">
          <img
            src={article.image}
            alt=""
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(167,99,241,0.42),_transparent_35%),linear-gradient(180deg,rgba(17,10,24,0.78)_0%,rgba(17,10,24,0.94)_100%)]" />
          <div className="relative mx-auto max-w-4xl px-4 py-20 md:px-6 md:py-28">
            <p className="mb-4 inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-myColor-100">
              {article.eyebrow}
            </p>
            <h1 className="max-w-3xl font-display text-4xl font-semibold tracking-tight text-white md:text-6xl">
              {article.title}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/75 md:text-lg">
              {article.description}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3 text-sm text-white/65">
              <span>{new Date(article.publishedAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}</span>
              <span className="h-1 w-1 rounded-full bg-white/35" />
              <span>{article.keywords.slice(0, 3).join(" · ")}</span>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-4 py-14 md:px-6 md:py-20">
          <div className="overflow-hidden rounded-[2rem] border border-myColor-100 bg-white shadow-[0_24px_90px_-48px_rgba(33,20,48,0.35)]">
            <div className="aspect-[16/8] w-full overflow-hidden bg-myColor-100">
              <img
                src={article.image}
                alt=""
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="px-5 py-8 md:px-10 md:py-10">
              <article className="max-w-none">
                {article.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="mb-6 text-base leading-8 text-myColor-700 md:text-lg">
                    {paragraph}
                  </p>
                ))}
              </article>

              <div className="mt-10 rounded-[1.5rem] border border-myColor-100 bg-myColor-50/75 px-5 py-5">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-myColor-500">
                  More from Amgel Jodi
                </p>
                <p className="mt-2 text-sm leading-7 text-myColor-700">
                  Explore more short reads on marriage, family life, GSB Konkani culture, and community traditions.
                </p>
                <div className="mt-4">
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 rounded-full bg-myColor-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-myColor-800"
                  >
                    Back to Home
                    <span aria-hidden="true">↗</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
