PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_medicines` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`category` text,
	`name_of_medicine` text,
	`ema_product_number` text,
	`medicine_status` text,
	`opinion_status` text,
	`latest_procedure_affecting_product_information` text,
	`international_non_proprietary_name_inn_common_name` text,
	`active_substance` text,
	`therapeutic_area_mesh` text,
	`species_veterinary` text,
	`patient_safety` text,
	`atc_code_human` text,
	`atcvet_code_veterinary` text,
	`pharmacotherapeutic_group_human` text,
	`pharmacotherapeutic_group_veterinary` text,
	`therapeutic_indication` text,
	`accelerated_assessment` text,
	`additional_monitoring` text,
	`advanced_therapy` text,
	`biosimilar` text,
	`conditional_approval` text,
	`exceptional_circumstances` text,
	`generic_or_hybrid` text,
	`orphan_medicine` text,
	`prime_priority_medicine` text,
	`marketing_authorisation_developer_applicant_holder` text,
	`european_commission_decision_date` text,
	`start_of_rolling_review_date` text,
	`start_of_evaluation_date` text,
	`opinion_adopted_date` text,
	`withdrawal_of_application_date` text,
	`marketing_authorisation_date` text,
	`refusal_of_marketing_authorisation_date` text,
	`withdrawal_expiry_revocation_lapse_of_marketing_authorisation_date` text,
	`suspension_of_marketing_authorisation_date` text,
	`revision_number` text,
	`first_published_date` text,
	`last_updated_date` text,
	`medicine_url` text
);
--> statement-breakpoint
INSERT INTO `__new_medicines`("id", "category", "name_of_medicine", "ema_product_number", "medicine_status", "opinion_status", "latest_procedure_affecting_product_information", "international_non_proprietary_name_inn_common_name", "active_substance", "therapeutic_area_mesh", "species_veterinary", "patient_safety", "atc_code_human", "atcvet_code_veterinary", "pharmacotherapeutic_group_human", "pharmacotherapeutic_group_veterinary", "therapeutic_indication", "accelerated_assessment", "additional_monitoring", "advanced_therapy", "biosimilar", "conditional_approval", "exceptional_circumstances", "generic_or_hybrid", "orphan_medicine", "prime_priority_medicine", "marketing_authorisation_developer_applicant_holder", "european_commission_decision_date", "start_of_rolling_review_date", "start_of_evaluation_date", "opinion_adopted_date", "withdrawal_of_application_date", "marketing_authorisation_date", "refusal_of_marketing_authorisation_date", "withdrawal_expiry_revocation_lapse_of_marketing_authorisation_date", "suspension_of_marketing_authorisation_date", "revision_number", "first_published_date", "last_updated_date", "medicine_url") SELECT "id", "category", "name_of_medicine", "ema_product_number", "medicine_status", "opinion_status", "latest_procedure_affecting_product_information", "international_non_proprietary_name_inn_common_name", "active_substance", "therapeutic_area_mesh", "species_veterinary", "patient_safety", "atc_code_human", "atcvet_code_veterinary", "pharmacotherapeutic_group_human", "pharmacotherapeutic_group_veterinary", "therapeutic_indication", "accelerated_assessment", "additional_monitoring", "advanced_therapy", "biosimilar", "conditional_approval", "exceptional_circumstances", "generic_or_hybrid", "orphan_medicine", "prime_priority_medicine", "marketing_authorisation_developer_applicant_holder", "european_commission_decision_date", "start_of_rolling_review_date", "start_of_evaluation_date", "opinion_adopted_date", "withdrawal_of_application_date", "marketing_authorisation_date", "refusal_of_marketing_authorisation_date", "withdrawal_expiry_revocation_lapse_of_marketing_authorisation_date", "suspension_of_marketing_authorisation_date", "revision_number", "first_published_date", "last_updated_date", "medicine_url" FROM `medicines`;--> statement-breakpoint
DROP TABLE `medicines`;--> statement-breakpoint
ALTER TABLE `__new_medicines` RENAME TO `medicines`;--> statement-breakpoint
PRAGMA foreign_keys=ON;