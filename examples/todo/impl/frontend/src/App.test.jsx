import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import App from './App';
import { gql } from '@apollo/client';

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

const mocks = [
  {
    request: {
      query: GET_TODOS,
      variables: { filter: 'ALL', sortBy: 'CREATED_AT', tag: null },
    },
    result: {
      data: {
        todos: [
          {
            __typename: 'Todo',
            id: '1',
            title: 'Test Todo',
            description: 'Test description',
            completed: false,
            priority: 'medium',
            dueDate: null,
            tags: [],
            createdAt: new Date().toISOString(),
          },
        ],
        stats: {
          __typename: 'TodoStats',
          total: 1,
          active: 1,
          completed: 0,
          overdue: 0,
          completionPercent: 0,
          byPriority: { __typename: 'PriorityStats', high: 0, medium: 1, low: 0 },
        },
        allTags: ['work', 'personal'],
      },
    },
  },
];

describe('App', () => {
  it('renders header', async () => {
    render(
      <MockedProvider mocks={mocks} >
        <App />
      </MockedProvider>
    );
    expect(screen.getByText('TODO')).toBeDefined();
  });

  it('shows loading state', () => {
    render(
      <MockedProvider mocks={mocks} >
        <App />
      </MockedProvider>
    );
    expect(screen.getByText('Loading...')).toBeDefined();
  });

  it('renders todos after loading', async () => {
    render(
      <MockedProvider mocks={mocks} >
        <App />
      </MockedProvider>
    );

    const todo = await screen.findByText('Test Todo');
    expect(todo).toBeDefined();
  });

  it('renders stats', async () => {
    render(
      <MockedProvider mocks={mocks} >
        <App />
      </MockedProvider>
    );

    await screen.findByText('Test Todo');
    expect(screen.getByText('Total')).toBeDefined();
    expect(screen.getAllByText('Active').length).toBeGreaterThan(0);
  });
});
