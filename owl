#!/usr/bin/env python3
"""owl - natural language terraform for products"""

import argparse
import hashlib
import json
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

VERSION = "0.1.0"


# =============================================================================
# parser component
# =============================================================================

def find_spec(dir: Path) -> Path | None:
    """locate product.md in directory"""
    product = dir / "product.md"
    return product if product.exists() else None


def read_spec(path: Path) -> str:
    """read single spec file"""
    return path.read_text()


def extract_links(content: str) -> list[str]:
    """extract markdown links from content"""
    pattern = r'\[([^\]]+)\]\(([^)]+\.md)\)'
    return [match[1] for match in re.findall(pattern, content)]


def gather_specs(dir: Path, root_spec: Path) -> dict[str, Path]:
    """collect all linked specs starting from root"""
    specs = {}
    visited = set()

    def visit(path: Path, key: str):
        if path in visited or not path.exists():
            return
        visited.add(path)

        # follows links only within project directory
        try:
            path.resolve().relative_to(dir.resolve())
        except ValueError:
            return

        specs[key] = path
        content = read_spec(path)

        for link in extract_links(content):
            link_path = (path.parent / link).resolve()
            link_key = str(link_path.relative_to(dir)).replace(".md", "")
            visit(link_path, link_key)

    visit(root_spec, "product")
    return specs


# =============================================================================
# state component
# =============================================================================

def hash_content(content: str) -> str:
    """sha256 hash of content"""
    return hashlib.sha256(content.encode()).hexdigest()[:16]


def compute_spec_hash(specs: dict[str, Path]) -> str:
    """compute hash of concatenated spec files"""
    content = []
    for key in sorted(specs.keys()):
        content.append(specs[key].read_text())
    return hash_content("".join(content))


def load_state(dir: Path) -> dict:
    """load state file"""
    state_file = dir / ".owl" / "state.json"
    if state_file.exists():
        return json.loads(state_file.read_text())
    return {"components": {}, "behaviors": {}}


def save_state(dir: Path, state: dict):
    """save state file"""
    owl_dir = dir / ".owl"
    owl_dir.mkdir(exist_ok=True)
    state_file = owl_dir / "state.json"
    state_file.write_text(json.dumps(state, indent=2))


def categorize_specs(specs: dict[str, Path]) -> tuple[dict, dict]:
    """split specs into components and behaviors"""
    components = {}
    behaviors = {}
    for key, path in specs.items():
        if key.startswith("components/"):
            name = key.replace("components/", "")
            components[name] = path
        elif key.startswith("behaviors/"):
            name = key.replace("behaviors/", "")
            behaviors[name] = path
    return components, behaviors


def get_spec_status(key: str, spec_hash: str, state: dict) -> str:
    """determine status of a spec: pending, satisfied, drifted, stale"""
    category = "components" if key.startswith("components/") else "behaviors"
    name = key.split("/")[-1] if "/" in key else key

    stored = state.get(category, {}).get(name, {})
    if not stored:
        return "pending"

    stored_hash = stored.get("spec_hash", "")
    if stored_hash != spec_hash:
        return "stale"

    if stored.get("status") == "satisfied":
        return "satisfied"

    return "drifted"


def build_state(specs: dict[str, Path], hashes: dict[str, str]) -> dict:
    """build state dict matching spec format"""
    now = datetime.now(timezone.utc).isoformat()
    components, behaviors = categorize_specs(specs)

    state = {
        "spec_hash": compute_spec_hash(specs),
        "applied_at": now,
        "owl_version": VERSION,
        "components": {},
        "behaviors": {},
    }

    for name in components:
        key = f"components/{name}"
        state["components"][name] = {
            "status": "satisfied",
            "spec_hash": hashes.get(key, ""),
            "files": [],  # populated by executor if tracking
            "applied_at": now,
        }

    for name in behaviors:
        key = f"behaviors/{name}"
        state["behaviors"][name] = {
            "status": "satisfied",
            "spec_hash": hashes.get(key, ""),
            "applied_at": now,
        }

    return state


# =============================================================================
# executor component
# =============================================================================

BROADCAST_CHANNEL = None


def broadcast(msg: str):
    """send update to agentchat channel if broadcasting enabled"""
    if not BROADCAST_CHANNEL:
        return
    try:
        subprocess.run(
            ["node", "/Users/jamescouch/dev/claude/agentchat/bin/agentchat.js",
             "send", "wss://agentchat-server.fly.dev", BROADCAST_CHANNEL, msg],
            capture_output=True, timeout=5
        )
    except Exception:
        pass  # don't fail owl if broadcast fails


