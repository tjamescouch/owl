# greeter

generates greeting messages.

## capabilities

- create personalized greeting from name
- support multiple greeting styles (casual, formal)

## interfaces

exposes:
- `greet(name: string, style?: 'casual' | 'formal'): string`
  - casual: "Hey {name}!"
  - formal: "Good day, {name}."
  - default: casual

depends on:
- (none)

## invariants

- never returns empty string
- name is trimmed and title-cased
