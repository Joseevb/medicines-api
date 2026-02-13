// server.ts
import { Elysia, t } from "elysia";
import { swagger } from "@elysiajs/swagger";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import { and, or, like, sql, count } from "drizzle-orm";
import { medicines } from "./db/schema";
import { Effect } from "effect";

// Error types
class DatabaseError {
	readonly _tag = "DatabaseError";
	constructor(readonly error: unknown) {}
}

// Mapping of camelCase field names to Drizzle column objects
const fieldMapping: Record<string, any> = {
	category: medicines.category,
	nameOfMedicine: medicines.nameOfMedicine,
	emaProductNumber: medicines.emaProductNumber,
	medicineStatus: medicines.medicineStatus,
	opinionStatus: medicines.opinionStatus,
	latestProcedure: medicines.latestProcedure,
	inn: medicines.inn,
	activeSubstance: medicines.activeSubstance,
	therapeuticArea: medicines.therapeuticArea,
	speciesVeterinary: medicines.speciesVeterinary,
	patientSafety: medicines.patientSafety,
	atcCodeHuman: medicines.atcCodeHuman,
	atcVetCode: medicines.atcVetCode,
	pharmacotherapeuticGroupHuman: medicines.pharmacotherapeuticGroupHuman,
	pharmacotherapeuticGroupVet: medicines.pharmacotherapeuticGroupVet,
	therapeuticIndication: medicines.therapeuticIndication,
	acceleratedAssessment: medicines.acceleratedAssessment,
	additionalMonitoring: medicines.additionalMonitoring,
	advancedTherapy: medicines.advancedTherapy,
	biosimilar: medicines.biosimilar,
	conditionalApproval: medicines.conditionalApproval,
	exceptionalCircumstances: medicines.exceptionalCircumstances,
	genericOrHybrid: medicines.genericOrHybrid,
	orphanMedicine: medicines.orphanMedicine,
	primePriorityMedicine: medicines.primePriorityMedicine,
	marketingAuthorisationDeveloper: medicines.marketingAuthorisationDeveloper,
	commissionDecisionDate: medicines.commissionDecisionDate,
	startRollingReviewDate: medicines.startRollingReviewDate,
	startEvaluationDate: medicines.startEvaluationDate,
	opinionAdoptedDate: medicines.opinionAdoptedDate,
	withdrawalApplicationDate: medicines.withdrawalApplicationDate,
	marketingAuthorisationDate: medicines.marketingAuthorisationDate,
	refusalMarketingAuthorisationDate:
		medicines.refusalMarketingAuthorisationDate,
	withdrawalExpiryRevocationDate: medicines.withdrawalExpiryRevocationDate,
	suspensionMarketingAuthorisationDate:
		medicines.suspensionMarketingAuthorisationDate,
	revisionNumber: medicines.revisionNumber,
	firstPublishedDate: medicines.firstPublishedDate,
	lastUpdatedDate: medicines.lastUpdatedDate,
	medicineUrl: medicines.medicineUrl,
};

// Reserved parameter names
const reservedParams = new Set([
	"page",
	"pageSize",
	"search",
	"marketingAuthorisationDateFrom",
	"marketingAuthorisationDateTo",
	"lastUpdatedDateFrom",
	"lastUpdatedDateTo",
]);