def read_specs_content(specs: dict[str, Path]) -> tuple[str, dict[str, str]]:
    """read specs, return concatenated content and per-file hashes"""
    content = []
    hashes = {}

    for key, path in sorted(specs.items()):
        text = path.read_text()
        hashes[key] = hash_content(text)
        content.append(f"# FILE: {path.name}\n")
        content.append(text)
        content.append("\n---\n")

    return "\n".join(content), hashes


def execute_claude(prompt: str, interactive: bool = False, auto_yes: bool = False) -> bool:
    """invoke claude cli, return success"""
    cmd = ["claude"]

    if not interactive:
        cmd.append("--print")
    elif auto_yes:
        cmd.append("--dangerously-skip-permissions")

    cmd.extend(["-p", prompt])

    try:
        subprocess.run(cmd, check=True)
        return True
    except FileNotFoundError:
        print("error: claude cli not found", file=sys.stderr)
        print("install: https://docs.anthropic.com/en/docs/claude-code", file=sys.stderr)
        sys.exit(1)
    except subprocess.CalledProcessError:
        return False


def execute_agentchat(prompt: str, dir: Path) -> bool:
    """distribute work via agentchat"""
    cmd = ["claude", "-p", f"""you are owl coordinator. use agentchat to distribute this work.

1. connect to agentchat
2. post the task to #owl channel
3. coordinate agents claiming components
4. wait for completion

working directory: {dir}

task:
{prompt}"""]

    try:
        subprocess.run(cmd, check=True)
        return True
    except FileNotFoundError:
        print("error: claude cli not found", file=sys.stderr)
        sys.exit(1)
    except subprocess.CalledProcessError:
        return False


def execute_human(prompt: str, dir: Path) -> bool:
    """print task list for manual execution"""
    print("task list for manual execution:\n")
    return execute_claude(prompt, interactive=False)


def execute(behavior: str, specs: str, dir: Path, options: dict) -> bool:
    """run a behavior - unified executor interface"""
    executor = options.get("executor", "claude")
    auto_yes = options.get("auto_yes", False)

    prompts = {
        "status": f"""you are owl. compare these specs to the codebase in {dir}.

output format:
```
missing:
- component X not implemented
- behavior Y has no code

unspecified:
- file Z exists but not in spec

contradictions:
- spec says A, code does B
```

be concise. if nothing to report for a category, omit it.

SPECS:
{specs}""",

        "plan": f"""you are owl. plan implementation from these specs for {dir}.

output format:
```
1. implement <component/behavior name>
   - specific task
   - specific task

2. implement <component/behavior name>
   - specific task

questions:
- spec unclear on X, assuming Y
```

do NOT implement. just plan. if spec already implemented: "nothing to do"

SPECS:
{specs}""",

        "apply": f"""you are owl. implement these specs in {dir}.

rules:
- follow constraints strictly
- one component at a time
- verify each matches spec
- be minimal

output format for each component:
```
implementing: <component name>
  - created <file>
  - added <feature>
```

at end:
```
done. N components implemented.
```

on ambiguity: stop and ask.
on error: report and pause.
on constraint violation: refuse and explain.

SPECS:
{specs}""",

        "drift": f"""you are owl. detect drift between specs and code in {dir}.

report ONLY:
1. behavioral drift (code contradicts spec)
2. scope creep (code exceeds spec)
3. partial implementations

output format:
```
drift detected:

behavioral:
- <what contradicts>

scope creep:
- <what exceeds spec>

partial:
- <component> N% implemented
  - missing: <what>
```

if no drift: "code matches spec"

SPECS:
{specs}"""
    }

    prompt = prompts.get(behavior)
    if not prompt:
        print(f"error: unknown behavior '{behavior}'", file=sys.stderr)
        return False

    if executor == "human":
        return execute_human(prompt, dir)
    elif executor == "agentchat":
        return execute_agentchat(prompt, dir)
    else:
        interactive = behavior == "apply"
        return execute_claude(prompt, interactive=interactive, auto_yes=auto_yes)


# =============================================================================
# cli component
# =============================================================================

def cmd_init(dir: Path):
    """create initial spec files"""
    if (dir / "product.md").exists():
        print("error: product.md already exists", file=sys.stderr)
        sys.exit(1)

    (dir / "product.md").write_text("""# my product

one sentence description.

## components

- [component](components/component.md) - what it does

## behaviors

- [behavior](behaviors/behavior.md) - how it works

## constraints

see [constraints.md](constraints.md)
""")

    (dir / "constraints.md").write_text("""# constraints

## style

- describe preferences

## dependencies

- minimal
""")

    (dir / "components").mkdir(exist_ok=True)
    (dir / "behaviors").mkdir(exist_ok=True)

    # add .owl to gitignore
    gitignore = dir / ".gitignore"
    if gitignore.exists():
        content = gitignore.read_text()
        if ".owl/" not in content:
            gitignore.write_text(content + "\n.owl/\n")
    else:
        gitignore.write_text(".owl/\n")

    print("created product.md, constraints.md, components/, behaviors/")


