'use client';

import { useState, useEffect, useMemo } from 'react';
import { Priority, Todo } from '@/lib/db';

// Priority Badge Component
function PriorityBadge({ 
  priority, 
  onClick, 
  size = 'sm' 
}: { 
  priority: Priority; 
  onClick?: () => void; 
  size?: 'sm' | 'md';
}) {
  const colors = {
    high: 'bg-red-500 text-white',
    medium: 'bg-yellow-500 text-white',
    low: 'bg-green-500 text-white',
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
  };

  return (
    <span
      className={`rounded-full font-medium ${colors[priority]} ${sizeClasses[size]} ${
        onClick ? 'cursor-pointer hover:opacity-80' : ''
      }`}
      onClick={onClick}
      aria-label={`Priority: ${priority}`}
    >
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  );
}

// Priority Selector Component
function PrioritySelector({
  value,
  onChange,
  disabled = false,
}: {
  value: Priority;
  onChange: (priority: Priority) => void;
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as Priority)}
      disabled={disabled}
      className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <option value="high">High</option>
      <option value="medium">Medium</option>
      <option value="low">Low</option>
    </select>
  );
}

// Priority Filter Component
function PriorityFilter({
  todos,
  selected,
  onChange,
}: {
  todos: Todo[];
  selected: Priority | 'all';
  onChange: (filter: Priority | 'all') => void;
}) {
  const counts = {
    all: todos.length,
    high: todos.filter((t) => t.priority === 'high').length,
    medium: todos.filter((t) => t.priority === 'medium').length,
    low: todos.filter((t) => t.priority === 'low').length,
  };

  const filters: Array<{ label: string; value: Priority | 'all' }> = [
    { label: 'All', value: 'all' },
    { label: 'High', value: 'high' },
    { label: 'Medium', value: 'medium' },
    { label: 'Low', value: 'low' },
  ];

  return (
    <div className="flex gap-2 mb-6">
      {filters.map((filter) => (
        <button
          key={filter.value}
          onClick={() => onChange(filter.value)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            selected === filter.value
              ? 'bg-blue-500 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          {filter.label}{' '}
          <span className="ml-1 text-sm">({counts[filter.value]})</span>
        </button>
      ))}
    </div>
  );
}

// Main Page Component
export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');
  const [sortByPriority, setSortByPriority] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sortByPriority') === 'true';
    }
    return false;
  });
  const [loading, setLoading] = useState(true);

  // Fetch todos on mount
  useEffect(() => {
    fetchTodos();
  }, []);

  // Save sort preference to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sortByPriority', sortByPriority.toString());
    }
  }, [sortByPriority]);

  const fetchTodos = async () => {
    try {
      const response = await fetch('/api/todos');
      const data = await response.json();
      setTodos(data.todos || []);
    } catch (error) {
      console.error('Failed to fetch todos:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          priority,
          due_date: dueDate || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setTodos([data.todo, ...todos]);
        setTitle('');
        setPriority('medium');
        setDueDate('');
      }
    } catch (error) {
      console.error('Failed to add todo:', error);
    }
  };

  const updateTodo = async (
    id: number,
    updates: Partial<Pick<Todo, 'title' | 'completed' | 'priority'>>
  ) => {
    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const data = await response.json();
        setTodos(todos.map((t) => (t.id === id ? data.todo : t)));
      }
    } catch (error) {
      console.error('Failed to update todo:', error);
    }
  };

  const deleteTodo = async (id: number) => {
    if (!confirm('Delete this todo? This cannot be undone.')) return;

    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setTodos(todos.filter((t) => t.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  };

  // Filtered and sorted todos
  const filteredTodos = useMemo(() => {
    let result = todos;

    // Apply priority filter
    if (priorityFilter !== 'all') {
      result = result.filter((t) => t.priority === priorityFilter);
    }

    // Apply priority sorting
    if (sortByPriority) {
      result = [...result].sort((a, b) => {
        // Completed todos go to bottom
        if (a.completed !== b.completed) return a.completed ? 1 : -1;

        // Priority order: high > medium > low
        const priorityOrder: Record<Priority, number> = { high: 0, medium: 1, low: 2 };
        if (a.priority !== b.priority) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }

        // Within same priority, newest first
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    }

    return result;
  }, [todos, priorityFilter, sortByPriority]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Todo App</h1>

      {/* Add Todo Form */}
      <form onSubmit={addTodo} className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              What needs to be done?
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter todo title..."
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={500}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <PrioritySelector value={priority} onChange={setPriority} />
            </div>

            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
                Due Date (optional)
              </label>
              <input
                id="dueDate"
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 text-white font-medium py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
          >
            Add Todo
          </button>
        </div>
      </form>

      {/* Priority Filter */}
      <PriorityFilter
        todos={todos}
        selected={priorityFilter}
        onChange={setPriorityFilter}
      />

      {/* Sort Toggle */}
      <div className="mb-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={sortByPriority}
            onChange={(e) => setSortByPriority(e.target.checked)}
            className="w-4 h-4 text-blue-500 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">
            Sort by priority (high → medium → low)
          </span>
        </label>
      </div>

      {/* Todo List */}
      <div className="space-y-3">
        {filteredTodos.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
            {priorityFilter === 'all'
              ? 'No todos yet. Add your first task above!'
              : `No ${priorityFilter} priority tasks.`}
          </div>
        ) : (
          filteredTodos.map((todo) => (
            <div
              key={todo.id}
              className={`bg-white rounded-lg shadow-md p-4 flex items-start gap-4 ${
                todo.completed ? 'opacity-60' : ''
              }`}
            >
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={(e) => updateTodo(todo.id, { completed: e.target.checked })}
                className="mt-1 w-5 h-5 text-blue-500 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <PriorityBadge priority={todo.priority} />
                  {todo.due_date && (
                    <span className="text-xs text-gray-500">
                      Due: {new Date(todo.due_date).toLocaleString('en-US', {
                        timeZone: 'Asia/Singapore',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                </div>

                <h3
                  className={`text-lg font-medium ${
                    todo.completed ? 'line-through text-gray-500' : 'text-gray-900'
                  }`}
                >
                  {todo.title}
                </h3>

                <div className="mt-2 flex items-center gap-4">
                  <PrioritySelector
                    value={todo.priority}
                    onChange={(newPriority) => updateTodo(todo.id, { priority: newPriority })}
                  />

                  <button
                    onClick={() => deleteTodo(todo.id)}
                    className="text-sm text-red-600 hover:text-red-800 font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
