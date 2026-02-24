import { Tool, TextContent, ImageContent, EmbeddedResource } from '@modelcontextprotocol/sdk/types.js';
import { GAuthService } from '../services/gauth.js';
import { google } from 'googleapis';
import { USER_ID_ARG } from '../types/tool-handler.js';

export class TasksTools {
  private tasks: any;

  constructor(private gauth: GAuthService) {
    this.tasks = google.tasks({ version: 'v1', auth: this.gauth.getClient() });
  }

  getTools(): Tool[] {
    return [
      {
        name: 'tasks_list_tasklists',
        description: 'List all task lists for the user.',
        inputSchema: {
          type: 'object',
          properties: {
            [USER_ID_ARG]: { type: 'string', description: 'Email address of the user' },
            max_results: { type: 'integer', description: 'Maximum number of task lists to return (1-100, default 20)', minimum: 1, maximum: 100 },
          },
          required: [USER_ID_ARG],
        },
      },
      {
        name: 'tasks_create_tasklist',
        description: 'Create a new task list.',
        inputSchema: {
          type: 'object',
          properties: {
            [USER_ID_ARG]: { type: 'string', description: 'Email address of the user' },
            title: { type: 'string', description: 'Title of the new task list' },
          },
          required: [USER_ID_ARG, 'title'],
        },
      },
      {
        name: 'tasks_delete_tasklist',
        description: 'Delete a task list by ID.',
        inputSchema: {
          type: 'object',
          properties: {
            [USER_ID_ARG]: { type: 'string', description: 'Email address of the user' },
            tasklist_id: { type: 'string', description: 'The ID of the task list to delete' },
          },
          required: [USER_ID_ARG, 'tasklist_id'],
        },
      },
      {
        name: 'tasks_list_tasks',
        description: 'List tasks in a task list. Can filter by completion status and due date.',
        inputSchema: {
          type: 'object',
          properties: {
            [USER_ID_ARG]: { type: 'string', description: 'Email address of the user' },
            tasklist_id: { type: 'string', description: 'The ID of the task list (default: "@default" for primary list)' },
            show_completed: { type: 'boolean', description: 'Whether to include completed tasks (default true)' },
            show_hidden: { type: 'boolean', description: 'Whether to include hidden tasks (default false)' },
            due_min: { type: 'string', description: 'Lower bound for due date (RFC3339 timestamp)' },
            due_max: { type: 'string', description: 'Upper bound for due date (RFC3339 timestamp)' },
            max_results: { type: 'integer', description: 'Maximum number of tasks to return (1-100, default 20)', minimum: 1, maximum: 100 },
            page_token: { type: 'string', description: 'Token for the next page of results' },
          },
          required: [USER_ID_ARG],
        },
      },
      {
        name: 'tasks_get_task',
        description: 'Get detailed information about a specific task.',
        inputSchema: {
          type: 'object',
          properties: {
            [USER_ID_ARG]: { type: 'string', description: 'Email address of the user' },
            tasklist_id: { type: 'string', description: 'The ID of the task list' },
            task_id: { type: 'string', description: 'The ID of the task' },
          },
          required: [USER_ID_ARG, 'tasklist_id', 'task_id'],
        },
      },
      {
        name: 'tasks_create_task',
        description: 'Create a new task in a task list. Supports title, notes, due date, and parent task (for subtasks).',
        inputSchema: {
          type: 'object',
          properties: {
            [USER_ID_ARG]: { type: 'string', description: 'Email address of the user' },
            tasklist_id: { type: 'string', description: 'The ID of the task list (default: "@default")' },
            title: { type: 'string', description: 'Title of the task' },
            notes: { type: 'string', description: 'Notes or description for the task' },
            due: { type: 'string', description: 'Due date in RFC3339 format (e.g. "2026-03-01T00:00:00Z")' },
            parent: { type: 'string', description: 'Parent task ID (to create a subtask)' },
            previous: { type: 'string', description: 'Previous sibling task ID (for ordering)' },
          },
          required: [USER_ID_ARG, 'title'],
        },
      },
      {
        name: 'tasks_update_task',
        description: 'Update an existing task. Set status to "completed" to mark done, or "needsAction" to reopen.',
        inputSchema: {
          type: 'object',
          properties: {
            [USER_ID_ARG]: { type: 'string', description: 'Email address of the user' },
            tasklist_id: { type: 'string', description: 'The ID of the task list' },
            task_id: { type: 'string', description: 'The ID of the task to update' },
            title: { type: 'string', description: 'Updated title' },
            notes: { type: 'string', description: 'Updated notes' },
            due: { type: 'string', description: 'Updated due date in RFC3339 format' },
            status: { type: 'string', enum: ['needsAction', 'completed'], description: 'Task status. "completed" marks done, "needsAction" reopens.' },
          },
          required: [USER_ID_ARG, 'tasklist_id', 'task_id'],
        },
      },
    ];
  }

  async handleTool(name: string, args: Record<string, unknown>): Promise<Array<TextContent | ImageContent | EmbeddedResource>> {
    switch (name) {
      case 'tasks_list_tasklists': return this.listTasklists(args);
      case 'tasks_create_tasklist': return this.createTasklist(args);
      case 'tasks_delete_tasklist': return this.deleteTasklist(args);
      case 'tasks_list_tasks': return this.listTasks(args);
      case 'tasks_get_task': return this.getTask(args);
      case 'tasks_create_task': return this.createTask(args);
      case 'tasks_update_task': return this.updateTask(args);
      default: throw new Error(`Unknown tool: ${name}`);
    }
  }

