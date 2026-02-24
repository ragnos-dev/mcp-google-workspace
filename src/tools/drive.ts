import { Tool, TextContent, ImageContent, EmbeddedResource } from '@modelcontextprotocol/sdk/types.js';
import { GAuthService } from '../services/gauth.js';
import { google } from 'googleapis';
import { USER_ID_ARG } from '../types/tool-handler.js';
import { Readable } from 'stream';

export class DriveTools {
  private drive: any;

  constructor(private gauth: GAuthService) {
    this.drive = google.drive({ version: 'v3', auth: this.gauth.getClient() });
  }

  getTools(): Tool[] {
    return [
      {
        name: 'drive_list_files',
        description: 'List or search files in Google Drive. Supports Drive query syntax (e.g. "name contains \'report\'" or "mimeType=\'application/pdf\'").',
        inputSchema: {
          type: 'object',
          properties: {
            [USER_ID_ARG]: { type: 'string', description: 'Email address of the user' },
            query: { type: 'string', description: 'Google Drive search query string. Examples: "name contains \'budget\'", "mimeType=\'application/pdf\'", "modifiedTime > \'2026-01-01\'"' },
            page_size: { type: 'integer', description: 'Number of results to return (1-100, default 20)', minimum: 1, maximum: 100 },
            order_by: { type: 'string', description: 'Sort order. Examples: "modifiedTime desc", "name", "createdTime desc"' },
            page_token: { type: 'string', description: 'Token for retrieving the next page of results' },
          },
          required: [USER_ID_ARG],
        },
      },
      {
        name: 'drive_get_file',
        description: 'Get detailed metadata for a specific file by ID, including name, size, mimeType, owners, sharing status, and links.',
        inputSchema: {
          type: 'object',
          properties: {
            [USER_ID_ARG]: { type: 'string', description: 'Email address of the user' },
            file_id: { type: 'string', description: 'The ID of the file to retrieve' },
          },
          required: [USER_ID_ARG, 'file_id'],
        },
      },
      {
        name: 'drive_get_file_content',
        description: 'Download and return the text content of a file. Works best with text-based files (documents, spreadsheets exported as CSV, plain text). For Google Docs/Sheets/Slides, exports to a text format.',
        inputSchema: {
          type: 'object',
          properties: {
            [USER_ID_ARG]: { type: 'string', description: 'Email address of the user' },
            file_id: { type: 'string', description: 'The ID of the file to download' },
            export_mime_type: { type: 'string', description: 'For Google Workspace files, the MIME type to export as. Default: text/plain for Docs, text/csv for Sheets.' },
          },
          required: [USER_ID_ARG, 'file_id'],
        },
      },
      {
        name: 'drive_create_file',
        description: 'Create a new file in Google Drive. Can create empty files or files with text content. For Google Docs, use mimeType "application/vnd.google-apps.document".',
        inputSchema: {
          type: 'object',
          properties: {
            [USER_ID_ARG]: { type: 'string', description: 'Email address of the user' },
            name: { type: 'string', description: 'Name of the file to create' },
            mime_type: { type: 'string', description: 'MIME type of the file. Use "application/vnd.google-apps.document" for Google Docs, "application/vnd.google-apps.spreadsheet" for Sheets, "application/vnd.google-apps.folder" for folders.' },
            parent_id: { type: 'string', description: 'ID of the parent folder. Omit for root.' },
            content: { type: 'string', description: 'Text content for the file (optional).' },
          },
          required: [USER_ID_ARG, 'name'],
        },
      },
      {
        name: 'drive_update_file',
        description: 'Update file metadata: rename, move between folders, or change description. Does not update file content.',
        inputSchema: {
          type: 'object',
          properties: {
            [USER_ID_ARG]: { type: 'string', description: 'Email address of the user' },
            file_id: { type: 'string', description: 'The ID of the file to update' },
            name: { type: 'string', description: 'New name for the file' },
            description: { type: 'string', description: 'New description for the file' },
            add_parents: { type: 'string', description: 'Comma-separated list of parent folder IDs to add' },
            remove_parents: { type: 'string', description: 'Comma-separated list of parent folder IDs to remove' },
          },
          required: [USER_ID_ARG, 'file_id'],
        },
      },
      {
        name: 'drive_delete_file',
        description: 'Move a file to trash (soft delete). The file can be recovered from trash.',
        inputSchema: {
          type: 'object',
          properties: {
            [USER_ID_ARG]: { type: 'string', description: 'Email address of the user' },
            file_id: { type: 'string', description: 'The ID of the file to trash' },
          },
          required: [USER_ID_ARG, 'file_id'],
        },
      },
      {
        name: 'drive_manage_permissions',
        description: 'Add, update, or remove sharing permissions on a file or folder.',
        inputSchema: {
          type: 'object',
          properties: {
            [USER_ID_ARG]: { type: 'string', description: 'Email address of the user' },
            file_id: { type: 'string', description: 'The ID of the file or folder' },
            action: { type: 'string', enum: ['add', 'update', 'remove', 'list'], description: 'The permission action to take' },
            role: { type: 'string', enum: ['owner', 'organizer', 'fileOrganizer', 'writer', 'commenter', 'reader'], description: 'The role to grant (for add/update)' },
            type: { type: 'string', enum: ['user', 'group', 'domain', 'anyone'], description: 'The type of grantee (for add)' },
            email_address: { type: 'string', description: 'Email address of the user or group (for add with type user/group)' },
            domain: { type: 'string', description: 'Domain name (for add with type domain)' },
            permission_id: { type: 'string', description: 'Permission ID (required for update/remove)' },
            send_notification: { type: 'boolean', description: 'Whether to send a notification email (for add, default false)' },
          },
          required: [USER_ID_ARG, 'file_id', 'action'],
        },
      },
    ];
  }

