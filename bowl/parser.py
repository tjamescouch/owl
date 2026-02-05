"""bowl.parser - reads and links spec files"""

import re
import sys
from pathlib import Path


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
    missing = []

    def visit(path: Path, key: str):
        if path in visited:
            return
        if not path.exists():
            missing.append(str(path))
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

    # explicit constraints.md fallback if not linked
    constraints_path = dir / "constraints.md"
    if constraints_path.exists() and "constraints" not in specs:
        specs["constraints"] = constraints_path

    # warn about missing spec files
    if missing:
        print(f"warning: missing spec files: {', '.join(missing)}", file=sys.stderr)

    return specs


def parse(dir: str | Path) -> dict[str, Path]:
    """main entry point - parse a product directory"""
    dir = Path(dir)
    root = find_spec(dir)
    if not root:
        return {}
    return gather_specs(dir, root)
