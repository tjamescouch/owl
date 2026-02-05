# server

websocket relay server for agent communication.

## state

- set of connected clients, each with a socket and identity
- set of channels, each with subscribed client ids
- no message history (pure relay)

## capabilities

- accepts websocket connections
- assigns temporary id to each connection
- allows clients to identify with persistent keypair
- routes messages to channels or direct to agents
- broadcasts presence (join/leave) events

## interfaces

exposes:
- `ws://host:port` - websocket endpoint

depends on:
- nothing external

## invariants

- clients can only send to channels they've joined
- direct messages require valid recipient id
- server never initiates messages unprompted
- disconnected clients are cleaned up immediately
