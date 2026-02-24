import { Tool, TextContent, ImageContent, EmbeddedResource } from '@modelcontextprotocol/sdk/types.js';
import { GAuthService } from '../services/gauth.js';
import { google } from 'googleapis';
import { USER_ID_ARG } from '../types/tool-handler.js';

export class AdminTools {
  private admin: any;

  constructor(private gauth: GAuthService) {
    this.admin = google.admin({ version: 'directory_v1', auth: this.gauth.getClient() });
  }

  getTools(): Tool[] {
    return [
      {
        name: 'admin_list_accounts',
        description: 'Lists all configured Google accounts that can be used with the admin tools. This tool does not require a user_id as it lists available accounts before selection.',
        inputSchema: {
          type: 'object',
          properties: {},
          additionalProperties: false,
          required: []
        }
      },
      {
        name: 'admin_list_users',
        description: 'Lists all users in a Google Workspace domain. Requires a Google Workspace admin account.',
        inputSchema: {
          type: 'object',
          properties: {
            [USER_ID_ARG]: {
              type: 'string',
              description: 'Email address of the admin user'
            },
            domain: {
              type: 'string',
              description: 'The domain name to list users from (e.g. example.com)'
            },
            max_results: {
              type: 'integer',
              description: 'Maximum number of users to return (1-500)',
              minimum: 1,
              maximum: 500,
              default: 100
            }
          },
          required: [USER_ID_ARG, 'domain']
        }
      },
      {
        name: 'admin_get_user',
        description: 'Retrieves detailed information about a specific user in Google Workspace. Requires a Google Workspace admin account.',
        inputSchema: {
          type: 'object',
          properties: {
            [USER_ID_ARG]: {
              type: 'string',
              description: 'Email address of the admin user'
            },
            user_key: {
              type: 'string',
              description: 'The user\'s primary email address, alias email, or unique user ID'
            }
          },
          required: [USER_ID_ARG, 'user_key']
        }
      },
      {
        name: 'admin_list_groups',
        description: 'Lists all groups in a Google Workspace domain. Requires a Google Workspace admin account.',
        inputSchema: {
          type: 'object',
          properties: {
            [USER_ID_ARG]: {
              type: 'string',
              description: 'Email address of the admin user'
            },
            domain: {
              type: 'string',
              description: 'The domain name to list groups from (e.g. example.com)'
            },
            max_results: {
              type: 'integer',
              description: 'Maximum number of groups to return (1-200)',
              minimum: 1,
              maximum: 200,
              default: 200
            }
          },
          required: [USER_ID_ARG, 'domain']
        }
      },
      {
        name: 'admin_get_group',
        description: 'Retrieves detailed information about a specific group in Google Workspace. Requires a Google Workspace admin account.',
        inputSchema: {
          type: 'object',
          properties: {
            [USER_ID_ARG]: {
              type: 'string',
              description: 'Email address of the admin user'
            },
            group_key: {
              type: 'string',
              description: 'The group\'s email address, alias, or unique group ID'
            }
          },
          required: [USER_ID_ARG, 'group_key']
        }
      },
      {
        name: 'admin_list_group_members',
        description: 'Lists all members of a specific Google Workspace group. Requires a Google Workspace admin account.',
        inputSchema: {
          type: 'object',
          properties: {
            [USER_ID_ARG]: {
              type: 'string',
              description: 'Email address of the admin user'
            },
            group_key: {
              type: 'string',
              description: 'The group\'s email address, alias, or unique group ID'
            },
            max_results: {
              type: 'integer',
              description: 'Maximum number of members to return (1-200)',
              minimum: 1,
              maximum: 200,
              default: 200
            }
          },
          required: [USER_ID_ARG, 'group_key']
        }
      },
      {
        name: 'admin_list_org_units',
        description: 'Lists all organizational units in a Google Workspace account. Requires a Google Workspace admin account.',
        inputSchema: {
          type: 'object',
          properties: {
            [USER_ID_ARG]: {
              type: 'string',
              description: 'Email address of the admin user'
            },
            customer_id: {
              type: 'string',
              description: 'The customer ID of the Google Workspace account. Defaults to "my_customer" for the authenticated user\'s domain.',
              default: 'my_customer'
            }
          },
          required: [USER_ID_ARG]
        }
      },
      {
        name: 'admin_get_domain_info',
        description: 'Retrieves information about a Google Workspace customer/domain. Requires a Google Workspace admin account.',
        inputSchema: {
          type: 'object',
          properties: {
            [USER_ID_ARG]: {
              type: 'string',
              description: 'Email address of the admin user'
            },
            customer_id: {
              type: 'string',
              description: 'The customer ID of the Google Workspace account. Defaults to "my_customer" for the authenticated user\'s domain.',
              default: 'my_customer'
            }
          },
          required: [USER_ID_ARG]
        }
      }
    ];
  }

