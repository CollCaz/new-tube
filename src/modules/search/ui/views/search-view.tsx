import { CategoriesSection } from "../../sections/categories-section";
import { ResultsSection } from "../../sections/results-section";

interface PageProps {
	query: string | undefined;
	categoryId: string | undefined;
}

export const SearchView = ({
	query,
	categoryId
}: PageProps) => {
	return (
		<div className="max-w-[1300] mx-auto mb-10">
			<CategoriesSection categoryId={categoryId} />
			<ResultsSection query={query} categoryId={categoryId} />
		</div>
	)
}
