export interface Feedback {
    kind: 'ok' | 'error';
    text: string;
}