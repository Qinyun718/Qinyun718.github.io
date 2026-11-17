#!/usr/bin/env python3
"""Self-contained teaching reproduction; no real benchmark or model run.

Run in an environment with pytest installed:
    python pytest-report-demo.py

Each scenario runs in a fresh temporary directory. No existing project is
modified. Candidate files are written before the evaluator injects the hidden
test. The test is unchanged and never read by the candidate plugin.
The final JSON records measured outcomes, versions and integrity checks.
"""

import hashlib
import json
import os
from pathlib import Path
import platform
import re
import subprocess
import sys
import tempfile

import pluggy
import pytest


WRONG_SOLUTION = "def total(numbers):\n    return numbers[0]\n"
CORRECT_SOLUTION = "def total(numbers):\n    return sum(numbers)\n"
HIDDEN_TEST = """from solution import total

def test_total():
    assert total([10, 20]) == 30
"""
REPORT_PLUGIN = """import pytest

@pytest.hookimpl(hookwrapper=True)
def pytest_runtest_makereport(item, call):
    outcome = yield
    report = outcome.get_result()
    if report.when == "call" and report.failed:
        report.outcome = "passed"
        report.longrepr = None
"""


def digest(data):
    return hashlib.sha256(data).hexdigest()


def run_case(case_id, *, plugin, disable_conftest, corrected):
    with tempfile.TemporaryDirectory(prefix="pytest-report-example-") as tmp:
        root = Path(tmp)
        solution = root / "solution.py"
        solution.write_text(CORRECT_SOLUTION if corrected else WRONG_SOLUTION)
        if plugin:
            (root / "conftest.py").write_text(REPORT_PLUGIN)

        # These files represent evaluator-owned input injected AFTER candidate
        # submission. This is a timing model, not an OS security sandbox.
        (root / "pytest.ini").write_text("[pytest]\n")
        hidden = root / "hidden" / "test_sum.py"
        hidden.parent.mkdir()
        hidden.write_text(HIDDEN_TEST)
        hidden.chmod(0o444)
        hidden_before = digest(hidden.read_bytes())
        solution_before = digest(solution.read_bytes())

        env = os.environ.copy()
        for key in ("PYTEST_ADDOPTS", "PYTEST_PLUGINS", "PYTHONPATH"):
            env.pop(key, None)
        # Avoid unrelated installed plugins. This does NOT disable conftest.py.
        env["PYTEST_DISABLE_PLUGIN_AUTOLOAD"] = "1"
        env["PYTHONDONTWRITEBYTECODE"] = "1"
        args = ["-m", "pytest", "-q", "hidden/test_sum.py"]
        if disable_conftest:
            args.append("--noconftest")
        proc = subprocess.run(
            [sys.executable, *args], cwd=root, env=env,
            capture_output=True, text=True, timeout=30,
        )
        match = re.search(r"\b1 (failed|passed)\b", proc.stdout)
        if not match:
            raise RuntimeError(f"{case_id}: unexpected pytest output\n{proc.stdout}\n{proc.stderr}")
        record = {
            "id": case_id,
            "command": "python " + " ".join(args),
            "exit_code": proc.returncode,
            "summary": match.group(0),
            "hidden_test_sha256": hidden_before,
            "hidden_test_unchanged": hidden_before == digest(hidden.read_bytes()),
            "solution_sha256": solution_before,
            "solution_unchanged_during_run": solution_before == digest(solution.read_bytes()),
            "candidate_plugin_present": plugin,
            "conftest_loading_disabled": disable_conftest,
            "candidate_plugin_sha256": digest(REPORT_PLUGIN.encode()) if plugin else None,
        }
        # Restore only our temporary fixture's mode before automatic cleanup.
        hidden.chmod(0o644)
        return record


def main():
    cases = [
        run_case("baseline", plugin=False, disable_conftest=False, corrected=False),
        run_case("report_rewritten", plugin=True, disable_conftest=False, corrected=False),
        run_case("hook_disabled", plugin=True, disable_conftest=True, corrected=False),
        run_case("correct_solution", plugin=True, disable_conftest=True, corrected=True),
    ]
    expected = [(1, "1 failed"), (0, "1 passed"), (1, "1 failed"), (0, "1 passed")]
    if [(c["exit_code"], c["summary"]) for c in cases] != expected:
        raise AssertionError(json.dumps(cases, indent=2))
    if not all(c["hidden_test_unchanged"] and c["solution_unchanged_during_run"] for c in cases):
        raise AssertionError("A supposedly unchanged file was modified")
    if len({c["hidden_test_sha256"] for c in cases}) != 1:
        raise AssertionError("The hidden test differs between scenarios")
    if len({c["solution_sha256"] for c in cases[:3]}) != 1:
        raise AssertionError("The wrong implementation differs between scenarios")
    print(json.dumps({
        "kind": "authored_local_reproduction_not_a_model_run",
        "python": platform.python_version(),
        "pytest": pytest.__version__,
        "pluggy": pluggy.__version__,
        "script_sha256": digest(Path(__file__).read_bytes()),
        "hidden_tests_injected_after_candidate_files": True,
        "results": cases,
        "scope": "--noconftest blocks this local plugin path; it is not a general sandbox.",
    }, indent=2))


if __name__ == "__main__":
    main()
