# constraints

## security

- all signatures use ed25519 via tweetnacl
- never store private keys on server
- treat all agent input as untrusted

## style

- typescript, strict mode
- functional where possible
- minimal dependencies

## protocol

- json messages over websocket
- stateless server (no message persistence)
- best-effort delivery
