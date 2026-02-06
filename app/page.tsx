'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const [username, setUsername] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });

      if (response.ok) {
        setIsLoggedIn(true);
        router.refresh();
      } else {
        alert('Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Login error');
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white p-8 rounded-lg shadow-lg w-96">
          <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
            Todo App
          </h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your username"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              Login / Register
            </button>
          </form>
          <p className="mt-4 text-xs text-gray-500 text-center">
            Enter any username to login or create a new account
          </p>
        </div>
      </div>
    );
  }

  return <TodoApp />;
}

// Todo App Component with Subtasks
function TodoApp() {
  const [todos, setTodos] = useState<any[]>([]);
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [expandedTodoId, setExpandedTodoId] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const response = await fetch('/api/todos');
      if (response.ok) {
        const data = await response.json();
        setTodos(data.todos);
      }
    } catch (error) {
      console.error('Error fetching todos:', error);
    }
  };

  const createTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTodoTitle.trim()) return;

    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTodoTitle }),
      });

      if (response.ok) {
        setNewTodoTitle('');
        fetchTodos();
      }
    } catch (error) {
      console.error('Error creating todo:', error);
    }
  };

  const toggleTodo = async (id: number, completed: boolean) => {
    try {
      await fetch(`/api/todos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !completed }),
      });
      fetchTodos();
    } catch (error) {
      console.error('Error toggling todo:', error);
    }
  };

  const deleteTodo = async (id: number) => {
    if (!confirm('Delete this todo? All subtasks will be deleted too.')) return;

    try {
      await fetch(`/api/todos/${id}`, { method: 'DELETE' });
      fetchTodos();
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const toggleExpand = (todoId: number) => {
    setExpandedTodoId(expandedTodoId === todoId ? null : todoId);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">My Todos</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Logout
          </button>
        </div>

        {/* Add Todo Form */}
        <form onSubmit={createTodo} className="mb-8 bg-white p-6 rounded-lg shadow">
          <div className="flex gap-2">
            <input
              type="text"
              value={newTodoTitle}
              onChange={(e) => setNewTodoTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              Add Todo
            </button>
          </div>
        </form>

        {/* Todo List */}
        <div className="space-y-3">
          {todos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              isExpanded={expandedTodoId === todo.id}
              onToggle={() => toggleTodo(todo.id, todo.completed)}
              onDelete={() => deleteTodo(todo.id)}
              onToggleExpand={() => toggleExpand(todo.id)}
              onUpdate={fetchTodos}
            />
          ))}
          {todos.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No todos yet. Create your first one above!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// TodoItem Component with Subtasks
function TodoItem({
  todo,
  isExpanded,
  onToggle,
  onDelete,
  onToggleExpand,
  onUpdate,
}: any) {
  const [subtasks, setSubtasks] = useState<any[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [progress, setProgress] = useState({ total: 0, completed: 0, percentage: 0 });

  useEffect(() => {
    if (isExpanded) {
      fetchSubtasks();
    }
  }, [isExpanded]);

  useEffect(() => {
    calculateProgress();
  }, [subtasks]);

  const fetchSubtasks = async () => {
    try {
      const response = await fetch(`/api/todos/${todo.id}/subtasks`);
      if (response.ok) {
        const data = await response.json();
        setSubtasks(data.subtasks);
      }
    } catch (error) {
      console.error('Error fetching subtasks:', error);
    }
  };

  const calculateProgress = () => {
    const total = subtasks.length;
    const completed = subtasks.filter((s: any) => s.completed).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    setProgress({ total, completed, percentage });
  };

  const createSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newSubtaskTitle.trim()) return;

    try {
      const response = await fetch(`/api/todos/${todo.id}/subtasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newSubtaskTitle }),
      });

      if (response.ok) {
        setNewSubtaskTitle('');
        fetchSubtasks();
      }
    } catch (error) {
      console.error('Error creating subtask:', error);
    }
  };

  const toggleSubtask = async (subtaskId: number, completed: boolean) => {
    try {
      await fetch(`/api/subtasks/${subtaskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !completed }),
      });
      fetchSubtasks();
    } catch (error) {
      console.error('Error toggling subtask:', error);
    }
  };

  const deleteSubtask = async (subtaskId: number) => {
    try {
      await fetch(`/api/subtasks/${subtaskId}`, { method: 'DELETE' });
      fetchSubtasks();
    } catch (error) {
      console.error('Error deleting subtask:', error);
    }
  };

  const priorityColors = {
    high: 'bg-red-100 text-red-800 border-red-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-blue-100 text-blue-800 border-blue-200',
  };

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
      {/* Todo Header */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={onToggle}
            className="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3
                className={`text-lg font-medium ${
                  todo.completed ? 'line-through text-gray-500' : 'text-gray-900'
                }`}
              >
                {todo.title}
              </h3>
              <span
                className={`px-2 py-1 text-xs font-medium rounded border ${
                  priorityColors[todo.priority as keyof typeof priorityColors]
                }`}
              >
                {todo.priority}
              </span>
            </div>

            {/* Progress Bar (only if subtasks exist) */}
            {isExpanded && progress.total > 0 && (
              <div className="mb-3">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>
                    {progress.completed}/{progress.total} completed
                  </span>
                  <span>{progress.percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      progress.percentage === 100 ? 'bg-green-600' : 'bg-blue-600'
                    }`}
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>
              </div>
            )}

            {/* Subtasks Section */}
            {isExpanded && (
              <div className="mt-4 space-y-2">
                {subtasks.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No subtasks yet. Add one below.</p>
                ) : (
                  <div className="space-y-2">
                    {subtasks.map((subtask: any) => (
                      <div
                        key={subtask.id}
                        className="flex items-center gap-2 p-2 bg-gray-50 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={subtask.completed}
                          onChange={() => toggleSubtask(subtask.id, subtask.completed)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span
                          className={`flex-1 text-sm ${
                            subtask.completed ? 'line-through text-gray-500' : 'text-gray-700'
                          }`}
                        >
                          {subtask.title}
                        </span>
                        <button
                          onClick={() => deleteSubtask(subtask.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          🗑
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Subtask Form */}
                <form onSubmit={createSubtask} className="flex gap-2 mt-3">
                  <input
                    type="text"
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    placeholder="Add a subtask..."
                    className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    + Add
                  </button>
                </form>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onToggleExpand}
              className="text-gray-500 hover:text-gray-700 text-sm font-medium"
            >
              {isExpanded ? '▼' : '▶'}
            </button>
            <button
              onClick={onDelete}
              className="text-red-600 hover:text-red-800"
            >
              🗑
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
