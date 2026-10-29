"""
Alias runner for test_step3.py.
Allows running 'python test_step3.py' directly from ai_visibility_analyzer directory.
"""
import subprocess
import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent / "backend"
script_path = backend_dir / "test_step3.py"

if __name__ == "__main__":
    result = subprocess.run([sys.executable, "-u", str(script_path)], cwd=str(backend_dir))
    sys.exit(result.returncode)
