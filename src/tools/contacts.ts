import { Tool, TextContent, ImageContent, EmbeddedResource } from '@modelcontextprotocol/sdk/types.js';
import { GAuthService } from '../services/gauth.js';
import { google } from 'googleapis';
import { USER_ID_ARG } from '../types/tool-handler.js';

const PERSON_FIELDS = 'names,emailAddresses,phoneNumbers,organizations,biographies,urls,addresses,photos,memberships';

export class ContactsTools {
  private people: any;

  constructor(private gauth: GAuthService) {
    this.people = google.people({ version: 'v1', auth: this.gauth.getClient() });
  }

  getTools(): Tool[] {
    return [
      {
        name: 'contacts_list',
        description: 'List the user\'s Google Contacts with names, emails, phones, and organizations.',
        inputSchema: {
          type: 'object',
          properties: {
            [USER_ID_ARG]: { type: 'string', description: 'Email address of the user' },
            page_size: { type: 'integer', description: 'Number of contacts to return (1-100, default 20)', minimum: 1, maximum: 100 },
            page_token: { type: 'string', description: 'Token for the next page of results' },
            sort_order: { type: 'string', enum: ['LAST_MODIFIED_ASCENDING', 'LAST_MODIFIED_DESCENDING', 'FIRST_NAME_ASCENDING', 'LAST_NAME_ASCENDING'], description: 'Sort order for results' },
          },
          required: [USER_ID_ARG],
        },
      },
      {
        name: 'contacts_search',
        description: 'Search contacts by name, email, or phone number.',
        inputSchema: {
          type: 'object',
          properties: {
            [USER_ID_ARG]: { type: 'string', description: 'Email address of the user' },
            query: { type: 'string', description: 'Search query (name, email, or phone)' },
            page_size: { type: 'integer', description: 'Number of results to return (1-30, default 10)', minimum: 1, maximum: 30 },
          },
          required: [USER_ID_ARG, 'query'],
        },
      },
      {
        name: 'contacts_get',
        description: 'Get detailed information about a specific contact by resource name (e.g. "people/c1234567890").',
        inputSchema: {
          type: 'object',
          properties: {
            [USER_ID_ARG]: { type: 'string', description: 'Email address of the user' },
            resource_name: { type: 'string', description: 'The resource name of the contact (e.g. "people/c1234567890")' },
          },
          required: [USER_ID_ARG, 'resource_name'],
        },
      },
      {
        name: 'contacts_create',
        description: 'Create a new Google Contact with name, email, phone, organization, and notes.',
        inputSchema: {
          type: 'object',
          properties: {
            [USER_ID_ARG]: { type: 'string', description: 'Email address of the user' },
            given_name: { type: 'string', description: 'First name' },
            family_name: { type: 'string', description: 'Last name' },
            emails: { type: 'array', items: { type: 'string' }, description: 'Email addresses' },
            phones: { type: 'array', items: { type: 'string' }, description: 'Phone numbers' },
            organization: { type: 'string', description: 'Company or organization name' },
            title: { type: 'string', description: 'Job title' },
            notes: { type: 'string', description: 'Notes about the contact' },
          },
          required: [USER_ID_ARG, 'given_name'],
        },
      },
      {
        name: 'contacts_update',
        description: 'Update an existing contact. Fetches current data first to get the required etag for optimistic concurrency.',
        inputSchema: {
          type: 'object',
          properties: {
            [USER_ID_ARG]: { type: 'string', description: 'Email address of the user' },
            resource_name: { type: 'string', description: 'The resource name of the contact (e.g. "people/c1234567890")' },
            given_name: { type: 'string', description: 'Updated first name' },
            family_name: { type: 'string', description: 'Updated last name' },
            emails: { type: 'array', items: { type: 'string' }, description: 'Updated email addresses (replaces existing)' },
            phones: { type: 'array', items: { type: 'string' }, description: 'Updated phone numbers (replaces existing)' },
            organization: { type: 'string', description: 'Updated organization name' },
            title: { type: 'string', description: 'Updated job title' },
            notes: { type: 'string', description: 'Updated notes' },
          },
          required: [USER_ID_ARG, 'resource_name'],
        },
      },
      {
        name: 'contacts_delete',
        description: 'Delete a contact by resource name.',
        inputSchema: {
          type: 'object',
          properties: {
            [USER_ID_ARG]: { type: 'string', description: 'Email address of the user' },
            resource_name: { type: 'string', description: 'The resource name of the contact to delete (e.g. "people/c1234567890")' },
          },
          required: [USER_ID_ARG, 'resource_name'],
        },
      },
    ];
  }

  async handleTool(name: string, args: Record<string, unknown>): Promise<Array<TextContent | ImageContent | EmbeddedResource>> {
    switch (name) {
      case 'contacts_list': return this.listContacts(args);
      case 'contacts_search': return this.searchContacts(args);
      case 'contacts_get': return this.getContact(args);
      case 'contacts_create': return this.createContact(args);
      case 'contacts_update': return this.updateContact(args);
      case 'contacts_delete': return this.deleteContact(args);
      default: throw new Error(`Unknown tool: ${name}`);
    }
  }

  private async listContacts(args: Record<string, unknown>): Promise<Array<TextContent>> {
    if (!args[USER_ID_ARG]) throw new Error('user_id is required');

    const response = await this.people.people.connections.list({
      resourceName: 'people/me',
      personFields: PERSON_FIELDS,
      pageSize: (args.page_size as number) || 20,
      pageToken: (args.page_token as string) || undefined,
      sortOrder: (args.sort_order as string) || 'LAST_MODIFIED_DESCENDING',
    });

    const connections = response.data.connections || [];
    const contacts = connections.map((p: any) => this.formatContact(p));

    return [{
      type: 'text',
      text: JSON.stringify({
        contacts,
        totalPeople: response.data.totalPeople || 0,
        nextPageToken: response.data.nextPageToken || null,
        count: contacts.length,
      }, null, 2),
    }];
  }

