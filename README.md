# Assignment 6 - Monitoring with Datadog

Add observability to your application using Datadog. By the end of this assignment your app will report real user interactions via Datadog RUM, send structured logs from your API, and display the health of the application on a custom dashboard.

This assignment continues where Assignment 5 left off — you will copy your Assignment 5 project into this repository and add monitoring on top of it.

**Group size:** 1 person

---

## Prerequisites

- Complete Assignment 5 (Kubernetes & Terraform)
- [Bun](https://bun.sh/) version 1.3 or later installed
- [Docker](https://docs.docker.com/get-docker/) installed and running
- [Kind](https://kind.sigs.k8s.io/) cluster from Assignment 5 still running (verify with `kubectl get nodes`)
- A [Datadog](https://www.datadoghq.com/) account — students can get free access via the [GitHub Student Developer Pack](https://education.github.com/pack)

## Setup

1. Accept the GitHub Classroom assignment and clone this repository
2. Copy your **Assignment 5** project files into this repository (everything except the `.git` directory):

   ```bash
   # From inside your new assignment-6 directory
   cp -r ../assignment-5-k8s-terraform/* .
   cp ../assignment-5-k8s-terraform/.github .
   cp ../assignment-5-k8s-terraform/.gitignore . 2>/dev/null
   ```

   > **Note:** Adjust the path above if your Assignment 5 directory has a different name or location. The goal is to bring over all your source code, Dockerfile, Kubernetes manifests, Terraform config, and GitHub Actions workflow.

3. Run `bun install` and verify the app starts with `bun run start`
4. Commit the initial copy as your starting point

---

## The Assignment

### Task 1: Create a Datadog Account (Commit 1)

Before adding monitoring, you need a Datadog account and application credentials.

**1a. Sign up for Datadog**

1. Go to [datadoghq.com](https://www.datadoghq.com/) and create a free account (use the GitHub Student Developer Pack if available)
2. Once logged in, you will land on the Datadog dashboard

**1b. Create a RUM Application**

1. In Datadog, navigate to **Digital Experience > Real User Monitoring > Applications** (or search for "RUM" in the sidebar)
2. Click **"New Application"**
3. Select **JavaScript (JS)** as the application type
4. Give your application a name (e.g., `assignment-6-todo`)
5. Note down the **Application ID** and **Client Token** — you will need these in the next task

> **Important:** Your Application ID and Client Token are not secrets in the traditional sense (they are included in client-side code), but you should still avoid hardcoding them directly. Use environment variables to keep your code clean and configurable.

**1c. Add environment variables**

Add the following to your `.env` file (create one if it doesn't exist):

```bash
DATADOG_APPLICATION_ID=your-application-id
DATADOG_CLIENT_TOKEN=your-client-token
```

> **Note:** Make sure `.env` is in your `.gitignore` — it should never be committed.

**Commit your changes with a descriptive message.**

---

### Task 2: Add Datadog RUM (Commit 2)

Add the Datadog Real User Monitoring (RUM) SDK to track page views, user interactions, and frontend errors.

**2a. Install the RUM SDK**

```bash
bun add @datadog/browser-rum
```

**2b. Initialize RUM in your application**

Create a client-side component (or add to an existing one) that initializes the Datadog RUM SDK. The initialization should run once when the application loads.

```typescript
import { datadogRum } from '@datadog/browser-rum';

datadogRum.init({
  applicationId: process.env.DATADOG_APPLICATION_ID,
  clientToken: process.env.DATADOG_CLIENT_TOKEN,
  site: 'datadoghq.com',
  service: 'assignment-6-todo',
  env: 'production',
  sessionSampleRate: 100,
  sessionReplaySampleRate: 100,
  trackUserInteractions: true,
  trackResources: true,
  trackLongTasks: true,
});
```

> **Note:** If you are using a framework with server-side rendering (e.g., Next.js), make sure the RUM initialization only runs on the **client side**. Use a `"use client"` directive or wrap it in a `useEffect` hook.

**2c. Verify RUM is working**

1. Start your application locally (`bun run start` or deploy to the cluster)
2. Open the app in your browser and interact with it (create a todo, mark one as complete, etc.)
3. In Datadog, navigate to **Digital Experience > Real User Monitoring > Sessions**
4. You should see your session appear with page views and actions

**Commit your changes with a descriptive message.**

---

### Task 3: Add Datadog Logging (Commit 3)

Add structured logging to your API routes so you have visibility into what is happening on the server side.

**3a. Install the Datadog browser logs SDK**

```bash
bun add @datadog/browser-logs
```

**3b. Initialize the logs SDK**

Add the logs initialization alongside your RUM initialization:

```typescript
import { datadogLogs } from '@datadog/browser-logs';

datadogLogs.init({
  clientToken: process.env.DATADOG_CLIENT_TOKEN,
  site: 'datadoghq.com',
  service: 'assignment-6-todo',
  env: 'production',
  forwardErrorsToLogs: true,
  sessionSampleRate: 100,
});
```

**3c. Add structured logging to your API routes**

Add log statements to your API routes. At minimum, log the following events:

- **Todo creation** — log when a new todo is created (include the todo title)
- **Todo updates** — log when a todo is updated (include the todo ID and what changed)
- **Todo deletion** — log when a todo is deleted (include the todo ID)
- **Errors** — log any errors that occur in the API routes (include the error message and relevant context)

Example:

```typescript
import { datadogLogs } from '@datadog/browser-logs';

// When a todo is created
datadogLogs.logger.info('Todo created', {
  todoId: newTodo.id,
  title: newTodo.title,
});

// When an error occurs
datadogLogs.logger.error('Failed to create todo', {
  error: error.message,
});
```

> **Note:** Logs should include relevant context so that when you are debugging an issue, you can trace what happened. Think about what information would be useful if something went wrong in production.

**3d. Verify logs are appearing**

1. Interact with your application (create, update, and delete todos)
2. In Datadog, navigate to **Logs > Search**
3. Filter by service `assignment-6-todo`
4. You should see your structured log entries appearing

**Commit your changes with a descriptive message.**

---

### Task 4: Create a Datadog Dashboard (Commit 4)

Create a dashboard in Datadog that gives you an overview of the health and usage of your application.

**4a. Create a new dashboard**

1. In Datadog, navigate to **Dashboards > New Dashboard**
2. Give it a descriptive name (e.g., `Assignment 6 - Todo App`)
3. Choose **New Dashboard** (not "New Screenboard")

**4b. Add widgets to the dashboard**

Your dashboard should include **at minimum** the following:

- **Page views** — a graph or count of page views over time
- **User sessions** — number of active user sessions
- **Top actions** — most common user interactions (button clicks, form submissions, etc.)
- **Error rate** — frontend errors captured by RUM
- **Log volume** — count of log entries over time, broken down by level (info, error, etc.)

Feel free to add any additional widgets that you think provide useful information about the health of your application. Think about what you would want to see if you were responsible for keeping this app running in production.

> **Note:** It may take a few minutes for data to appear in Datadog after interacting with your application. If widgets show "No data", make sure you have generated some traffic by using the app.

**4c. Take a screenshot of your dashboard**

Once your dashboard has data, take a screenshot and add it to the `README.md` of your repository:

```markdown
## Datadog Dashboard

![Datadog Dashboard](./screenshots/dashboard.png)
```

Create a `screenshots/` directory and add your screenshot there.

**Commit your changes with a descriptive message.**

---

### Task 5: Explore and Document (Commit 5)

Answer the following questions by adding an `ANSWERS.md` file to the root of your repository (or appending to it if it already exists from Assignment 5).

1. What is Datadog RUM and how does it differ from backend/server logging?
2. Why is it important to include context (e.g., todo ID, user action) in log messages rather than just logging "error occurred"?
3. What metrics would you monitor if this application had real users? Name at least three and explain why each is important.
4. What is the difference between RUM session replay and traditional logging when debugging a user-reported issue?

**Commit your answers with a descriptive message.**

---

## Redeploy to the Cluster (Optional)

If you want your monitored application running on the Kind cluster from Assignment 5, rebuild and redeploy:

```bash
# Build the new image with monitoring included
docker build -t app:monitoring .

# Load into Kind
kind load docker-image app:monitoring --name assignment-5

# Update and apply the deployment
sed 's|IMAGE_TAG|monitoring|g' k8s/deployment.yaml | kubectl apply -f -
kubectl apply -f k8s/service.yaml

# Wait for rollout
kubectl rollout status deployment/app --timeout=60s
```

Visit http://localhost:30080 to verify the app is running with Datadog monitoring enabled.

---

## Handin

1. Ensure you have at least **5 commits** (one per task)
2. Verify the following before submitting:
   - Datadog RUM is initialized and capturing sessions (visible in Datadog)
   - Structured logging is added to API routes (visible in Datadog Logs)
   - A Datadog dashboard exists with at least the required widgets
   - A screenshot of the dashboard is included in `README.md`
   - `ANSWERS.md` contains answers to all four questions
3. Make sure the dashboard screenshot(s) are **clear and visible** in the README
4. Submit the GitHub repository link to Canvas

## Tips & Troubleshooting

- **No data in Datadog?** It can take a few minutes for data to appear. Make sure you have interacted with the app after initializing the SDKs. Check the browser console for any initialization errors.
- **RUM not initializing?** Make sure the initialization code runs on the client side. If using a framework with SSR, wrap it in `useEffect` or use a `"use client"` directive.
- **Environment variables not loading?** If your framework requires a prefix for client-side env vars (e.g., `NEXT_PUBLIC_` in Next.js), update your variable names accordingly.
- **Logs not appearing?** Verify your client token is correct and that `forwardErrorsToLogs` is enabled. Check the browser console network tab for requests to `browser-intake-datadoghq.com`.
- **Dashboard shows "No data"?** Make sure the time range in the top-right corner of the dashboard covers the period when you were using the app. Try setting it to "Past 1 Hour".
- **Free account limitations?** The Datadog free tier (or Student Pack) may have data retention limits. Complete the assignment within a reasonable timeframe so your data is still available.
- Remember what you learned in Assignment 5 — your cluster and deployment setup carries over to this assignment.

Good luck and have fun :)
