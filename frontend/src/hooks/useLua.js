import { useState, useCallback } from "react";

let fengari = null;

async function loadFengari() {
  if (fengari) return fengari;
  fengari = await import("fengari-web");
  return fengari;
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
      const { lua, lauxlib, lualib, to_luastring, to_jsstring } = await loadFengari();

      const L = lauxlib.luaL_newstate();
      lualib.luaL_openlibs(L);

      let captured = "";

      lua.lua_register(L, to_luastring("print"), (L) => {
        const n = lua.lua_gettop(L);
        const parts = [];
        for (let i = 1; i <= n; i++) {
          parts.push(to_jsstring(lauxlib.luaL_tolstring(L, i, null)));
          lua.lua_pop(L, 1);
        }
        captured += parts.join("\t") + "\n";
        return 0;
      });

      const status = lauxlib.luaL_dostring(L, to_luastring(code));

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
        const passed = result === expectedOutput.trim();
        setSuccess(passed);
        if (!passed) {
          setError(`Expected:\n${expectedOutput.trim()}\nGot:\n${result}`);
        }
        setRunning(false);
        return { output: result, error: passed ? "" : `Expected:\n${expectedOutput.trim()}\nGot:\n${result}`, success: passed };
      } else {
        setSuccess(true);
        setRunning(false);
        return { output: result, error: "", success: true };
      }

    } catch (e) {
      const msg = e.message || "Failed to run Lua";
      setError(msg);
      setSuccess(false);
      setRunning(false);
      return { output: "", error: msg, success: false };
    }
  }, []);

  return { runLua, output, error, success, running };
}