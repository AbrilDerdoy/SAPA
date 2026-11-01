import { FollowRequestStatus } from "./follow-request-status";
import { PatientSummary } from "./patient-summary";

export interface FollowRequest {
    id: number;
    patient: PatientSummary;
    status: FollowRequestStatus;
    requestedAt: string;
    respondedAt: string | null;
}