  private async listTasklists(args: Record<string, unknown>): Promise<Array<TextContent>> {
    if (!args[USER_ID_ARG]) throw new Error('user_id is required');

    const response = await this.tasks.tasklists.list({
      maxResults: (args.max_results as number) || 20,
    });

    const items = response.data.items || [];

    return [{
      type: 'text',
      text: JSON.stringify({
        tasklists: items.map((tl: any) => ({
          id: tl.id,
          title: tl.title,
          updated: tl.updated,
        })),
        count: items.length,
      }, null, 2),
    }];
  }

  private async createTasklist(args: Record<string, unknown>): Promise<Array<TextContent>> {
    if (!args[USER_ID_ARG]) throw new Error('user_id is required');
    if (!args.title) throw new Error('title is required');

    const response = await this.tasks.tasklists.insert({
      requestBody: { title: args.title as string },
    });

    return [{ type: 'text', text: JSON.stringify(response.data, null, 2) }];
  }

  private async deleteTasklist(args: Record<string, unknown>): Promise<Array<TextContent>> {
    if (!args[USER_ID_ARG]) throw new Error('user_id is required');
    if (!args.tasklist_id) throw new Error('tasklist_id is required');

    await this.tasks.tasklists.delete({
      tasklist: args.tasklist_id as string,
    });

    return [{ type: 'text', text: JSON.stringify({ success: true, message: `Task list ${args.tasklist_id} deleted` }, null, 2) }];
  }

  private async listTasks(args: Record<string, unknown>): Promise<Array<TextContent>> {
    if (!args[USER_ID_ARG]) throw new Error('user_id is required');

    const params: Record<string, any> = {
      tasklist: (args.tasklist_id as string) || '@default',
      maxResults: (args.max_results as number) || 20,
    };

    if (args.show_completed !== undefined) params.showCompleted = args.show_completed as boolean;
    if (args.show_hidden !== undefined) params.showHidden = args.show_hidden as boolean;
    if (args.due_min) params.dueMin = args.due_min as string;
    if (args.due_max) params.dueMax = args.due_max as string;
    if (args.page_token) params.pageToken = args.page_token as string;

    const response = await this.tasks.tasks.list(params);

    const items = response.data.items || [];

    return [{
      type: 'text',
      text: JSON.stringify({
        tasks: items.map((t: any) => ({
          id: t.id,
          title: t.title,
          notes: t.notes || null,
          status: t.status,
          due: t.due || null,
          completed: t.completed || null,
          parent: t.parent || null,
          position: t.position,
          updated: t.updated,
        })),
        nextPageToken: response.data.nextPageToken || null,
        count: items.length,
      }, null, 2),
    }];
  }

  private async getTask(args: Record<string, unknown>): Promise<Array<TextContent>> {
    if (!args[USER_ID_ARG]) throw new Error('user_id is required');
    if (!args.tasklist_id) throw new Error('tasklist_id is required');
    if (!args.task_id) throw new Error('task_id is required');

    const response = await this.tasks.tasks.get({
      tasklist: args.tasklist_id as string,
      task: args.task_id as string,
    });

    return [{ type: 'text', text: JSON.stringify(response.data, null, 2) }];
  }

  private async createTask(args: Record<string, unknown>): Promise<Array<TextContent>> {
    if (!args[USER_ID_ARG]) throw new Error('user_id is required');
    if (!args.title) throw new Error('title is required');

    const requestBody: Record<string, any> = {
      title: args.title as string,
    };

    if (args.notes) requestBody.notes = args.notes as string;
    if (args.due) requestBody.due = args.due as string;

    const params: Record<string, any> = {
      tasklist: (args.tasklist_id as string) || '@default',
      requestBody,
    };

    if (args.parent) params.parent = args.parent as string;
    if (args.previous) params.previous = args.previous as string;

    const response = await this.tasks.tasks.insert(params);

    return [{ type: 'text', text: JSON.stringify(response.data, null, 2) }];
  }

  private async updateTask(args: Record<string, unknown>): Promise<Array<TextContent>> {
    if (!args[USER_ID_ARG]) throw new Error('user_id is required');
    if (!args.tasklist_id) throw new Error('tasklist_id is required');
    if (!args.task_id) throw new Error('task_id is required');

    const requestBody: Record<string, any> = {};

    if (args.title !== undefined) requestBody.title = args.title as string;
    if (args.notes !== undefined) requestBody.notes = args.notes as string;
    if (args.due !== undefined) requestBody.due = args.due as string;
    if (args.status !== undefined) {
      requestBody.status = args.status as string;
      // When reopening a task, clear the completed timestamp
      if (args.status === 'needsAction') {
        requestBody.completed = null;
      }
    }

    const response = await this.tasks.tasks.patch({
      tasklist: args.tasklist_id as string,
      task: args.task_id as string,
      requestBody,
    });

    return [{ type: 'text', text: JSON.stringify(response.data, null, 2) }];
  }
}
