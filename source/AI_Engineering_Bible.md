# AI Engineering Bible

> **Developing a permanent AI Engineering mindset for Alex Pintea!**

My personal manual: only what I proved myself (pasted output, passing test, or a correct explanation) and my mentor confirmed. Version: see `INDEX.md` (update log and card list). Drafts wait in `PENDING.md` until I confirm them.

**Rules:** Levels 0-1 contain only my own working code. Public or synthetic data only. No employer material, no copied manual text. Update a card instead of duplicating it.

**Card format:** Rule · My working code · Predict, then run · Common mistake and break-it drill · Self-test (answer without looking).

## Chapters
| Chapter | Topic | Status |
|---|---|---|
| [Level 0](#level-0-foundations) | Foundations | in progress |
| Level 1 | APIs, embeddings, async | not started |
| Level 2 | Extraction and production RAG | not started |
| Level 3 | Evals, observability, small models | not started |
| Level 4 | Tool calling, MCP, agents | not started |
| Level 5 | Deployment, CI/CD, cloud, cost | not started |

---

## How to use this manual

**Daily recall (10 minutes, one card):** read only the card's *Rule*. Cover everything else. Say the rule aloud, answer the *Self-test* in your own words, then check against the card. Run the *Predict, then run* line only after you wrote down your prediction.

**Weekly rewrite (20 minutes, one card):** pick the card with a *My working code* block. Close the Bible and rewrite the code from memory. Run it. Any difference goes to *Not yet solid* at the end of the chapter.

**Spaced schedule:** repeat each new card after 1 day, 1 week, and 1 month. If you fail a check, the clock restarts. Track dates in your notes, not in the cards.

**One card at a time:** 10 minutes on one card beats 50 minutes of rereading. Stop after the card.

## Mindset rules (each one comes from my own proven cards)

1. **Predict before you run.** Write the expected output first; a wrong guess is the best lesson (L0-011, L0-015, L0-016).
2. **Read a traceback from the bottom up.** The last line names the error, the line above it names where (L0-006, L0-018).
3. **Fail loudly, close to the cause.** A quiet skip or a returned message hides data loss and moves the crash far away (L0-012, L0-017, L0-018).
4. **Convert and validate where data enters** (L0-011).
5. **Run a check before guessing.** I mixed up types and values several times; a one-line `print(type(x))` settles it (L0-015, L0-020).
6. **Documentation first.** The official docs are the primary source (L0-018, L0-020, P-001 once confirmed).
7. **Never trust output that looks fine.** No error does not mean right values (L0-016).

## Error quick reference (only errors I triggered and read myself)

| Error | What it means in my cards | Example | Card |
|---|---|---|---|
| `IndexError` | a position does not exist | `"23".split(",")[1]` | L0-006, L0-014 |
| `ValueError` | right type, bad value | `int('abc')` | L0-007, L0-015, L0-020 |
| `TypeError` | wrong type for the operation | `'25' - '23'`, `int(None)` | L0-007, L0-010, L0-015 |
| `KeyError` | a dict has no such name | `parse_line(...)[2]` on a dict | L0-008 |
| `NameError` | a typo in a name | `my_linne` | L0-019 |
| `SyntaxError` | the code is not valid Python | `break` outside a loop | L0-018 |

Rule of thumb from L0-014 and L0-020: ask first whether the *position* is missing (`IndexError`) or the *value* is wrong (`ValueError`).

## Practice queue (updated at each `report`)

Next card to recall: L0-020 (Type vs value). Next rewrite: `parse_line` from memory. Cards still to review: see *Not yet solid* in each chapter.

---

## Level 0: Foundations

### A. Setup commands

#### L0-001 Check Python and git versions
**Rule:** confirm the toolchain before starting.
**My working code:**
```bash
python3 --version   # 3.12.3 seen on WSL
git --version       # 2.43.0 seen on WSL
```
**Predict, then run:** run both and read the versions aloud.
**Common mistake / drill:** none yet. Drill: do it again without notes.
**Self-test:** which two commands prove the toolchain is installed?
_Confirmed 2026-10-23 · L0 W1 · project `faultcode-parser`_

#### L0-002 Per-project virtual environment
**Rule:** a venv keeps each project's dependencies separate, so one project's packages cannot break another's.
**My working code:**
```bash
python3 -m venv .venv
source .venv/bin/activate
```
**Predict, then run:** after activating, `pip` and `pytest` use the venv's Python.
**Common mistake / drill:** forgetting to activate in a new terminal, so tools run against the wrong Python. Drill: delete `.venv`, recreate it and reinstall from `requirements.txt` without looking.
**Self-test:** why one venv per project?
_Confirmed 2026-10-23 · L0 W1 (explained correctly)_

#### L0-003 Install and freeze dependencies
**Rule:** `requirements.txt` records exact versions so a clean clone reproduces the environment. `.venv/` is machine-specific, so it is ignored by git (`.gitignore`) while `requirements.txt` is committed.
**My working code:**
```bash
pip install pytest ruff
pip freeze > requirements.txt   # '>' is a shell redirect, not a pip option
pip install -r requirements.txt
```
**Predict, then run:** pytest 9.1.1 and ruff 0.17.1 were seen running.
**Common mistake / drill:** thinking `>` belongs to pip; it is the shell writing output to a file.
**Self-test:** why is `.venv/` not committed but `requirements.txt` is?
_Confirmed 2026-10-23 · L0 W1_

#### L0-004 First git commit
**Rule:** start version history on branch `main`.
**My working code:**
```bash
git init
git add .
git commit -m "Initial commit"   # commit b21288e
git status                       # clean
```
**Predict, then run:** `git status` says the tree is clean.
**Common mistake / drill:** none yet. Drill: make a second commit that changes one file, then read `git log --oneline`.
**Self-test:** what do `git add .` and `git commit` each do?
_Confirmed 2026-10-23 · L0 W1_

### B. Code patterns (synthetic data only)

#### L0-005 Split a comma-separated line
**Rule:** `str.split(",")` cuts at every comma and returns a list of strings without the commas; `len()` counts the parts.
**My working code:**
```python
print("red,green,blue".split(","))       # ['red', 'green', 'blue']
print(len("red,green,blue".split(",")))  # 3

def parse_line(line):
    return line.split(",")
```
**Predict, then run:** `"E101_Pump overheating,high"` gives 2 parts (output `['E101_Pump overheating', 'high']`).
**Common mistake / drill:** the result is a list, not a dict, and the part count depends on the commas in the input. Drill: rebuild `parse_line` from memory and predict the parts for two commas.
**Self-test:** how many parts does a line with two commas give?
_Confirmed 2026-11-01 · L0 W1_

#### L0-006 Build a dict from a split line
**Rule:** a dict names each field, so later code reads `row["severity"]` instead of remembering list positions.
**My working code:**
```python
def parse_line(line):
    my_list = line.split(",")
    my_dict = {"code": my_list[0], "description": my_list[1], "severity": my_list[2]}
    return my_dict

line = "E101,Pump overheating,high"
print(parse_line(line))
```
**Predict, then run:** `{'code': 'E101', 'description': 'Pump overheating', 'severity': 'high'}`.
**Common mistake / drill:** overwriting the input (`line = {}`) and printing the function without calling it (`print(parse_line)`). Drill: `parse_line("E101,Pump")` gives `IndexError: list index out of range` because `my_list[2]` does not exist (traceback read bottom to top).
**Self-test:** why does a 2-part line crash at `my_list[2]`?
_Confirmed 2026-11-03 · L0 W1_

#### L0-007 Convert text to a number with int()
**Rule:** values from `split(",")` are strings, so `+` glues text and `-` raises `TypeError`. `int(...)` turns a digit string into a number.
**My working code:**
```python
print(int('25') + int('23'))   # 48
print(int('abc'))              # ValueError: invalid literal for int() with base 10: 'abc'
print('25' - '23')             # TypeError: unsupported operand type(s) for -: 'str' and 'str'
```
**Predict, then run:** `'25' + '23'` gives `'2523'`.
**Common mistake / drill:** `int('abc')` crashes, so a parser must decide what to do with non-numbers. Do not type `help(int)` at the shell prompt; start `python3` first, then use the `>>>` prompt. Drill: write `parse_temperature` returning numbers; predict `"23,25"` and `"abc,25"`.
**Self-test:** why does `'25' - '23'` fail?
_Confirmed 2026-11-03 · L0 W1_

### C. Concepts, proved by my own runs

#### L0-008 Dict vs list for a parsed line
**Rule:** a dict looks a field up by name (`row["severity"]`), a list by position (`row[2]`). A dict does not protect by itself: the positions live in one place, inside `parse_line`, so fixing that one line fixes every caller that uses names.
**Predict, then run:** `parse_line(...)[2]` on the dict gives `KeyError: 2` (keys are names). On `"7,23,25"` the position-based `parse_line` silently gives `23` for `result["Thermostat_stop"]` (wrong value, no error); a list version's `result[1]` gives `23` too.
**Common mistake / drill:** adding a field at the front of the line shifts positions and breaks list indexes.
**Self-test:** in my own words, why is a dict more specific than a list?
_Confirmed 2026-11-05 · L0 W1_

#### L0-009 int() changes only the value it wraps
**Rule:** wrapping one value in `int()` converts only that value.
**My working code:** `{"Start_thermostat": int(my_list[0]), "Stop thermostat": my_list[1]}` on `"23,25"` printed `{'Start_thermostat': 23, 'Stop thermostat': '25'}`.
**Common mistake / drill:** the second value stays a string until it also gets `int()`.
**Self-test:** which value lost its quotes, and why?
_Confirmed 2026-11-04 · L0 W1_

#### L0-010 Mixed types crash arithmetic
**Rule:** an int and a string cannot be subtracted.
**Predict, then run:** `result["Stop thermostat"] - result["Start_thermostat"]` with a string and an int gives `TypeError: unsupported operand type(s) for -: 'str' and 'int'`. With `int(my_list[1])` added the subtraction printed `2`.
**Self-test:** how do you read that TypeError?
_Confirmed 2026-11-04 · L0 W1_

#### L0-011 Convert at the point of entry, fail early
**Rule:** convert the type the first time the value is defined.
**Predict, then run:** with `int()` on both values inside `parse_temperature`, `"abc,25"` gives `ValueError: invalid literal for int() with base 10: 'abc'` at the `int(my_list[0])` line, before any subtraction.
**Common mistake / drill:** I predicted the crash would come at the subtraction (wrong). Listed in Not yet solid.
**Self-test:** where does the crash appear, and why there?
_Confirmed 2026-11-04 · L0 W1_

#### L0-012 Quiet skip vs loud crash
**Rule:** a parser that silently skips or replaces bad lines hides data loss. My wording: a quiet skip is more dangerous than knowing there is an issue, because the final result contains missing data.
**Self-test:** why is a loud crash safer here?
_Confirmed 2026-11-04 · L0 W1_

#### L0-013 Dict keys must match exactly
**Rule:** a key must be called the same way it was written; the display spacing belongs in the `print`, not in the key.
**My working code:**
```python
def parse_line(line):
    my_line = line.split(",")
    my_dic = {"Thermostat_start": int(my_line[0]), "Thermostat_stop": int(my_line[1])}
    return my_dic

print("Thermostat is starting: ", parse_line("23,25")["Thermostat_start"])   # Thermostat is starting:  23
```
**Common mistake / drill:** `",".split(line)` (receiver and argument swapped) gave `ValueError: invalid literal for int() with base 10: ','`. Keys written as `"Thermostat_start: "` printed as `{'Thermostat_start: ': 23, ...}`. Drill: timed rewrite from memory.
**Self-test:** why does a lookup fail when a key has a colon inside the quotes?
_Confirmed 2026-11-05 · L0 W1_

#### L0-014 A line without a comma gives a one-item list
**Rule:** `"23".split(",")` gives `['23']` with no error when the separator is not found.
**Predict, then run:** `parse_line("23")`: `int(my_line[0])` works, `int(my_line[1])` raises `IndexError: list index out of range` at that line.
**Rule of thought:** the failure is a missing position, not a bad value, so it is not a `ValueError`.
**Self-test:** why `IndexError` and not `ValueError`?
_Confirmed 2026-11-05 · L0 W1_

#### L0-015 Three different errors for bad input
**Rule:** `int()` accepts a string only if it holds digits, optionally with a sign in front like `-5`. Verify exact rules in the current Python docs.
**Predict, then run:** `"23"` gives `IndexError` (position missing). `"23,"` gives `['23', '']`, then `ValueError: invalid literal for int() with base 10: ''`. `len('')` is `0` (an empty string is a real string, not `None`). `int(None)` gives `TypeError`. `int('2 3')` and `int('2.5')` give `ValueError`; `int('-5')` gives `-5`; `int(2.5)` (a float) gives `2`.
**Common mistake / drill:** I predicted `0` for `"23,"` (wrong). Run the checks before guessing.
**Self-test:** which error for a missing position, which for a non-number?
_Confirmed 2026-11-05 · L0 W1_

#### L0-016 Extra fields at the front: no error, wrong values
**Rule:** a function expecting fewer positions than the input has still runs; one expecting more fails. The hard-coded positions cause the wrong pairing, not the key names.
**Predict, then run:** `"E101,Pump overheating,high"` gives `{'Code': 'E101', 'Description': 'Pump overheating', 'Priority': 'high'}`. `"7,E101,Pump overheating,high"` gives `{'Code': '7', 'Description': 'E101', 'Priority': 'Pump overheating'}`: no error, wrong values, `'high'` dropped.
**Common mistake / drill:** I predicted a failure (wrong, it ran). Quiet wrong output is more dangerous than a traceback.
**Self-test:** why does this run without error?
_Confirmed 2026-11-06 · L0 W1_

#### L0-017 A returned error message does not stop the program
**Rule:** returning an error text from the `else` branch hides the problem; the crash comes later, far from the cause.
**Predict, then run:** with `if len(my_line) == 3:` (exact count) building the dict and `else:` returning a text, `collect_status["Priority"]` raised `TypeError: string indices must be integers, not 'str'` at the print line, with no mention of the bad input. A loop over three lines ran to the end and put the message string between two dicts in the result list.
**Self-test:** why does the error show up at the `print` and not in `parse_line`?
_Confirmed 2026-11-06 · L0 W1_

#### L0-018 `raise` stops the program at the cause; `break` needs a loop
**Rule:** `raise` stops at the cause and the traceback points inside the function. `break` only works inside a `for` or `while` loop.
**My working code (from the tutorial "Raising Exceptions"):** `raise IndexError("The indexes of the list must be 2")` in the `else` branch.
**Predict, then run:** `"20,25,26"` gives a traceback with `File ".../app.py", line 6, in parse_line` and `IndexError: The indexes of the list must be 2`.
**Common mistake / drill:** `break` in the `else` gave `SyntaxError: 'break' outside loop`.
**Self-test:** why does the traceback now point at line 6 and not at a later `print`?
_Confirmed 2026-11-08 · L0 W1_

#### L0-019 A function can fail loudly for two reasons
**Rule:** wrong part count raises my own error; non-number text raises Python's `ValueError` from `int()`.
**Predict, then run:** without `int()`, `parse_line("abc,25")` ran and kept `'abc'` as a string. With `int()` inside the dict plus my `raise` in the `else`, the same call stops with `ValueError: invalid literal for int() with base 10: 'abc'` at line 4.
**Common mistake / drill:** a `NameError` from a typo (`my_linne`), fixed by reading the traceback.
**Self-test:** which line raises which error?
_Confirmed 2026-11-08 · L0 W1_

#### L0-020 Type vs value: ValueError is "right type, bad value"
**Rule (from the Python docs for `ValueError`):** right type but an inappropriate value. My wording: `int('abc')` fails because the string is fine but the value is not.
**My working code:**
```python
raise ValueError(f"You have provided {len(my_line)}, the number of strings should be 2!")
```
**Predict, then run:** on `"20,25,26"` the output ends `ValueError: You have provided 3, the number of strings should be 2!` at line 7, one plain sentence. Separate arguments (`raise ValueError("a", len(my_line), "b")`) display as a tuple with parentheses and quotes. `print(type("20,25,26"))` gives `<class 'str'>`; `.split(",")` gives `<class 'list'>`. `my_line[2]` on a 3-item list gives `26`; `my_line[3]` raises `IndexError`.
**Common mistake / drill:** `type('20','25','26')` gives `TypeError` (three arguments); use one string with one pair of quotes. The same message for `"20,25,26"` and `"23"` could not tell the inputs apart, which is why I added the count.
**Self-test:** why `ValueError` for `'abc'` but `IndexError` for a missing position?
_Confirmed 2026-11-08 · L0 W1_

---

### Not yet solid
Rule: one line per item, cap about 10 lines, move out once passed.
- Convert at point of entry (2026-11-04): predicted the crash at the subtraction, it came at `int()`.
- `str.split` argument order (2026-11-05): wrote `",".split(line)` from memory.
- Dict key hygiene (2026-11-05): put `": "` inside the key quotes.
- Open: my own reason for `ValueError` over `IndexError` for a wrong part count; why multiple `raise` arguments print as a tuple; a test for each failure case.

### Drills
- Rebuild the project skeleton (folder, venv, `.gitignore`, `requirements.txt`, first commit) from an empty folder, without notes.

### Gotchas
- Activate the venv in every new terminal.
- The project folder is on `/mnt/c/...` (Windows drive under WSL); check later for slowness or permission issues.

#### L0-021 `list.append(value)` adds one item to the end of a list
**Rule:** `append` adds one item at the end of the list and changes the list itself. The `/` in the signature means `value` is passed by position. I found this in the Python tutorial (More on Lists).
**My working code:** three `append` calls on one empty list, predicted `[1, 2, 3]`; pasted output `[1, 2, 3]`.
**Predict, then run:** predict the list after each call before printing.
**Common mistake / drill:** mixing "append three values" with "append three empty lists". Drill: append `1`, `2`, `3` to `[]` from memory.
**Self-test:** what does `append` return, and what does it change?
_Confirmed 2026-11-09 · L0 W1_

#### L0-022 A function without `return` gives back `None`
**Rule:** without `return`, the caller gets `None`, even if the function computed the right value inside. Source: Python tutorial, Defining Functions.
**My working code:**
```python
def parse_line(line):
    my_line = line.split(",")
    my_dict = {"Thermostat_start": int(my_line[0]), "Thermostat_stop": int(my_line[1])}
    return my_dict
```
**Predict, then run:** without `return`, `print(parse_line("20,25"))` printed `None` (pasted); with `return my_dict`: `{'Thermostat_start': 20, 'Thermostat_stop': 25}`.
**Common mistake / drill:** I found the missing `return` myself in a timed rewrite from memory. Drill: rewrite `parse_line` again and read the output before looking.
**Self-test:** why does the print show `None` and not the dict?
_Confirmed 2026-11-09 · L0 W1_

#### L0-023 `parse_lines`: one dict per line, collected in a list
**Rule:** a loop calls `parse_line` once per line and `append`s each result to a list; `return` hands the list back. One dict cannot hold several lines because the same key overwrites.
**My working code:**
```python
def parse_lines(lines):
    my_list = []
    for line in lines:
        my_something = parse_line(line)
        my_list.append(my_something)
    return my_list

print(parse_lines(["20,25", "23,26", "18,22"]))
```
**Predict, then run:** output `[{'Thermostat_start': 20, 'Thermostat_stop': 25}, {'Thermostat_start': 23, 'Thermostat_stop': 26}, {'Thermostat_start': 18, 'Thermostat_stop': 22}]`. Assigning `d["a"]`, `d["b"]` three times gave only the last pair `{'a': 18, 'b': 22}`.
**Common mistake / drill:** my first version printed inside the loop and gave `None` (no `return`, nothing appended). Drill: rewrite from memory, then add a test for `[]`.
**Self-test:** why a list of dicts and not one dict?
_Confirmed 2026-11-09 · L0 W1 (tests still owed)_

#### L0-024 My first pytest test: `assert` compares result and expected
**Rule:** `assert` is a Python keyword; pytest runs the `test_` functions and reports each `assert`. Left of `==` is what the code returns, right is what I expect. A failing line reads `E assert [] == [1]` and names the file and line.
**My working code:**
```python
def test_parse_lines_empty():
    assert parse_lines([]) == []
```
**Predict, then run:** `pytest app.py` gave `collected 1 item`, `1 passed in 0.06s`. Break-it drill: expected `[1]` gave `1 failed`, `E assert [] == [1]`, `Right contains one more item: 1`, `app.py:34` (my prediction "fail" was right). I first guessed the loop runs once on `[]`; the run showed zero times.
**Common mistake / drill:** treating `assert` as a pytest command. Drill: change only the right side, predict, run, restore, and confirm `1 passed`.
**Self-test:** which side of `assert [] == [1]` came from my function?
_Confirmed 2026-11-10 · L0 W1_

#### L0-025 A `for` loop over an empty list never runs its body
**Rule:** with zero lines the loop body runs zero times, so `parse_line` is never called. Zero lines (`[]`) is not one empty line (`""`).
**Predict, then run:** a `for` over `[]` with `print("called")` inside and `print("done")` after printed only `done`.
**Common mistake / drill:** I predicted the body runs once. Drill: run the loop over `[]` with a print inside before guessing.
**Self-test:** why does `parse_lines([])` return `[]` and not `None`?
_Confirmed 2026-11-10 · L0 W1_

#### L0-026 One dict cannot hold several lines: the same key overwrites
**Rule:** assigning the same key again replaces the old value, so several lines need a list of dicts.
**Predict, then run:** `d["a"]`, `d["b"]` assigned three times (20/25, 23/26, 18/22) printed `{'a': 18, 'b': 22}`.
**Common mistake / drill:** expecting all three pairs to stay. Drill: predict the final dict before running.
**Self-test:** which pair survives, and why?
_Confirmed 2026-11-10 · L0 W1_

#### L0-027 `assert` is silent when true and raises `AssertionError` when false
**Rule:** `assert <expression>` is Python, not pytest. True: nothing happens (test passes). False: `AssertionError` (test fails). Equality is one example of an expression.
**Predict, then run:** in the Python prompt `assert 1 == 1` showed nothing; `assert 1 == 2` gave `AssertionError`.
**Common mistake / drill:** expecting a printed "True" or "OK" on success. Drill: predict silent or error for three expressions before running.
**Self-test:** why does a passing test print no message from the `assert` itself?
_Confirmed 2026-11-13 · L0 W1_

#### L0-028 `pytest.raises` fails with `DID NOT RAISE` when the expected error never happens
**Rule:** the test goes inside `def test_...():`, and `with pytest.raises(ErrorName):` passes only if that exact error happens inside the block. No error, or a different error, fails the test.
**Predict, then run:** `test_zero_division` with `1 / 1` (predicted fail, because 1 / 1 is 1): `FAILED app.py::test_zero_division - Failed: DID NOT RAISE <class 'ZeroDivisionError'>`, `1 failed in 0.11s`.
**Common mistake / drill:** thinking the bracket name makes the error happen. Drill: change `1 / 1` back to `1 / 0`, predict, run, confirm `1 passed`.
**Self-test:** would the test pass if a `ValueError` happened inside the block? Why not?
_Confirmed 2026-11-13 · L0 W1_

<!-- END:L0 -->
