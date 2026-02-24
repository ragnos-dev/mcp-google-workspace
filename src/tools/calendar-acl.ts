import { Tool, TextContent, ImageContent, EmbeddedResource } from '@modelcontextprotocol/sdk/types.js';
import { GAuthService } from '../services/gauth.js';
import { google } from 'googleapis';
import { USER_ID_ARG } from '../types/tool-handler.js';

export class CalendarAclTools {
  private calendar: ReturnType<typeof google.calendar>;

  constructor(private gauth: GAuthService) {
    this.calendar = google.calendar({ version: 'v3', auth: this.gauth.getClient() });
  }

  getTools(): Tool[] {
    return [
      {
        name: 'calendar_acl_list',
        description: 'List all access control rules (ACL) for a calendar. Returns the list of rules with their IDs, scope (type and value), and roles.',
        inputSchema: {
          type: 'object',
          properties: {
            [USER_ID_ARG]: {
              type: 'string',
              description: 'Email address of the user',
            },
            calendar_id: {
              type: 'string',
              description: 'Calendar identifier. Defaults to the primary calendar if not specified.',
            },
          },
          required: [USER_ID_ARG],
        },
      },
      {
        name: 'calendar_acl_add',
        description: 'Add an access control rule to a calendar. Roles: "none" (no access), "freeBusyReader" (see free/busy info only), "reader" (read-only), "writer" (read/write), "owner" (full ownership). Scope types: "default" (public), "user" (specific email), "group" (Google Group), "domain" (entire domain).',
        inputSchema: {
          type: 'object',
          properties: {
            [USER_ID_ARG]: {
              type: 'string',
              description: 'Email address of the user',
            },
            calendar_id: {
              type: 'string',
              description: 'Calendar identifier. Defaults to the primary calendar if not specified.',
            },
            role: {
              type: 'string',
              description: 'The role to assign. One of: "none", "freeBusyReader", "reader", "writer", "owner".',
            },
            scope_type: {
              type: 'string',
              description: 'The type of scope. One of: "default" (public access), "user" (specific user by email), "group" (Google Group by email), "domain" (all users in a domain).',
            },
            scope_value: {
              type: 'string',
              description: 'The email address or domain for the scope. Required for scope_type "user", "group", or "domain". Not needed for "default".',
            },
          },
          required: [USER_ID_ARG, 'role', 'scope_type', 'scope_value'],
        },
      },
      {
        name: 'calendar_acl_remove',
        description: 'Remove an access control rule from a calendar by its rule ID.',
        inputSchema: {
          type: 'object',
          properties: {
            [USER_ID_ARG]: {
              type: 'string',
              description: 'Email address of the user',
            },
            calendar_id: {
              type: 'string',
              description: 'Calendar identifier. Defaults to the primary calendar if not specified.',
            },
            rule_id: {
              type: 'string',
              description: 'The ID of the ACL rule to remove.',
            },
          },
          required: [USER_ID_ARG, 'rule_id'],
        },
      },
      {
        name: 'calendar_freebusy',
        description: 'Query free/busy information for a set of calendars within a given time range. Returns busy intervals for each requested calendar.',
        inputSchema: {
          type: 'object',
          properties: {
            [USER_ID_ARG]: {
              type: 'string',
              description: 'Email address of the user',
            },
            time_min: {
              type: 'string',
              description: 'The start of the interval for the query in RFC3339 format (e.g., "2024-01-15T09:00:00Z").',
            },
            time_max: {
              type: 'string',
              description: 'The end of the interval for the query in RFC3339 format (e.g., "2024-01-15T17:00:00Z").',
            },
            items: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'Array of calendar IDs or email addresses to query for free/busy information.',
            },
            timezone: {
              type: 'string',
              description: 'Time zone used in the response. Defaults to UTC if not specified.',
            },
          },
          required: [USER_ID_ARG, 'time_min', 'time_max', 'items'],
        },
      },
      {
        name: 'calendar_get_settings',
        description: 'Retrieve all Google Calendar settings for the authenticated user. Returns all settings as key-value pairs.',
        inputSchema: {
          type: 'object',
          properties: {
            [USER_ID_ARG]: {
              type: 'string',
              description: 'Email address of the user',
            },
          },
          required: [USER_ID_ARG],
        },
      },
    ];
  }

  async handleTool(
    name: string,
    args: Record<string, unknown>
  ): Promise<Array<TextContent | ImageContent | EmbeddedResource>> {
    switch (name) {
      case 'calendar_acl_list':
        return this.listAcl(args);
      case 'calendar_acl_add':
        return this.addAcl(args);
      case 'calendar_acl_remove':
        return this.removeAcl(args);
      case 'calendar_freebusy':
        return this.queryFreeBusy(args);
      case 'calendar_get_settings':
        return this.getSettings(args);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  private async listAcl(
    args: Record<string, unknown>
  ): Promise<Array<TextContent>> {
    if (!args.user_id) {
      throw new Error('user_id is required');
    }

    const calendarId = (args.calendar_id as string) || 'primary';

    const response = await this.calendar.acl.list({ calendarId });
    const rules = response.data.items || [];

    const formatted = rules.map((rule) => ({
      id: rule.id,
      role: rule.role,
      scope: {
        type: rule.scope?.type,
        value: rule.scope?.value,
      },
    }));

    return [
      {
        type: 'text',
        text: JSON.stringify({ calendarId, rules: formatted }, null, 2),
      },
    ];
  }

  private async addAcl(
    args: Record<string, unknown>
  ): Promise<Array<TextContent>> {
    if (!args.user_id) {
      throw new Error('user_id is required');
    }
    if (!args.role) {
      throw new Error('role is required');
    }
    if (!args.scope_type) {
      throw new Error('scope_type is required');
    }
    if (!args.scope_value) {
      throw new Error('scope_value is required');
    }

    const calendarId = (args.calendar_id as string) || 'primary';

    const response = await this.calendar.acl.insert({
      calendarId,
      requestBody: {
        role: args.role as string,
        scope: {
          type: args.scope_type as string,
          value: args.scope_value as string,
        },
      },
    });

    const rule = response.data;

    return [
      {
        type: 'text',
        text: JSON.stringify(
          {
            success: true,
            rule: {
              id: rule.id,
              role: rule.role,
              scope: {
                type: rule.scope?.type,
                value: rule.scope?.value,
              },
            },
          },
          null,
          2
        ),
      },
    ];
  }

  private async removeAcl(
    args: Record<string, unknown>
  ): Promise<Array<TextContent>> {
    if (!args.user_id) {
      throw new Error('user_id is required');
    }
    if (!args.rule_id) {
      throw new Error('rule_id is required');
    }

    const calendarId = (args.calendar_id as string) || 'primary';

    await this.calendar.acl.delete({
      calendarId,
      ruleId: args.rule_id as string,
    });

    return [
      {
        type: 'text',
        text: JSON.stringify(
          {
            success: true,
            message: `ACL rule "${args.rule_id}" removed from calendar "${calendarId}".`,
          },
          null,
          2
        ),
      },
    ];
  }

  private async queryFreeBusy(
    args: Record<string, unknown>
  ): Promise<Array<TextContent>> {
    if (!args.user_id) {
      throw new Error('user_id is required');
    }
    if (!args.time_min) {
      throw new Error('time_min is required');
    }
    if (!args.time_max) {
      throw new Error('time_max is required');
    }
    if (!args.items || !Array.isArray(args.items) || args.items.length === 0) {
      throw new Error('items is required and must be a non-empty array');
    }

    const response = await this.calendar.freebusy.query({
      requestBody: {
        timeMin: args.time_min as string,
        timeMax: args.time_max as string,
        items: (args.items as string[]).map((id: string) => ({ id })),
        timeZone: (args.timezone as string) || 'UTC',
      },
    });

    const data = response.data;

    return [
      {
        type: 'text',
        text: JSON.stringify(
          {
            timeMin: data.timeMin,
            timeMax: data.timeMax,
            calendars: data.calendars,
          },
          null,
          2
        ),
      },
    ];
  }

  private async getSettings(
    args: Record<string, unknown>
  ): Promise<Array<TextContent>> {
    if (!args.user_id) {
      throw new Error('user_id is required');
    }

    const response = await this.calendar.settings.list();
    const items = response.data.items || [];

    const settings = items.reduce(
      (acc: Record<string, string>, item) => {
        if (item.id) {
          acc[item.id] = item.value || '';
        }
        return acc;
      },
      {}
    );

    return [
      {
        type: 'text',
        text: JSON.stringify({ settings }, null, 2),
      },
    ];
  }
}
