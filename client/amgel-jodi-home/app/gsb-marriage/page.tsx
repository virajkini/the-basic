import ArticleLayout from "../components/ArticleLayout";
import { createArticleMetadata, getArticleBySlug } from "../articles";

const article = getArticleBySlug("gsb-marriage")!;

export const metadata = createArticleMetadata(article);

export default function Page() {
  return <ArticleLayout article={article} />;
}
