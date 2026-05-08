import { relations, sql } from "drizzle-orm";
import {
	type AnyPgColumn,
	boolean,
	index,
	pgEnum,
	pgTable,
	pgTableCreator,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";

export const createTable = pgTableCreator((name) => `difflab_${name}`);

export const documentType = pgEnum("document_type", [
	"text",
	"diff",
	"snippet",
]);
export const userRole = pgEnum("user_role", [
	"user",
	"team",
	"admin",
	"superadmin",
]);

export const posts = createTable(
	"post",
	(d) => ({
		id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
		name: d.varchar({ length: 256 }),
		createdById: d
			.varchar({ length: 255 })
			.notNull()
			.references(() => user.id),
		createdAt: d
			.timestamp({ withTimezone: true })
			.$defaultFn(() => new Date())
			.notNull(),
		updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
	}),
	(t) => [
		index("created_by_idx").on(t.createdById),
		index("name_idx").on(t.name),
	],
);

export const user = pgTable(
	"user",
	{
		id: text("id").primaryKey(),
		name: text("name").notNull(),
		email: text("email").notNull().unique(),
		emailVerified: boolean("email_verified")
			.$defaultFn(() => false)
			.notNull(),
		image: text("image"),
		role: userRole("role").default("user").notNull(),
		createdAt: timestamp("created_at")
			.$defaultFn(() => /* @__PURE__ */ new Date())
			.notNull(),
		updatedAt: timestamp("updated_at")
			.$defaultFn(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(t) => [
		uniqueIndex("user_single_superadmin_idx")
			.on(t.role)
			.where(sql`${t.role} = 'superadmin'`),
	],
);

export const session = pgTable("session", {
	id: text("id").primaryKey(),
	expiresAt: timestamp("expires_at").notNull(),
	token: text("token").notNull().unique(),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
	id: text("id").primaryKey(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at"),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
	scope: text("scope"),
	password: text("password"),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
	id: text("id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: timestamp("expires_at").notNull(),
	createdAt: timestamp("created_at").$defaultFn(
		() => /* @__PURE__ */ new Date(),
	),
	updatedAt: timestamp("updated_at").$defaultFn(
		() => /* @__PURE__ */ new Date(),
	),
});

export const folders = createTable(
	"folder",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		parentId: uuid("parent_id").references((): AnyPgColumn => folders.id, {
			onDelete: "cascade",
		}),
		createdAt: timestamp("created_at", { withTimezone: true })
			.$defaultFn(() => new Date())
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.$defaultFn(() => new Date())
			.$onUpdate(() => new Date())
			.notNull(),
		deletedAt: timestamp("deleted_at", { withTimezone: true }),
	},
	(t) => [
		index("folders_user_parent_idx").on(t.userId, t.parentId),
		uniqueIndex("folders_user_parent_name_idx").on(
			t.userId,
			t.parentId,
			t.name,
		),
	],
);

export const documents = createTable(
	"document",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		folderId: uuid("folder_id").references(() => folders.id, {
			onDelete: "set null",
		}),
		name: text("name").notNull(),
		type: documentType("type").default("text").notNull(),
		contentInline: text("content_inline"),
		storageKey: text("storage_key"),
		baseSnapshotId: uuid("base_snapshot_id").references(
			(): AnyPgColumn => documents.id,
			{ onDelete: "set null" },
		),
		headSnapshotId: uuid("head_snapshot_id").references(
			(): AnyPgColumn => documents.id,
			{ onDelete: "set null" },
		),
		isPublic: boolean("is_public").default(false).notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.$defaultFn(() => new Date())
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.$defaultFn(() => new Date())
			.$onUpdate(() => new Date())
			.notNull(),
		deletedAt: timestamp("deleted_at", { withTimezone: true }),
	},
	(t) => [
		index("documents_user_folder_idx").on(t.userId, t.folderId),
		index("documents_public_idx").on(t.isPublic),
		index("documents_base_snapshot_idx").on(t.baseSnapshotId),
		index("documents_head_snapshot_idx").on(t.headSnapshotId),
	],
);

export const documentVersions = createTable(
	"document_version",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		documentId: uuid("document_id")
			.notNull()
			.references(() => documents.id, { onDelete: "cascade" }),
		contentInline: text("content_inline"),
		storageKey: text("storage_key"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.$defaultFn(() => new Date())
			.notNull(),
	},
	(t) => [index("document_versions_document_idx").on(t.documentId)],
);

export const userRelations = relations(user, ({ many }) => ({
	account: many(account),
	session: many(session),
}));

export const accountRelations = relations(account, ({ one }) => ({
	user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const folderRelations = relations(folders, ({ many, one }) => ({
	children: many(folders),
	documents: many(documents),
	parent: one(folders, {
		fields: [folders.parentId],
		references: [folders.id],
		relationName: "folder_parent",
	}),
	user: one(user, { fields: [folders.userId], references: [user.id] }),
}));

export const documentRelations = relations(documents, ({ many, one }) => ({
	baseSnapshot: one(documents, {
		fields: [documents.baseSnapshotId],
		references: [documents.id],
		relationName: "base_snapshot",
	}),
	folder: one(folders, {
		fields: [documents.folderId],
		references: [folders.id],
	}),
	headSnapshot: one(documents, {
		fields: [documents.headSnapshotId],
		references: [documents.id],
		relationName: "head_snapshot",
	}),
	user: one(user, { fields: [documents.userId], references: [user.id] }),
	versions: many(documentVersions),
}));

export const documentVersionRelations = relations(
	documentVersions,
	({ one }) => ({
		document: one(documents, {
			fields: [documentVersions.documentId],
			references: [documents.id],
		}),
	}),
);
