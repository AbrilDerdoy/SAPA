import { ReportedContentType } from "./reported-content-type.type"

export interface CreateReportRequest {
    contentType: ReportedContentType
    contentId: number
    reason: string
}
