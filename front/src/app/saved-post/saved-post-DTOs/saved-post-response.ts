import { PostResponse } from "../../post/post-DTOs/post-response"

export interface SavedPostResponse {
    savedPostId: number
    post: PostResponse
    savedAt: string
}