// Build dynamic where clause
const buildWhereClause = (queryParams: Record<string, any>) =>
	Effect.sync(() => {
		const conditions = [];

		// Dynamic field searches
		for (const [key, value] of Object.entries(queryParams)) {
			if (reservedParams.has(key) || !value) {
				continue;
			}

			const field = fieldMapping[key];
			if (field) {
				conditions.push(like(field, `%${value}%`));
			}
		}

		// Date range filters
		if (queryParams.marketingAuthorisationDateFrom) {
			conditions.push(
				sql`${medicines.marketingAuthorisationDate} >= ${queryParams.marketingAuthorisationDateFrom}`,
			);
		}
		if (queryParams.marketingAuthorisationDateTo) {
			conditions.push(
				sql`${medicines.marketingAuthorisationDate} <= ${queryParams.marketingAuthorisationDateTo}`,
			);
		}
		if (queryParams.lastUpdatedDateFrom) {
			conditions.push(
				sql`${medicines.lastUpdatedDate} >= ${queryParams.lastUpdatedDateFrom}`,
			);
		}
		if (queryParams.lastUpdatedDateTo) {
			conditions.push(
				sql`${medicines.lastUpdatedDate} <= ${queryParams.lastUpdatedDateTo}`,
			);
		}

		// Global search
		if (queryParams.search) {
			const searchTerm = `%${queryParams.search}%`;
			conditions.push(
				or(
					like(medicines.nameOfMedicine, searchTerm),
					like(medicines.inn, searchTerm),
					like(medicines.activeSubstance, searchTerm),
					like(medicines.therapeuticArea, searchTerm),
					like(medicines.therapeuticIndication, searchTerm),
					like(medicines.marketingAuthorisationDeveloper, searchTerm),
					like(medicines.emaProductNumber, searchTerm),
				),
			);
		}

		return conditions.length > 0 ? and(...conditions) : undefined;
	});

// Get total count
const getTotalCount = (db: BunSQLiteDatabase, whereClause: any) =>
	Effect.tryPromise({
		try: async () => {
			const res = await db
				.select({ total: count() })
				.from(medicines)
				.where(whereClause);
			return res[0]?.total;
		},
		catch: (error) => new DatabaseError(error),
	});

// Get paginated data
const getPaginatedData = (
	db: BunSQLiteDatabase,
	whereClause: any,
	page: number,
	pageSize: number,
) =>
	Effect.tryPromise({
		try: () => {
			const offset = (page - 1) * pageSize;
			return db
				.select()
				.from(medicines)
				.where(whereClause)
				.limit(pageSize)
				.offset(offset);
		},
		catch: (error) => new DatabaseError(error),
	});

// HTTP Error responses
class HTTPError extends Error {
	constructor(
		public status: number,
		message: string,
	) {
		super(message);
	}
}

