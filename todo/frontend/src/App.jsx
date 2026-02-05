import { useQuery, useMutation, gql } from '@apollo/client';
import { useState, useMemo, useEffect, useRef } from 'react';
import './styles.css';

const GET_TODOS = gql`
  query GetTodos($filter: FilterStatus, $sortBy: SortBy, $tag: String) {
    todos(filter: $filter, sortBy: $sortBy, tag: $tag) {
      id
      title
      description
      completed
      priority
      dueDate
      tags
      createdAt
    }
    stats {
      total
      active
      completed
      overdue
      completionPercent
      byPriority {
        high
        medium
        low
      }
    }
    allTags
  }
`;

const ADD_TODO = gql`
  mutation AddTodo($title: String!, $description: String, $priority: Priority, $dueDate: String, $tags: [String!]) {
    addTodo(title: $title, description: $description, priority: $priority, dueDate: $dueDate, tags: $tags) {
      id
      title
      description
      completed
      priority
      dueDate
      tags
    }
  }
`;

const TOGGLE_TODO = gql`
  mutation ToggleTodo($id: ID!) {
    toggleTodo(id: $id) {
      id
      completed
    }
  }
`;

const DELETE_TODO = gql`
  mutation DeleteTodo($id: ID!) {
    deleteTodo(id: $id)
  }
`;

const CLEAR_COMPLETED = gql`
  mutation ClearCompleted {
    clearCompleted
  }
`;

const EXPORT_DATA = gql`
  query ExportData {
    exportData {
      todos {
        id
        title
        description
        completed
        priority
        dueDate
        tags
        createdAt
      }
      tags
      exportedAt
    }
  }
`;

const IMPORT_DATA = gql`
  mutation ImportData($data: String!) {
    importData(data: $data) {
      success
      imported
      message
    }
  }
`;

const TOGGLE_ALL = gql`
  mutation ToggleAll($completed: Boolean!) {
    toggleAll(completed: $completed)
  }
`;

const tagColors = [
  '#3498db', '#9b59b6', '#1abc9c', '#e67e22', '#e74c3c',
  '#2ecc71', '#f39c12', '#8e44ad', '#16a085', '#d35400',
];

function getTagColor(tag, allTags) {
  const index = allTags.indexOf(tag);
  return tagColors[index % tagColors.length];
}

function getDueDateStatus(dueDate) {
  if (!dueDate) return null;
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { status: 'overdue', color: '#e74c3c', label: `${Math.abs(diffDays)} days overdue` };
  if (diffDays === 0) return { status: 'today', color: '#f39c12', label: 'Due today' };
  if (diffDays === 1) return { status: 'tomorrow', color: '#3498db', label: 'Due tomorrow' };
  if (diffDays <= 7) return { status: 'soon', color: '#27ae60', label: `Due in ${diffDays} days` };
  return { status: 'later', color: '#95a5a6', label: `Due ${due.toLocaleDateString()}` };
}

