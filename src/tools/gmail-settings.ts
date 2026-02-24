import { Tool, TextContent, ImageContent, EmbeddedResource } from '@modelcontextprotocol/sdk/types.js';
import { GAuthService } from '../services/gauth.js';
import { google } from 'googleapis';
import { USER_ID_ARG } from '../types/tool-handler.js';

export class GmailSettingsTools {
  private gmail;

  constructor(private gauth: GAuthService) {
    this.gmail = google.gmail({ version: 'v1', auth: this.gauth.getClient() });
  }

  getTools(): Tool[] {
    return [
      {
        name: 'gmail_settings_list_labels',
        description: 'List all labels in the user\'s Gmail mailbox, including system labels and user-created labels.',
        inputSchema: {
          type: 'object',
          properties: {
            user_id: {
              type: 'string',
              description: USER_ID_ARG,
            },
          },
          required: ['user_id'],
        },
      },
      {
        name: 'gmail_settings_create_label',
        description: 'Create a new label in the user\'s Gmail mailbox.',
        inputSchema: {
          type: 'object',
          properties: {
            user_id: {
              type: 'string',
              description: USER_ID_ARG,
            },
            name: {
              type: 'string',
              description: 'The display name of the label.',
            },
            visibility: {
              type: 'string',
              description: 'The visibility of the label in the label list. One of: labelShow, labelShowIfUnread, labelHide. Defaults to labelShow.',
            },
            message_visibility: {
              type: 'string',
              description: 'The visibility of messages with this label in the message list. One of: show, hide. Defaults to show.',
            },
          },
          required: ['user_id', 'name'],
        },
      },
      {
        name: 'gmail_settings_delete_label',
        description: 'Delete a label from the user\'s Gmail mailbox. System labels cannot be deleted.',
        inputSchema: {
          type: 'object',
          properties: {
            user_id: {
              type: 'string',
              description: USER_ID_ARG,
            },
            label_id: {
              type: 'string',
              description: 'The ID of the label to delete.',
            },
          },
          required: ['user_id', 'label_id'],
        },
      },
      {
        name: 'gmail_settings_list_filters',
        description: 'List all message filters in the user\'s Gmail settings.',
        inputSchema: {
          type: 'object',
          properties: {
            user_id: {
              type: 'string',
              description: USER_ID_ARG,
            },
          },
          required: ['user_id'],
        },
      },
      {
        name: 'gmail_settings_create_filter',
        description: 'Create a new message filter in Gmail. Filters automatically apply actions to incoming messages matching the specified criteria.',
        inputSchema: {
          type: 'object',
          properties: {
            user_id: {
              type: 'string',
              description: USER_ID_ARG,
            },
            from: {
              type: 'string',
              description: 'The sender\'s email address to match.',
            },
            to: {
              type: 'string',
              description: 'The recipient\'s email address to match.',
            },
            subject: {
              type: 'string',
              description: 'The subject line to match.',
            },
            query: {
              type: 'string',
              description: 'A Gmail search query string to match messages.',
            },
            has_attachment: {
              type: 'boolean',
              description: 'Whether to match messages that have attachments.',
            },
            add_label_ids: {
              type: 'array',
              items: { type: 'string' },
              description: 'List of label IDs to add to matching messages.',
            },
            remove_label_ids: {
              type: 'array',
              items: { type: 'string' },
              description: 'List of label IDs to remove from matching messages.',
            },
            forward: {
              type: 'string',
              description: 'Email address to forward matching messages to.',
            },
          },
          required: ['user_id'],
        },
      },
      {
        name: 'gmail_settings_delete_filter',
        description: 'Delete a message filter from the user\'s Gmail settings.',
        inputSchema: {
          type: 'object',
          properties: {
            user_id: {
              type: 'string',
              description: USER_ID_ARG,
            },
            filter_id: {
              type: 'string',
              description: 'The ID of the filter to delete.',
            },
          },
          required: ['user_id', 'filter_id'],
        },
      },
      {
        name: 'gmail_settings_get_vacation',
        description: 'Get the vacation auto-reply settings for the user\'s Gmail account.',
        inputSchema: {
          type: 'object',
          properties: {
            user_id: {
              type: 'string',
              description: USER_ID_ARG,
            },
          },
          required: ['user_id'],
        },
      },
      {
        name: 'gmail_settings_set_vacation',
        description: 'Update the vacation auto-reply settings for the user\'s Gmail account.',
        inputSchema: {
          type: 'object',
          properties: {
            user_id: {
              type: 'string',
              description: USER_ID_ARG,
            },
            enable: {
              type: 'boolean',
              description: 'Whether to enable the vacation auto-reply.',
            },
            subject: {
              type: 'string',
              description: 'The subject line of the vacation auto-reply.',
            },
            body: {
              type: 'string',
              description: 'The plain text body of the vacation auto-reply.',
            },
            restrict_to_contacts: {
              type: 'boolean',
              description: 'Whether to only send auto-replies to senders in the user\'s contacts. Defaults to false.',
            },
            restrict_to_domain: {
              type: 'boolean',
              description: 'Whether to only send auto-replies to senders in the same domain. Defaults to false.',
            },
            start_time: {
              type: 'string',
              description: 'The start time for the vacation period in milliseconds since epoch.',
            },
            end_time: {
              type: 'string',
              description: 'The end time for the vacation period in milliseconds since epoch.',
            },
          },
          required: ['user_id', 'enable'],
        },
      },
      {
        name: 'gmail_settings_list_send_as',
        description: 'List the send-as aliases for the user\'s Gmail account, including the primary address and any configured aliases.',
        inputSchema: {
          type: 'object',
          properties: {
            user_id: {
              type: 'string',
              description: USER_ID_ARG,
            },
          },
          required: ['user_id'],
        },
      },
      {
        name: 'gmail_settings_list_forwarding',
        description: 'List the forwarding addresses configured for the user\'s Gmail account.',
        inputSchema: {
          type: 'object',
          properties: {
            user_id: {
              type: 'string',
              description: USER_ID_ARG,
            },
          },
          required: ['user_id'],
        },
      },
      {
        name: 'gmail_settings_list_delegates',
        description: 'List the delegates for the user\'s Gmail account. Delegates can read, send, and delete messages on behalf of the account owner.',
        inputSchema: {
          type: 'object',
          properties: {
            user_id: {
              type: 'string',
              description: USER_ID_ARG,
            },
          },
          required: ['user_id'],
        },
      },
    ];
  }

