import { hostname } from "os";
import pino from "pino";

type Todo = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
};

const todos: Todo[] = [];

const port = Number(process.env.PORT || 3000);
const host = hostname();

const logger = pino({
  level: "info",
  base: {
    service: process.env.DATADOG_SERVICE || "assignment-6-todo",
    env: process.env.DATADOG_ENV || "production",
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

function json(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...(init?.headers || {}),
    },
  });
}

function html(content: string, init?: ResponseInit) {
  return new Response(content, {
    ...init,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      ...(init?.headers || {}),
    },
  });
}

function badRequest(message: string) {
  return json({ error: message }, { status: 400 });
}

function renderPage() {
  const applicationId = process.env.DATADOG_APPLICATION_ID || "";
  const clientToken = process.env.DATADOG_CLIENT_TOKEN || "";
  const site = process.env.DATADOG_SITE || "datadoghq.com";
  const service = process.env.DATADOG_SERVICE || "assignment-6-todo";
  const env = process.env.DATADOG_ENV || "production";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Assignment 6 Todo App</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 720px;
      margin: 40px auto;
      padding: 0 16px;
      line-height: 1.4;
    }
    h1 { margin-bottom: 8px; }
    .muted { color: #666; margin-bottom: 24px; }
    form { display: flex; gap: 8px; margin-bottom: 20px; }
    input[type="text"] { flex: 1; padding: 10px; font-size: 16px; }
    button { padding: 10px 14px; cursor: pointer; }
    ul { list-style: none; padding: 0; }
    li {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 8px;
      margin-bottom: 10px;
    }
    .left {
      display: flex;
      align-items: center;
      gap: 10px;
      flex: 1;
    }
    .done {
      text-decoration: line-through;
      color: #666;
    }
    .danger {
      background: #b00020;
      color: white;
      border: none;
      border-radius: 6px;
    }
    .error {
      color: #b00020;
      margin-bottom: 12px;
    }
  </style>
</head>
<body>
  <h1>Assignment 6 Todo App</h1>
  <p class="muted">Bun + Datadog RUM + structured logging</p>

  <div id="error" class="error"></div>

  <form id="todo-form">
    <input id="title" type="text" placeholder="Write a todo..." required maxlength="120" />
    <button type="submit">Add todo</button>
  </form>

  <ul id="todo-list"></ul>

  <script src="https://www.datadoghq-browser-agent.com/us1/v6/datadog-rum.js"></script>
  <script src="https://www.datadoghq-browser-agent.com/us1/v6/datadog-logs.js"></script>
  <script>
    const DATADOG_APPLICATION_ID = ${JSON.stringify(applicationId)};
    const DATADOG_CLIENT_TOKEN = ${JSON.stringify(clientToken)};
    const DATADOG_SITE = ${JSON.stringify(site)};
    const DATADOG_SERVICE = ${JSON.stringify(service)};
    const DATADOG_ENV = ${JSON.stringify(env)};

    if (DATADOG_APPLICATION_ID && DATADOG_CLIENT_TOKEN && window.DD_RUM && window.DD_LOGS) {
      window.DD_RUM.init({
        applicationId: DATADOG_APPLICATION_ID,
        clientToken: DATADOG_CLIENT_TOKEN,
        site: DATADOG_SITE,
        service: DATADOG_SERVICE,
        env: DATADOG_ENV,
        sessionSampleRate: 100,
        sessionReplaySampleRate: 100,
        trackUserInteractions: true,
        trackResources: true,
        trackLongTasks: true,
        defaultPrivacyLevel: "mask-user-input"
      });

      window.DD_RUM.startSessionReplayRecording();

      window.DD_LOGS.init({
        clientToken: DATADOG_CLIENT_TOKEN,
        site: DATADOG_SITE,
        service: DATADOG_SERVICE,
        env: DATADOG_ENV,
        forwardErrorsToLogs: true,
        sessionSampleRate: 100
      });

      window.DD_LOGS.logger.info("Frontend initialized", {
        source: "browser"
      });
    }

    const todoList = document.getElementById("todo-list");
    const todoForm = document.getElementById("todo-form");
    const titleInput = document.getElementById("title");
    const errorBox = document.getElementById("error");

    function setError(message) {
      errorBox.textContent = message || "";
    }

    async function loadTodos() {
      try {
        const response = await fetch("/api/todos");
        if (!response.ok) {
          throw new Error("Failed to load todos");
        }

        const todos = await response.json();
        renderTodos(todos);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        setError(message);

        if (window.DD_LOGS) {
          window.DD_LOGS.logger.error("Failed to load todos", {
            error: message
          });
        }
      }
    }

    function renderTodos(todos) {
      todoList.innerHTML = "";

      for (const todo of todos) {
        const li = document.createElement("li");

        const left = document.createElement("div");
        left.className = "left";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = Boolean(todo.completed);

        checkbox.addEventListener("change", async () => {
          try {
            const response = await fetch("/api/todos/" + todo.id, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ completed: checkbox.checked })
            });

            if (!response.ok) {
              throw new Error("Failed to update todo");
            }

            if (window.DD_LOGS) {
              window.DD_LOGS.logger.info("Todo toggled from frontend", {
                todoId: todo.id,
                completed: checkbox.checked,
                source: "browser"
              });
            }

            await loadTodos();
          } catch (error) {
            const message = error instanceof Error ? error.message : "Unknown error";
            setError(message);

            if (window.DD_LOGS) {
              window.DD_LOGS.logger.error("Failed to toggle todo", {
                todoId: todo.id,
                error: message
              });
            }
          }
        });

        const text = document.createElement("span");
        text.textContent = todo.title;
        if (todo.completed) {
          text.className = "done";
        }

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.className = "danger";

        deleteButton.addEventListener("click", async () => {
          try {
            const response = await fetch("/api/todos/" + todo.id, {
              method: "DELETE"
            });

            if (!response.ok) {
              throw new Error("Failed to delete todo");
            }

            if (window.DD_LOGS) {
              window.DD_LOGS.logger.info("Todo deleted from frontend", {
                todoId: todo.id,
                source: "browser"
              });
            }

            await loadTodos();
          } catch (error) {
            const message = error instanceof Error ? error.message : "Unknown error";
            setError(message);

            if (window.DD_LOGS) {
              window.DD_LOGS.logger.error("Failed to delete todo", {
                todoId: todo.id,
                error: message
              });
            }
          }
        });

        left.appendChild(checkbox);
        left.appendChild(text);
        li.appendChild(left);
        li.appendChild(deleteButton);
        todoList.appendChild(li);
      }
    }

    todoForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      setError("");

      const title = titleInput.value.trim();
      if (!title) return;

      try {
        const response = await fetch("/api/todos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title })
        });

        if (!response.ok) {
          throw new Error("Failed to create todo");
        }

        if (window.DD_LOGS) {
          window.DD_LOGS.logger.info("Todo created from frontend", {
            title,
            source: "browser"
          });
        }

        titleInput.value = "";
        await loadTodos();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        setError(message);

        if (window.DD_LOGS) {
          window.DD_LOGS.logger.error("Failed to create todo", {
            title,
            error: message
          });
        }
      }
    });

    loadTodos();
  </script>
