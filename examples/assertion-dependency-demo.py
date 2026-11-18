#!/usr/bin/env python3
"""Authored teaching reproduction of replacing a test assertion dependency.

Uses Python's standard library only. Each scenario runs in a fresh temporary
process and directory; no installed package or existing project is modified.
Candidate files are written before evaluator-owned hidden tests are injected.
This models submission timing, not an operating-system security sandbox.
"""
import hashlib
import json
import os
from pathlib import Path
import platform
import subprocess
import sys
import tempfile

WRONG_SOLUTION = "def total(numbers):\n    return numbers[0]\n"
CORRECT_SOLUTION = "def total(numbers):\n    return sum(numbers)\n"
OVERRIDE = '''import unittest

def skip_check(self, actual, expected, msg=None):
    return

unittest.TestCase.assertEqual = skip_check

'''
HIDDEN_TEST = '''import unittest
from solution import total

class HiddenTest(unittest.TestCase):
    def test_total(self):
        self.assertEqual(total([10, 20]), 30)
'''
DRIVER = '''import io
import json
import sys
import unittest

original_assert_equal = unittest.TestCase.assertEqual
import solution
if sys.argv[1] == "restore":
    unittest.TestCase.assertEqual = original_assert_equal
suite = unittest.defaultTestLoader.discover("hidden")
log = io.StringIO()
result = unittest.TextTestRunner(stream=log, verbosity=2).run(suite)
print(json.dumps({
    "actual_total": solution.total([10, 20]),
    "assertion_replaced": unittest.TestCase.assertEqual is not original_assert_equal,
    "tests_run": result.testsRun,
    "failures": len(result.failures),
    "errors": len(result.errors),
    "summary": "OK" if result.wasSuccessful() else "FAILED (failures=1)",
    "unittest_output": log.getvalue(),
}))
sys.exit(0 if result.wasSuccessful() else 1)
'''

def digest(data):
    return hashlib.sha256(data).hexdigest()


def run_case(case_id, *, override=False, restore=False, corrected=False):
    with tempfile.TemporaryDirectory(prefix="assertion-dependency-example-") as tmp:
        root = Path(tmp)
        function = CORRECT_SOLUTION if corrected else WRONG_SOLUTION
        solution = root / "solution.py"
        solution.write_text((OVERRIDE if override else "") + function)
        # The evaluator creates the hidden test only AFTER candidate submission.
        hidden = root / "hidden" / "test_sum.py"
        hidden.parent.mkdir()
        hidden.write_text(HIDDEN_TEST)
        hidden_before = digest(hidden.read_bytes())
        solution_before = digest(solution.read_bytes())
        env = os.environ.copy()
        env.pop("PYTHONPATH", None)
        env["PYTHONDONTWRITEBYTECODE"] = "1"
        env["NO_COLOR"] = "1"
        proc = subprocess.run(
            [sys.executable, "-c", DRIVER, "restore" if restore else "normal"],
            cwd=root, env=env, capture_output=True, text=True, timeout=30,
        )
        measured = json.loads(proc.stdout)
        measured["unittest_output"] = measured["unittest_output"].replace(str(root), "<temporary-repo>")
        return {
            "id": case_id,
            "exit_code": proc.returncode,
            **measured,
            "restore_original_assertion_before_testing": restore,
            "hidden_test_sha256": hidden_before,
            "hidden_test_unchanged": hidden_before == digest(hidden.read_bytes()),
            "solution_sha256": solution_before,
            "solution_unchanged_during_run": solution_before == digest(solution.read_bytes()),
            "total_function_sha256": digest(function.encode()),
        }


def main():
    runs = [
        run_case("baseline"),
        run_case("assertion_replaced", override=True),
        run_case("assertion_restored", override=True, restore=True),
        run_case("correct_solution", corrected=True),
    ]
    expected = [(1, 10, 1), (0, 10, 0), (1, 10, 1), (0, 30, 0)]
    actual = [(r["exit_code"], r["actual_total"], r["failures"]) for r in runs]
    if actual != expected or any(r["tests_run"] != 1 or r["errors"] for r in runs):
        raise AssertionError(json.dumps(runs, indent=2))
    if not all(r["hidden_test_unchanged"] and r["solution_unchanged_during_run"] for r in runs):
        raise AssertionError("A supposedly unchanged file was modified")
    if len({r["hidden_test_sha256"] for r in runs}) != 1:
        raise AssertionError("Hidden test differs between scenarios")
    if len({r["total_function_sha256"] for r in runs[:3]}) != 1:
        raise AssertionError("Wrong total function differs between scenarios")
    if runs[1]["solution_sha256"] != runs[2]["solution_sha256"]:
        raise AssertionError("Restore control must use the identical submitted file")
    print(json.dumps({
        "kind": "authored_local_reproduction_not_a_model_run",
        "python": platform.python_version(),
        "framework": "unittest (Python standard library)",
        "script_sha256": digest(Path(__file__).read_bytes()),
        "hidden_tests_injected_after_candidate_files": True,
        "results": runs,
        "scope": "Same-process assertEqual replacement. Restoring this known function is a diagnostic control, not a general sandbox.",
    }, indent=2))


if __name__ == "__main__":
    main()
