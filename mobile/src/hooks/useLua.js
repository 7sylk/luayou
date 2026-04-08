import { useCallback, useState } from "react";
import { lua, to_jsstring, to_luastring } from "fengari/src/fengari";
import * as lauxlib from "fengari/src/lauxlib";
import { luaopen_base } from "fengari/src/lbaselib";
import { luaopen_math } from "fengari/src/lmathlib";
import { luaopen_string } from "fengari/src/lstrlib";
import { luaopen_table } from "fengari/src/ltablib";
import { luaopen_utf8 } from "fengari/src/lutf8lib";

function openStandardLibraries(L) {
  lauxlib.luaL_requiref(L, to_luastring("_G"), luaopen_base, 1);
  lua.lua_pop(L, 1);
  lauxlib.luaL_requiref(L, to_luastring("table"), luaopen_table, 1);
  lua.lua_pop(L, 1);
  lauxlib.luaL_requiref(L, to_luastring("string"), luaopen_string, 1);
  lua.lua_pop(L, 1);
  lauxlib.luaL_requiref(L, to_luastring("math"), luaopen_math, 1);
  lua.lua_pop(L, 1);
  lauxlib.luaL_requiref(L, to_luastring("utf8"), luaopen_utf8, 1);
  lua.lua_pop(L, 1);
}

export function useLua() {
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);
  const [running, setRunning] = useState(false);

  const runLua = useCallback(async (code, expectedOutput = null) => {
    setRunning(true);
    setOutput("");
    setError("");
    setSuccess(null);

    try {
      const L = lauxlib.luaL_newstate();
      openStandardLibraries(L);

      let captured = "";

      lua.lua_register(L, to_luastring("print"), (state) => {
        const count = lua.lua_gettop(state);
        const parts = [];
        for (let i = 1; i <= count; i += 1) {
          parts.push(to_jsstring(lauxlib.luaL_tolstring(state, i)));
          lua.lua_pop(state, 1);
        }
        captured += `${parts.join("\t")}\n`;
        return 0;
      });

      const status = lauxlib.luaL_dostring(L, to_luastring(code || ""));

      if (status !== lua.LUA_OK) {
        const errMsg = to_jsstring(lua.lua_tostring(L, -1));
        setError(errMsg);
        setSuccess(false);
        setRunning(false);
        return { output: "", error: errMsg, success: false };
      }

      const result = captured.trim();
      setOutput(result);

      if (expectedOutput !== null) {
        const expected = String(expectedOutput ?? "").trim();
        const passed = result === expected;
        setSuccess(passed);
        if (!passed) {
          setError(`Expected:\n${expected}\nGot:\n${result}`);
        }
        setRunning(false);
        return {
          output: result,
          error: passed ? "" : `Expected:\n${expected}\nGot:\n${result}`,
          success: passed
        };
      }

      setSuccess(true);
      setRunning(false);
      return { output: result, error: "", success: true };
    } catch (e) {
      const message = e.message || "Failed to run Lua";
      setError(message);
      setSuccess(false);
      setRunning(false);
      return { output: "", error: message, success: false };
    }
  }, []);

  return { runLua, output, error, success, running };
}