def cmd_status(dir: Path, specs: dict[str, Path]):
    """compare spec to reality"""
    spec_content, hashes = read_specs_content(specs)
    state = load_state(dir)

    # report stale specs
    stale = []
    for key in specs:
        status = get_spec_status(key, hashes.get(key, ""), state)
        if status == "stale":
            stale.append(key)

    if stale:
        print(f"stale specs (changed since last apply): {', '.join(stale)}\n")

    execute("status", spec_content, dir, {"executor": "claude"})


def cmd_plan(dir: Path, specs: dict[str, Path]):
    """show what would change"""
    spec_content, hashes = read_specs_content(specs)
    state = load_state(dir)
    spec_hash = compute_spec_hash(specs)

    if state.get("spec_hash") == spec_hash:
        print("spec unchanged since last apply.")
        print("use 'owl drift' to check if code still matches.\n")

    execute("plan", spec_content, dir, {"executor": "claude"})


def cmd_apply(dir: Path, specs: dict[str, Path], auto_yes: bool = False, executor: str = "claude"):
    """build what's missing"""
    spec_content, hashes = read_specs_content(specs)
    state = load_state(dir)
    spec_hash = compute_spec_hash(specs)

    if state.get("spec_hash") == spec_hash:
        print("spec already satisfied. nothing to apply.")
        print("use 'owl drift' to verify, or delete .owl/state.json to force re-apply.")
        return

    broadcast(f"owl apply started")

    success = execute("apply", spec_content, dir, {
        "executor": executor,
        "auto_yes": auto_yes
    })

    if success:
        new_state = build_state(specs, hashes)
        save_state(dir, new_state)
        print(f"\nstate saved to .owl/state.json")
        broadcast(f"owl apply complete")


def cmd_drift(dir: Path, specs: dict[str, Path]):
    """check for divergence"""
    spec_content, _ = read_specs_content(specs)
    execute("drift", spec_content, dir, {"executor": "claude"})


def main():
    parser = argparse.ArgumentParser(
        description="owl - natural language terraform for products"
    )
    parser.add_argument("command", nargs="?", choices=["init", "status", "plan", "apply", "drift"],
                       help="command to run")
    parser.add_argument("-d", "--dir", type=Path, default=Path.cwd(),
                       help="project directory")
    parser.add_argument("-s", "--spec", type=Path, default=None,
                       help="spec file path (default: product.md)")
    parser.add_argument("-e", "--executor", choices=["claude", "agentchat", "human"],
                       default="claude", help="executor to use")
    parser.add_argument("-y", "--yes", action="store_true",
                       help="auto-approve changes")
    parser.add_argument("-b", "--broadcast", type=str, metavar="CHANNEL",
                       help="broadcast updates to agentchat channel")
    parser.add_argument("--version", action="version", version=f"owl {VERSION}")

    args = parser.parse_args()

    # prints help on unknown/missing command
    if not args.command:
        parser.print_help()
        sys.exit(0)

    dir = args.dir.resolve()

    global BROADCAST_CHANNEL
    if args.broadcast:
        BROADCAST_CHANNEL = args.broadcast
        broadcast(f"owl {args.command} started in {dir.name}")

    if args.command == "init":
        cmd_init(dir)
        sys.exit(0)

    # find root spec
    if args.spec:
        root = args.spec if args.spec.is_absolute() else dir / args.spec
        if not root.exists():
            print(f"error: spec file not found: {root}", file=sys.stderr)
            sys.exit(1)
    else:
        root = find_spec(dir)

    if not root:
        print(f"error: no product.md found in {dir}", file=sys.stderr)
        print("run 'owl init' to create one", file=sys.stderr)
        sys.exit(1)

    specs = gather_specs(dir, root)

    # returns empty dict if no specs found (per parser invariant)
    if not specs:
        print("nothing specified")
        sys.exit(0)

    if args.command == "status":
        cmd_status(dir, specs)
    elif args.command == "plan":
        cmd_plan(dir, specs)
    elif args.command == "apply":
        cmd_apply(dir, specs, args.yes, args.executor)
    elif args.command == "drift":
        cmd_drift(dir, specs)

    sys.exit(0)


if __name__ == "__main__":
    main()
