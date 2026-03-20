import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { MewsClient } from "../types/mews.js";

export function registerTaskTools(server: McpServer, mews: MewsClient) {
  server.tool(
    "mews_get_tasks",
    "Get tasks from Mews (housekeeping, maintenance, custom tasks, etc.). " +
      "Filter by date range or task IDs. Returns task details including name, state, " +
      "deadline, assigned department, and resolution notes.",
    {
      taskIds: z
        .array(z.string().uuid())
        .optional()
        .describe("Filter by specific task UUIDs"),
      startUtc: z
        .string()
        .optional()
        .describe("Start of date range for task deadlines (ISO 8601 UTC)"),
      endUtc: z
        .string()
        .optional()
        .describe("End of date range for task deadlines (ISO 8601 UTC)"),
      limit: z
        .number()
        .int()
        .min(1)
        .max(1000)
        .optional()
        .default(100)
        .describe("Max results per page (default 100)"),
      cursor: z
        .string()
        .optional()
        .describe("Pagination cursor from a previous response"),
    },
    async (params) => {
      const body: Record<string, unknown> = {
        Limitation: {
          Count: params.limit,
          ...(params.cursor ? { Cursor: params.cursor } : {}),
        },
      };

      if (params.taskIds) body.TaskIds = params.taskIds;
      if (params.startUtc && params.endUtc) {
        body.DeadlineUtc = { StartUtc: params.startUtc, EndUtc: params.endUtc };
      }

      const result = await mews.request("tasks/getAll", body);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.tool(
    "mews_add_task",
    "Create a new task in Mews. Tasks can be used for housekeeping requests, " +
      "maintenance issues, or any custom operational task.",
    {
      name: z.string().describe("Task name/title (required)"),
      description: z.string().optional().describe("Detailed task description"),
      deadlineUtc: z.string().describe("Task deadline (ISO 8601 UTC)"),
      serviceId: z
        .string()
        .uuid()
        .optional()
        .describe("Service ID the task belongs to"),
      departmentId: z
        .string()
        .uuid()
        .optional()
        .describe("Department ID to assign the task to"),
      resourceId: z
        .string()
        .uuid()
        .optional()
        .describe("Room/resource ID the task is related to"),
    },
    async (params) => {
      const body: Record<string, unknown> = {
        Name: params.name,
        DeadlineUtc: params.deadlineUtc,
      };

      if (params.description) body.Description = params.description;
      if (params.serviceId) body.ServiceId = params.serviceId;
      if (params.departmentId) body.DepartmentId = params.departmentId;
      if (params.resourceId) body.ResourceId = params.resourceId;

      const result = await mews.request("tasks/add", body);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );
}
