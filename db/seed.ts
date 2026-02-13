import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import { insertMedicineSchema, medicines } from "./schema";
import Bun from "bun";
import { parse } from "csv-parse/sync";

import { Effect, Console } from "effect";

// Define error types
class CSVReadError {
	readonly _tag = "CSVReadError";
	constructor(readonly error: unknown) {}
}

class CSVParseError {
	readonly _tag = "CSVParseError";
	constructor(readonly error: unknown) {}
}

class ValidationError {
	readonly _tag = "ValidationError";
	constructor(
		readonly error: unknown,
		readonly rowData: Record<string, string>,
	) {}
}

class DatabaseInsertError {
	readonly _tag = "DatabaseInsertError";
	constructor(
		readonly error: unknown,
		readonly rowData: Record<string, string>,
	) {}
}

// CSV to table mapping
const csvToTableMapping: Record<string, string> = {
	category: "category",
	name_of_medicine: "nameOfMedicine",
	ema_product_number: "emaProductNumber",
	medicine_status: "medicineStatus",
	opinion_status: "opinionStatus",
	latest_procedure_affecting_product_information: "latestProcedure",
	"international_non-proprietary_name_inn__common_name": "inn",
	active_substance: "activeSubstance",
	therapeutic_area_mesh: "therapeuticArea",
	species_veterinary: "speciesVeterinary",
	patient_safety: "patientSafety",
	atc_code_human: "atcCodeHuman",
	atcvet_code_veterinary: "atcVetCode",
	pharmacotherapeutic_group_human: "pharmacotherapeuticGroupHuman",
	pharmacotherapeutic_group_veterinary: "pharmacotherapeuticGroupVet",
	therapeutic_indication: "therapeuticIndication",
	accelerated_assessment: "acceleratedAssessment",
	additional_monitoring: "additionalMonitoring",
	advanced_therapy: "advancedTherapy",
	biosimilar: "biosimilar",
	conditional_approval: "conditionalApproval",
	exceptional_circumstances: "exceptionalCircumstances",
	generic_or_hybrid: "genericOrHybrid",
	orphan_medicine: "orphanMedicine",
	"prime:_priority_medicine": "primePriorityMedicine",
	marketing_authorisation_developer__applicant__holder:
		"marketingAuthorisationDeveloper",
	european_commission_decision_date: "commissionDecisionDate",
	start_of_rolling_review_date: "startRollingReviewDate",
	start_of_evaluation_date: "startEvaluationDate",
	opinion_adopted_date: "opinionAdoptedDate",
	withdrawal_of_application_date: "withdrawalApplicationDate",
	marketing_authorisation_date: "marketingAuthorisationDate",
	refusal_of_marketing_authorisation_date: "refusalMarketingAuthorisationDate",
	withdrawal__expiry__revocation__lapse_of_marketing_authorisation_date:
		"withdrawalExpiryRevocationDate",
	suspension_of_marketing_authorisation_date:
		"suspensionMarketingAuthorisationDate",
	revision_number: "revisionNumber",
	first_published_date: "firstPublishedDate",
	last_updated_date: "lastUpdatedDate",
	medicine_url: "medicineUrl",
};

const cleanHeader = (raw: string): string =>
	raw
		.trim()
		.replace(/\n/g, " ")
		.replace(/ +/g, "_")
		.replace(/[()\/]/g, "")
		.toLowerCase();

// Read CSV file
const readCSVFile = (filename: string) =>
	Effect.tryPromise({
		try: () => Bun.file(filename).text(),
		catch: (error) => new CSVReadError(error),
	});

// Parse CSV content
const parseCSV = (content: string) =>
	Effect.try({
		try: () =>
			parse(content, {
				columns: true,
				skip_empty_lines: true,
				trim: true,
			}) as Record<string, string>[],
		catch: (error) => new CSVParseError(error),
	});

// Transform a single row
const transformRow = (row: Record<string, string>) =>
	Effect.sync(() => {
		const insertObj: any = {};

		for (const [rawKey, rawVal] of Object.entries(row)) {
			const cleanKey = cleanHeader(rawKey);
			const tableColumn = csvToTableMapping[cleanKey];

			if (tableColumn) {
				insertObj[tableColumn] = rawVal === "" ? null : rawVal;
			}
		}

		return insertObj;
	});

// Validate row data
const validateRow = (insertObj: any, originalRow: Record<string, string>) =>
	Effect.try({
		try: () => insertMedicineSchema.parse(insertObj),
		catch: (error) => new ValidationError(error, originalRow),
	});

// Insert into database
const insertRow = (
	db: BunSQLiteDatabase,
	validated: any,
	originalRow: Record<string, string>,
) =>
	Effect.tryPromise({
		try: () => db.insert(medicines).values(validated),
		catch: (error) => new DatabaseInsertError(error, originalRow),
	});

// Process a single row (transform, validate, insert)
const processRow = (db: BunSQLiteDatabase, row: Record<string, string>) =>
	Effect.gen(function* (_) {
		const transformed = yield* _(transformRow(row));
		const validated = yield* _(validateRow(transformed, row));
		yield* _(insertRow(db, validated, row));
		return { success: true };
	});

// Process all rows with error collection
const processAllRows = (
	db: BunSQLiteDatabase,
	records: Record<string, string>[],
) =>
	Effect.gen(function* (_) {
		const results = yield* _(
			Effect.forEach(
				records,
				(row) =>
					processRow(db, row).pipe(
						Effect.map(() => ({ success: true, error: null })),
						Effect.catchAll((error) =>
							Effect.succeed({ success: false, error }),
						),
					),
				{ concurrency: "unbounded" },
			),
		);

		const successCount = results.filter((r) => r.success).length;
		const errorCount = results.filter((r) => !r.success).length;
		const errors = results
			.filter((r) => !r.success)
			.map((r) => r.error)
			.filter((e): e is NonNullable<typeof e> => e !== null);

		return { successCount, errorCount, errors };
	});

// Main import function
export const importCSV = (db: BunSQLiteDatabase, filename: string) =>
	Effect.gen(function* (_) {
		yield* _(Console.log(`Reading CSV file: ${filename}`));
		const content = yield* _(readCSVFile(filename));

		yield* _(Console.log("Parsing CSV content..."));
		const records = yield* _(parseCSV(content));

		yield* _(Console.log(`Processing ${records.length} records...`));
		const result = yield* _(processAllRows(db, records));

		yield* _(
			Console.log(
				`Import complete: ${result.successCount} records inserted, ${result.errorCount} errors`,
			),
		);

		// Log errors if any
		if (result.errors.length > 0) {
			yield* _(Console.log("\nErrors encountered:"));
			for (const error of result.errors.slice(0, 5)) {
				// Show first 5 errors
				yield* _(Console.error(error));
			}
			if (result.errors.length > 5) {
				yield* _(
					Console.log(`... and ${result.errors.length - 5} more errors`),
				);
			}
		}

		return result;
	});
