import uuid
import os
from datetime import datetime, timezone

LESSONS = [
    {
        "id": "lesson-01",
        "title": "Hello, Lua!",
        "difficulty": "beginner",
        "order_index": 1,
        "xp_reward": 50,
        "content": "Welcome to Lua! Lua is a lightweight, fast scripting language used in game development, embedded systems, and more.\n\nThe `print()` function outputs text to the console. Comments start with `--` for single line, or `--[[ ]]` for multi-line.\n\nLua is dynamically typed and uses simple, clean syntax with no semicolons needed.",
        "code_examples": "-- Single line comment\nprint(\"Hello, World!\")\n\n--[[ \n  Multi-line comment\n  This won't execute\n]]\nprint(\"Lua is fun!\")",
        "challenge_description": "Write a program that prints exactly: Hello, Lua!",
        "challenge_starter_code": "-- Your first Lua program\n-- Use print() to output text\n",
        "challenge_expected_output": "Hello, Lua!",
    },
    {
        "id": "lesson-02",
        "title": "Variables & Types",
        "difficulty": "beginner",
        "order_index": 2,
        "xp_reward": 50,
        "content": "Lua has several basic types: `nil`, `boolean`, `number`, `string`. Use `local` to declare variables (recommended for scope control).\n\n`nil` represents absence of value. Booleans are `true`/`false`. Numbers can be integers or floats. Strings use double or single quotes.\n\nUse `type()` to check a variable's type.",
        "code_examples": "local name = \"Lua\"\nlocal version = 5.4\nlocal isAwesome = true\nlocal nothing = nil\n\nprint(name)\nprint(version)\nprint(isAwesome)\nprint(type(name))",
        "challenge_description": "Create a variable called `language` with value \"Lua\" and print it.",
        "challenge_starter_code": "-- Create a variable and print it\n",
        "challenge_expected_output": "Lua",
    },
    {
        "id": "lesson-03",
        "title": "Strings & Operations",
        "difficulty": "beginner",
        "order_index": 3,
        "xp_reward": 50,
        "content": "Strings in Lua are immutable sequences of characters. Use `..` for concatenation and `#` for length.\n\nStrings can be defined with double quotes, single quotes, or long brackets `[[ ]]`. The `string` library provides methods like `string.upper()`, `string.lower()`, `string.len()`.",
        "code_examples": "local first = \"Hello\"\nlocal second = \"World\"\nlocal combined = first .. \" \" .. second\nprint(combined)\nprint(#combined)",
        "challenge_description": "Concatenate \"Hello\" and \"World\" with a space between them and print the result.",
        "challenge_starter_code": "-- Concatenate two strings\nlocal first = \"Hello\"\nlocal second = \"World\"\n",
        "challenge_expected_output": "Hello World",
    },
    {
        "id": "lesson-04",
        "title": "Numbers & Math",
        "difficulty": "beginner",
        "order_index": 4,
        "xp_reward": 50,
        "content": "Lua uses a single `number` type (double-precision floating point by default). Standard arithmetic operators: `+`, `-`, `*`, `/`, `%` (modulo), `^` (power).\n\nInteger division uses `//`. The `math` library provides functions like `math.floor()`, `math.ceil()`, `math.sqrt()`, `math.pi`.",
        "code_examples": "print(10 + 5)\nprint(10 - 3)\nprint(4 * 3)\nprint(10 / 3)\nprint(2 ^ 8)\nprint(10 % 3)",
        "challenge_description": "Calculate and print the result of 7 * 8.",
        "challenge_starter_code": "-- Calculate 7 * 8\n",
        "challenge_expected_output": "56",
    },
    {
        "id": "lesson-05",
        "title": "Conditionals",
        "difficulty": "beginner",
        "order_index": 5,
        "xp_reward": 75,
        "content": "Lua uses `if`, `elseif`, `else`, and `end` for conditional logic. Comparison operators: `==`, `~=` (not equal), `<`, `>`, `<=`, `>=`.\n\nLogical operators: `and`, `or`, `not`. In Lua, only `nil` and `false` are falsy; everything else (including 0 and empty string) is truthy.",
        "code_examples": "local score = 85\n\nif score >= 90 then\n  print(\"Excellent\")\nelseif score >= 70 then\n  print(\"Good\")\nelse\n  print(\"Keep trying\")\nend",
        "challenge_description": "Write a conditional that prints \"Pass\" (score is 75, which is >= 60).",
        "challenge_starter_code": "local score = 75\n-- Write an if statement\n",
        "challenge_expected_output": "Pass",
    },
    {
        "id": "lesson-06",
        "title": "Loops",
        "difficulty": "intermediate",
        "order_index": 6,
        "xp_reward": 75,
        "content": "Lua has three loop types:\n\n**Numeric for:** `for i = start, stop, step do ... end`\n**While:** `while condition do ... end`\n**Repeat-until:** `repeat ... until condition` (runs at least once)\n\nUse `break` to exit a loop early.",
        "code_examples": "-- Numeric for\nfor i = 1, 5 do\n  print(i)\nend\n\n-- While loop\nlocal n = 1\nwhile n <= 3 do\n  print(n)\n  n = n + 1\nend",
        "challenge_description": "Use a for loop to print numbers 1 through 5, each on a new line.",
        "challenge_starter_code": "-- Print 1 to 5 using a for loop\n",
        "challenge_expected_output": "1\n2\n3\n4\n5",
    },
    {
        "id": "lesson-07",
        "title": "Functions",
        "difficulty": "intermediate",
        "order_index": 7,
        "xp_reward": 75,
        "content": "Functions in Lua are first-class values. Define with `function name(params) ... end` or as anonymous functions assigned to variables.\n\nFunctions can return multiple values. Use `local function` for local scope. Parameters are passed by value (except tables, which are references).",
        "code_examples": "local function greet(name)\n  return \"Hello, \" .. name\nend\n\nprint(greet(\"Lua\"))\n\n-- Multiple returns\nlocal function minmax(a, b)\n  return math.min(a,b), math.max(a,b)\nend",
        "challenge_description": "Create a function called `double` that takes a number and returns it multiplied by 2. Print double(21).",
        "challenge_starter_code": "-- Define the double function\n",
        "challenge_expected_output": "42",
    },
    {
        "id": "lesson-08",
        "title": "Tables: Arrays",
        "difficulty": "intermediate",
        "order_index": 8,
        "xp_reward": 75,
        "content": "Tables are the only data structure in Lua. Used as arrays, they are 1-indexed (start at 1, not 0).\n\nCreate with `{}`. Access with `table[index]`. Use `#table` for length. `table.insert()` adds elements, `table.remove()` removes them.\n\nIterate with `ipairs()` for sequential integer keys.",
        "code_examples": "local fruits = {\"apple\", \"banana\", \"cherry\"}\nprint(fruits[1])  -- apple\nprint(#fruits)    -- 3\n\nfor i, fruit in ipairs(fruits) do\n  print(i, fruit)\nend",
        "challenge_description": "Create a table with values \"red\", \"green\", \"blue\" and print the second element.",
        "challenge_starter_code": "-- Create a table and access an element\n",
        "challenge_expected_output": "green",
    },
    {
        "id": "lesson-09",
        "title": "Tables: Dictionaries",
        "difficulty": "intermediate",
        "order_index": 9,
        "xp_reward": 75,
        "content": "Tables can also be used as dictionaries (hash maps) with string keys. Access values with `table.key` or `table[\"key\"]`.\n\nIterate with `pairs()` for all keys. You can mix array and dictionary parts. Nested tables allow complex data structures.",
        "code_examples": "local person = {\n  name = \"Alice\",\n  age = 30,\n  language = \"Lua\"\n}\n\nprint(person.name)\nprint(person[\"age\"])\n\nfor key, value in pairs(person) do\n  print(key, value)\nend",
        "challenge_description": "Create a table with key \"language\" set to \"Lua\" and print the value.",
        "challenge_starter_code": "-- Create a dictionary table\n",
        "challenge_expected_output": "Lua",
    },
    {
        "id": "lesson-10",
        "title": "String Library",
        "difficulty": "intermediate",
        "order_index": 10,
        "xp_reward": 100,
        "content": "Lua's string library provides powerful manipulation functions:\n\n- `string.find(s, pattern)` - find pattern in string\n- `string.sub(s, i, j)` - substring\n- `string.upper(s)` / `string.lower(s)` - case conversion\n- `string.format(fmt, ...)` - formatted strings\n- `string.gsub(s, pattern, replace)` - global substitution",
        "code_examples": "local text = \"Hello, Lua!\"\nprint(string.upper(text))\nprint(string.sub(text, 1, 5))\nprint(string.format(\"Version: %d.%d\", 5, 4))",
        "challenge_description": "Use string.upper() to convert \"hello\" to uppercase and print it.",
        "challenge_starter_code": "-- Convert to uppercase\nlocal text = \"hello\"\n",
        "challenge_expected_output": "HELLO",
    },
    {
        "id": "lesson-11",
        "title": "Metatables",
        "difficulty": "advanced",
        "order_index": 11,
        "xp_reward": 100,
        "content": "Metatables define behavior for table operations. Use `setmetatable(table, metatable)` to assign one.\n\nKey metamethods:\n- `__index` - called when accessing a missing key\n- `__newindex` - called when setting a new key\n- `__tostring` - defines string representation\n- `__add`, `__mul`, etc. - operator overloading",
        "code_examples": "local defaults = {color = \"red\", size = 10}\nlocal config = {}\n\nsetmetatable(config, {__index = defaults})\n\nprint(config.color)  -- \"red\" (from defaults)\nconfig.color = \"blue\"\nprint(config.color)  -- \"blue\" (own key)",
        "challenge_description": "Create a table with a metatable that provides a default value of \"unknown\" for missing keys. Print myTable.name.",
        "challenge_starter_code": "-- Create a table with __index metatable\n",
        "challenge_expected_output": "unknown",
    },
    {
        "id": "lesson-12",
        "title": "OOP in Lua",
        "difficulty": "advanced",
        "order_index": 12,
        "xp_reward": 100,
        "content": "Lua doesn't have built-in classes, but you can implement OOP using tables and metatables.\n\nThe colon syntax `object:method()` automatically passes `self`. Create a class by defining a table, setting `__index` to itself, and providing a constructor function.",
        "code_examples": "local Animal = {}\nAnimal.__index = Animal\n\nfunction Animal.new(name, sound)\n  local self = setmetatable({}, Animal)\n  self.name = name\n  self.sound = sound\n  return self\nend\n\nfunction Animal:speak()\n  return self.name .. \" says \" .. self.sound\nend\n\nlocal cat = Animal.new(\"Cat\", \"Meow\")\nprint(cat:speak())",
        "challenge_description": "Print \"OOP in Lua\" to demonstrate you understand the concept.",
        "challenge_starter_code": "-- Object-Oriented Programming\n",
        "challenge_expected_output": "OOP in Lua",
    },
    {
        "id": "lesson-13",
        "title": "Error Handling",
        "difficulty": "advanced",
        "order_index": 13,
        "xp_reward": 100,
        "content": "Lua uses `pcall()` (protected call) and `xpcall()` for error handling. `error()` raises an error.\n\n`pcall(func, args)` returns `true, result` on success or `false, error_message` on failure.\n\n`xpcall(func, handler)` lets you specify a custom error handler that receives the error message.",
        "code_examples": "local ok, result = pcall(function()\n  return 10 / 2\nend)\n\nif ok then\n  print(\"Result: \" .. result)\nelse\n  print(\"Error: \" .. result)\nend",
        "challenge_description": "Use pcall to safely call a function and print \"Safe call\" on success.",
        "challenge_starter_code": "-- Use pcall for error handling\n",
        "challenge_expected_output": "Safe call",
    },
    {
        "id": "lesson-14",
        "title": "Iterators & Closures",
        "difficulty": "advanced",
        "order_index": 14,
        "xp_reward": 100,
        "content": "Closures are functions that capture variables from their enclosing scope. They're fundamental to Lua's iterator pattern.\n\nA closure maintains state between calls. Custom iterators return a closure that produces the next value each time it's called.",
        "code_examples": "-- Closure example\nfunction counter(start)\n  local count = start\n  return function()\n    count = count + 1\n    return count\n  end\nend\n\nlocal next = counter(0)\nprint(next())  -- 1\nprint(next())  -- 2\nprint(next())  -- 3",
        "challenge_description": "Print \"Closure works\" to demonstrate understanding of closures.",
        "challenge_starter_code": "-- Closures capture outer variables\n",
        "challenge_expected_output": "Closure works",
    },
    {
        "id": "lesson-15",
        "title": "Coroutines",
        "difficulty": "advanced",
        "order_index": 15,
        "xp_reward": 150,
        "content": "Coroutines enable cooperative multitasking in Lua. They can suspend (yield) and resume execution.\n\nKey functions:\n- `coroutine.create(func)` - create a coroutine\n- `coroutine.resume(co, args)` - start/resume\n- `coroutine.yield(values)` - suspend and return values\n- `coroutine.status(co)` - check status (suspended/running/dead)",
        "code_examples": "local co = coroutine.create(function()\n  print(\"Step 1\")\n  coroutine.yield()\n  print(\"Step 2\")\n  coroutine.yield()\n  print(\"Step 3\")\nend)\n\ncoroutine.resume(co)  -- Step 1\ncoroutine.resume(co)  -- Step 2\ncoroutine.resume(co)  -- Step 3",
        "challenge_description": "Print \"Coroutines\" to complete the final lesson.",
        "challenge_starter_code": "-- The power of coroutines\n",
        "challenge_expected_output": "Coroutines",
    },
]