function App() {
  const [newTodo, setNewTodo] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState('MEDIUM');
  const [newDueDate, setNewDueDate] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [expandedTodo, setExpandedTodo] = useState(null);
  const [deletedTodo, setDeletedTodo] = useState(null);
  const [showUndo, setShowUndo] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('CREATED_AT');
  const [filterTag, setFilterTag] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showTagSelector, setShowTagSelector] = useState(false);
  const [darkMode, setDarkMode] = useState(() =>
    localStorage.getItem('darkMode') === 'true'
  );
  const inputRef = useRef(null);

  const { loading, error, data, refetch } = useQuery(GET_TODOS, {
    variables: { filter, sortBy, tag: filterTag || null },
  });

  const [addTodo] = useMutation(ADD_TODO, { onCompleted: () => refetch() });
  const [toggleTodo] = useMutation(TOGGLE_TODO);
  const [deleteTodo] = useMutation(DELETE_TODO, { onCompleted: () => refetch() });
  const [clearCompleted] = useMutation(CLEAR_COMPLETED, { onCompleted: () => refetch() });
  const [importData] = useMutation(IMPORT_DATA, { onCompleted: () => refetch() });
  const [toggleAllMutation] = useMutation(TOGGLE_ALL, { onCompleted: () => refetch() });
  const { refetch: exportRefetch } = useQuery(EXPORT_DATA, { skip: true });

  // Persist dark mode
  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
    document.body.classList.toggle('dark-mode', darkMode);
  }, [darkMode]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Escape to clear input
      if (e.key === 'Escape') {
        setNewTodo('');
        setSearchQuery('');
        setShowTagSelector(false);
        inputRef.current?.blur();
      }
      // Ctrl/Cmd + K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      // Ctrl/Cmd + 1/2/3 for filters
      if ((e.ctrlKey || e.metaKey) && ['1', '2', '3'].includes(e.key)) {
        e.preventDefault();
        setFilter(['ALL', 'ACTIVE', 'COMPLETED'][parseInt(e.key) - 1]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newTodo.trim()) {
      addTodo({
        variables: {
          title: newTodo,
          description: newDescription || null,
          priority: newPriority,
          dueDate: newDueDate || null,
          tags: selectedTags,
        },
      });
      setNewTodo('');
      setNewDescription('');
      setNewDueDate('');
      setSelectedTags([]);
    }
  };

  const handleExport = async () => {
    const { data } = await exportRefetch();
    if (data?.exportData) {
      const blob = new Blob([JSON.stringify(data.exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `todos-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (file) {
        const text = await file.text();
        const result = await importData({ variables: { data: text } });
        if (result.data?.importData.success) {
          alert(result.data.importData.message);
        } else {
          alert('Import failed: ' + result.data?.importData.message);
        }
      }
    };
    input.click();
  };

  const toggleTag = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleDelete = (todo) => {
    setDeletedTodo(todo);
    setShowUndo(true);
    deleteTodo({ variables: { id: todo.id } });
    // Auto-hide undo after 5 seconds
    setTimeout(() => setShowUndo(false), 5000);
  };

  const handleUndo = () => {
    if (deletedTodo) {
      addTodo({
        variables: {
          title: deletedTodo.title,
          description: deletedTodo.description,
          priority: deletedTodo.priority.toUpperCase(),
          dueDate: deletedTodo.dueDate,
          tags: deletedTodo.tags,
        },
      });
      setDeletedTodo(null);
      setShowUndo(false);
    }
  };

  const filteredTodos = useMemo(() => {
    if (!data?.todos) return [];
    if (!searchQuery.trim()) return data.todos;
    return data.todos.filter(todo =>
      todo.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [data?.todos, searchQuery]);

  if (loading) {
    return (
      <div className="app">
        <div className="header">
          <h1>TODO</h1>
        </div>
        <div className="empty-state">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <div className="header">
          <h1>TODO</h1>
        </div>
        <div className="empty-state" style={{ color: '#e74c3c' }}>
          Error: {error.message}
        </div>
      </div>
    );
  }

  const { stats, allTags } = data;

  return (
    <div className={`app ${darkMode ? 'dark' : ''}`}>
      <div className="header">
        <h1>TODO</h1>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="dark-mode-toggle"
          title="Toggle dark mode (Ctrl+D)"
        >
          {darkMode ? '☀️' : '🌙'}
        </button>
      </div>

      <div className="stats-bar">
        <div className="stat">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total</div>
        </div>
        <div className="stat">
          <div className="stat-value">{stats.active}</div>
          <div className="stat-label">Active</div>
        </div>
        <div className="stat">
          <div className="stat-value">{stats.completed}</div>
          <div className="stat-label">Done</div>
        </div>
        {stats.overdue > 0 && (
          <div className="stat">
            <div className="stat-value" style={{ color: '#e74c3c' }}>{stats.overdue}</div>
            <div className="stat-label">Overdue</div>
          </div>
        )}
      </div>

      {/* Priority breakdown */}
      {stats.total > 0 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '15px',
          padding: '8px 20px',
          background: darkMode ? '#1e1e2e' : '#f0f0f0',
          fontSize: '12px',
        }}>
          <span style={{ color: '#e74c3c' }}>● {stats.byPriority.high} High</span>
          <span style={{ color: '#f39c12' }}>● {stats.byPriority.medium} Medium</span>
          <span style={{ color: '#27ae60' }}>● {stats.byPriority.low} Low</span>
        </div>
      )}

      {/* Progress Bar */}
      {stats.total > 0 && (
        <div style={{ padding: '0 20px 15px', background: darkMode ? '#252535' : '#f8f9fa' }}>
          <div style={{
            height: '8px',
            background: darkMode ? '#1e1e2e' : '#e0e0e0',
            borderRadius: '4px',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${(stats.completed / stats.total) * 100}%`,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '4px',
              transition: 'width 0.3s ease',
            }} />
          </div>
          <div style={{ textAlign: 'center', fontSize: '12px', color: '#888', marginTop: '5px' }}>
            {Math.round((stats.completed / stats.total) * 100)}% complete
          </div>
        </div>
      )}

      <form className="add-form" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="What needs to be done? (Ctrl+K to focus)"
        />
        <input
          type="text"
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
          placeholder="Add notes (optional)"
          style={{ flex: 1, minWidth: '150px' }}
        />
        <select value={newPriority} onChange={(e) => setNewPriority(e.target.value)}>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
        </select>
        <input
          type="date"
          value={newDueDate}
          onChange={(e) => setNewDueDate(e.target.value)}
        />
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            className="btn"
            style={{ background: '#ecf0f1', color: '#333' }}
            onClick={() => setShowTagSelector(!showTagSelector)}
          >
            Tags {selectedTags.length > 0 && `(${selectedTags.length})`}
          </button>
          {showTagSelector && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              background: 'white',
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '10px',
              zIndex: 10,
              minWidth: '150px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}>
              {allTags.map(tag => (
                <label key={tag} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={selectedTags.includes(tag)}
                    onChange={() => toggleTag(tag)}
                  />
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    background: getTagColor(tag, allTags),
                    color: 'white',
                  }}>{tag}</span>
                </label>
              ))}
            </div>
          )}
        </div>
        <button type="submit" className="btn btn-primary">Add</button>
      </form>

      {/* Selected tags display */}
      {selectedTags.length > 0 && (
        <div style={{ padding: '10px 20px', background: '#f8f9fa', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {selectedTags.map(tag => (
            <span
              key={tag}
              onClick={() => toggleTag(tag)}
              style={{
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '12px',
                background: getTagColor(tag, allTags),
                color: 'white',
                cursor: 'pointer',
              }}
            >
              {tag} ×
            </span>
          ))}
        </div>
      )}

      <div className="controls">
        <div className="filters">
          {stats.total > 0 && (
            <>
              <button
                onClick={() => toggleAllMutation({ variables: { completed: true } })}
                className="filter-btn"
                title="Mark all complete"
              >
                ✓ All
              </button>
              <button
                onClick={() => toggleAllMutation({ variables: { completed: false } })}
                className="filter-btn"
                title="Mark all incomplete"
              >
                ○ All
              </button>
            </>
          )}
          {['ALL', 'ACTIVE', 'COMPLETED'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`filter-btn ${filter === f ? 'active' : ''}`}
            >
              {f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-box"
        />
        <select value={filterTag} onChange={(e) => setFilterTag(e.target.value)}>
          <option value="">All Tags</option>
          {allTags.map(tag => (
            <option key={tag} value={tag}>{tag}</option>
          ))}
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="CREATED_AT">Newest</option>
          <option value="PRIORITY">Priority</option>
          <option value="DUE_DATE">Due Date</option>
          <option value="TITLE">Title</option>
        </select>
      </div>

      {filteredTodos.length === 0 ? (
        <div className="empty-state">
          {searchQuery || filterTag ? 'No matching todos' : 'No todos yet. Add one above!'}
        </div>
      ) : (
        <ul className="todo-list">
          {filteredTodos.map((todo) => (
            <li key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => toggleTodo({ variables: { id: todo.id } })}
                className="todo-checkbox"
              />
              <span className={`priority-dot priority-${todo.priority}`} title={`${todo.priority} priority`} />
              <div className="todo-content" onClick={() => setExpandedTodo(expandedTodo === todo.id ? null : todo.id)} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="todo-title">{todo.title}</span>
                  {todo.description && (
                    <span style={{ fontSize: '12px', color: '#999' }}>
                      {expandedTodo === todo.id ? '▼' : '▶'}
                    </span>
                  )}
                </div>
                {expandedTodo === todo.id && todo.description && (
                  <div style={{
                    marginTop: '8px',
                    padding: '10px',
                    background: darkMode ? '#2a2a3a' : '#f5f5f5',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    color: darkMode ? '#ccc' : '#555',
                    whiteSpace: 'pre-wrap',
                  }}>
                    {todo.description}
                  </div>
                )}
                <div className="todo-meta">
                  <span>{todo.priority}</span>
                  {todo.dueDate && (() => {
                    const dueDateInfo = getDueDateStatus(todo.dueDate);
                    return dueDateInfo && !todo.completed ? (
                      <span style={{ color: dueDateInfo.color, fontWeight: dueDateInfo.status === 'overdue' ? 'bold' : 'normal' }}>
                        {dueDateInfo.label}
                      </span>
                    ) : (
                      <span style={{ color: '#888' }}>Due: {new Date(todo.dueDate).toLocaleDateString()}</span>
                    );
                  })()}
                  {todo.tags.length > 0 && (
                    <div style={{ display: 'flex', gap: '4px', marginLeft: '8px' }}>
                      {todo.tags.map(tag => (
                        <span
                          key={tag}
                          onClick={(e) => { e.stopPropagation(); setFilterTag(tag); }}
                          style={{
                            padding: '2px 8px',
                            borderRadius: '10px',
                            fontSize: '10px',
                            background: getTagColor(tag, allTags),
                            color: 'white',
                            cursor: 'pointer',
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="todo-actions">
                <button
                  onClick={() => handleDelete(todo)}
                  className="btn btn-danger delete-btn"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="footer">
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {stats.completed > 0 && (
            <button onClick={() => clearCompleted()} className="btn btn-secondary">
              Clear Completed ({stats.completed})
            </button>
          )}
          <button onClick={handleExport} className="btn" style={{ background: '#3498db', color: 'white' }}>
            Export
          </button>
          <button onClick={handleImport} className="btn" style={{ background: '#27ae60', color: 'white' }}>
            Import
          </button>
        </div>
      </div>

      {/* Undo Toast */}
      {showUndo && deletedTodo && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#333',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '15px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          zIndex: 1000,
        }}>
          <span>Deleted "{deletedTodo.title}"</span>
          <button
            onClick={handleUndo}
            style={{
              background: '#667eea',
              color: 'white',
              border: 'none',
              padding: '6px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Undo
          </button>
          <button
            onClick={() => setShowUndo(false)}
            style={{
              background: 'transparent',
              color: '#888',
              border: 'none',
              fontSize: '18px',
              cursor: 'pointer',
            }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
