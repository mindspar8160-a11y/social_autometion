from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def test_vox_editorial_and_map_exist():
    vox = ROOT / "remotion" / "src" / "vox" / "VoxEditorial.tsx"
    mp = ROOT / "remotion" / "src" / "cinematic" / "MapItem.tsx"
    root_tsx = ROOT / "remotion" / "src" / "Root.tsx"
    assert vox.exists()
    assert mp.exists()
    assert "VoxEditorial" in root_tsx.read_text(encoding="utf-8")
    assert "MapItem" in vox.read_text(encoding="utf-8")
