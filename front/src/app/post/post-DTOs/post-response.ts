import { PostAttachmentResponse } from "./post-attachment-response"

export interface PostResponse {
    postId: number
    forumId: number
    forumTitle: string
    authorId: number
    authorName: string
    title: string
    content: string
    active: boolean
    attachments: PostAttachmentResponse[]
    createdAt: string
}
