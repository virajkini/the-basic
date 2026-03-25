import ArticleLayout from "../components/ArticleLayout";
import { createArticleMetadata, getArticleBySlug } from "../articles";

const article = getArticleBySlug("arranged-marriage-benefits-india")!;

export const metadata = createArticleMetadata(article);

export default function Page() {
  return <ArticleLayout article={article} />;
}