  async handleTool(name: string, args: Record<string, unknown>): Promise<Array<TextContent | ImageContent | EmbeddedResource>> {
    switch (name) {
      case 'drive_list_files': return this.listFiles(args);
      case 'drive_get_file': return this.getFile(args);
      case 'drive_get_file_content': return this.getFileContent(args);
      case 'drive_create_file': return this.createFile(args);
      case 'drive_update_file': return this.updateFile(args);
      case 'drive_delete_file': return this.deleteFile(args);
      case 'drive_manage_permissions': return this.managePermissions(args);
      default: throw new Error(`Unknown tool: ${name}`);
    }
  }

  private async listFiles(args: Record<string, unknown>): Promise<Array<TextContent>> {
    if (!args[USER_ID_ARG]) throw new Error('user_id is required');

    const response = await this.drive.files.list({
      q: (args.query as string) || undefined,
      pageSize: (args.page_size as number) || 20,
      orderBy: (args.order_by as string) || 'modifiedTime desc',
      pageToken: (args.page_token as string) || undefined,
      fields: 'nextPageToken, files(id, name, mimeType, size, modifiedTime, createdTime, owners, shared, webViewLink, parents)',
    });

    return [{
      type: 'text',
      text: JSON.stringify({
        files: response.data.files || [],
        nextPageToken: response.data.nextPageToken || null,
        count: response.data.files?.length || 0,
      }, null, 2),
    }];
  }

  private async getFile(args: Record<string, unknown>): Promise<Array<TextContent>> {
    if (!args[USER_ID_ARG]) throw new Error('user_id is required');
    if (!args.file_id) throw new Error('file_id is required');

    const response = await this.drive.files.get({
      fileId: args.file_id as string,
      fields: '*',
    });

    return [{ type: 'text', text: JSON.stringify(response.data, null, 2) }];
  }

  private async getFileContent(args: Record<string, unknown>): Promise<Array<TextContent>> {
    if (!args[USER_ID_ARG]) throw new Error('user_id is required');
    if (!args.file_id) throw new Error('file_id is required');

    // First get file metadata to determine type
    const meta = await this.drive.files.get({
      fileId: args.file_id as string,
      fields: 'mimeType, name',
    });

    const mimeType = meta.data.mimeType as string;
    let content: string;

    if (mimeType.startsWith('application/vnd.google-apps.')) {
      // Google Workspace file - need to export
      const exportMime = (args.export_mime_type as string) ||
        (mimeType.includes('document') ? 'text/plain' :
         mimeType.includes('spreadsheet') ? 'text/csv' :
         mimeType.includes('presentation') ? 'text/plain' : 'text/plain');

      const res = await this.drive.files.export({
        fileId: args.file_id as string,
        mimeType: exportMime,
      }, { responseType: 'text' });

      content = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
    } else {
      // Regular file - download
      const res = await this.drive.files.get({
        fileId: args.file_id as string,
        alt: 'media',
      }, { responseType: 'text' });

      content = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
    }

    return [{
      type: 'text',
      text: JSON.stringify({
        name: meta.data.name,
        mimeType: mimeType,
        content: content.length > 50000 ? content.substring(0, 50000) + '\n... [truncated]' : content,
      }, null, 2),
    }];
  }

