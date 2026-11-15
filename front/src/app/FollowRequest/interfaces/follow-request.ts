import { FollowRequestStatus } from "./follow-request-status";
import { PatientSummary } from "./patient-summary";
import { FollowRequestDoctor } from "./follow-request-doctor";

export interface FollowRequest {
    id: number;
    patient: PatientSummary | null;
    doctorFollower: FollowRequestDoctor | null;
    doctor: FollowRequestDoctor;
    status: FollowRequestStatus;
    requestedAt: string;
    respondedAt: string | null;
}