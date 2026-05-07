import {
	GetObjectCommand,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { env } from "~/env";

type StoredContent = {
	contentInline: string | null;
	storageKey: string | null;
};

let r2Client: S3Client | null = null;

function assertR2Config() {
	if (
		!env.R2_ACCESS_KEY_ID ||
		!env.R2_BUCKET_NAME ||
		!env.R2_ENDPOINT ||
		!env.R2_SECRET_ACCESS_KEY
	) {
		throw new Error("Cloudflare R2 is not configured.");
	}

	return {
		accessKeyId: env.R2_ACCESS_KEY_ID,
		bucketName: env.R2_BUCKET_NAME,
		endpoint: env.R2_ENDPOINT,
		secretAccessKey: env.R2_SECRET_ACCESS_KEY,
	};
}

export function getR2Client() {
	const config = assertR2Config();

	r2Client ??= new S3Client({
		credentials: {
			accessKeyId: config.accessKeyId,
			secretAccessKey: config.secretAccessKey,
		},
		endpoint: config.endpoint,
		region: "auto",
	});

	return r2Client;
}

export function getContentSize(content: string) {
	return new TextEncoder().encode(content).byteLength;
}

export function shouldStoreInline(content: string) {
	return getContentSize(content) < env.INLINE_CONTENT_MAX_BYTES;
}

export function createDocumentStorageKey(params: {
	documentId: string;
	userId: string;
}) {
	return `users/${params.userId}/documents/${params.documentId}/${Date.now()}.txt`;
}

export async function storeTextContent(params: {
	content: string;
	documentId: string;
	userId: string;
}): Promise<StoredContent> {
	if (shouldStoreInline(params.content)) {
		return {
			contentInline: params.content,
			storageKey: null,
		};
	}

	const config = assertR2Config();
	const storageKey = createDocumentStorageKey(params);

	await getR2Client().send(
		new PutObjectCommand({
			Body: params.content,
			Bucket: config.bucketName,
			ContentType: "text/plain; charset=utf-8",
			Key: storageKey,
		}),
	);

	return {
		contentInline: null,
		storageKey,
	};
}

export async function readTextContent(params: StoredContent) {
	if (params.contentInline !== null) {
		return params.contentInline;
	}

	if (!params.storageKey) {
		return "";
	}

	const config = assertR2Config();
	const response = await getR2Client().send(
		new GetObjectCommand({
			Bucket: config.bucketName,
			Key: params.storageKey,
		}),
	);

	return response.Body?.transformToString("utf-8") ?? "";
}

export async function getPresignedUploadUrl(params: {
	contentType: string;
	storageKey: string;
}) {
	const config = assertR2Config();

	return getSignedUrl(
		getR2Client(),
		new PutObjectCommand({
			Bucket: config.bucketName,
			ContentType: params.contentType,
			Key: params.storageKey,
		}),
		{ expiresIn: 60 * 10 },
	);
}

export async function getPresignedDownloadUrl(storageKey: string) {
	const config = assertR2Config();

	return getSignedUrl(
		getR2Client(),
		new GetObjectCommand({
			Bucket: config.bucketName,
			Key: storageKey,
		}),
		{ expiresIn: 60 * 10 },
	);
}
