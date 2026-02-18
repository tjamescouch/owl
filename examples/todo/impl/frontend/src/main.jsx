import React from 'react';
import ReactDOM from 'react-dom/client';
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';
import App from './App';
import { initErrorHandler } from './error-handler';

// Initialize error reporting to error-daemon
const ERROR_COLLECTOR = import.meta.env.VITE_ERROR_COLLECTOR || 'http://localhost:4098/error';
initErrorHandler('todo-app', ERROR_COLLECTOR);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4005/graphql';

const client = new ApolloClient({
  uri: API_URL,
  cache: new InMemoryCache(),
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
  </React.StrictMode>
);