  private async createFile(args: Record<string, unknown>): Promise<Array<TextContent>> {
    if (!args[USER_ID_ARG]) throw new Error('user_id is required');
    if (!args.name) throw new Error('name is required');

    const requestBody: Record<string, any> = {
      name: args.name as string,
    };

    if (args.mime_type) requestBody.mimeType = args.mime_type as string;
    if (args.parent_id) requestBody.parents = [args.parent_id as string];

    const params: Record<string, any> = { requestBody, fields: 'id, name, mimeType, webViewLink' };

    if (args.content) {
      params.media = {
        mimeType: (args.mime_type as string) || 'text/plain',
        body: Readable.from([args.content as string]),
      };
    }

    const response = await this.drive.files.create(params);

    return [{ type: 'text', text: JSON.stringify(response.data, null, 2) }];
  }

  private async updateFile(args: Record<string, unknown>): Promise<Array<TextContent>> {
    if (!args[USER_ID_ARG]) throw new Error('user_id is required');
    if (!args.file_id) throw new Error('file_id is required');

    const requestBody: Record<string, any> = {};
    if (args.name) requestBody.name = args.name as string;
    if (args.description) requestBody.description = args.description as string;

    const params: Record<string, any> = {
      fileId: args.file_id as string,
      requestBody,
      fields: 'id, name, mimeType, webViewLink, parents',
    };

    if (args.add_parents) params.addParents = args.add_parents as string;
    if (args.remove_parents) params.removeParents = args.remove_parents as string;

    const response = await this.drive.files.update(params);

    return [{ type: 'text', text: JSON.stringify(response.data, null, 2) }];
  }

  private async deleteFile(args: Record<string, unknown>): Promise<Array<TextContent>> {
    if (!args[USER_ID_ARG]) throw new Error('user_id is required');
    if (!args.file_id) throw new Error('file_id is required');

    await this.drive.files.update({
      fileId: args.file_id as string,
      requestBody: { trashed: true },
    });

    return [{ type: 'text', text: JSON.stringify({ success: true, message: `File ${args.file_id} moved to trash` }, null, 2) }];
  }

  private async managePermissions(args: Record<string, unknown>): Promise<Array<TextContent>> {
    if (!args[USER_ID_ARG]) throw new Error('user_id is required');
    if (!args.file_id) throw new Error('file_id is required');
    if (!args.action) throw new Error('action is required');

    const fileId = args.file_id as string;
    const action = args.action as string;

    if (action === 'list') {
      const response = await this.drive.permissions.list({
        fileId,
        fields: 'permissions(id, type, role, emailAddress, domain, displayName)',
      });
      return [{ type: 'text', text: JSON.stringify(response.data.permissions || [], null, 2) }];
    }

    if (action === 'add') {
      if (!args.role) throw new Error('role is required for add action');
      if (!args.type) throw new Error('type is required for add action');

      const permission: Record<string, any> = {
        role: args.role as string,
        type: args.type as string,
      };
      if (args.email_address) permission.emailAddress = args.email_address as string;
      if (args.domain) permission.domain = args.domain as string;

      const response = await this.drive.permissions.create({
        fileId,
        requestBody: permission,
        sendNotificationEmail: (args.send_notification as boolean) || false,
        fields: 'id, type, role, emailAddress, domain',
      });
      return [{ type: 'text', text: JSON.stringify(response.data, null, 2) }];
    }

    if (action === 'update') {
      if (!args.permission_id) throw new Error('permission_id is required for update action');
      if (!args.role) throw new Error('role is required for update action');

      const response = await this.drive.permissions.update({
        fileId,
        permissionId: args.permission_id as string,
        requestBody: { role: args.role as string },
        fields: 'id, type, role, emailAddress, domain',
      });
      return [{ type: 'text', text: JSON.stringify(response.data, null, 2) }];
    }

    if (action === 'remove') {
      if (!args.permission_id) throw new Error('permission_id is required for remove action');

      await this.drive.permissions.delete({
        fileId,
        permissionId: args.permission_id as string,
      });
      return [{ type: 'text', text: JSON.stringify({ success: true, message: `Permission ${args.permission_id} removed` }, null, 2) }];
    }

    throw new Error(`Unknown action: ${action}. Valid actions: list, add, update, remove`);
  }
}
