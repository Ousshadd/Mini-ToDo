import { Component, input, output, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Todo } from '../../../services/todo';
import { Category } from '../../../services/category';
import { CommentService, Comment } from '../../../services/comment';

@Component({
  selector: 'app-todo-item',
  imports: [DatePipe, FormsModule],
  templateUrl: './todo-item.html',
  styleUrl: './todo-item.css',
})
export class TodoItemComponent implements OnInit {
  private commentService = inject(CommentService);

  todo = input.required<Todo>();
  categories = input<Category[]>([]);

  statusChange = output<{ todo: Todo, newStatus: 'à faire' | 'en cours' | 'terminé' }>();
  deleteTodo = output<string>();
  editTodo = output<{ id: string, data: Partial<Todo> }>();

  isEditing = false;
  editData: Partial<Todo> = {};

  showComments = signal(false);
  comments = signal<Comment[]>([]);
  commentsLoading = signal(false);
  commentError = signal('');
  newComment = '';
  editingCommentId: number | null = null;
  editingCommentContent = '';

  ngOnInit() {
    this.resetEditData();
  }

  resetEditData() {
    const t = this.todo();
    // Use string type for dueDate in inputs, formatting it as YYYY-MM-DD
    let formattedDate = null;
    if (t.dueDate) {
      formattedDate = new Date(t.dueDate).toISOString().split('T')[0];
    }
    this.editData = {
      title: t.title,
      description: t.description,
      priority: t.priority,
      dueDate: formattedDate,
      categoryId: t.categoryId || null
    };
  }

  getCategoryForTodo(): Category | undefined {
    const catId = this.todo().categoryId;
    if (!catId) return undefined;
    return this.categories().find(c => c._id === catId);
  }

  onEditClick() {
    this.resetEditData();
    this.isEditing = true;
  }

  onCancelEdit() {
    this.isEditing = false;
  }

  onSaveEdit() {
    if (this.editData.title?.trim()) {
      const id = this.todo()._id;
      if (id) {
        this.editTodo.emit({ id, data: this.editData });
      }
      this.isEditing = false;
    }
  }

  onStatusChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const newStatus = select.value as 'à faire' | 'en cours' | 'terminé';
    this.statusChange.emit({ todo: this.todo(), newStatus });
  }

  onDelete() {
    const id = this.todo()._id;
    if (id) {
      this.deleteTodo.emit(id);
    }
  }

  toggleComments() {
    this.showComments.update(value => !value);
    if (this.showComments()) {
      this.loadComments();
    }
  }

  loadComments() {
    const todoId = this.todo()._id;
    if (!todoId) return;

    this.commentsLoading.set(true);
    this.commentError.set('');
    this.commentService.getComments(todoId).subscribe({
      next: comments => {
        this.comments.set(comments);
        this.commentsLoading.set(false);
      },
      error: () => {
        this.commentError.set('Impossible de charger les commentaires.');
        this.commentsLoading.set(false);
      },
    });
  }

  onAddComment() {
    const todoId = this.todo()._id;
    const content = this.newComment.trim();
    if (!todoId || !content) return;

    this.commentError.set('');
    this.commentService.addComment(todoId, content).subscribe({
      next: response => {
        this.comments.update(comments => [...comments, response.comment]);
        this.newComment = '';
      },
      error: () => this.commentError.set("Impossible d'ajouter le commentaire."),
    });
  }

  startCommentEdit(comment: Comment) {
    this.editingCommentId = comment.id;
    this.editingCommentContent = comment.content;
  }

  cancelCommentEdit() {
    this.editingCommentId = null;
    this.editingCommentContent = '';
  }

  saveCommentEdit(commentId: number) {
    const content = this.editingCommentContent.trim();
    if (!content) return;

    this.commentService.updateComment(commentId, content).subscribe({
      next: response => {
        this.comments.update(comments =>
          comments.map(comment => comment.id === commentId ? response.comment : comment)
        );
        this.cancelCommentEdit();
      },
      error: () => this.commentError.set('Impossible de modifier le commentaire.'),
    });
  }

  onDeleteComment(commentId: number) {
    const previousComments = this.comments();
    this.comments.update(comments => comments.filter(comment => comment.id !== commentId));

    this.commentService.deleteComment(commentId).subscribe({
      error: () => {
        this.comments.set(previousComments);
        this.commentError.set('Impossible de supprimer le commentaire.');
      },
    });
  }
}