// Create the API
export function createMedicineAPI(db: BunSQLiteDatabase) {
	const app = new Elysia()
		.use(
			swagger({
				autoDarkMode: true,
				provider: "scalar",
				path: "/api-docs",
				documentation: {
					info: {
						title: "Medicines API",
						version: "1.0.0",
						description:
							"API for searching and retrieving medicine information from EMA database",
					},
					tags: [
						{ name: "Health", description: "Health check endpoints" },
						{ name: "Medicines", description: "Medicine data endpoints" },
						{ name: "Statistics", description: "Statistical data endpoints" },
					],
					components: {
						schemas: {
							Medicine: {
								type: "object",
								properties: {
									id: { type: "integer", format: "int32" },
									category: { type: "string" },
									nameOfMedicine: { type: "string" },
									emaProductNumber: { type: "string", nullable: true },
									medicineStatus: { type: "string", nullable: true },
									opinionStatus: { type: "string", nullable: true },
									latestProcedure: { type: "string", nullable: true },
									inn: { type: "string" },
									activeSubstance: { type: "string" },
									therapeuticArea: { type: "string", nullable: true },
									speciesVeterinary: { type: "string", nullable: true },
									patientSafety: { type: "string", nullable: true },
									atcCodeHuman: { type: "string", nullable: true },
									atcVetCode: { type: "string", nullable: true },
									pharmacotherapeuticGroupHuman: {
										type: "string",
										nullable: true,
									},
									pharmacotherapeuticGroupVet: {
										type: "string",
										nullable: true,
									},
									therapeuticIndication: { type: "string", nullable: true },
									acceleratedAssessment: { type: "string", nullable: true },
									additionalMonitoring: { type: "string", nullable: true },
									advancedTherapy: { type: "string", nullable: true },
									biosimilar: { type: "string", nullable: true },
									conditionalApproval: { type: "string", nullable: true },
									exceptionalCircumstances: { type: "string", nullable: true },
									genericOrHybrid: { type: "string", nullable: true },
									orphanMedicine: { type: "string", nullable: true },
									primePriorityMedicine: { type: "string", nullable: true },
									marketingAuthorisationDeveloper: { type: "string" },
									commissionDecisionDate: { type: "string", nullable: true },
									startRollingReviewDate: { type: "string", nullable: true },
									startEvaluationDate: { type: "string", nullable: true },
									opinionAdoptedDate: { type: "string", nullable: true },
									withdrawalApplicationDate: { type: "string", nullable: true },
									marketingAuthorisationDate: {
										type: "string",
										nullable: true,
									},
									refusalMarketingAuthorisationDate: {
										type: "string",
										nullable: true,
									},
									withdrawalExpiryRevocationDate: {
										type: "string",
										nullable: true,
									},
									suspensionMarketingAuthorisationDate: {
										type: "string",
										nullable: true,
									},
									revisionNumber: { type: "string", nullable: true },
									firstPublishedDate: { type: "string", nullable: true },
									lastUpdatedDate: { type: "string", nullable: true },
									medicineUrl: { type: "string", nullable: true },
								},
								required: [
									"id",
									"category",
									"nameOfMedicine",
									"inn",
									"activeSubstance",
									"marketingAuthorisationDeveloper",
								],
							},
							PaginationMetadata: {
								type: "object",
								properties: {
									page: { type: "integer", format: "int32" },
									pageSize: { type: "integer", format: "int32" },
									totalRecords: { type: "integer", format: "int32" },
									totalPages: { type: "integer", format: "int32" },
									hasNextPage: { type: "boolean" },
									hasPreviousPage: { type: "boolean" },
								},
								required: [
									"page",
									"pageSize",
									"totalRecords",
									"totalPages",
									"hasNextPage",
									"hasPreviousPage",
								],
							},
							PaginatedMedicinesResponse: {
								type: "object",
								properties: {
									data: {
										type: "array",
										items: { $ref: "#/components/schemas/Medicine" },
									},
									pagination: {
										$ref: "#/components/schemas/PaginationMetadata",
									},
								},
								required: ["data", "pagination"],
							},
							FieldValuesResponse: {
								type: "object",
								properties: {
									field: { type: "string" },
									values: {
										type: "array",
										items: { type: "string" },
									},
								},
								required: ["field", "values"],
							},
							StatsResponse: {
								type: "object",
								properties: {
									totalMedicines: { type: "integer", format: "int32" },
									byCategory: {
										type: "object",
										properties: {
											human: { type: "integer", format: "int32" },
											veterinary: { type: "integer", format: "int32" },
										},
										required: ["human", "veterinary"],
									},
									byStatus: {
										type: "object",
										properties: {
											authorised: { type: "integer", format: "int32" },
											withdrawn: { type: "integer", format: "int32" },
											refused: { type: "integer", format: "int32" },
										},
										required: ["authorised", "withdrawn", "refused"],
									},
								},
								required: ["totalMedicines", "byCategory", "byStatus"],
							},
							HealthResponse: {
								type: "object",
								properties: {
									status: { type: "string" },
									timestamp: { type: "string", format: "date-time" },
								},
								required: ["status", "timestamp"],
							},
							ErrorResponse: {
								type: "object",
								properties: {
									error: { type: "string" },
								},
								required: ["error"],
							},
						},
					},
				},
			}),
		)
		.onError(({ error, set }) => {
			if (error instanceof HTTPError) {
				set.status = error.status;
				return { error: error.message };
			}

			console.error("Unhandled error:", error);
			set.status = 500;
			return { error: "Internal server error" };
		})
		.get(
			"/health",
			() => ({
				status: "ok",
				timestamp: new Date().toISOString(),
			}),
			{
				detail: {
					tags: ["Health"],
					summary: "Health check",
					description: "Check if the API is running",
					responses: {
						200: {
							description: "API is healthy",
							content: {
								"application/json": {
									schema: { $ref: "#/components/schemas/HealthResponse" },
								},
							},
						},
					},
				},
			},
		)
		.get(
			"/medicines",
			async ({ query }) => {
				const effect = Effect.gen(function* (_) {
					const page = query.page ?? 1;
					const pageSize = query.pageSize ?? 50;

					const whereClause = yield* _(buildWhereClause(query));
					const total = yield* _(getTotalCount(db, whereClause));
					const data = yield* _(
						getPaginatedData(db, whereClause, page, pageSize),
					);

					const totalPages = total ? Math.ceil(total / pageSize) : 1;

					return {
						data,
						pagination: {
							page,
							pageSize,
							totalRecords: total,
							totalPages,
							hasNextPage: page < totalPages,
							hasPreviousPage: page > 1,
						},
					};
				}).pipe(
					Effect.catchAll((err) => {
						if (err instanceof DatabaseError) {
							console.error("Database error:", err.error);
							return Effect.fail(new HTTPError(500, "Database error occurred"));
						}
						return Effect.fail(new HTTPError(500, "Internal server error"));
					}),
				);

				return Effect.runPromise(effect);
			},
			{
				query: t.Object({
					page: t.Optional(t.Integer({ minimum: 1, format: "int32" })),
					pageSize: t.Optional(
						t.Integer({
							minimum: 1,
							maximum: 100,
							format: "int32",
						}),
					),
					search: t.Optional(t.String()),
					category: t.Optional(t.String()),
					nameOfMedicine: t.Optional(t.String()),
					emaProductNumber: t.Optional(t.String()),
					medicineStatus: t.Optional(t.String()),
					opinionStatus: t.Optional(t.String()),
					latestProcedure: t.Optional(t.String()),
					inn: t.Optional(t.String()),
					activeSubstance: t.Optional(t.String()),
					therapeuticArea: t.Optional(t.String()),
					speciesVeterinary: t.Optional(t.String()),
					patientSafety: t.Optional(t.String()),
					atcCodeHuman: t.Optional(t.String()),
					atcVetCode: t.Optional(t.String()),
					pharmacotherapeuticGroupHuman: t.Optional(t.String()),
					pharmacotherapeuticGroupVet: t.Optional(t.String()),
					therapeuticIndication: t.Optional(t.String()),
					acceleratedAssessment: t.Optional(t.String()),
					additionalMonitoring: t.Optional(t.String()),
					advancedTherapy: t.Optional(t.String()),
					biosimilar: t.Optional(t.String()),
					conditionalApproval: t.Optional(t.String()),
					exceptionalCircumstances: t.Optional(t.String()),
					genericOrHybrid: t.Optional(t.String()),
					orphanMedicine: t.Optional(t.String()),
					primePriorityMedicine: t.Optional(t.String()),
					marketingAuthorisationDeveloper: t.Optional(t.String()),
					marketingAuthorisationDateFrom: t.Optional(t.String()),
					marketingAuthorisationDateTo: t.Optional(t.String()),
					lastUpdatedDateFrom: t.Optional(t.String()),
					lastUpdatedDateTo: t.Optional(t.String()),
				}),
				detail: {
					tags: ["Medicines"],
					summary: "Get medicines with pagination and filtering",
					parameters: [
						{
							name: "page",
							in: "query",
							description: "Page number",
							required: false,
							schema: { type: "integer", format: "int32", minimum: 1 },
						},
						{
							name: "pageSize",
							in: "query",
							description: "Number of items per page",
							required: false,
							schema: {
								type: "integer",
								format: "int32",
								minimum: 1,
								maximum: 100,
							},
						},
						{
							name: "search",
							in: "query",
							description: "Global search term across multiple fields",
							required: false,
							schema: { type: "string" },
						},
						{
							name: "category",
							in: "query",
							description: "Filter by medicine category",
							required: false,
							schema: { type: "string" },
						},
						{
							name: "nameOfMedicine",
							in: "query",
							description: "Filter by medicine name",
							required: false,
							schema: { type: "string" },
						},
						{
							name: "emaProductNumber",
							in: "query",
							description: "Filter by EMA product number",
							required: false,
							schema: { type: "string" },
						},
						{
							name: "medicineStatus",
							in: "query",
							description: "Filter by medicine status",
							required: false,
							schema: { type: "string" },
						},
						{
							name: "opinionStatus",
							in: "query",
							description: "Filter by opinion status",
							required: false,
							schema: { type: "string" },
						},
						{
							name: "latestProcedure",
							in: "query",
							description: "Filter by latest procedure",
							required: false,
							schema: { type: "string" },
						},
						{
							name: "inn",
							in: "query",
							description: "Filter by International Nonproprietary Name",
							required: false,
							schema: { type: "string" },
						},
						{
							name: "activeSubstance",
							in: "query",
							description: "Filter by active substance",
							required: false,
							schema: { type: "string" },
						},
						{
							name: "therapeuticArea",
							in: "query",
							description: "Filter by therapeutic area",
							required: false,
							schema: { type: "string" },
						},
						{
							name: "speciesVeterinary",
							in: "query",
							description: "Filter by veterinary species",
							required: false,
							schema: { type: "string" },
						},
						{
							name: "patientSafety",
							in: "query",
							description: "Filter by patient safety information",
							required: false,
							schema: { type: "string" },
						},
						{
							name: "atcCodeHuman",
							in: "query",
							description: "Filter by ATC code for humans",
							required: false,
							schema: { type: "string" },
						},
						{
							name: "atcVetCode",
							in: "query",
							description: "Filter by ATC code for veterinary",
							required: false,
							schema: { type: "string" },
						},
						{
							name: "pharmacotherapeuticGroupHuman",
							in: "query",
							description: "Filter by pharmacotherapeutic group for humans",
							required: false,
							schema: { type: "string" },
						},
						{
							name: "pharmacotherapeuticGroupVet",
							in: "query",
							description: "Filter by pharmacotherapeutic group for veterinary",
							required: false,
							schema: { type: "string" },
						},
						{
							name: "therapeuticIndication",
							in: "query",
							description: "Filter by therapeutic indication",
							required: false,
							schema: { type: "string" },
						},
						{
							name: "acceleratedAssessment",
							in: "query",
							description: "Filter by accelerated assessment status",
							required: false,
							schema: { type: "string" },
						},
						{
							name: "additionalMonitoring",
							in: "query",
							description: "Filter by additional monitoring status",
							required: false,
							schema: { type: "string" },
						},
						{
							name: "advancedTherapy",
							in: "query",
							description: "Filter by advanced therapy status",
							required: false,
							schema: { type: "string" },
						},
						{
							name: "biosimilar",
							in: "query",
							description: "Filter by biosimilar status",
							required: false,
							schema: { type: "string" },
						},
						{
							name: "conditionalApproval",
							in: "query",
							description: "Filter by conditional approval status",
							required: false,
							schema: { type: "string" },
						},
						{
							name: "exceptionalCircumstances",
							in: "query",
							description: "Filter by exceptional circumstances status",
							required: false,
							schema: { type: "string" },
						},
						{
							name: "genericOrHybrid",
							in: "query",
							description: "Filter by generic or hybrid status",
							required: false,
							schema: { type: "string" },
						},
						{
							name: "orphanMedicine",
							in: "query",
							description: "Filter by orphan medicine status",
							required: false,
							schema: { type: "string" },
						},
						{
							name: "primePriorityMedicine",
							in: "query",
							description: "Filter by PRIME priority medicine status",
							required: false,
							schema: { type: "string" },
						},
						{
							name: "marketingAuthorisationDeveloper",
							in: "query",
							description: "Filter by marketing authorisation developer",
							required: false,
							schema: { type: "string" },
						},
						{
							name: "marketingAuthorisationDateFrom",
							in: "query",
							description:
								"Filter by marketing authorisation date from (inclusive)",
							required: false,
							schema: { type: "string", format: "date" },
						},
						{
							name: "marketingAuthorisationDateTo",
							in: "query",
							description:
								"Filter by marketing authorisation date to (inclusive)",
							required: false,
							schema: { type: "string", format: "date" },
						},
						{
							name: "lastUpdatedDateFrom",
							in: "query",
							description: "Filter by last updated date from (inclusive)",
							required: false,
							schema: { type: "string", format: "date" },
						},
						{
							name: "lastUpdatedDateTo",
							in: "query",
							description: "Filter by last updated date to (inclusive)",
							required: false,
							schema: { type: "string", format: "date" },
						},
					],
					description:
						"Retrieve a paginated list of medicines with optional filtering by any field. All field names should be in camelCase.",
					responses: {
						200: {
							description: "Paginated list of medicines",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/PaginatedMedicinesResponse",
									},
								},
							},
						},
						500: {
							description: "Server error",
							content: {
								"application/json": {
									schema: { $ref: "#/components/schemas/ErrorResponse" },
								},
							},
						},
					},
				},
			},
		)
		.get(
			"/medicines/stats",
			async () => {
				const effect = Effect.gen(function* (_) {
					const [stats, categoryStats, statusStats] = yield* _(
						Effect.all(
							[
								Effect.tryPromise({
									try: () =>
										db
											.select({ total: count() })
											.from(medicines)
											.then((r) => r[0]),
									catch: (err) => new DatabaseError(err),
								}),
								Effect.tryPromise({
									try: () =>
										db
											.select({
												humanCount: sql<number>`COUNT(CASE WHEN ${medicines.category} = 'Human' THEN 1 END)`,
												veterinaryCount: sql<number>`COUNT(CASE WHEN ${medicines.category} = 'Veterinary' THEN 1 END)`,
											})
											.from(medicines)
											.then((r) => r[0]),
									catch: (err) => new DatabaseError(err),
								}),
								Effect.tryPromise({
									try: () =>
										db
											.select({
												authorisedCount: sql<number>`COUNT(CASE WHEN ${medicines.medicineStatus} = 'Authorised' THEN 1 END)`,
												withdrawnCount: sql<number>`COUNT(CASE WHEN ${medicines.medicineStatus} LIKE '%withdrawn%' THEN 1 END)`,
												refusedCount: sql<number>`COUNT(CASE WHEN ${medicines.medicineStatus} LIKE '%refused%' THEN 1 END)`,
											})
											.from(medicines)
											.then((r) => r[0]),
									catch: (err) => new DatabaseError(err),
								}),
							],
							{ concurrency: "unbounded" },
						),
					);

					return {
						totalMedicines: stats.total,
						byCategory: {
							human: categoryStats.humanCount,
							veterinary: categoryStats.veterinaryCount,
						},
						byStatus: {
							authorised: statusStats.authorisedCount,
							withdrawn: statusStats.withdrawnCount,
							refused: statusStats.refusedCount,
						},
					};
				}).pipe(
					Effect.catchAll((err) => {
						if (err instanceof DatabaseError) {
							console.error("Database error:", err.error);
							return Effect.fail(new HTTPError(500, "Database error occurred"));
						}
						return Effect.fail(new HTTPError(500, "Internal server error"));
					}),
				);

				return Effect.runPromise(effect);
			},
			{
				detail: {
					tags: ["Statistics"],
					summary: "Get statistics",
					description: "Get overall statistics about medicines in the database",
					responses: {
						200: {
							description: "Statistics about medicines",
							content: {
								"application/json": {
									schema: { $ref: "#/components/schemas/StatsResponse" },
								},
							},
						},
						500: {
							description: "Server error",
							content: {
								"application/json": {
									schema: { $ref: "#/components/schemas/ErrorResponse" },
								},
							},
						},
					},
				},
			},
		)
		.get(
			"/medicines/fields/:fieldName",
			async ({ params }) => {
				const effect = Effect.gen(function* (_) {
					const field = fieldMapping[params.fieldName];

					if (!field) {
						return yield* _(
							Effect.fail(new HTTPError(400, "Invalid field name")),
						);
					}

					const results = yield* _(
						Effect.tryPromise({
							try: () =>
								db
									.selectDistinct({ value: field })
									.from(medicines)
									.where(sql`${field} IS NOT NULL AND ${field} != ''`)
									.orderBy(field),
							catch: (err) => new DatabaseError(err),
						}),
					);

					return {
						field: params.fieldName,
						values: results.map((r) => r.value),
					};
				}).pipe(
					Effect.catchAll((err) => {
						if (err instanceof HTTPError) {
							return Effect.fail(err);
						}
						if (err instanceof DatabaseError) {
							console.error("Database error:", err.error);
							return Effect.fail(new HTTPError(500, "Database error occurred"));
						}
						return Effect.fail(new HTTPError(500, "Internal server error"));
					}),
				);

				return Effect.runPromise(effect);
			},
			{
				params: t.Object({
					fieldName: t.String(),
				}),
				detail: {
					tags: ["Medicines"],
					summary: "Get unique values for a field",
					description:
						"Retrieve all unique values for a specific field (useful for dropdowns and filters)",
					responses: {
						200: {
							description: "List of unique values",
							content: {
								"application/json": {
									schema: { $ref: "#/components/schemas/FieldValuesResponse" },
								},
							},
						},
						400: {
							description: "Invalid field name",
							content: {
								"application/json": {
									schema: { $ref: "#/components/schemas/ErrorResponse" },
								},
							},
						},
						500: {
							description: "Server error",
							content: {
								"application/json": {
									schema: { $ref: "#/components/schemas/ErrorResponse" },
								},
							},
						},
					},
				},
			},
		)
		.get(
			"/medicines/:id",
			async ({ params }) => {
				const effect = Effect.gen(function* (_) {
					const numId = parseInt(params.id);

					if (isNaN(numId)) {
						return yield* _(Effect.fail(new HTTPError(400, "Invalid ID")));
					}

					const results = yield* _(
						Effect.tryPromise({
							try: () =>
								db
									.select()
									.from(medicines)
									.where(sql`${medicines.id} = ${numId}`)
									.limit(1),
							catch: (err) => new DatabaseError(err),
						}),
					);

					if (results.length === 0) {
						return yield* _(
							Effect.fail(new HTTPError(404, "Medicine not found")),
						);
					}

					return results[0];
				}).pipe(
					Effect.catchAll((err) => {
						if (err instanceof HTTPError) {
							return Effect.fail(err);
						}
						if (err instanceof DatabaseError) {
							console.error("Database error:", err.error);
							return Effect.fail(new HTTPError(500, "Database error occurred"));
						}
						return Effect.fail(new HTTPError(500, "Internal server error"));
					}),
				);

				return Effect.runPromise(effect);
			},
			{
				params: t.Object({
					id: t.String(),
				}),
				detail: {
					tags: ["Medicines"],
					summary: "Get medicine by ID",
					description: "Retrieve a single medicine by its ID",
					responses: {
						200: {
							description: "Medicine details",
							content: {
								"application/json": {
									schema: { $ref: "#/components/schemas/Medicine" },
								},
							},
						},
						400: {
							description: "Invalid ID",
							content: {
								"application/json": {
									schema: { $ref: "#/components/schemas/ErrorResponse" },
								},
							},
						},
						404: {
							description: "Medicine not found",
							content: {
								"application/json": {
									schema: { $ref: "#/components/schemas/ErrorResponse" },
								},
							},
						},
						500: {
							description: "Server error",
							content: {
								"application/json": {
									schema: { $ref: "#/components/schemas/ErrorResponse" },
								},
							},
						},
					},
				},
			},
		);

	return app;
}

// Start the server
export function startServer(db: BunSQLiteDatabase, port = 4000) {
	const app = createMedicineAPI(db);

	app.listen(port);

	console.log(`🚀 Server running at http://localhost:${port}`);
	console.log(`📚 OpenAPI documentation at http://localhost:${port}/api-docs`);
	console.log(`📄 OpenAPI JSON at http://localhost:${port}/api-docs/json`);
	console.log(`
Available endpoints:
  GET  /health
  GET  /medicines?page=1&pageSize=50&search=...
  GET  /medicines?category=Human&therapeuticArea=Carcinoma
  GET  /medicines/:id
  GET  /medicines/fields/:fieldName
  GET  /medicines/stats
	`);

	return app;
}
