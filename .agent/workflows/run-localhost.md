---
description: How to efficiently run the local development server
---

# Running Localhost

To run the local development server efficiently and avoid common pitfalls (like port conflicts or resource exhaustion), follow these steps.

## The "Happy Path"

1.  **Check for existing processes**:
    Before starting, ensure no orphaned processes are holding onto the ports (3000, 3001, 3002).
    ```bash
    lsof -i :3000 -i :3001 -i :3002
    ```
    If processes are found, kill them:
    ```bash
    kill -9 $(lsof -t -i :3000 -i :3001 -i :3002)
    ```

2.  **Run with Filters (Recommended)**:
    Instead of running the entire monorepo, run only the app you are working on.

    *   **For Portfolio**:
        ```bash
        pnpm dev --filter web
        ```

    *   **For Creative Powerup**:
        ```bash
        pnpm dev --filter creative-powerup
        ```

3.  **Run Everything (If needed)**:
    ```bash
    pnpm dev
    ```

## Troubleshooting

*   **"Address already in use"**: Run step 1 to kill old processes.
*   **"Concurrency" errors**: Use the `--concurrency 20` flag if running manually (the root `pnpm dev` script already includes this).
*   **Browser Timeout**: If the browser agent fails to connect, the server might still be compiling. Give it 10-20 seconds after the "Ready" message appears in the terminal.
