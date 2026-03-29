import re


def simulate_lua(code: str, expected_output: str = None) -> dict:
    """Simple Lua code pattern-matching simulator."""
    output_lines = []
    error = None
    success = True

    code_clean = re.sub(r"--\[\[.*?\]\]", "", code, flags=re.DOTALL)
    code_clean = re.sub(r"--.*$", "", code_clean, flags=re.MULTILINE)

    # Basic syntax checks
    openers = len(re.findall(r"\b(function|if|for|while|do)\b", code_clean))
    enders = len(re.findall(r"\bend\b", code_clean))
    repeats = len(re.findall(r"\brepeat\b", code_clean))
    untils = len(re.findall(r"\buntil\b", code_clean))

    net_openers = openers - repeats
    if net_openers > enders:
        return {
            "output": "",
            "success": False,
            "error": "Syntax error: missing 'end' keyword",
        }
    if repeats > untils:
        return {
            "output": "",
            "success": False,
            "error": "Syntax error: 'repeat' without matching 'until'",
        }

    single_quotes = len(re.findall(r"(?<!\\)'", code_clean))
    double_quotes = len(re.findall(r'(?<!\\)"', code_clean))
    long_strings = len(re.findall(r"\[\[", code_clean))
    double_quotes -= long_strings * 2
    if single_quotes % 2 != 0:
        return {
            "output": "",
            "success": False,
            "error": "Syntax error: unclosed string",
        }
    if double_quotes % 2 != 0:
        return {
            "output": "",
            "success": False,
            "error": "Syntax error: unclosed string",
        }

    # Extract print() calls
    prints = re.findall(r"print\s*\((.+?)\)\s*$", code_clean, re.MULTILINE)
    if not prints:
        prints = re.findall(r"print\s*\((.+?)\)", code_clean)

    for p in prints:
        p = p.strip()
        if (p.startswith('"') and p.endswith('"')) or (
            p.startswith("'") and p.endswith("'")
        ):
            output_lines.append(p[1:-1])
        elif re.match(r"^[\d\.\+\-\*\/\%\s\(\)]+$", p):
            try:
                result = eval(p)
                if isinstance(result, float) and result == int(result):
                    result = int(result)
                output_lines.append(str(result))
            except Exception:
                output_lines.append(str(p))
        elif ".." in p:
            parts = [x.strip() for x in re.split(r"\.\.", p)]
            result_str = ""
            for part in parts:
                if (part.startswith('"') and part.endswith('"')) or (
                    part.startswith("'") and part.endswith("'")
                ):
                    result_str += part[1:-1]
                elif re.match(r"^[\d\.]+$", part):
                    result_str += part
                else:
                    result_str += part
            output_lines.append(result_str)
        elif "," in p:
            args = [a.strip() for a in p.split(",")]
            parts = []
            for a in args:
                if (a.startswith('"') and a.endswith('"')) or (
                    a.startswith("'") and a.endswith("'")
                ):
                    parts.append(a[1:-1])
                else:
                    parts.append(a)
            output_lines.append("\t".join(parts))
        elif p in ("true", "false", "nil"):
            output_lines.append(p)
        else:
            output_lines.append(str(p))

    output = "\n".join(output_lines)

    if expected_output is not None:
        expected_clean = expected_output.strip()
        output_clean = output.strip()
        if output_clean != expected_clean:
            success = False
            if not output_clean:
                error = "No output produced. Make sure to use print() to display results."
            else:
                error = f"Output doesn't match expected result.\nExpected:\n{expected_clean}\nGot:\n{output_clean}"

    return {"output": output, "success": success, "error": error}
