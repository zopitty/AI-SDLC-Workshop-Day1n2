'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatSingaporeDate, isOverdue } from '@/lib/timezone';

interface Todo {
  id: number;
  user_id: number;
  title: string;
  completed: boolean;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export default function HomePage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [newTodoDueDate, setNewTodoDueDate] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Fetch todos on mount
  const fetchTodos = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/todos');
      if (!response.ok) {
        throw new Error('Failed to fetch todos');
      }
      const data = await response.json();
      setTodos(data.todos || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  // Create new todo
  const handleCreateTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTodoTitle.trim()) {
      setError('Title cannot be empty');
      return;
    }

    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTodoTitle,
          due_date: newTodoDueDate || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create todo');
      }

      const data = await response.json();
      
      // Optimistic update
      setTodos([data.todo, ...todos]);
      setNewTodoTitle('');
      setNewTodoDueDate('');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create todo');
    }
  };

  // Toggle todo completion
  const handleToggleComplete = async (id: number, completed: boolean) => {
    // Optimistic update
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !completed } : todo
    ));

    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !completed }),
      });

      if (!response.ok) {
        throw new Error('Failed to update todo');
      }

      const data = await response.json();
      setTodos(todos.map(todo => todo.id === id ? data.todo : todo));
    } catch (err) {
      // Revert on error
      setTodos(todos.map(todo => 
        todo.id === id ? { ...todo, completed } : todo
      ));
      setError(err instanceof Error ? err.message : 'Failed to update todo');
    }
  };

  // Start editing
  const handleStartEdit = (id: number, title: string) => {
    setEditingId(id);
    setEditingTitle(title);
  };

  // Save edited todo
  const handleSaveEdit = async (id: number) => {
    if (!editingTitle.trim()) {
      setError('Title cannot be empty');
      return;
    }

    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editingTitle }),
      });

      if (!response.ok) {
        throw new Error('Failed to update todo');
      }

      const data = await response.json();
      setTodos(todos.map(todo => todo.id === id ? data.todo : todo));
      setEditingId(null);
      setEditingTitle('');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update todo');
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingTitle('');
  };

  // Delete todo
  const handleDeleteTodo = async (id: number) => {
    setDeletingId(null);

    // Optimistic update
    const originalTodos = todos;
    setTodos(todos.filter(todo => todo.id !== id));

    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete todo');
      }

      setError(null);
    } catch (err) {
      // Revert on error
      setTodos(originalTodos);
      setError(err instanceof Error ? err.message : 'Failed to delete todo');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            My Todos
          </h1>
          <p className="text-gray-600">
            Manage your tasks efficiently
          </p>
        </header>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Add todo form */}
        <form onSubmit={handleCreateTodo} className="mb-8 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">Add New Todo</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                id="title"
                type="text"
                value={newTodoTitle}
                onChange={(e) => setNewTodoTitle(e.target.value)}
                placeholder="What needs to be done?"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={500}
                autoFocus
              />
            </div>
            <div>
              <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 mb-1">
                Due Date (optional)
              </label>
              <input
                id="due_date"
                type="datetime-local"
                value={newTodoDueDate}
                onChange={(e) => setNewTodoDueDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Add Todo
            </button>
          </div>
        </form>

        {/* Todos list */}
        <div className="bg-white rounded-lg shadow-sm">
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              Loading todos...
            </div>
          ) : todos.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="text-lg">No todos yet. Add your first task above!</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {todos.map((todo) => (
                <li key={todo.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() => handleToggleComplete(todo.id, todo.completed)}
                      className="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      aria-label={`Mark "${todo.title}" as ${todo.completed ? 'incomplete' : 'complete'}`}
                    />

                    {/* Todo content */}
                    <div className="flex-1 min-w-0">
                      {editingId === todo.id ? (
                        // Edit mode
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSaveEdit(todo.id);
                              } else if (e.key === 'Escape') {
                                handleCancelEdit();
                              }
                            }}
                            className="w-full px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            maxLength={500}
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSaveEdit(todo.id)}
                              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                            >
                              Save
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        // View mode
                        <>
                          <div
                            onClick={() => handleStartEdit(todo.id, todo.title)}
                            className={`text-lg cursor-pointer ${
                              todo.completed ? 'line-through text-gray-400' : 'text-gray-900'
                            }`}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleStartEdit(todo.id, todo.title);
                              }
                            }}
                          >
                            {todo.title}
                          </div>
                          {todo.due_date && (
                            <div
                              className={`text-sm mt-1 ${
                                isOverdue(todo.due_date) && !todo.completed
                                  ? 'text-red-600 font-medium'
                                  : 'text-gray-500'
                              }`}
                            >
                              Due: {formatSingaporeDate(new Date(todo.due_date), 'datetime')}
                              {isOverdue(todo.due_date) && !todo.completed && ' (Overdue)'}
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Delete button */}
                    {editingId !== todo.id && (
                      <button
                        onClick={() => setDeletingId(todo.id)}
                        className="text-red-600 hover:text-red-700 p-1"
                        aria-label={`Delete "${todo.title}"`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Delete confirmation modal */}
        {deletingId !== null && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
              <h3 className="text-lg font-semibold mb-2 text-gray-900">Delete Todo</h3>
              <p className="text-gray-600 mb-6">
                Delete this todo? This cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setDeletingId(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteTodo(deletingId)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