QUIZZES = [
    {
        "id": "quiz-01",
        "lesson_id": "lesson-01",
        "questions": [
            {"question": "Which function outputs text in Lua?", "options": ["echo()", "console.log()", "print()", "printf()"], "correct": 2, "explanation": "In Lua, print() is used to output text to the console."},
            {"question": "How do you write a single-line comment in Lua?", "options": ["// comment", "# comment", "-- comment", "/* comment */"], "correct": 2, "explanation": "Single-line comments in Lua start with --."},
            {"question": "What is Lua primarily known for?", "options": ["Web development", "Lightweight scripting", "System programming", "Database management"], "correct": 1, "explanation": "Lua is known for being a lightweight, fast scripting language."},
        ],
    },
    {
        "id": "quiz-02",
        "lesson_id": "lesson-02",
        "questions": [
            {"question": "How do you declare a local variable?", "options": ["var x = 5", "let x = 5", "local x = 5", "dim x = 5"], "correct": 2, "explanation": "The local keyword declares a local variable in Lua."},
            {"question": "What value represents 'nothing' in Lua?", "options": ["null", "undefined", "nil", "none"], "correct": 2, "explanation": "nil represents the absence of a value in Lua."},
            {"question": "Which function checks a variable's type?", "options": ["typeof()", "type()", "class()", "kind()"], "correct": 1, "explanation": "type() returns the type name as a string."},
        ],
    },
    {
        "id": "quiz-03",
        "lesson_id": "lesson-03",
        "questions": [
            {"question": "What operator concatenates strings in Lua?", "options": ["+", "&", "..", "++"], "correct": 2, "explanation": "The .. operator concatenates strings in Lua."},
            {"question": "How do you get string length?", "options": ["len(s)", "#s", "s.length", "size(s)"], "correct": 1, "explanation": "The # operator returns the length of a string."},
            {"question": "Can Lua strings contain single quotes?", "options": ["No", "Only in double-quoted strings", "Yes, with escape \\' or in double-quoted strings", "Only in long brackets"], "correct": 2, "explanation": "You can use \\' inside single-quoted strings or use double quotes."},
        ],
    },
    {
        "id": "quiz-04",
        "lesson_id": "lesson-04",
        "questions": [
            {"question": "What is the power operator in Lua?", "options": ["**", "^^", "^", "pow"], "correct": 2, "explanation": "The ^ operator performs exponentiation in Lua."},
            {"question": "What does 10 % 3 return?", "options": ["3", "1", "0", "3.33"], "correct": 1, "explanation": "The modulo operator % returns the remainder: 10 % 3 = 1."},
            {"question": "How many number types does Lua have?", "options": ["Two (int and float)", "One (number)", "Three", "Four"], "correct": 1, "explanation": "Lua uses a single number type (double-precision float by default)."},
        ],
    },
    {
        "id": "quiz-05",
        "lesson_id": "lesson-05",
        "questions": [
            {"question": "What is the 'not equal' operator in Lua?", "options": ["!=", "<>", "~=", "=/="], "correct": 2, "explanation": "Lua uses ~= for not-equal comparison."},
            {"question": "Is 0 truthy or falsy in Lua?", "options": ["Falsy", "Truthy", "Depends on context", "Undefined"], "correct": 1, "explanation": "In Lua, only nil and false are falsy. 0 is truthy!"},
            {"question": "What keyword ends an if block?", "options": ["endif", "fi", "end", "}"], "correct": 2, "explanation": "All blocks in Lua (if, for, function, etc.) end with 'end'."},
        ],
    },
    {
        "id": "quiz-06",
        "lesson_id": "lesson-06",
        "questions": [
            {"question": "What is the default step in a numeric for loop?", "options": ["0", "1", "2", "Must be specified"], "correct": 1, "explanation": "The default step in a for loop is 1 if not specified."},
            {"question": "Which loop always runs at least once?", "options": ["for", "while", "repeat-until", "do-while"], "correct": 2, "explanation": "repeat-until checks the condition at the end, so it always runs at least once."},
            {"question": "How do you exit a loop early?", "options": ["exit", "return", "break", "stop"], "correct": 2, "explanation": "The break statement exits the innermost loop."},
        ],
    },
    {
        "id": "quiz-07",
        "lesson_id": "lesson-07",
        "questions": [
            {"question": "Are functions first-class values in Lua?", "options": ["No", "Yes", "Only named functions", "Only anonymous"], "correct": 1, "explanation": "Functions in Lua are first-class values that can be assigned to variables."},
            {"question": "Can Lua functions return multiple values?", "options": ["No", "Yes", "Max 2", "Only with tables"], "correct": 1, "explanation": "Lua functions can return multiple values separated by commas."},
            {"question": "What keyword makes a function local?", "options": ["private", "local", "static", "internal"], "correct": 1, "explanation": "Use 'local function' to declare a function with local scope."},
        ],
    },
    {
        "id": "quiz-08",
        "lesson_id": "lesson-08",
        "questions": [
            {"question": "What index does a Lua array start at?", "options": ["0", "1", "-1", "Configurable"], "correct": 1, "explanation": "Lua arrays are 1-indexed by convention."},
            {"question": "How do you get array length?", "options": ["array.length", "len(array)", "#array", "array.size()"], "correct": 2, "explanation": "The # operator returns the length of a table used as an array."},
            {"question": "Which function iterates over array elements?", "options": ["pairs()", "ipairs()", "each()", "iterate()"], "correct": 1, "explanation": "ipairs() iterates over sequential integer keys starting from 1."},
        ],
    },
    {
        "id": "quiz-09",
        "lesson_id": "lesson-09",
        "questions": [
            {"question": "How do you access a table field named 'name'?", "options": ["table->name", "table.name", "table::name", "table@name"], "correct": 1, "explanation": "Use dot notation: table.name or bracket notation: table[\"name\"]."},
            {"question": "Which function iterates all table keys?", "options": ["ipairs()", "pairs()", "keys()", "all()"], "correct": 1, "explanation": "pairs() iterates over all key-value pairs in a table."},
            {"question": "Can tables mix array and dictionary parts?", "options": ["No", "Yes", "Only in Lua 5.4", "Requires special syntax"], "correct": 1, "explanation": "Lua tables can freely mix integer keys and string keys."},
        ],
    },
    {
        "id": "quiz-10",
        "lesson_id": "lesson-10",
        "questions": [
            {"question": "What does string.upper() do?", "options": ["Trims whitespace", "Converts to uppercase", "Capitalizes first letter", "Reverses string"], "correct": 1, "explanation": "string.upper() converts all characters to uppercase."},
            {"question": "What does string.sub(s, 1, 3) return?", "options": ["Characters 0-2", "First 3 characters", "Last 3 characters", "Substring after position 3"], "correct": 1, "explanation": "string.sub(s, 1, 3) returns the first 3 characters (1-indexed)."},
            {"question": "What does string.gsub do?", "options": ["Gets substring", "Global substitution/replace", "Gets sub-table", "Groups strings"], "correct": 1, "explanation": "string.gsub performs global pattern substitution (find and replace)."},
        ],
    },
    {
        "id": "quiz-11",
        "lesson_id": "lesson-11",
        "questions": [
            {"question": "What function assigns a metatable?", "options": ["meta()", "setmetatable()", "addmeta()", "assignmeta()"], "correct": 1, "explanation": "setmetatable(table, metatable) assigns a metatable to a table."},
            {"question": "Which metamethod handles missing key access?", "options": ["__get", "__missing", "__index", "__access"], "correct": 2, "explanation": "__index is called when accessing a key that doesn't exist in the table."},
            {"question": "Can metatables enable operator overloading?", "options": ["No", "Yes, via metamethods like __add", "Only for strings", "Only in Lua 5.3+"], "correct": 1, "explanation": "Metamethods like __add, __mul, __eq etc. enable operator overloading."},
        ],
    },
    {
        "id": "quiz-12",
        "lesson_id": "lesson-12",
        "questions": [
            {"question": "Does Lua have built-in classes?", "options": ["Yes", "No, but can simulate with tables", "Only in Lua 6", "Yes, using class keyword"], "correct": 1, "explanation": "Lua uses tables and metatables to simulate object-oriented patterns."},
            {"question": "What does the colon syntax (obj:method()) do?", "options": ["Nothing special", "Passes self automatically", "Creates a static method", "Makes method private"], "correct": 1, "explanation": "The colon syntax automatically passes the object as the first argument (self)."},
            {"question": "How is inheritance typically done in Lua?", "options": ["extends keyword", "__index metatable chain", "prototype chain", "import statement"], "correct": 1, "explanation": "Inheritance uses __index metatable chains to look up missing methods."},
        ],
    },
    {
        "id": "quiz-13",
        "lesson_id": "lesson-13",
        "questions": [
            {"question": "What does pcall stand for?", "options": ["Parallel call", "Protected call", "Private call", "Proxied call"], "correct": 1, "explanation": "pcall means 'protected call' - it catches errors without stopping the program."},
            {"question": "What does pcall return on success?", "options": ["Just the result", "true and the result", "An error object", "nil"], "correct": 1, "explanation": "pcall returns true followed by the function's return values on success."},
            {"question": "How do you raise an error in Lua?", "options": ["throw()", "raise()", "error()", "exception()"], "correct": 2, "explanation": "The error() function raises an error that can be caught by pcall/xpcall."},
        ],
    },
    {
        "id": "quiz-14",
        "lesson_id": "lesson-14",
        "questions": [
            {"question": "What is a closure?", "options": ["A closed file", "A function capturing outer variables", "A table operation", "A loop type"], "correct": 1, "explanation": "A closure is a function that captures and remembers variables from its enclosing scope."},
            {"question": "Do closures maintain state between calls?", "options": ["No", "Yes", "Only with global variables", "Only once"], "correct": 1, "explanation": "Closures maintain their captured variables between calls, enabling stateful functions."},
            {"question": "What are closures commonly used for in Lua?", "options": ["File I/O", "Custom iterators", "Network requests", "Memory management"], "correct": 1, "explanation": "Closures are the foundation of Lua's iterator pattern."},
        ],
    },
    {
        "id": "quiz-15",
        "lesson_id": "lesson-15",
        "questions": [
            {"question": "What type of multitasking do coroutines provide?", "options": ["Preemptive", "Cooperative", "Parallel", "Distributed"], "correct": 1, "explanation": "Coroutines provide cooperative multitasking - they yield control voluntarily."},
            {"question": "What does coroutine.yield() do?", "options": ["Destroys the coroutine", "Suspends execution", "Creates a new coroutine", "Returns an error"], "correct": 1, "explanation": "coroutine.yield() suspends the coroutine, returning control to the caller."},
            {"question": "What status does a finished coroutine have?", "options": ["done", "finished", "dead", "complete"], "correct": 2, "explanation": "A coroutine that has finished executing has the status 'dead'."},
        ],
    },
]

