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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#e8eaf0' }}>
        <div className="bg-white p-8 rounded-xl shadow-lg w-96">
          <h1 className="text-3xl font-bold mb-6 text-center text-gray-900">
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
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your username"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
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
  const [username, setUsername] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchTodos();
    fetchUsername();
  }, []);

  const fetchUsername = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUsername(data.username || 'User');
      }
    } catch (error) {
      console.error('Error fetching username:', error);
    }
  };

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

  // Calculate stats
  const now = new Date();
  const overdueCount = todos.filter(t => !t.completed && t.due_date && new Date(t.due_date) < now).length;
  const pendingCount = todos.filter(t => !t.completed && (!t.due_date || new Date(t.due_date) >= now)).length;
  const completedCount = todos.filter(t => t.completed).length;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#e8eaf0' }}>
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-1">Todo App</h1>
              <p className="text-gray-600">Welcome, {username}</p>
            </div>
            <div className="flex gap-2">
              <button
                className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors"
                style={{ backgroundColor: '#9333ea' }}
                title="Calendar View"
              >
                Calendar
              </button>
              <button
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                title="Templates"
              >
                📋 Templates
              </button>
              <button
                className="px-3 py-2 text-lg"
                title="Notifications"
              >
                🔔
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Add Todo Form */}
        <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
          <form onSubmit={createTodo} className="space-y-4">
            <input
              type="text"
              value={newTodoTitle}
              onChange={(e) => setNewTodoTitle(e.target.value)}
              placeholder="Add a new todo..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
            />
            <div className="flex gap-3">
              <select className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option>Medium</option>
                <option>High</option>
                <option>Low</option>
              </select>
              <input
                type="datetime-local"
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="mm/dd/yyyy, --:-- --"
              />
              <button
                type="submit"
                className="px-8 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Add
              </button>
            </div>
            <button
              type="button"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
            >
              ▸ Show Advanced Options
            </button>
          </form>
        </div>

        {/* Search and Filter */}
        <div className="bg-white p-4 rounded-xl shadow-sm mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              <input
                type="text"
                placeholder="Search todos and subtasks..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option>All Priorities</option>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
            <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium">
              ▸ Advanced
            </button>
          </div>
        </div>

        {/* Overdue Section */}
        {overdueCount > 0 && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-red-600 mb-3 flex items-center gap-2">
              <span className="text-3xl">⚠️</span> Overdue ({overdueCount})
            </h2>
            <div className="space-y-3">
              {todos
                .filter(t => !t.completed && t.due_date && new Date(t.due_date) < now)
                .map((todo) => (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    isExpanded={expandedTodoId === todo.id}
                    onToggle={() => toggleTodo(todo.id, todo.completed)}
                    onDelete={() => deleteTodo(todo.id)}
                    onToggleExpand={() => toggleExpand(todo.id)}
                    onUpdate={fetchTodos}
                    isOverdue={true}
                  />
                ))}
            </div>
          </div>
        )}

        {/* Pending Section */}
        {pendingCount > 0 && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-blue-600 mb-3">
              Pending ({pendingCount})
            </h2>
            <div className="space-y-3">
              {todos
                .filter(t => !t.completed && (!t.due_date || new Date(t.due_date) >= now))
                .map((todo) => (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    isExpanded={expandedTodoId === todo.id}
                    onToggle={() => toggleTodo(todo.id, todo.completed)}
                    onDelete={() => deleteTodo(todo.id)}
                    onToggleExpand={() => toggleExpand(todo.id)}
                    onUpdate={fetchTodos}
                    isOverdue={false}
                  />
                ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {todos.length === 0 && (
          <div className="text-center py-12 text-gray-500 bg-white rounded-xl shadow-sm">
            No todos yet. Create your first one above!
          </div>
        )}

        {/* Stats Counter */}
        <div className="bg-white rounded-xl shadow-sm p-6 mt-8">
          <div className="flex justify-around text-center">
            <div>
              <div className="text-4xl font-bold text-red-600">{overdueCount}</div>
              <div className="text-gray-600 mt-1">Overdue</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600">{pendingCount}</div>
              <div className="text-gray-600 mt-1">Pending</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-600">{completedCount}</div>
              <div className="text-gray-600 mt-1">Completed</div>
            </div>
          </div>
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
  isOverdue,
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

  const priorityConfig = {
    high: { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5', label: 'High' },
    medium: { bg: '#fef3c7', text: '#92400e', border: '#fcd34d', label: 'Medium' },
    low: { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd', label: 'Low' },
  };

  const priority = priorityConfig[todo.priority as keyof typeof priorityConfig] || priorityConfig.medium;

  // Calculate time until due
  const getDueText = () => {
    if (!todo.due_date) return null;
    const due = new Date(todo.due_date);
    const now = new Date();
    const diffMs = due.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMs < 0) {
      const absDays = Math.abs(diffDays);
      return absDays === 0 ? '1 day overdue' : `${absDays} day${absDays > 1 ? 's' : ''} overdue`;
    }
    if (diffMins < 60) return `Due in ${diffMins} minute${diffMins !== 1 ? 's' : ''}`;
    if (diffHours < 24) return `Due in ${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
    return `Due in ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
  };

  const dueText = getDueText();
  const bgColor = isOverdue ? '#fee2e2' : '#ffffff';

  return (
    <div className="rounded-xl shadow-sm overflow-hidden" style={{ backgroundColor: bgColor }}>
      {/* Todo Header */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={onToggle}
            className="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3
                  className={`text-lg font-medium ${
                    todo.completed ? 'line-through text-gray-500' : 'text-gray-900'
                  }`}
                >
                  {todo.title}
                </h3>
                <span
                  className="px-2 py-0.5 text-xs font-semibold rounded"
                  style={{
                    backgroundColor: priority.bg,
                    color: priority.text,
                    border: `1px solid ${priority.border}`
                  }}
                >
                  {priority.label}
                </span>
                {progress.total > 0 && (
                  <span className="text-sm text-gray-600">
                    {progress.completed}/{progress.total}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onToggleExpand}
                  className="text-gray-600 hover:text-gray-800 font-bold text-lg px-2"
                >
                  {isExpanded ? '▼' : '▶'}
                </button>
              </div>
            </div>

            {dueText && (
              <div className={`text-sm font-medium mb-2 ${isOverdue ? 'text-red-600' : 'text-red-600'}`}>
                {dueText}
              </div>
            )}

            {/* Progress Bar */}
            {progress.total > 0 && (
              <div className="mb-3">
                <div className="text-xs text-gray-600 mb-1">
                  {progress.completed}/{progress.total} subtasks
                </div>
                <div className="w-full bg-gray-300 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full transition-all"
                    style={{
                      width: `${progress.percentage}%`,
                      backgroundColor: progress.percentage === 100 ? '#10b981' : '#3b82f6'
                    }}
                  />
                </div>
              </div>
            )}

            {/* Subtasks Section */}
            {isExpanded && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="space-y-2 mb-3">
                  {subtasks.map((subtask: any) => (
                    <div
                      key={subtask.id}
                      className="flex items-center gap-2 p-2 bg-white rounded border border-gray-200"
                    >
                      <input
                        type="checkbox"
                        checked={subtask.completed}
                        onChange={() => toggleSubtask(subtask.id, subtask.completed)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
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
                        className="text-red-600 hover:text-red-800 text-lg"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Subtask Form */}
                <form onSubmit={createSubtask} className="flex gap-2">
                  <input
                    type="text"
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    placeholder="Add subtask..."
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    Add
                  </button>
                </form>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 mt-3">
              <button
                onClick={() => {/* Edit functionality */}}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Edit
              </button>
              <button
                onClick={onDelete}
                className="text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
