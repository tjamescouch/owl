# Personalized Banking App

Web app for users to view and manage finances.

## State

- User profile and accounts
- Recent transactions
- Budgets and goals

## Capabilities

- Display real-time balances
- Transaction history with search/filter
- Transfer funds between accounts
- Set up alerts for low balance

## Interfaces

Exposes:
- React app at / (login required)
- Responsive UI for mobile/desktop

Depends on:
- Secure API for data
- Auth service

## Invariants

- UI updates in < 1s for real-time data
- All inputs sanitized
- Offline support for viewing cached data
- Accessibility: WCAG 2.1 AA