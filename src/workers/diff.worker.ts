import { computeDiffStats } from "~/lib/diff";

type DiffWorkerRequest = {
	baseText: string;
	headText: string;
};

self.onmessage = (event: MessageEvent<DiffWorkerRequest>) => {
	const stats = computeDiffStats(event.data.baseText, event.data.headText);

	self.postMessage(stats);
};