</body>
</html>`;
}

const server = Bun.serve({
  port,
  async fetch(req) {
    const url = new URL(req.url);

    if (req.method === "GET" && url.pathname === "/") {
      return html(renderPage());
    }

    if (req.method === "GET" && url.pathname === "/health") {
      return json({
        status: "ok",
        hostname: host,
        timestamp: new Date().toISOString(),
      });
    }

    if (req.method === "GET" && url.pathname === "/api/todos") {
      return json(todos);
    }

    if (req.method === "POST" && url.pathname === "/api/todos") {
      try {
        const body = await req.json();

        if (!body || typeof body.title !== "string" || !body.title.trim()) {
          logger.error(
            {
              event: "todo_create_failed",
              reason: "invalid_title",
            },
            "Failed to create todo"
          );

          return badRequest("Title is required");
        }

        const newTodo: Todo = {
          id: crypto.randomUUID(),
          title: body.title.trim(),
          completed: false,
          createdAt: new Date().toISOString(),
        };

        todos.unshift(newTodo);

        logger.info(
          {
            event: "todo_created",
            todoId: newTodo.id,
            title: newTodo.title,
          },
          "Todo created"
        );

        return json(newTodo, { status: 201 });
      } catch (error) {
        logger.error(
          {
            event: "todo_create_failed",
            error: error instanceof Error ? error.message : String(error),
          },
          "Failed to create todo"
        );

        return json({ error: "Failed to create todo" }, { status: 500 });
      }
    }

    if (
      (req.method === "PATCH" || req.method === "DELETE") &&
      url.pathname.startsWith("/api/todos/")
    ) {
      const todoId = url.pathname.split("/").pop();

      if (!todoId) {
        return badRequest("Missing todo ID");
      }

      const todo = todos.find((item) => item.id === todoId);

      if (!todo) {
        logger.error(
          {
            event: "todo_not_found",
            todoId,
          },
          "Todo not found"
        );

        return json({ error: "Todo not found" }, { status: 404 });
      }

      if (req.method === "PATCH") {
        try {
          const body = await req.json();
          const changedFields: string[] = [];

          if (typeof body.title === "string") {
            todo.title = body.title.trim() || todo.title;
            changedFields.push("title");
          }

          if (typeof body.completed === "boolean") {
            todo.completed = body.completed;
            changedFields.push("completed");
          }

          logger.info(
            {
              event: "todo_updated",
              todoId: todo.id,
              changedFields,
              completed: todo.completed,
            },
            "Todo updated"
          );

          return json(todo);
        } catch (error) {
          logger.error(
            {
              event: "todo_update_failed",
              todoId,
              error: error instanceof Error ? error.message : String(error),
            },
            "Failed to update todo"
          );

          return json({ error: "Failed to update todo" }, { status: 500 });
        }
      }

      if (req.method === "DELETE") {
        try {
          const index = todos.findIndex((item) => item.id === todoId);
          todos.splice(index, 1);

          logger.info(
            {
              event: "todo_deleted",
              todoId,
            },
            "Todo deleted"
          );

          return new Response(null, { status: 204 });
        } catch (error) {
          logger.error(
            {
              event: "todo_delete_failed",
              todoId,
              error: error instanceof Error ? error.message : String(error),
            },
            "Failed to delete todo"
          );

          return json({ error: "Failed to delete todo" }, { status: 500 });
        }
      }
    }

    return new Response("Not Found", { status: 404 });
  },
});

console.log(`Server running at http://localhost:${server.port}`);