  async handleTool(name: string, args: Record<string, unknown>): Promise<Array<TextContent | ImageContent | EmbeddedResource>> {
    switch (name) {
      case 'gmail_settings_list_labels':
        return this.listLabels(args);
      case 'gmail_settings_create_label':
        return this.createLabel(args);
      case 'gmail_settings_delete_label':
        return this.deleteLabel(args);
      case 'gmail_settings_list_filters':
        return this.listFilters(args);
      case 'gmail_settings_create_filter':
        return this.createFilter(args);
      case 'gmail_settings_delete_filter':
        return this.deleteFilter(args);
      case 'gmail_settings_get_vacation':
        return this.getVacation(args);
      case 'gmail_settings_set_vacation':
        return this.setVacation(args);
      case 'gmail_settings_list_send_as':
        return this.listSendAs(args);
      case 'gmail_settings_list_forwarding':
        return this.listForwarding(args);
      case 'gmail_settings_list_delegates':
        return this.listDelegates(args);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  private async listLabels(args: Record<string, unknown>): Promise<Array<TextContent>> {
    if (!args.user_id) {
      throw new Error('user_id is required');
    }

    const response = await this.gmail.users.labels.list({
      userId: args.user_id as string,
    });

    const labels = response.data.labels || [];
    const result = labels.map((label) => ({
      id: label.id,
      name: label.name,
      type: label.type,
      messagesTotal: label.messagesTotal,
      messagesUnread: label.messagesUnread,
      threadsTotal: label.threadsTotal,
      threadsUnread: label.threadsUnread,
    }));

    return [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2),
      },
    ];
  }

  private async createLabel(args: Record<string, unknown>): Promise<Array<TextContent>> {
    if (!args.user_id) {
      throw new Error('user_id is required');
    }
    if (!args.name) {
      throw new Error('name is required');
    }

    const response = await this.gmail.users.labels.create({
      userId: args.user_id as string,
      requestBody: {
        name: args.name as string,
        labelListVisibility: (args.visibility as string) || 'labelShow',
        messageListVisibility: (args.message_visibility as string) || 'show',
      },
    });

    return [
      {
        type: 'text',
        text: JSON.stringify(response.data, null, 2),
      },
    ];
  }

  private async deleteLabel(args: Record<string, unknown>): Promise<Array<TextContent>> {
    if (!args.user_id) {
      throw new Error('user_id is required');
    }
    if (!args.label_id) {
      throw new Error('label_id is required');
    }

    await this.gmail.users.labels.delete({
      userId: args.user_id as string,
      id: args.label_id as string,
    });

    return [
      {
        type: 'text',
        text: `Label ${args.label_id} deleted successfully.`,
      },
    ];
  }

  private async listFilters(args: Record<string, unknown>): Promise<Array<TextContent>> {
    if (!args.user_id) {
      throw new Error('user_id is required');
    }

    const response = await this.gmail.users.settings.filters.list({
      userId: args.user_id as string,
    });

    const filters = response.data.filter || [];

    return [
      {
        type: 'text',
        text: JSON.stringify(filters, null, 2),
      },
    ];
  }

