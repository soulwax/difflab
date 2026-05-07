import { diffLines } from "diff";

export type DiffStats = {
	additions: number;
	changes: number;
	deletions: number;
};

export function computeDiffStats(
	baseText: string,
	headText: string,
): DiffStats {
	return diffLines(baseText, headText).reduce<DiffStats>(
		(stats, part) => {
			const lineCount = part.count ?? part.value.split("\n").length - 1;

			if (part.added) {
				stats.additions += lineCount;
				return stats;
			}

			if (part.removed) {
				stats.deletions += lineCount;
				return stats;
			}

			stats.changes += lineCount;
			return stats;
		},
		{ additions: 0, changes: 0, deletions: 0 },
	);
}

export function shouldUseDiffWorker(baseText: string, headText: string) {
	const lineCount = baseText.split("\n").length + headText.split("\n").length;

	return lineCount > 5000;
}
