import { forwardRef, useImperativeHandle, useRef } from "react";
import { View } from "react-native";
import { WebView } from "react-native-webview";

const HTML = `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <script src="https://unpkg.com/fengari-web/dist/fengari-web.js"></script>
  </head>
  <body>
    <script>
      (function () {
        function respond(message) {
          window.ReactNativeWebView.postMessage(JSON.stringify(message));
        }

        function execute(payload) {
          try {
            const { lua, lauxlib, lualib, to_luastring, to_jsstring } = fengari;
            const L = lauxlib.luaL_newstate();
            lualib.luaL_openlibs(L);

            let captured = "";

            lua.lua_register(L, to_luastring("print"), (state) => {
              const count = lua.lua_gettop(state);
              const parts = [];
              for (let i = 1; i <= count; i += 1) {
                parts.push(to_jsstring(lauxlib.luaL_tolstring(state, i, null)));
                lua.lua_pop(state, 1);
              }
              captured += parts.join("\\t") + "\\n";
              return 0;
            });

            const status = lauxlib.luaL_dostring(L, to_luastring(payload.code || ""));
            if (status !== lua.LUA_OK) {
              respond({ id: payload.id, output: "", error: to_jsstring(lua.lua_tostring(L, -1)), success: false });
              return;
            }

            const output = captured.trim();
            if (payload.expectedOutput != null) {
              const expected = String(payload.expectedOutput || "").trim();
              const success = output === expected;
              respond({
                id: payload.id,
                output,
                error: success ? "" : "Expected:\\n" + expected + "\\nGot:\\n" + output,
                success
              });
              return;
            }

            respond({ id: payload.id, output, error: "", success: true });
          } catch (error) {
            respond({ id: payload.id, output: "", error: error.message || "Failed to run Lua", success: false });
          }
        }

        function receive(event) {
          try {
            const payload = JSON.parse(event.data);
            execute(payload);
          } catch (error) {
            respond({ id: "unknown", output: "", error: error.message || "Invalid payload", success: false });
          }
        }

        document.addEventListener("message", receive);
        window.addEventListener("message", receive);
        respond({ type: "ready" });
      })();
    </script>
  </body>
</html>
`;

const LuaRuntime = forwardRef(function LuaRuntime(_, ref) {
  const webViewRef = useRef(null);
  const pendingRef = useRef(new Map());
  const counterRef = useRef(0);
  const readyRef = useRef(false);

  useImperativeHandle(ref, () => ({
    run(code, expectedOutput = null) {
      return new Promise((resolve, reject) => {
        if (!readyRef.current || !webViewRef.current) {
          reject(new Error("Lua runtime is not ready yet."));
          return;
        }

        counterRef.current += 1;
        const id = String(counterRef.current);
        pendingRef.current.set(id, resolve);
        webViewRef.current.postMessage(JSON.stringify({ id, code, expectedOutput }));
      });
    }
  }));

  return (
    <View style={{ width: 0, height: 0, overflow: "hidden" }}>
      <WebView
        ref={webViewRef}
        originWhitelist={["*"]}
        source={{ html: HTML }}
        onMessage={(event) => {
          try {
            const message = JSON.parse(event.nativeEvent.data);
            if (message.type === "ready") {
              readyRef.current = true;
              return;
            }
            const resolve = pendingRef.current.get(message.id);
            if (resolve) {
              pendingRef.current.delete(message.id);
              resolve(message);
            }
          } catch {
            // ignore malformed messages
          }
        }}
      />
    </View>
  );
});

export default LuaRuntime;
