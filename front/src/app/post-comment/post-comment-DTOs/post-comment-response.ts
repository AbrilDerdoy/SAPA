export interface PostCommentResponse {
    commentId: number
    postId: number
    authorId: number
    authorName: string
    content: string
    createdAt: string
    updatedAt: string | null
}
