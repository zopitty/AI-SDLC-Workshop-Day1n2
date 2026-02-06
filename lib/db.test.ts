import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { 
  userDB, 
  todoDB, 
  subtaskDB, 
  calculateProgress,
  Priority,
  RecurrencePattern,
  Subtask,
} from './db';

describe('db module', () => {
  // Store created IDs for cleanup
  let createdUserIds: number[] = [];
  let createdTodoIds: number[] = [];
  let testCounter = 0;
  
  beforeEach(() => {
    createdUserIds = [];
    createdTodoIds = [];
    testCounter++;
  });

  afterEach(() => {
    // Clean up created data in reverse order
    createdTodoIds.forEach(id => {
      try {
        // Todos will be deleted automatically with user cascade
      } catch (e) {
        // Ignore errors during cleanup
      }
    });
    
    createdUserIds.forEach(id => {
      try {
        // We can't delete users easily without exposing a delete method
        // The database will persist between tests
      } catch (e) {
        // Ignore errors during cleanup
      }
    });
  });

  describe('userDB', () => {
    describe('create', () => {
      it('should create a new user', () => {
        const username = `testuser_${Date.now()}_${testCounter}_${Math.random()}_${testCounter}_${Math.random()}`;
        const user = userDB.create(username);
        createdUserIds.push(user.id);
        
        expect(user).toBeDefined();
        expect(user.id).toBeGreaterThan(0);
        expect(user.username).toBe(username);
        expect(user.created_at).toBeDefined();
      });

      it('should auto-increment user IDs', () => {
        const user1 = userDB.create(`user1_${Date.now()}_${testCounter}_${Math.random()}_${testCounter}_${Math.random()}`);
        const user2 = userDB.create(`user2_${Date.now()}_${testCounter}_${Math.random()}_${testCounter}_${Math.random()}`);
        createdUserIds.push(user1.id, user2.id);
        
        expect(user2.id).toBeGreaterThan(user1.id);
      });

      it('should throw error for duplicate username', () => {
        const username = `duplicate_${Date.now()}_${testCounter}_${Math.random()}`;
        const user = userDB.create(username);
        createdUserIds.push(user.id);
        
        expect(() => userDB.create(username)).toThrow();
      });

      it('should handle special characters in username', () => {
        const username = `user@example.com_${Date.now()}_${testCounter}_${Math.random()}`;
        const user = userDB.create(username);
        createdUserIds.push(user.id);
        
        expect(user.username).toBe(username);
      });

      it('should handle unicode characters', () => {
        const username = `用户${Date.now()}_${testCounter}_${Math.random()}`;
        const user = userDB.create(username);
        createdUserIds.push(user.id);
        
        expect(user.username).toBe(username);
      });
    });

    describe('getById', () => {
      it('should retrieve user by ID', () => {
        const username = `testuser_${Date.now()}_${testCounter}_${Math.random()}_${testCounter}_${Math.random()}`;
        const created = userDB.create(username);
        createdUserIds.push(created.id);
        
        const retrieved = userDB.getById(created.id);
        
        expect(retrieved).toEqual(created);
      });

      it('should return null for non-existent ID', () => {
        const user = userDB.getById(999999999);
        
        expect(user).toBeFalsy();
      });
    });

    describe('getByUsername', () => {
      it('should retrieve user by username', () => {
        const username = `findme_${Date.now()}_${testCounter}_${Math.random()}`;
        const created = userDB.create(username);
        createdUserIds.push(created.id);
        
        const retrieved = userDB.getByUsername(username);
        
        expect(retrieved).toEqual(created);
      });

      it('should return null for non-existent username', () => {
        const user = userDB.getByUsername(`nonexistent_${Date.now()}_${testCounter}_${Math.random()}`);
        
        expect(user).toBeFalsy();
      });
    });
  });

  describe('todoDB', () => {
    let userId: number;

    beforeEach(() => {
      const user = userDB.create(`todouser_${Date.now()}_${testCounter}_${Math.random()}`);
      userId = user.id;
      createdUserIds.push(userId);
    });

    describe('create', () => {
      it('should create a todo with required fields only', () => {
        const todo = todoDB.create(userId, { title: 'Test todo' });
        createdTodoIds.push(todo.id);
        
        expect(todo).toBeDefined();
        expect(todo.id).toBeGreaterThan(0);
        expect(todo.user_id).toBe(userId);
        expect(todo.title).toBe('Test todo');
        expect(todo.completed).toBe(false);
        expect(todo.priority).toBe('medium');
        expect(todo.due_date).toBeNull();
        expect(todo.is_recurring).toBe(false);
        expect(todo.recurrence_pattern).toBeNull();
        expect(todo.reminder_minutes).toBeNull();
      });

      it('should create a todo with all fields', () => {
        const todo = todoDB.create(userId, {
          title: 'Complete todo',
          priority: 'high' as Priority,
          due_date: '2026-02-10',
          is_recurring: true,
          recurrence_pattern: 'daily' as RecurrencePattern,
          reminder_minutes: 60,
        });
        createdTodoIds.push(todo.id);
        
        expect(todo.title).toBe('Complete todo');
        expect(todo.priority).toBe('high');
        expect(todo.due_date).toBe('2026-02-10');
        expect(todo.is_recurring).toBe(true);
        expect(todo.recurrence_pattern).toBe('daily');
        expect(todo.reminder_minutes).toBe(60);
      });

      it('should default priority to medium', () => {
        const todo = todoDB.create(userId, { title: 'Default priority' });
        createdTodoIds.push(todo.id);
        
        expect(todo.priority).toBe('medium');
      });

      it('should handle all priority levels', () => {
        const high = todoDB.create(userId, { title: 'Urgent', priority: 'high' as Priority });
        const medium = todoDB.create(userId, { title: 'Normal', priority: 'medium' as Priority });
        const low = todoDB.create(userId, { title: 'Later', priority: 'low' as Priority });
        createdTodoIds.push(high.id, medium.id, low.id);
        
        expect(high.priority).toBe('high');
        expect(medium.priority).toBe('medium');
        expect(low.priority).toBe('low');
      });

      it('should validate title length (max 500)', () => {
        const longTitle = 'a'.repeat(501);
        
        expect(() => todoDB.create(userId, { title: longTitle })).toThrow();
      });

      it('should reject empty title', () => {
        expect(() => todoDB.create(userId, { title: '' })).toThrow();
      });

      it('should reject whitespace-only title', () => {
        expect(() => todoDB.create(userId, { title: '   ' })).toThrow();
      });

      it('should handle all recurrence patterns', () => {
        const daily = todoDB.create(userId, { title: 'Daily', recurrence_pattern: 'daily' as RecurrencePattern });
        const weekly = todoDB.create(userId, { title: 'Weekly', recurrence_pattern: 'weekly' as RecurrencePattern });
        const monthly = todoDB.create(userId, { title: 'Monthly', recurrence_pattern: 'monthly' as RecurrencePattern });
        const yearly = todoDB.create(userId, { title: 'Yearly', recurrence_pattern: 'yearly' as RecurrencePattern });
        createdTodoIds.push(daily.id, weekly.id, monthly.id, yearly.id);
        
        expect(daily.recurrence_pattern).toBe('daily');
        expect(weekly.recurrence_pattern).toBe('weekly');
        expect(monthly.recurrence_pattern).toBe('monthly');
        expect(yearly.recurrence_pattern).toBe('yearly');
      });
    });

    describe('getById', () => {
      it('should retrieve todo by ID', () => {
        const created = todoDB.create(userId, { title: 'Find me' });
        createdTodoIds.push(created.id);
        
        const retrieved = todoDB.getById(userId, created.id);
        
        expect(retrieved).toMatchObject({
          id: created.id,
          title: 'Find me',
        });
      });

      it('should return null for non-existent ID', () => {
        const todo = todoDB.getById(userId, 999999999);
        
        expect(todo).toBeFalsy();
      });

      it('should return null for wrong user', () => {
        const otherUser = userDB.create(`otheruser_${Date.now()}_${testCounter}_${Math.random()}`);
        createdUserIds.push(otherUser.id);
        
        const todo = todoDB.create(userId, { title: 'My todo' });
        createdTodoIds.push(todo.id);
        
        const retrieved = todoDB.getById(otherUser.id, todo.id);
        
        expect(retrieved).toBeNull();
      });

      it('should convert booleans correctly', () => {
        const todo = todoDB.create(userId, { title: 'Boolean test', is_recurring: true });
        createdTodoIds.push(todo.id);
        
        const retrieved = todoDB.getById(userId, todo.id);
        
        expect(typeof retrieved?.completed).toBe('boolean');
        expect(typeof retrieved?.is_recurring).toBe('boolean');
        expect(retrieved?.is_recurring).toBe(true);
      });
    });

    describe('getWithSubtasks', () => {
      it('should retrieve todo with empty subtasks array', () => {
        const todo = todoDB.create(userId, { title: 'No subtasks' });
        createdTodoIds.push(todo.id);
        
        const result = todoDB.getWithSubtasks(userId, todo.id);
        
        expect(result).toBeDefined();
        expect(result?.subtasks).toEqual([]);
        expect(result?.progress).toEqual({
          total: 0,
          completed: 0,
          percentage: 0,
        });
      });

      it('should retrieve todo with subtasks', () => {
        const todo = todoDB.create(userId, { title: 'With subtasks' });
        createdTodoIds.push(todo.id);
        
        subtaskDB.create(todo.id, { title: 'Subtask 1' });
        subtaskDB.create(todo.id, { title: 'Subtask 2' });
        
        const result = todoDB.getWithSubtasks(userId, todo.id);
        
        expect(result?.subtasks).toHaveLength(2);
      });

      it('should calculate progress correctly', () => {
        const todo = todoDB.create(userId, { title: 'Progress test' });
        createdTodoIds.push(todo.id);
        
        const s1 = subtaskDB.create(todo.id, { title: 'Sub 1' });
        const s2 = subtaskDB.create(todo.id, { title: 'Sub 2' });
        const s3 = subtaskDB.create(todo.id, { title: 'Sub 3' });
        
        subtaskDB.update(s1.id, { completed: true });
        
        const result = todoDB.getWithSubtasks(userId, todo.id);
        
        expect(result?.progress).toEqual({
          total: 3,
          completed: 1,
          percentage: 33,
        });
      });

      it('should return null for non-existent todo', () => {
        const result = todoDB.getWithSubtasks(userId, 999999999);
        
        expect(result).toBeFalsy();
      });
    });

    describe('list', () => {
      it('should return empty array when no todos', () => {
        const newUser = userDB.create(`emptyuser_${Date.now()}_${testCounter}_${Math.random()}`);
        createdUserIds.push(newUser.id);
        
        const todos = todoDB.list(newUser.id);
        
        expect(todos).toEqual([]);
      });

      it('should list all todos for a user', () => {
        const t1 = todoDB.create(userId, { title: 'Todo 1' });
        const t2 = todoDB.create(userId, { title: 'Todo 2' });
        const t3 = todoDB.create(userId, { title: 'Todo 3' });
        createdTodoIds.push(t1.id, t2.id, t3.id);
        
        const todos = todoDB.list(userId);
        
        expect(todos.length).toBeGreaterThanOrEqual(3);
      });

      it('should not return todos from other users', () => {
        const otherUser = userDB.create(`otheruser_list_${Date.now()}_${testCounter}_${Math.random()}`);
        createdUserIds.push(otherUser.id);
        
        const myTodo = todoDB.create(userId, { title: 'My todo unique' });
        const otherTodo = todoDB.create(otherUser.id, { title: 'Other todo unique' });
        createdTodoIds.push(myTodo.id, otherTodo.id);
        
        const myTodos = todoDB.list(userId);
        const otherTodos = todoDB.list(otherUser.id);
        
        expect(myTodos.some(t => t.id === myTodo.id)).toBe(true);
        expect(myTodos.some(t => t.id === otherTodo.id)).toBe(false);
        expect(otherTodos.some(t => t.id === otherTodo.id)).toBe(true);
      });

      it('should sort by priority', () => {
        const low = todoDB.create(userId, { title: `Low ${Date.now()}_${testCounter}_${Math.random()}`, priority: 'low' as Priority });
        const high = todoDB.create(userId, { title: `High ${Date.now()}_${testCounter}_${Math.random()}`, priority: 'high' as Priority });
        const medium = todoDB.create(userId, { title: `Medium ${Date.now()}_${testCounter}_${Math.random()}`, priority: 'medium' as Priority });
        createdTodoIds.push(low.id, high.id, medium.id);
        
        const todos = todoDB.list(userId);
        
        // Find positions of our todos
        const highIdx = todos.findIndex(t => t.id === high.id);
        const mediumIdx = todos.findIndex(t => t.id === medium.id);
        const lowIdx = todos.findIndex(t => t.id === low.id);
        
        // High should come before medium, medium before low
        expect(highIdx).toBeLessThan(mediumIdx);
        expect(mediumIdx).toBeLessThan(lowIdx);
      });
    });

    describe('update', () => {
      it('should update todo title', () => {
        const todo = todoDB.create(userId, { title: 'Original' });
        createdTodoIds.push(todo.id);
        
        const success = todoDB.update(userId, todo.id, { title: 'Updated' });
        expect(success).toBe(true);
        
        const updated = todoDB.getById(userId, todo.id);
        expect(updated?.title).toBe('Updated');
      });

      it('should update completed status', () => {
        const todo = todoDB.create(userId, { title: 'Task' });
        createdTodoIds.push(todo.id);
        
        todoDB.update(userId, todo.id, { completed: true });
        
        const updated = todoDB.getById(userId, todo.id);
        expect(updated?.completed).toBe(true);
      });

      it('should update priority', () => {
        const todo = todoDB.create(userId, { title: 'Task' });
        createdTodoIds.push(todo.id);
        
        todoDB.update(userId, todo.id, { priority: 'high' as Priority });
        
        const updated = todoDB.getById(userId, todo.id);
        expect(updated?.priority).toBe('high');
      });

      it('should update due_date', () => {
        const todo = todoDB.create(userId, { title: 'Task' });
        createdTodoIds.push(todo.id);
        
        todoDB.update(userId, todo.id, { due_date: '2026-03-01' });
        
        const updated = todoDB.getById(userId, todo.id);
        expect(updated?.due_date).toBe('2026-03-01');
      });

      it('should update recurring fields', () => {
        const todo = todoDB.create(userId, { title: 'Task' });
        createdTodoIds.push(todo.id);
        
        todoDB.update(userId, todo.id, {
          is_recurring: true,
          recurrence_pattern: 'weekly' as RecurrencePattern,
        });
        
        const updated = todoDB.getById(userId, todo.id);
        expect(updated?.is_recurring).toBe(true);
        expect(updated?.recurrence_pattern).toBe('weekly');
      });

      it('should update reminder_minutes', () => {
        const todo = todoDB.create(userId, { title: 'Task' });
        createdTodoIds.push(todo.id);
        
        todoDB.update(userId, todo.id, { reminder_minutes: 30 });
        
        const updated = todoDB.getById(userId, todo.id);
        expect(updated?.reminder_minutes).toBe(30);
      });

      it('should update multiple fields at once', () => {
        const todo = todoDB.create(userId, { title: 'Task' });
        createdTodoIds.push(todo.id);
        
        todoDB.update(userId, todo.id, {
          title: 'New title',
          priority: 'high' as Priority,
          completed: true,
        });
        
        const updated = todoDB.getById(userId, todo.id);
        expect(updated?.title).toBe('New title');
        expect(updated?.priority).toBe('high');
        expect(updated?.completed).toBe(true);
      });

      it('should return false when no fields to update', () => {
        const todo = todoDB.create(userId, { title: 'Task' });
        createdTodoIds.push(todo.id);
        
        const success = todoDB.update(userId, todo.id, {});
        
        expect(success).toBe(false);
      });

      it('should return false for non-existent todo', () => {
        const success = todoDB.update(userId, 999999999, { title: 'Fail' });
        
        expect(success).toBe(false);
      });

      it('should return false when updating other users todo', () => {
        const otherUser = userDB.create(`other_${Date.now()}_${testCounter}_${Math.random()}`);
        createdUserIds.push(otherUser.id);
        
        const todo = todoDB.create(userId, { title: 'My todo' });
        createdTodoIds.push(todo.id);
        
        const success = todoDB.update(otherUser.id, todo.id, { title: 'Hacked' });
        
        expect(success).toBe(false);
      });
    });

    describe('delete', () => {
      it('should delete a todo', () => {
        const todo = todoDB.create(userId, { title: 'Delete me' });
        
        const success = todoDB.delete(userId, todo.id);
        expect(success).toBe(true);
        
        const retrieved = todoDB.getById(userId, todo.id);
        expect(retrieved).toBeNull();
      });

      it('should return false for non-existent todo', () => {
        const success = todoDB.delete(userId, 999999999);
        
        expect(success).toBe(false);
      });

      it('should not delete other users todos', () => {
        const otherUser = userDB.create(`other_delete_${Date.now()}_${testCounter}_${Math.random()}`);
        createdUserIds.push(otherUser.id);
        
        const todo = todoDB.create(userId, { title: 'My todo' });
        createdTodoIds.push(todo.id);
        
        const success = todoDB.delete(otherUser.id, todo.id);
        
        expect(success).toBe(false);
        expect(todoDB.getById(userId, todo.id)).not.toBeNull();
      });

      it('should cascade delete subtasks', () => {
        const todo = todoDB.create(userId, { title: 'With subtasks' });
        const subtask = subtaskDB.create(todo.id, { title: 'Subtask' });
        
        todoDB.delete(userId, todo.id);
        
        const retrievedSubtask = subtaskDB.getById(subtask.id);
        expect(retrievedSubtask).toBeNull();
      });
    });
  });

  describe('subtaskDB', () => {
    let userId: number;
    let todoId: number;

    beforeEach(() => {
      const user = userDB.create(`subtaskuser_${Date.now()}_${testCounter}_${Math.random()}`);
      userId = user.id;
      createdUserIds.push(userId);
      
      const todo = todoDB.create(userId, { title: 'Parent todo' });
      todoId = todo.id;
      createdTodoIds.push(todoId);
    });

    describe('create', () => {
      it('should create a subtask', () => {
        const subtask = subtaskDB.create(todoId, { title: 'First subtask' });
        
        expect(subtask).toBeDefined();
        expect(subtask.id).toBeGreaterThan(0);
        expect(subtask.todo_id).toBe(todoId);
        expect(subtask.title).toBe('First subtask');
        expect(subtask.completed).toBe(false);
        expect(subtask.position).toBeGreaterThanOrEqual(0);
      });

      it('should auto-increment positions', () => {
        const s1 = subtaskDB.create(todoId, { title: 'First' });
        const s2 = subtaskDB.create(todoId, { title: 'Second' });
        const s3 = subtaskDB.create(todoId, { title: 'Third' });
        
        expect(s2.position).toBeGreaterThan(s1.position);
        expect(s3.position).toBeGreaterThan(s2.position);
      });

      it('should validate title length (max 200)', () => {
        const longTitle = 'a'.repeat(201);
        
        expect(() => subtaskDB.create(todoId, { title: longTitle })).toThrow();
      });

      it('should reject empty title', () => {
        expect(() => subtaskDB.create(todoId, { title: '' })).toThrow();
      });

      it('should reject whitespace-only title', () => {
        expect(() => subtaskDB.create(todoId, { title: '   ' })).toThrow();
      });
    });

    describe('list', () => {
      it('should return empty array when no subtasks', () => {
        const newTodo = todoDB.create(userId, { title: 'Empty todo' });
        createdTodoIds.push(newTodo.id);
        
        const subtasks = subtaskDB.list(newTodo.id);
        
        expect(subtasks).toEqual([]);
      });

      it('should list all subtasks for a todo', () => {
        subtaskDB.create(todoId, { title: 'Sub 1' });
        subtaskDB.create(todoId, { title: 'Sub 2' });
        subtaskDB.create(todoId, { title: 'Sub 3' });
        
        const subtasks = subtaskDB.list(todoId);
        
        expect(subtasks).toHaveLength(3);
      });

      it('should order by position', () => {
        const s1 = subtaskDB.create(todoId, { title: 'First' });
        const s2 = subtaskDB.create(todoId, { title: 'Second' });
        const s3 = subtaskDB.create(todoId, { title: 'Third' });
        
        const subtasks = subtaskDB.list(todoId);
        
        expect(subtasks[0].id).toBe(s1.id);
        expect(subtasks[1].id).toBe(s2.id);
        expect(subtasks[2].id).toBe(s3.id);
      });

      it('should not return subtasks from other todos', () => {
        const otherTodo = todoDB.create(userId, { title: 'Other todo' });
        createdTodoIds.push(otherTodo.id);
        
        subtaskDB.create(todoId, { title: 'My subtask' });
        subtaskDB.create(otherTodo.id, { title: 'Other subtask' });
        
        const mySubtasks = subtaskDB.list(todoId);
        const otherSubtasks = subtaskDB.list(otherTodo.id);
        
        expect(mySubtasks).toHaveLength(1);
        expect(otherSubtasks).toHaveLength(1);
      });
    });

    describe('getById', () => {
      it('should retrieve subtask by ID', () => {
        const created = subtaskDB.create(todoId, { title: 'Find me' });
        const retrieved = subtaskDB.getById(created.id);
        
        expect(retrieved).toMatchObject({
          id: created.id,
          title: 'Find me',
        });
      });

      it('should return null for non-existent ID', () => {
        const subtask = subtaskDB.getById(999999999);
        
        expect(subtask).toBeFalsy();
      });

      it('should convert completed to boolean', () => {
        const subtask = subtaskDB.create(todoId, { title: 'Test' });
        const retrieved = subtaskDB.getById(subtask.id);
        
        expect(typeof retrieved?.completed).toBe('boolean');
      });
    });

    describe('update', () => {
      it('should update subtask title', () => {
        const subtask = subtaskDB.create(todoId, { title: 'Original' });
        const success = subtaskDB.update(subtask.id, { title: 'Updated' });
        
        expect(success).toBe(true);
        
        const updated = subtaskDB.getById(subtask.id);
        expect(updated?.title).toBe('Updated');
      });

      it('should update completed status', () => {
        const subtask = subtaskDB.create(todoId, { title: 'Task' });
        subtaskDB.update(subtask.id, { completed: true });
        
        const updated = subtaskDB.getById(subtask.id);
        expect(updated?.completed).toBe(true);
      });

      it('should update both fields at once', () => {
        const subtask = subtaskDB.create(todoId, { title: 'Task' });
        subtaskDB.update(subtask.id, {
          title: 'New title',
          completed: true,
        });
        
        const updated = subtaskDB.getById(subtask.id);
        expect(updated?.title).toBe('New title');
        expect(updated?.completed).toBe(true);
      });

      it('should return false when no fields to update', () => {
        const subtask = subtaskDB.create(todoId, { title: 'Task' });
        const success = subtaskDB.update(subtask.id, {});
        
        expect(success).toBe(false);
      });

      it('should return false for non-existent subtask', () => {
        const success = subtaskDB.update(999999999, { title: 'Fail' });
        
        expect(success).toBe(false);
      });
    });

    describe('delete', () => {
      it('should delete a subtask', () => {
        const subtask = subtaskDB.create(todoId, { title: 'Delete me' });
        const success = subtaskDB.delete(subtask.id);
        
        expect(success).toBe(true);
        
        const retrieved = subtaskDB.getById(subtask.id);
        expect(retrieved).toBeNull();
      });

      it('should return false for non-existent subtask', () => {
        const success = subtaskDB.delete(999999999);
        
        expect(success).toBe(false);
      });
    });

    describe('getMaxPosition', () => {
      it('should return -1 when no subtasks exist', () => {
        const newTodo = todoDB.create(userId, { title: 'Empty todo' });
        createdTodoIds.push(newTodo.id);
        
        const max = subtaskDB.getMaxPosition(newTodo.id);
        
        expect(max).toBe(-1);
      });

      it('should return max position', () => {
        subtaskDB.create(todoId, { title: 'First' });
        subtaskDB.create(todoId, { title: 'Second' });
        subtaskDB.create(todoId, { title: 'Third' });
        
        const max = subtaskDB.getMaxPosition(todoId);
        
        expect(max).toBeGreaterThanOrEqual(2);
      });

      it('should return correct max after deletion', () => {
        const s1 = subtaskDB.create(todoId, { title: 'First' });
        const s2 = subtaskDB.create(todoId, { title: 'Second' });
        const s3 = subtaskDB.create(todoId, { title: 'Third' });
        
        const maxBefore = subtaskDB.getMaxPosition(todoId);
        subtaskDB.delete(s3.id);
        const maxAfter = subtaskDB.getMaxPosition(todoId);
        
        expect(maxAfter).toBeLessThan(maxBefore);
      });

      it('should return -1 for non-existent todo', () => {
        const max = subtaskDB.getMaxPosition(999999999);
        
        expect(max).toBe(-1);
      });
    });
  });

  describe('calculateProgress', () => {
    it('should return 0% for empty subtasks', () => {
      const progress = calculateProgress([]);
      
      expect(progress).toEqual({
        total: 0,
        completed: 0,
        percentage: 0,
      });
    });

    it('should calculate 0% when none completed', () => {
      const subtasks: Subtask[] = [
        { id: 1, todo_id: 1, title: 'Sub 1', completed: false, position: 0, created_at: '' },
        { id: 2, todo_id: 1, title: 'Sub 2', completed: false, position: 1, created_at: '' },
      ];
      
      const progress = calculateProgress(subtasks);
      
      expect(progress).toEqual({
        total: 2,
        completed: 0,
        percentage: 0,
      });
    });

    it('should calculate 100% when all completed', () => {
      const subtasks: Subtask[] = [
        { id: 1, todo_id: 1, title: 'Sub 1', completed: true, position: 0, created_at: '' },
        { id: 2, todo_id: 1, title: 'Sub 2', completed: true, position: 1, created_at: '' },
      ];
      
      const progress = calculateProgress(subtasks);
      
      expect(progress).toEqual({
        total: 2,
        completed: 2,
        percentage: 100,
      });
    });

    it('should calculate 50% when half completed', () => {
      const subtasks: Subtask[] = [
        { id: 1, todo_id: 1, title: 'Sub 1', completed: true, position: 0, created_at: '' },
        { id: 2, todo_id: 1, title: 'Sub 2', completed: false, position: 1, created_at: '' },
      ];
      
      const progress = calculateProgress(subtasks);
      
      expect(progress).toEqual({
        total: 2,
        completed: 1,
        percentage: 50,
      });
    });

    it('should round percentage to nearest integer', () => {
      const subtasks: Subtask[] = [
        { id: 1, todo_id: 1, title: 'Sub 1', completed: true, position: 0, created_at: '' },
        { id: 2, todo_id: 1, title: 'Sub 2', completed: false, position: 1, created_at: '' },
        { id: 3, todo_id: 1, title: 'Sub 3', completed: false, position: 2, created_at: '' },
      ];
      
      const progress = calculateProgress(subtasks);
      
      expect(progress.percentage).toBe(33);
    });

    it('should calculate 67% for 2 of 3 completed', () => {
      const subtasks: Subtask[] = [
        { id: 1, todo_id: 1, title: 'Sub 1', completed: true, position: 0, created_at: '' },
        { id: 2, todo_id: 1, title: 'Sub 2', completed: true, position: 1, created_at: '' },
        { id: 3, todo_id: 1, title: 'Sub 3', completed: false, position: 2, created_at: '' },
      ];
      
      const progress = calculateProgress(subtasks);
      
      expect(progress.percentage).toBe(67);
    });

    it('should handle large number of subtasks', () => {
      const subtasks: Subtask[] = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        todo_id: 1,
        title: `Sub ${i + 1}`,
        completed: i < 73, // 73 of 100 completed
        position: i,
        created_at: '',
      }));
      
      const progress = calculateProgress(subtasks);
      
      expect(progress).toEqual({
        total: 100,
        completed: 73,
        percentage: 73,
      });
    });
  });
});
