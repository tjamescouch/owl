import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Data file - ~/.todo/data.json
const DATA_DIR = process.env.TODO_DATA_DIR || path.join(os.homedir(), '.todo');
const DATA_FILE = path.join(DATA_DIR, 'data.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Load or initialize data
function load() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    }
  } catch (e) {
    console.error('Failed to load data:', e.message);
  }
  return { todos: [], tags: ['personal', 'work', 'urgent'], nextId: 1 };
}

function save() {
  fs.writeFileSync(DATA_FILE, JSON.stringify({ todos, tags: allTags, nextId }, null, 2));
}

// State
let { todos, tags: allTags, nextId } = load();
console.log(`Loaded ${todos.length} todos from ${DATA_FILE}`);

// GraphQL Schema
const typeDefs = `
  enum Priority {
    LOW
    MEDIUM
    HIGH
  }

  enum FilterStatus {
    ALL
    ACTIVE
    COMPLETED
  }

  enum SortBy {
    CREATED_AT
    DUE_DATE
    PRIORITY
    TITLE
  }

  type Todo {
    id: ID!
    title: String!
    description: String
    completed: Boolean!
    priority: Priority!
    dueDate: String
    tags: [String!]!
    createdAt: String!
  }

  type Query {
    todos(filter: FilterStatus, sortBy: SortBy, tag: String): [Todo!]!
    todo(id: ID!): Todo
    stats: TodoStats!
    allTags: [String!]!
    exportData: ExportData!
  }

  type ExportData {
    todos: [Todo!]!
    tags: [String!]!
    exportedAt: String!
  }

  type TodoStats {
    total: Int!
    active: Int!
    completed: Int!
    overdue: Int!
    completionPercent: Float!
    byPriority: PriorityStats!
  }

  type PriorityStats {
    high: Int!
    medium: Int!
    low: Int!
  }

  type Mutation {
    addTodo(title: String!, description: String, priority: Priority, dueDate: String, tags: [String!]): Todo!
    updateTodo(id: ID!, title: String, description: String, priority: Priority, dueDate: String, tags: [String!]): Todo
    toggleTodo(id: ID!): Todo
    deleteTodo(id: ID!): Boolean!
    clearCompleted: Int!
    toggleAll(completed: Boolean!): Int!
    addTag(name: String!): [String!]!
    importData(data: String!): ImportResult!
  }

  input TodoInput {
    title: String!
    completed: Boolean!
    priority: String!
    dueDate: String
    tags: [String!]!
  }

  type ImportResult {
    success: Boolean!
    imported: Int!
    message: String
  }
`;

// Priority order for sorting
const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };

// Resolvers
const resolvers = {
  Query: {
    todos: (_, { filter, sortBy, tag }) => {
      let result = [...todos];

      // Filter by status
      if (filter === 'ACTIVE') {
        result = result.filter(t => !t.completed);
      } else if (filter === 'COMPLETED') {
        result = result.filter(t => t.completed);
      }

      // Filter by tag
      if (tag) {
        result = result.filter(t => t.tags.includes(tag));
      }

      // Sort
      if (sortBy === 'PRIORITY') {
        result.sort((a, b) => priorityOrder[a.priority.toUpperCase()] - priorityOrder[b.priority.toUpperCase()]);
      } else if (sortBy === 'DUE_DATE') {
        result.sort((a, b) => {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate) - new Date(b.dueDate);
        });
      } else if (sortBy === 'TITLE') {
        result.sort((a, b) => a.title.localeCompare(b.title));
      } else {
        result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }

      return result;
    },
    todo: (_, { id }) => todos.find(t => t.id === id),
    stats: () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const overdue = todos.filter(t => {
        if (t.completed || !t.dueDate) return false;
        const due = new Date(t.dueDate);
        due.setHours(0, 0, 0, 0);
        return due < today;
      }).length;
      const total = todos.length;
      const completed = todos.filter(t => t.completed).length;
      return {
        total,
        active: todos.filter(t => !t.completed).length,
        completed,
        overdue,
        completionPercent: total > 0 ? Math.round((completed / total) * 1000) / 10 : 0,
        byPriority: {
          high: todos.filter(t => t.priority === 'HIGH').length,
          medium: todos.filter(t => t.priority === 'MEDIUM').length,
          low: todos.filter(t => t.priority === 'LOW').length,
        },
      };
    },
    allTags: () => allTags,
    exportData: () => ({
      todos: todos,
      tags: allTags,
      exportedAt: new Date().toISOString(),
    }),
  },
  Mutation: {
    addTodo: (_, { title, description = '', priority = 'MEDIUM', dueDate = null, tags = [] }) => {
      const todo = {
        id: String(nextId++),
        title,
        description,
        completed: false,
        priority: priority.toUpperCase(),
        dueDate,
        tags,
        createdAt: new Date().toISOString(),
      };
      todos.push(todo);
      tags.forEach(tag => {
        if (!allTags.includes(tag)) allTags.push(tag);
      });
      save();
      return todo;
    },
    updateTodo: (_, { id, title, description, priority, dueDate, tags }) => {
      const todo = todos.find(t => t.id === id);
      if (todo) {
        if (title !== undefined) todo.title = title;
        if (description !== undefined) todo.description = description;
        if (priority !== undefined) todo.priority = priority.toUpperCase();
        if (dueDate !== undefined) todo.dueDate = dueDate;
        if (tags !== undefined) {
          todo.tags = tags;
          tags.forEach(tag => {
            if (!allTags.includes(tag)) allTags.push(tag);
          });
        }
        save();
      }
      return todo;
    },
    toggleTodo: (_, { id }) => {
      const todo = todos.find(t => t.id === id);
      if (todo) {
        todo.completed = !todo.completed;
        save();
      }
      return todo;
    },
    deleteTodo: (_, { id }) => {
      const index = todos.findIndex(t => t.id === id);
      if (index > -1) {
        todos.splice(index, 1);
        save();
        return true;
      }
      return false;
    },
    clearCompleted: () => {
      const count = todos.filter(t => t.completed).length;
      todos = todos.filter(t => !t.completed);
      if (count > 0) save();
      return count;
    },
    toggleAll: (_, { completed }) => {
      let count = 0;
      todos.forEach(todo => {
        if (todo.completed !== completed) {
          todo.completed = completed;
          count++;
        }
      });
      if (count > 0) save();
      return count;
    },
    addTag: (_, { name }) => {
      if (!allTags.includes(name)) {
        allTags.push(name);
        save();
      }
      return allTags;
    },
    importData: (_, { data }) => {
      try {
        const parsed = JSON.parse(data);
        if (!parsed.todos || !Array.isArray(parsed.todos)) {
          return { success: false, imported: 0, message: 'Invalid data format' };
        }
        let imported = 0;
        parsed.todos.forEach(todo => {
          const newTodo = {
            id: String(nextId++),
            title: todo.title || 'Untitled',
            completed: !!todo.completed,
            priority: (todo.priority || 'MEDIUM').toUpperCase(),
            dueDate: todo.dueDate || null,
            tags: Array.isArray(todo.tags) ? todo.tags : [],
            createdAt: todo.createdAt || new Date().toISOString(),
          };
          todos.push(newTodo);
          newTodo.tags.forEach(tag => {
            if (!allTags.includes(tag)) allTags.push(tag);
          });
          imported++;
        });
        if (parsed.tags && Array.isArray(parsed.tags)) {
          parsed.tags.forEach(tag => {
            if (!allTags.includes(tag)) allTags.push(tag);
          });
        }
        if (imported > 0) save();
        return { success: true, imported, message: `Imported ${imported} todos` };
      } catch (e) {
        return { success: false, imported: 0, message: 'Failed to parse JSON: ' + e.message };
      }
    },
  },
};

// Create Express app and Apollo Server
const PORT = process.env.TODO_PORT || 4005;
const app = express();
const server = new ApolloServer({ typeDefs, resolvers });

await server.start();

app.use('/graphql', cors(), express.json(), expressMiddleware(server));

const httpServer = app.listen(PORT, () => {
  console.log(`todo-server listening on :${PORT}`);
  console.log(`data: ${DATA_FILE}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  save();
  httpServer.close(() => process.exit(0));
});

process.on('SIGTERM', () => {
  save();
  httpServer.close(() => process.exit(0));
});