DAILY_TEMPLATES = [
    {
        "id": "daily-t-01",
        "title": "FizzBuzz",
        "description": "Print 'FizzBuzz' - a classic programming challenge. For this simplified version, just print the word FizzBuzz.",
        "starter_code": "-- Print FizzBuzz\n",
        "difficulty": "beginner",
        "xp_reward": 75,
        "expected_output": "FizzBuzz",
    },
    {
        "id": "daily-t-02",
        "title": "Reverse Greeting",
        "description": "Print the string 'olleH' (Hello reversed).",
        "starter_code": "-- Print a reversed greeting\n",
        "difficulty": "beginner",
        "xp_reward": 75,
        "expected_output": "olleH",
    },
    {
        "id": "daily-t-03",
        "title": "Sum Challenge",
        "description": "Print the sum of 15 + 27.",
        "starter_code": "-- Calculate and print the sum\n",
        "difficulty": "beginner",
        "xp_reward": 75,
        "expected_output": "42",
    },
    {
        "id": "daily-t-04",
        "title": "String Builder",
        "description": "Concatenate 'Lua' and 'You' with a space and print 'Lua You'.",
        "starter_code": "-- Build a string\n",
        "difficulty": "beginner",
        "xp_reward": 75,
        "expected_output": "Lua You",
    },
    {
        "id": "daily-t-05",
        "title": "Power Play",
        "description": "Calculate and print 2 to the power of 10 (1024).",
        "starter_code": "-- Calculate a power\n",
        "difficulty": "intermediate",
        "xp_reward": 100,
        "expected_output": "1024",
    },
    {
        "id": "daily-t-06",
        "title": "Type Check",
        "description": "Print the word 'string' (the type of text values in Lua).",
        "starter_code": "-- What type is a text value?\n",
        "difficulty": "beginner",
        "xp_reward": 75,
        "expected_output": "string",
    },
    {
        "id": "daily-t-07",
        "title": "Lua Version",
        "description": "Print '5.4' - the latest major Lua version.",
        "starter_code": "-- What's the latest Lua version?\n",
        "difficulty": "beginner",
        "xp_reward": 75,
        "expected_output": "5.4",
    },
]


