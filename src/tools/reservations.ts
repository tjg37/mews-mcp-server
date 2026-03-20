import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { MewsClient } from "../types/mews.js";

export function registerReservationTools(server: McpServer, mews: MewsClient) {
  server.tool(
    "mews_get_reservations",
    "Get reservations from Mews, filtered by date range, state, customer IDs, or reservation IDs. " +
      "Returns reservation details including dates, state, assigned room, rate, and customer. " +
      "Use startUtc/endUtc for the reservation interval (check-in to check-out overlap). " +
      "States: Enquired, Requested, Optional, Confirmed, Started, Processed, Canceled.",
    {
      reservationIds: z
        .array(z.string().uuid())
        .optional()
        .describe("Filter by specific reservation UUIDs"),
      customerIds: z
        .array(z.string().uuid())
        .optional()
        .describe("Filter by customer UUIDs"),
      startUtc: z
        .string()
        .optional()
        .describe("Start of date range (ISO 8601 UTC). Reservations overlapping this range are returned."),
      endUtc: z
        .string()
        .optional()
        .describe("End of date range (ISO 8601 UTC)"),
      states: z
        .array(
          z.enum([
            "Enquired", "Requested", "Optional", "Confirmed",
            "Started", "Processed", "Canceled",
          ]),
        )
        .optional()
        .describe("Filter by reservation states"),
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

      if (params.reservationIds) body.ReservationIds = params.reservationIds;
      if (params.customerIds) body.CustomerIds = params.customerIds;
      if (params.states) body.States = params.states;
      if (params.startUtc && params.endUtc) {
        body.Interval = { StartUtc: params.startUtc, EndUtc: params.endUtc };
      }

      const result = await mews.request("reservations/getAll", body);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.tool(
    "mews_add_reservations",
    "Create one or more new reservations in Mews. Requires a service ID (typically the Accommodation service), " +
      "and for each reservation: start/end UTC dates, rate ID, and the number of adults. " +
      "Optionally assign a customer, room category, or specific room.",
    {
      serviceId: z
        .string()
        .uuid()
        .describe("The service ID (get from mews_get_services, usually the Accommodation service)"),
      reservations: z
        .array(
          z.object({
            startUtc: z.string().describe("Check-in date (ISO 8601 UTC)"),
            endUtc: z.string().describe("Check-out date (ISO 8601 UTC)"),
            adultCount: z.number().int().min(1).describe("Number of adults"),
            childCount: z.number().int().min(0).optional().describe("Number of children (default 0)"),
            rateId: z.string().uuid().describe("Rate plan ID (get from mews_get_rates)"),
            customerId: z.string().uuid().optional().describe("Customer UUID to assign"),
            resourceCategoryId: z.string().uuid().optional().describe("Room category ID"),
            resourceId: z.string().uuid().optional().describe("Specific room/resource ID"),
            notes: z.string().optional().describe("Reservation notes"),
          }),
        )
        .describe("Array of reservations to create"),
    },
    async (params) => {
      const body: Record<string, unknown> = {
        ServiceId: params.serviceId,
        Reservations: params.reservations.map((r) => ({
          StartUtc: r.startUtc,
          EndUtc: r.endUtc,
          AdultCount: r.adultCount,
          ChildCount: r.childCount ?? 0,
          RateId: r.rateId,
          ...(r.customerId ? { CustomerId: r.customerId } : {}),
          ...(r.resourceCategoryId ? { ResourceCategoryId: r.resourceCategoryId } : {}),
          ...(r.resourceId ? { ResourceId: r.resourceId } : {}),
          ...(r.notes ? { Notes: r.notes } : {}),
        })),
      };

      const result = await mews.request("reservations/add", body);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.tool(
    "mews_update_reservation",
    "Update an existing reservation in Mews. You can change dates, room assignment, " +
      "guest count, or notes. Only provided fields are updated.",
    {
      reservationId: z
        .string()
        .uuid()
        .describe("The reservation UUID to update"),
      startUtc: z.string().optional().describe("New check-in date (ISO 8601 UTC)"),
      endUtc: z.string().optional().describe("New check-out date (ISO 8601 UTC)"),
      adultCount: z.number().int().min(1).optional().describe("New number of adults"),
      childCount: z.number().int().min(0).optional().describe("New number of children"),
      resourceId: z.string().uuid().optional().describe("New room/resource ID"),
      resourceCategoryId: z.string().uuid().optional().describe("New room category ID"),
      notes: z.string().optional().describe("Updated reservation notes"),
    },
    async (params) => {
      const body: Record<string, unknown> = {
        ReservationId: params.reservationId,
      };

      if (params.startUtc) body.StartUtc = { Value: params.startUtc };
      if (params.endUtc) body.EndUtc = { Value: params.endUtc };
      if (params.adultCount !== undefined) body.AdultCount = { Value: params.adultCount };
      if (params.childCount !== undefined) body.ChildCount = { Value: params.childCount };
      if (params.resourceId) body.ResourceId = { Value: params.resourceId };
      if (params.resourceCategoryId) body.ResourceCategoryId = { Value: params.resourceCategoryId };
      if (params.notes !== undefined) body.Notes = { Value: params.notes };

      const result = await mews.request("reservations/update", body);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.tool(
    "mews_cancel_reservation",
    "Cancel a reservation in Mews. This sets the reservation state to Canceled. " +
      "Provide a reason for the cancellation.",
    {
      reservationId: z
        .string()
        .uuid()
        .describe("The reservation UUID to cancel"),
      reason: z
        .string()
        .optional()
        .describe("Reason for cancellation"),
    },
    async (params) => {
      const body: Record<string, unknown> = {
        ReservationId: params.reservationId,
      };
      if (params.reason) body.Notes = params.reason;

      const result = await mews.request("reservations/cancel", body);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );
}