  async handleTool(name: string, args: Record<string, any>): Promise<Array<TextContent | ImageContent | EmbeddedResource>> {
    switch (name) {
      case 'admin_list_accounts':
        return this.listAccounts();
      case 'admin_list_users':
        return this.listUsers(args);
      case 'admin_get_user':
        return this.getUser(args);
      case 'admin_list_groups':
        return this.listGroups(args);
      case 'admin_get_group':
        return this.getGroup(args);
      case 'admin_list_group_members':
        return this.listGroupMembers(args);
      case 'admin_list_org_units':
        return this.listOrgUnits(args);
      case 'admin_get_domain_info':
        return this.getDomainInfo(args);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  private async listAccounts(): Promise<Array<TextContent>> {
    try {
      const accounts = await this.gauth.getAccountInfo();
      const accountList = accounts.map(account => ({
        email: account.email,
        accountType: account.accountType,
        extraInfo: account.extraInfo,
        description: account.toDescription()
      }));

      if (accountList.length === 0) {
        return [{
          type: 'text',
          text: JSON.stringify({
            message: 'No accounts configured. Please check your .accounts.json file.',
            accounts: []
          }, null, 2)
        }];
      }

      return [{
        type: 'text',
        text: JSON.stringify({
          message: `Found ${accountList.length} configured account(s)`,
          accounts: accountList
        }, null, 2)
      }];
    } catch (error) {
      console.error('Error listing accounts:', error);
      return [{
        type: 'text',
        text: JSON.stringify({
          error: `Failed to list accounts: ${(error as Error).message}`,
          accounts: []
        }, null, 2)
      }];
    }
  }

  private async listUsers(args: Record<string, any>): Promise<Array<TextContent>> {
    const userId = args[USER_ID_ARG];
    if (!userId) {
      throw new Error(`Missing required argument: ${USER_ID_ARG}`);
    }
    if (!args.domain) {
      throw new Error('Missing required argument: domain');
    }

    try {
      const response = await this.admin.users.list({
        domain: args.domain,
        maxResults: args.max_results || 100,
        customer: 'my_customer'
      });

      const users = response.data.users?.map((user: any) => ({
        id: user.id,
        primaryEmail: user.primaryEmail,
        fullName: user.name?.fullName,
        orgUnitPath: user.orgUnitPath,
        isAdmin: user.isAdmin,
        suspended: user.suspended,
        creationTime: user.creationTime,
        lastLoginTime: user.lastLoginTime
      })) || [];

      return [{
        type: 'text',
        text: JSON.stringify({
          domain: args.domain,
          count: users.length,
          users
        }, null, 2)
      }];
    } catch (error) {
      console.error('Error listing users:', error);
      if ((error as any).code === 403) {
        return [{
          type: 'text',
          text: JSON.stringify({
            error: 'This operation requires a Google Workspace admin account. Personal Gmail accounts do not have admin access.',
            success: false
          }, null, 2)
        }];
      }
      throw error;
    }
  }

  private async getUser(args: Record<string, any>): Promise<Array<TextContent>> {
    const userId = args[USER_ID_ARG];
    if (!userId) {
      throw new Error(`Missing required argument: ${USER_ID_ARG}`);
    }
    if (!args.user_key) {
      throw new Error('Missing required argument: user_key');
    }

    try {
      const response = await this.admin.users.get({ userKey: args.user_key });

      return [{
        type: 'text',
        text: JSON.stringify(response.data, null, 2)
      }];
    } catch (error) {
      console.error('Error getting user:', error);
      if ((error as any).code === 403) {
        return [{
          type: 'text',
          text: JSON.stringify({
            error: 'This operation requires a Google Workspace admin account. Personal Gmail accounts do not have admin access.',
            success: false
          }, null, 2)
        }];
      }
      throw error;
    }
  }

  private async listGroups(args: Record<string, any>): Promise<Array<TextContent>> {
    const userId = args[USER_ID_ARG];
    if (!userId) {
      throw new Error(`Missing required argument: ${USER_ID_ARG}`);
    }
    if (!args.domain) {
      throw new Error('Missing required argument: domain');
    }

    try {
      const response = await this.admin.groups.list({
        domain: args.domain,
        maxResults: args.max_results || 200,
        customer: 'my_customer'
      });

      return [{
        type: 'text',
        text: JSON.stringify({
          domain: args.domain,
          count: response.data.groups?.length || 0,
          groups: response.data.groups || []
        }, null, 2)
      }];
    } catch (error) {
      console.error('Error listing groups:', error);
      if ((error as any).code === 403) {
        return [{
          type: 'text',
          text: JSON.stringify({
            error: 'This operation requires a Google Workspace admin account. Personal Gmail accounts do not have admin access.',
            success: false
          }, null, 2)
        }];
      }
      throw error;
    }
  }

  private async getGroup(args: Record<string, any>): Promise<Array<TextContent>> {
    const userId = args[USER_ID_ARG];
    if (!userId) {
      throw new Error(`Missing required argument: ${USER_ID_ARG}`);
    }
    if (!args.group_key) {
      throw new Error('Missing required argument: group_key');
    }

    try {
      const response = await this.admin.groups.get({ groupKey: args.group_key });

      return [{
        type: 'text',
        text: JSON.stringify(response.data, null, 2)
      }];
    } catch (error) {
      console.error('Error getting group:', error);
      if ((error as any).code === 403) {
        return [{
          type: 'text',
          text: JSON.stringify({
            error: 'This operation requires a Google Workspace admin account. Personal Gmail accounts do not have admin access.',
            success: false
          }, null, 2)
        }];
      }
      throw error;
    }
  }

  private async listGroupMembers(args: Record<string, any>): Promise<Array<TextContent>> {
    const userId = args[USER_ID_ARG];
    if (!userId) {
      throw new Error(`Missing required argument: ${USER_ID_ARG}`);
    }
    if (!args.group_key) {
      throw new Error('Missing required argument: group_key');
    }

    try {
      const response = await this.admin.members.list({
        groupKey: args.group_key,
        maxResults: args.max_results || 200
      });

      return [{
        type: 'text',
        text: JSON.stringify({
          groupKey: args.group_key,
          count: response.data.members?.length || 0,
          members: response.data.members || []
        }, null, 2)
      }];
    } catch (error) {
      console.error('Error listing group members:', error);
      if ((error as any).code === 403) {
        return [{
          type: 'text',
          text: JSON.stringify({
            error: 'This operation requires a Google Workspace admin account. Personal Gmail accounts do not have admin access.',
            success: false
          }, null, 2)
        }];
      }
      throw error;
    }
  }

  private async listOrgUnits(args: Record<string, any>): Promise<Array<TextContent>> {
    const userId = args[USER_ID_ARG];
    if (!userId) {
      throw new Error(`Missing required argument: ${USER_ID_ARG}`);
    }

    try {
      const response = await this.admin.orgunits.list({
        customerId: args.customer_id || 'my_customer'
      });

      return [{
        type: 'text',
        text: JSON.stringify({
          count: response.data.organizationUnits?.length || 0,
          organizationUnits: response.data.organizationUnits || []
        }, null, 2)
      }];
    } catch (error) {
      console.error('Error listing org units:', error);
      if ((error as any).code === 403) {
        return [{
          type: 'text',
          text: JSON.stringify({
            error: 'This operation requires a Google Workspace admin account. Personal Gmail accounts do not have admin access.',
            success: false
          }, null, 2)
        }];
      }
      throw error;
    }
  }

  private async getDomainInfo(args: Record<string, any>): Promise<Array<TextContent>> {
    const userId = args[USER_ID_ARG];
    if (!userId) {
      throw new Error(`Missing required argument: ${USER_ID_ARG}`);
    }

    try {
      const response = await this.admin.customers.get({
        customerKey: args.customer_id || 'my_customer'
      });

      return [{
        type: 'text',
        text: JSON.stringify(response.data, null, 2)
      }];
    } catch (error) {
      console.error('Error getting domain info:', error);
      if ((error as any).code === 403) {
        return [{
          type: 'text',
          text: JSON.stringify({
            error: 'This operation requires a Google Workspace admin account. Personal Gmail accounts do not have admin access.',
            success: false
          }, null, 2)
        }];
      }
      throw error;
    }
  }
}
