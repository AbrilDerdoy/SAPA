import { Component, effect, input, OnDestroy, output, signal } from '@angular/core';
import { PostResponse } from '../../post-DTOs/post-response';
import { ForumRequest } from '../../../forum/forum-DTOs/forum-request';
import { form, FormField, minLength, required } from '@angular/forms/signals';
import { PostAttachments } from '../post-attachments/post-attachments';

@Component({
  selector: 'app-post-form',
  imports: [FormField, PostAttachments],
  templateUrl: './post-form.html',
  styleUrl: './post-form.css',
})
export class PostForm implements OnDestroy {
  post = input<PostResponse | null>(null)

  save = output<{
    request: ForumRequest
    files: File[]
    removedAttachmentIds: number[]
  }>()
  cancel = output<void>()

  removedAttachmentIds = signal<number[]>([])

  model = signal<ForumRequest>({
    title: '',
    content: ''
  })

  readonly formulario = form(this.model, path => {
    required(path.title, { message: 'El título es obligatorio.' })
    minLength(path.title, 3, { message: 'El título debe tener al menos 3 caracteres.' })
    required(path.content, { message: 'El contenido es obligatorio.' })
  })

  selectedFiles = signal<File[]>([])
  error = signal('')

  private filePreviews = new Map<File, string>()

  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024
  private readonly MAX_FILES = 10

  private readonly ALLOWED_EXTENSIONS = [
    'jpg', 'jpeg', 'png', 'webp', 'gif',
    'pdf', 'doc', 'docx', 'xls', 'xlsx'
  ]

  constructor() {
    effect(() => {
      const currentPost = this.post()

      this.clearFilePreviews()
      this.selectedFiles.set([])
      this.removedAttachmentIds.set([])
      this.error.set('')

      this.model.set({
        title: currentPost?.title ?? '',
        content: currentPost?.content ?? ''
      })
    })
  }

  get isEditing(): boolean {
    return this.post() !== null
  }

  selectFiles(event: Event): void {
    const input = event.target as HTMLInputElement
    const files = Array.from(input.files ?? [])
    const currentFiles = this.selectedFiles()
    const existingCount = (this.post()?.attachments.length ?? 0) - this.removedAttachmentIds().length

    const duplicated = files.find(file =>
      currentFiles.some(existing =>
        existing.name === file.name &&
        existing.size === file.size &&
        existing.lastModified === file.lastModified
      )
    )

    if (duplicated) {
      this.error.set(`${duplicated.name} ya fue seleccionado.`)
      input.value = ''
      return
    }

    if (existingCount + currentFiles.length + files.length > this.MAX_FILES) {
      this.error.set(`Una publicación puede tener un máximo de ${this.MAX_FILES} archivos.`)
      input.value = ''
      return
    }

    const invalidFile = files.find(file => {
      const extension = this.getExtension(file)

      return !this.ALLOWED_EXTENSIONS.includes(extension) || file.size > this.MAX_FILE_SIZE
    })

    if (invalidFile) {
      const extension = this.getExtension(invalidFile)

      if (!this.ALLOWED_EXTENSIONS.includes(extension)) {
        this.error.set(`El formato de ${invalidFile.name} no está permitido.`)
      } else {
        this.error.set(`${invalidFile.name} supera el límite de 10 MB.`)
      }

      input.value = ''
      return
    }

    for (const file of files) {
      if (this.isImageFile(file)) {
        this.filePreviews.set(file, URL.createObjectURL(file))
      }
    }

    this.selectedFiles.update(current => [...current, ...files])
    this.error.set('')
    input.value = ''
  }

  removeSelectedFile(index: number): void {
    const file = this.selectedFiles()[index]

    if (file) {
      this.revokeFilePreview(file)
    }

    this.selectedFiles.update(files =>
      files.filter((_, i) => i !== index)
    )
  }

  getFilePreview(file: File): string {
    return this.filePreviews.get(file) ?? ''
  }

  isImageFile(file: File): boolean {
    return ['jpg', 'jpeg', 'png', 'webp', 'gif']
      .includes(this.getExtension(file))
  }

  getFileExtension(file: File): string {
    return this.getExtension(file).toUpperCase()
  }

  private getExtension(file: File): string {
    return file.name.split('.').pop()?.toLowerCase() ?? ''
  }

  formatFileSize(size: number): string {
    return size < 1024 * 1024
      ? `${(size / 1024).toFixed(1)} KB`
      : `${(size / (1024 * 1024)).toFixed(2)} MB`
  }

  submitForm(): void {
    if (this.formulario().invalid()) {
      this.formulario().markAsTouched()
      return
    }

    this.save.emit({
      request: this.model(),
      files: this.selectedFiles(),
      removedAttachmentIds: this.removedAttachmentIds()
    })
  }

  cancelForm(): void {
    this.cancel.emit()
  }

  private revokeFilePreview(file: File): void {
    const preview = this.filePreviews.get(file)

    if (preview) {
      URL.revokeObjectURL(preview)
      this.filePreviews.delete(file)
    }
  }

  private clearFilePreviews(): void {
    for (const preview of this.filePreviews.values()) {
      URL.revokeObjectURL(preview)
    }

    this.filePreviews.clear()
  }

  removeExistingAttachment(attachmentId: number): void {
    this.removedAttachmentIds.update(ids =>
      ids.includes(attachmentId) ? ids : [...ids, attachmentId]
    )
  }

  ngOnDestroy(): void {
    this.clearFilePreviews()
  }
}