  private async searchContacts(args: Record<string, unknown>): Promise<Array<TextContent>> {
    if (!args[USER_ID_ARG]) throw new Error('user_id is required');
    if (!args.query) throw new Error('query is required');

    const response = await this.people.people.searchContacts({
      query: args.query as string,
      readMask: PERSON_FIELDS,
      pageSize: (args.page_size as number) || 10,
    });

    const results = response.data.results || [];
    const contacts = results.map((r: any) => this.formatContact(r.person));

    return [{
      type: 'text',
      text: JSON.stringify({
        contacts,
        count: contacts.length,
      }, null, 2),
    }];
  }

  private async getContact(args: Record<string, unknown>): Promise<Array<TextContent>> {
    if (!args[USER_ID_ARG]) throw new Error('user_id is required');
    if (!args.resource_name) throw new Error('resource_name is required');

    const response = await this.people.people.get({
      resourceName: args.resource_name as string,
      personFields: PERSON_FIELDS,
    });

    return [{ type: 'text', text: JSON.stringify(this.formatContact(response.data), null, 2) }];
  }

  private async createContact(args: Record<string, unknown>): Promise<Array<TextContent>> {
    if (!args[USER_ID_ARG]) throw new Error('user_id is required');
    if (!args.given_name) throw new Error('given_name is required');

    const requestBody: Record<string, any> = {
      names: [{ givenName: args.given_name as string, familyName: (args.family_name as string) || '' }],
    };

    if (args.emails) {
      requestBody.emailAddresses = (args.emails as string[]).map(e => ({ value: e }));
    }
    if (args.phones) {
      requestBody.phoneNumbers = (args.phones as string[]).map(p => ({ value: p }));
    }
    if (args.organization || args.title) {
      requestBody.organizations = [{
        name: (args.organization as string) || '',
        title: (args.title as string) || '',
      }];
    }
    if (args.notes) {
      requestBody.biographies = [{ value: args.notes as string }];
    }

    const response = await this.people.people.createContact({
      requestBody,
      personFields: PERSON_FIELDS,
    });

    return [{ type: 'text', text: JSON.stringify(this.formatContact(response.data), null, 2) }];
  }

  private async updateContact(args: Record<string, unknown>): Promise<Array<TextContent>> {
    if (!args[USER_ID_ARG]) throw new Error('user_id is required');
    if (!args.resource_name) throw new Error('resource_name is required');

    // Fetch current contact to get etag
    const current = await this.people.people.get({
      resourceName: args.resource_name as string,
      personFields: PERSON_FIELDS,
    });

    const requestBody: Record<string, any> = {
      etag: current.data.etag,
    };

    const updateFields: string[] = [];

    if (args.given_name !== undefined || args.family_name !== undefined) {
      requestBody.names = [{
        givenName: (args.given_name as string) ?? current.data.names?.[0]?.givenName ?? '',
        familyName: (args.family_name as string) ?? current.data.names?.[0]?.familyName ?? '',
      }];
      updateFields.push('names');
    }

    if (args.emails !== undefined) {
      requestBody.emailAddresses = (args.emails as string[]).map(e => ({ value: e }));
      updateFields.push('emailAddresses');
    }

    if (args.phones !== undefined) {
      requestBody.phoneNumbers = (args.phones as string[]).map(p => ({ value: p }));
      updateFields.push('phoneNumbers');
    }

    if (args.organization !== undefined || args.title !== undefined) {
      requestBody.organizations = [{
        name: (args.organization as string) ?? current.data.organizations?.[0]?.name ?? '',
        title: (args.title as string) ?? current.data.organizations?.[0]?.title ?? '',
      }];
      updateFields.push('organizations');
    }

    if (args.notes !== undefined) {
      requestBody.biographies = [{ value: args.notes as string }];
      updateFields.push('biographies');
    }

    if (updateFields.length === 0) {
      return [{ type: 'text', text: JSON.stringify({ message: 'No fields to update' }, null, 2) }];
    }

    const response = await this.people.people.updateContact({
      resourceName: args.resource_name as string,
      updatePersonFields: updateFields.join(','),
      requestBody,
      personFields: PERSON_FIELDS,
    });

    return [{ type: 'text', text: JSON.stringify(this.formatContact(response.data), null, 2) }];
  }

  private async deleteContact(args: Record<string, unknown>): Promise<Array<TextContent>> {
    if (!args[USER_ID_ARG]) throw new Error('user_id is required');
    if (!args.resource_name) throw new Error('resource_name is required');

    await this.people.people.deleteContact({
      resourceName: args.resource_name as string,
    });

    return [{ type: 'text', text: JSON.stringify({ success: true, message: `Contact ${args.resource_name} deleted` }, null, 2) }];
  }

  private formatContact(person: any): Record<string, any> {
    if (!person) return {};
    return {
      resourceName: person.resourceName,
      name: person.names?.[0] ? {
        givenName: person.names[0].givenName,
        familyName: person.names[0].familyName,
        displayName: person.names[0].displayName,
      } : null,
      emails: person.emailAddresses?.map((e: any) => ({ value: e.value, type: e.type })) || [],
      phones: person.phoneNumbers?.map((p: any) => ({ value: p.value, type: p.type })) || [],
      organization: person.organizations?.[0] ? {
        name: person.organizations[0].name,
        title: person.organizations[0].title,
        department: person.organizations[0].department,
      } : null,
      notes: person.biographies?.[0]?.value || null,
      photo: person.photos?.[0]?.url || null,
    };
  }
}
