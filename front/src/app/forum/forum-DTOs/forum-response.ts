export interface ForumResponse {
    forumId: number
    createdById: number
    createdByName: string
    title: string
    content: string
    active: boolean
    imageUrl: string | null
    createdAt: string
}
