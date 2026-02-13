import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import * as z from "zod";

export const medicines = sqliteTable("medicines", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	category: text("category"),
	nameOfMedicine: text("name_of_medicine"),
	emaProductNumber: text("ema_product_number"),
	medicineStatus: text("medicine_status"),
	opinionStatus: text("opinion_status"),
	latestProcedure: text("latest_procedure_affecting_product_information"),
	inn: text("international_non_proprietary_name_inn_common_name"),
	activeSubstance: text("active_substance"),
	therapeuticArea: text("therapeutic_area_mesh"),
	speciesVeterinary: text("species_veterinary"),
	patientSafety: text("patient_safety"),
	atcCodeHuman: text("atc_code_human"),
	atcVetCode: text("atcvet_code_veterinary"),
	pharmacotherapeuticGroupHuman: text("pharmacotherapeutic_group_human"),
	pharmacotherapeuticGroupVet: text("pharmacotherapeutic_group_veterinary"),
	therapeuticIndication: text("therapeutic_indication"),
	acceleratedAssessment: text("accelerated_assessment"),
	additionalMonitoring: text("additional_monitoring"),
	advancedTherapy: text("advanced_therapy"),
	biosimilar: text("biosimilar"),
	conditionalApproval: text("conditional_approval"),
	exceptionalCircumstances: text("exceptional_circumstances"),
	genericOrHybrid: text("generic_or_hybrid"),
	orphanMedicine: text("orphan_medicine"),
	primePriorityMedicine: text("prime_priority_medicine"),
	marketingAuthorisationDeveloper: text(
		"marketing_authorisation_developer_applicant_holder",
	),
	commissionDecisionDate: text("european_commission_decision_date"),
	startRollingReviewDate: text("start_of_rolling_review_date"),
	startEvaluationDate: text("start_of_evaluation_date"),
	opinionAdoptedDate: text("opinion_adopted_date"),
	withdrawalApplicationDate: text("withdrawal_of_application_date"),
	marketingAuthorisationDate: text("marketing_authorisation_date"),
	refusalMarketingAuthorisationDate: text(
		"refusal_of_marketing_authorisation_date",
	),
	withdrawalExpiryRevocationDate: text(
		"withdrawal_expiry_revocation_lapse_of_marketing_authorisation_date",
	),
	suspensionMarketingAuthorisationDate: text(
		"suspension_of_marketing_authorisation_date",
	),
	revisionNumber: text("revision_number"),
	firstPublishedDate: text("first_published_date"),
	lastUpdatedDate: text("last_updated_date"),
	medicineUrl: text("medicine_url"),
});

export const selectMedicineSchema = createSelectSchema(medicines);
export const insertMedicineSchema = createInsertSchema(medicines);

export type Medicine = z.infer<typeof selectMedicineSchema>;
export type InsertMedicine = z.infer<typeof insertMedicineSchema>;
