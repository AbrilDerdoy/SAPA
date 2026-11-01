import { FdaDrugDetails } from "./fda-drug-details";

export interface FdaResult {
    openfda?: FdaDrugDetails;
    purpose?: string[];
    indications_and_usages?: string[];
    warnings?: string[];
    dosage_and_administration?: string[];
}