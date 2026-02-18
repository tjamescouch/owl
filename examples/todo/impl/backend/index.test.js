import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';

const API_URL = 'http://localhost:4005/graphql';

async function gql(query, variables = {}) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  return res.json();
}

describe('todo api', () => {
  it('fetches todos', async () => {
    const { data } = await gql('{ todos { id title completed } }');
    assert(Array.isArray(data.todos));
  });

  it('fetches stats', async () => {
    const { data } = await gql('{ stats { total active completed } }');
    assert(typeof data.stats.total === 'number');
    assert(typeof data.stats.active === 'number');
    assert(typeof data.stats.completed === 'number');
  });

  it('adds a todo', async () => {
    const title = `Test todo ${Date.now()}`;
    const { data } = await gql(
      `mutation($title: String!) { addTodo(title: $title) { id title completed } }`,
      { title }
    );
    assert.strictEqual(data.addTodo.title, title);
    assert.strictEqual(data.addTodo.completed, false);
  });

  it('toggles a todo', async () => {
    const { data: addData } = await gql(
      `mutation { addTodo(title: "Toggle test") { id completed } }`
    );
    const id = addData.addTodo.id;
    assert.strictEqual(addData.addTodo.completed, false);

    const { data: toggleData } = await gql(
      `mutation($id: ID!) { toggleTodo(id: $id) { id completed } }`,
      { id }
    );
    assert.strictEqual(toggleData.toggleTodo.completed, true);
  });

  it('deletes a todo', async () => {
    const { data: addData } = await gql(
      `mutation { addTodo(title: "Delete test") { id } }`
    );
    const id = addData.addTodo.id;

    const { data: deleteData } = await gql(
      `mutation($id: ID!) { deleteTodo(id: $id) }`,
      { id }
    );
    assert.strictEqual(deleteData.deleteTodo, true);

    const { data: fetchData } = await gql(
      `query($id: ID!) { todo(id: $id) { id } }`,
      { id }
    );
    assert.strictEqual(fetchData.todo, null);
  });

  it('filters by status', async () => {
    const { data: activeData } = await gql(
      '{ todos(filter: ACTIVE) { id completed } }'
    );
    assert(activeData.todos.every(t => !t.completed));

    const { data: completedData } = await gql(
      '{ todos(filter: COMPLETED) { id completed } }'
    );
    assert(completedData.todos.every(t => t.completed));
  });

  it('exports data', async () => {
    const { data } = await gql('{ exportData { todos { id } tags exportedAt } }');
    assert(Array.isArray(data.exportData.todos));
    assert(Array.isArray(data.exportData.tags));
    assert(typeof data.exportData.exportedAt === 'string');
  });
});
