# formatter

styles and decorates text output.

## capabilities

- add visual decoration to text
- support terminal colors (ANSI)
- support plain text fallback

## interfaces

exposes:
- `format(text: string, options?: FormatOptions): string`
  - options.color: 'green' | 'blue' | 'yellow' | 'none' (default: 'green')
  - options.border: boolean (default: false)
- `FormatOptions` type export

depends on:
- (none)

## invariants

- preserves original text content (decoration only)
- plain mode when NO_COLOR env is set
