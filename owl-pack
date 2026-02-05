#!/usr/bin/env python3
"""owl-pack - multi-agent owl via agentchat

a pack of owls working together. agents join, claim components, build.
"""

import argparse
import json
import subprocess
import sys
import time
from pathlib import Path

# agentchat config
SERVER = "wss://agentchat-server.fly.dev"
CHANNEL = "#owl"
AGENTCHAT_DIR = Path.home() / "dev/claude/agentchat"
AGENTCHAT_CLI = AGENTCHAT_DIR / "bin/agentchat.js"


def check_agentchat():
    """verify agentchat is available"""
    if not AGENTCHAT_CLI.exists():
        print("agentchat not found. installing...")
        try:
            subprocess.run(
                ["npm", "install", "-g", "@tjamescouch/agentchat"],
                check=True, capture_output=True
            )
        except Exception as e:
            print(f"failed to install agentchat: {e}", file=sys.stderr)
            print("install manually: npm install -g @tjamescouch/agentchat")
            sys.exit(1)
    return True


def send(msg: str):
    """send message to owl channel"""
    subprocess.run(
        ["node", str(AGENTCHAT_CLI), "send", SERVER, CHANNEL, msg],
        capture_output=True, timeout=10
    )


def listen(timeout: int = 30) -> list[dict]:
    """listen for messages"""
    result = subprocess.run(
        ["node", str(AGENTCHAT_CLI), "listen", SERVER, CHANNEL,
         "--timeout", str(timeout * 1000), "--json"],
        capture_output=True, text=True, timeout=timeout + 5
    )
    if result.returncode == 0 and result.stdout.strip():
        try:
            return json.loads(result.stdout).get("messages", [])
        except json.JSONDecodeError:
            return []
    return []


def get_identity() -> str:
    """get or create agent identity"""
    identity_file = Path.home() / ".agentchat/identity.json"
    if identity_file.exists():
        data = json.loads(identity_file.read_text())
        return data.get("agent_id", "unknown")
    return "unknown"


def gather_specs(dir: Path) -> dict:
    """import from main owl"""
    sys.path.insert(0, str(dir))

    # read product.md and linked specs
    product = dir / "product.md"
    if not product.exists():
        return {}

    specs = {"product": product}

    for subdir in ["components", "behaviors"]:
        path = dir / subdir
        if path.exists():
            for f in path.glob("*.md"):
                specs[f"{subdir}/{f.stem}"] = f

    constraints = dir / "constraints.md"
    if constraints.exists():
        specs["constraints"] = constraints

    return specs


def format_specs(specs: dict) -> str:
    """format specs for posting"""
    lines = []
    for key, path in sorted(specs.items()):
        lines.append(f"- {key}: {path.name}")
    return "\n".join(lines)


def cmd_summon(dir: Path, specs: dict):
    """summon agents to work on specs"""
    agent_id = get_identity()

    send(f"🦉 owl-pack summoned by {agent_id}")
    send(f"project: {dir.name}")
    send(f"specs:\n{format_specs(specs)}")
    send("agents: reply 'claim <component>' to take ownership")
    send("---")

    print(f"summoned pack to {CHANNEL}")
    print(f"specs posted: {len(specs)}")
    print("\nwaiting for agents to claim components...")
    print("(ctrl+c to stop watching)\n")

    claimed = {}

    try:
        while True:
            messages = listen(30)
            for msg in messages:
                content = msg.get("content", "")
                sender = msg.get("from", "")

                if content.lower().startswith("claim "):
                    component = content[6:].strip()
                    if component in specs and component not in claimed:
                        claimed[component] = sender
                        send(f"✓ {component} claimed by {sender}")
                        print(f"  {component} → {sender}")
                    elif component in claimed:
                        send(f"✗ {component} already claimed by {claimed[component]}")

                elif content.lower() == "status":
                    unclaimed = [k for k in specs if k not in claimed]
                    send(f"claimed: {len(claimed)}/{len(specs)}")
                    if unclaimed:
                        send(f"unclaimed: {', '.join(unclaimed)}")

                elif content.lower().startswith("done "):
                    component = content[5:].strip()
                    if component in claimed and claimed[component] == sender:
                        send(f"✓ {component} completed by {sender}")
                        print(f"  {component} ✓ done")
                        del claimed[component]

            if not claimed and len(specs) > 0:
                # all done or none claimed yet
                pass

    except KeyboardInterrupt:
        print("\nstopped watching")
        if claimed:
            print(f"still claimed: {list(claimed.keys())}")


def cmd_join(dir: Path):
    """join as a worker agent"""
    agent_id = get_identity()

    send(f"🦉 {agent_id} joining the pack")
    print(f"joined {CHANNEL} as {agent_id}")
    print("listening for tasks...\n")

    my_claims = []

    try:
        while True:
            messages = listen(30)
            for msg in messages:
                content = msg.get("content", "")
                sender = msg.get("from", "")

                # look for unclaimed components
                if "unclaimed:" in content.lower():
                    parts = content.split("unclaimed:")
                    if len(parts) > 1:
                        unclaimed = [c.strip() for c in parts[1].split(",")]
                        if unclaimed and unclaimed[0]:
                            # claim first unclaimed
                            component = unclaimed[0]
                            send(f"claim {component}")
                            my_claims.append(component)
                            print(f"claiming: {component}")

                # if we claimed something and it was confirmed
                if content.startswith("✓") and agent_id in content:
                    for claim in my_claims:
                        if claim in content:
                            print(f"confirmed: {claim}")
                            print(f"implementing {claim}...")

                            # invoke claude to implement
                            subprocess.run([
                                "claude", "-p",
                                f"implement {claim} according to its spec in {dir}"
                            ])

                            send(f"done {claim}")
                            my_claims.remove(claim)
                            print(f"completed: {claim}")

    except KeyboardInterrupt:
        if my_claims:
            send(f"🦉 {agent_id} leaving, releasing: {', '.join(my_claims)}")
        print("\nleft the pack")


def cmd_watch(dir: Path):
    """watch the channel passively"""
    print(f"watching {CHANNEL}...\n")

    try:
        while True:
            messages = listen(30)
            for msg in messages:
                sender = msg.get("from", "")
                content = msg.get("content", "")
                print(f"{sender}: {content}")
    except KeyboardInterrupt:
        print("\nstopped watching")


def main():
    parser = argparse.ArgumentParser(
        description="owl-pack - multi-agent owl via agentchat"
    )
    parser.add_argument("command", choices=["summon", "join", "watch"],
                       help="summon=post specs, join=work on claims, watch=observe")
    parser.add_argument("-d", "--dir", type=Path, default=Path.cwd(),
                       help="project directory")
    parser.add_argument("-c", "--channel", type=str, default="#owl",
                       help="agentchat channel")

    args = parser.parse_args()

    global CHANNEL
    CHANNEL = args.channel

    dir = args.dir.resolve()

    check_agentchat()

    specs = gather_specs(dir)

    if args.command == "summon":
        if not specs:
            print(f"no specs found in {dir}", file=sys.stderr)
            sys.exit(1)
        cmd_summon(dir, specs)
    elif args.command == "join":
        cmd_join(dir)
    elif args.command == "watch":
        cmd_watch(dir)


if __name__ == "__main__":
    main()
