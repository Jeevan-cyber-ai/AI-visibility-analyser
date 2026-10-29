"""
Convenience launcher for Milestone 1 test script.
Allows running directly from the ai_visibility_analyzer folder:
    python run_step1.py
"""
import subprocess
import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent / "backend"
script_path = backend_dir / "test_step1.py"

if __name__ == "__main__":
    result = subprocess.run([sys.executable, str(script_path)], cwd=str(backend_dir))
    sys.exit(result.returncode)