  private async createFilter(args: Record<string, unknown>): Promise<Array<TextContent>> {
    if (!args.user_id) {
      throw new Error('user_id is required');
    }

    const criteriaRaw: Record<string, unknown> = {
      from: args.from,
      to: args.to,
      subject: args.subject,
      query: args.query,
      hasAttachment: args.has_attachment,
    };

    const criteria: Record<string, unknown> = Object.fromEntries(
      Object.entries(criteriaRaw).filter(([, v]) => v !== undefined)
    );

    const actionRaw: Record<string, unknown> = {
      addLabelIds: args.add_label_ids,
      removeLabelIds: args.remove_label_ids,
      forward: args.forward,
    };

    const action: Record<string, unknown> = Object.fromEntries(
      Object.entries(actionRaw).filter(([, v]) => v !== undefined)
    );

    const response = await this.gmail.users.settings.filters.create({
      userId: args.user_id as string,
      requestBody: {
        criteria: Object.keys(criteria).length > 0 ? criteria : undefined,
        action: Object.keys(action).length > 0 ? action : undefined,
      },
    });

    return [
      {
        type: 'text',
        text: JSON.stringify(response.data, null, 2),
      },
    ];
  }

  private async deleteFilter(args: Record<string, unknown>): Promise<Array<TextContent>> {
    if (!args.user_id) {
      throw new Error('user_id is required');
    }
    if (!args.filter_id) {
      throw new Error('filter_id is required');
    }

    await this.gmail.users.settings.filters.delete({
      userId: args.user_id as string,
      id: args.filter_id as string,
    });

    return [
      {
        type: 'text',
        text: `Filter ${args.filter_id} deleted successfully.`,
      },
    ];
  }

  private async getVacation(args: Record<string, unknown>): Promise<Array<TextContent>> {
    if (!args.user_id) {
      throw new Error('user_id is required');
    }

    const response = await this.gmail.users.settings.getVacation({
      userId: args.user_id as string,
    });

    return [
      {
        type: 'text',
        text: JSON.stringify(response.data, null, 2),
      },
    ];
  }

  private async setVacation(args: Record<string, unknown>): Promise<Array<TextContent>> {
    if (!args.user_id) {
      throw new Error('user_id is required');
    }
    if (args.enable === undefined) {
      throw new Error('enable is required');
    }

    const response = await this.gmail.users.settings.updateVacation({
      userId: args.user_id as string,
      requestBody: {
        enableAutoReply: args.enable as boolean,
        responseSubject: args.subject as string | undefined,
        responseBodyPlainText: args.body as string | undefined,
        restrictToContacts: (args.restrict_to_contacts as boolean) || false,
        restrictToDomain: (args.restrict_to_domain as boolean) || false,
        startTime: args.start_time as string | undefined,
        endTime: args.end_time as string | undefined,
      },
    });

    return [
      {
        type: 'text',
        text: JSON.stringify(response.data, null, 2),
      },
    ];
  }

  private async listSendAs(args: Record<string, unknown>): Promise<Array<TextContent>> {
    if (!args.user_id) {
      throw new Error('user_id is required');
    }

    const response = await this.gmail.users.settings.sendAs.list({
      userId: args.user_id as string,
    });

    const sendAs = response.data.sendAs || [];

    return [
      {
        type: 'text',
        text: JSON.stringify(sendAs, null, 2),
      },
    ];
  }

  private async listForwarding(args: Record<string, unknown>): Promise<Array<TextContent>> {
    if (!args.user_id) {
      throw new Error('user_id is required');
    }

    const response = await this.gmail.users.settings.forwardingAddresses.list({
      userId: args.user_id as string,
    });

    const addresses = response.data.forwardingAddresses || [];

    return [
      {
        type: 'text',
        text: JSON.stringify(addresses, null, 2),
      },
    ];
  }

  private async listDelegates(args: Record<string, unknown>): Promise<Array<TextContent>> {
    if (!args.user_id) {
      throw new Error('user_id is required');
    }

    try {
      const response = await this.gmail.users.settings.delegates.list({
        userId: args.user_id as string,
      });

      const delegates = response.data.delegates || [];

      return [
        {
          type: 'text',
          text: JSON.stringify(delegates, null, 2),
        },
      ];
    } catch (error: unknown) {
      const code = (error as any)?.code;
      const message = (error as Error)?.message || '';
      if (code === 403 || message.includes('domain-wide authority') || message.includes('Access restricted')) {
        return [
          {
            type: 'text',
            text: JSON.stringify({
              delegates: [],
              note: 'Delegates API requires domain-wide delegation of authority (service account). Listing delegates via OAuth user tokens is not supported by the Gmail API.'
            }, null, 2),
          },
        ];
      }
      throw error;
    }
  }
}
