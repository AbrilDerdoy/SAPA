import { ReportedContentType } from "./reported-content-type.type"

export interface ReportResponse {
    reportId: number
    reportedById: number
    reportedByName: string
    contentType: ReportedContentType
    contentId: number
    reason: string
    createdAt: string
    reviewed: boolean
}