async def seed_database(db):
    existing = await db.lessons.count_documents({})
    if existing > 0:
        return

    for lesson in LESSONS:
        await db.lessons.insert_one({**lesson})

    for quiz in QUIZZES:
        await db.quizzes.insert_one({**quiz})

    for template in DAILY_TEMPLATES:
        await db.daily_templates.insert_one({**template})

    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    await db.users.create_index([("xp", -1)])
    await db.lessons.create_index("id", unique=True)
    await db.lessons.create_index("order_index")
    await db.user_progress.create_index([("user_id", 1), ("lesson_id", 1)], unique=True)
    await db.quizzes.create_index("lesson_id")
    await db.daily_challenges.create_index("date")
    await db.user_daily.create_index([("user_id", 1), ("date", 1)], unique=True)
    await db.daily_templates.create_index("id")

    # Seed admin user
    from utils import hash_password

    admin_email = os.environ.get("ADMIN_EMAIL", "admin@luayou.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    admin_exists = await db.users.find_one({"email": admin_email})
    if not admin_exists:
        admin_doc = {
            "id": str(uuid.uuid4()),
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "username": "Admin",
            "avatar": "default",
            "xp": 500,
            "level": 3,
            "streak": 5,
            "badges": ["first_lesson", "xp_500"],
            "lessons_completed": 3,
            "daily_completed": 2,
            "perfect_quizzes": 1,
            "last_active": datetime.now(timezone.utc).isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.users.insert_one(admin_doc)
