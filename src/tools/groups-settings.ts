import { Tool, TextContent, ImageContent, EmbeddedResource } from '@modelcontextprotocol/sdk/types.js';
import { GAuthService } from '../services/gauth.js';
import { google } from 'googleapis';
import { USER_ID_ARG } from '../types/tool-handler.js';

export class GroupsSettingsTools {
  private groupsSettings: ReturnType<typeof google.groupssettings>;

  constructor(private gauth: GAuthService) {
    this.groupsSettings = google.groupssettings({ version: 'v1', auth: this.gauth.getClient() });
  }

  getTools(): Tool[] {
    return [
      {
        name: 'groups_get_settings',
        description: 'Retrieve the settings for a Google Group, including posting permissions, membership visibility, join restrictions, and external member policies.',
        inputSchema: {
          type: 'object',
          properties: {
            [USER_ID_ARG]: {
              type: 'string',
              description: 'Email address of the user',
            },
            group_email: {
              type: 'string',
              description: 'The email address of the Google Group (e.g., mygroup@example.com).',
            },
          },
          required: [USER_ID_ARG, 'group_email'],
        },
      },
      {
        name: 'groups_update_settings',
        description: 'Update the settings for a Google Group. Allows configuring posting permissions, membership visibility, join policies, external member access, and moderation levels.',
        inputSchema: {
          type: 'object',
          properties: {
            [USER_ID_ARG]: {
              type: 'string',
              description: 'Email address of the user',
            },
            group_email: {
              type: 'string',
              description: 'The email address of the Google Group to update (e.g., mygroup@example.com).',
            },
            who_can_post: {
              type: 'string',
              description: 'Who can post messages to the group. One of: NONE_CAN_POST, ALL_MANAGERS_CAN_POST, ALL_MEMBERS_CAN_POST, ALL_OWNERS_CAN_POST, ALL_IN_DOMAIN_CAN_POST, ANYONE_CAN_POST.',
            },
            who_can_view_membership: {
              type: 'string',
              description: 'Who can view the membership list of the group (e.g., ALL_IN_DOMAIN_CAN_VIEW, ALL_MEMBERS_CAN_VIEW, ALL_MANAGERS_CAN_VIEW).',
            },
            who_can_join: {
              type: 'string',
              description: 'Who can join the group (e.g., ANYONE_CAN_JOIN, ALL_IN_DOMAIN_CAN_JOIN, INVITED_CAN_JOIN, CAN_REQUEST_TO_JOIN).',
            },
            allow_external_members: {
              type: 'boolean',
              description: 'Whether members outside the domain can join the group.',
            },
            message_moderation_level: {
              type: 'string',
              description: 'Moderation level for messages posted to the group (e.g., MODERATE_ALL_MESSAGES, MODERATE_NEW_MEMBERS, MODERATE_NONE, MODERATE_NON_MEMBERS).',
            },
            spam_moderation_level: {
              type: 'string',
              description: 'Moderation level for spam detected in the group (e.g., ALLOW, MODERATE, SILENTLY_MODERATE, REJECT).',
            },
          },
          required: ['user_id', 'group_email'],
        },
      },
    ];
  }

  async handleTool(
    name: string,
    args: Record<string, unknown>
  ): Promise<Array<TextContent | ImageContent | EmbeddedResource>> {
    switch (name) {
      case 'groups_get_settings':
        return this.getGroupSettings(args);
      case 'groups_update_settings':
        return this.updateGroupSettings(args);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  private async getGroupSettings(
    args: Record<string, unknown>
  ): Promise<Array<TextContent>> {
    if (!args.user_id) {
      throw new Error('user_id is required');
    }
    if (!args.group_email) {
      throw new Error('group_email is required');
    }

    try {
      const response = await this.groupsSettings.groups.get({
        groupUniqueId: args.group_email as string,
        alt: 'json',
      });

      const settings = response.data;

      return [
        {
          type: 'text',
          text: JSON.stringify(
            {
              email: settings.email,
              name: settings.name,
              description: settings.description,
              whoCanPostMessage: settings.whoCanPostMessage,
              whoCanViewMembership: settings.whoCanViewMembership,
              whoCanJoin: settings.whoCanJoin,
              allowExternalMembers: settings.allowExternalMembers,
              isArchived: settings.isArchived,
              archiveOnly: settings.archiveOnly,
              messageModerationLevel: settings.messageModerationLevel,
              spamModerationLevel: settings.spamModerationLevel,
              whoCanViewGroup: settings.whoCanViewGroup,
              whoCanInvite: settings.whoCanInvite,
              whoCanAdd: settings.whoCanAdd,
              allowWebPosting: settings.allowWebPosting,
              primaryLanguage: settings.primaryLanguage,
              maxMessageBytes: settings.maxMessageBytes,
              membersCanPostAsTheGroup: settings.membersCanPostAsTheGroup,
              messageDisplayFont: settings.messageDisplayFont,
              includeInGlobalAddressList: settings.includeInGlobalAddressList,
              whoCanLeaveGroup: settings.whoCanLeaveGroup,
              whoCanContactOwner: settings.whoCanContactOwner,
              whoCanDiscoverGroup: settings.whoCanDiscoverGroup,
              replyTo: settings.replyTo,
              customReplyTo: settings.customReplyTo,
              sendMessageDenyNotification: settings.sendMessageDenyNotification,
              defaultMessageDenyNotificationText: settings.defaultMessageDenyNotificationText,
              showInGroupDirectory: settings.showInGroupDirectory,
              allowGoogleCommunication: settings.allowGoogleCommunication,
              enableCollaborativeInbox: settings.enableCollaborativeInbox,
              whoCanAssignTopics: settings.whoCanAssignTopics,
              whoCanEnterFreeFormTags: settings.whoCanEnterFreeFormTags,
              whoCanMarkDuplicate: settings.whoCanMarkDuplicate,
              whoCanMarkNoResponseNeeded: settings.whoCanMarkNoResponseNeeded,
              whoCanMarkFavoriteReplyOnAnyTopic: settings.whoCanMarkFavoriteReplyOnAnyTopic,
              whoCanMarkFavoriteReplyOnOwnTopic: settings.whoCanMarkFavoriteReplyOnOwnTopic,
              whoCanUnmarkFavoriteReplyOnAnyTopic: settings.whoCanUnmarkFavoriteReplyOnAnyTopic,
              whoCanUnassignTopic: settings.whoCanUnassignTopic,
              whoCanTakeTopics: settings.whoCanTakeTopics,
              whoCanLockTopics: settings.whoCanLockTopics,
              whoCanMoveTopicsIn: settings.whoCanMoveTopicsIn,
              whoCanMoveTopicsOut: settings.whoCanMoveTopicsOut,
              whoCanDeleteTopics: settings.whoCanDeleteTopics,
              whoCanDeleteAnyPost: settings.whoCanDeleteAnyPost,
              whoCanMakeTopicsSticky: settings.whoCanMakeTopicsSticky,
              whoCanPostAnnouncements: settings.whoCanPostAnnouncements,
              whoCanBanUsers: settings.whoCanBanUsers,
              whoCanModifyTagsAndCategories: settings.whoCanModifyTagsAndCategories,
              favoriteRepliesOnTop: settings.favoriteRepliesOnTop,
              whoCanApproveMembers: settings.whoCanApproveMembers,
              whoCanApproveMessages: settings.whoCanApproveMessages,
              whoCanAddReferences: settings.whoCanAddReferences,
              whoCanModifyMembers: settings.whoCanModifyMembers,
              customFooterText: settings.customFooterText,
              includeCustomFooter: settings.includeCustomFooter,
              default_sender: settings.default_sender,
              kind: settings.kind,
            },
            null,
            2
          ),
        },
      ];
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code: number }).code === 403
      ) {
        throw new Error(
          'This operation requires a Google Workspace admin account or appropriate group permissions.'
        );
      }
      throw error;
    }
  }

  private async updateGroupSettings(
    args: Record<string, unknown>
  ): Promise<Array<TextContent>> {
    if (!args.user_id) {
      throw new Error('user_id is required');
    }
    if (!args.group_email) {
      throw new Error('group_email is required');
    }

    const requestBody: Record<string, unknown> = {};

    if (args.who_can_post !== undefined) {
      requestBody.whoCanPostMessage = args.who_can_post;
    }
    if (args.who_can_view_membership !== undefined) {
      requestBody.whoCanViewMembership = args.who_can_view_membership;
    }
    if (args.who_can_join !== undefined) {
      requestBody.whoCanJoin = args.who_can_join;
    }
    if (args.allow_external_members !== undefined) {
      requestBody.allowExternalMembers = String(args.allow_external_members);
    }
    if (args.message_moderation_level !== undefined) {
      requestBody.messageModerationLevel = args.message_moderation_level;
    }
    if (args.spam_moderation_level !== undefined) {
      requestBody.spamModerationLevel = args.spam_moderation_level;
    }

    try {
      const response = await this.groupsSettings.groups.update({
        groupUniqueId: args.group_email as string,
        requestBody,
      });

      const updated = response.data;

      return [
        {
          type: 'text',
          text: JSON.stringify(
            {
              message: `Successfully updated settings for group: ${args.group_email}`,
              updatedSettings: {
                email: updated.email,
                name: updated.name,
                whoCanPostMessage: updated.whoCanPostMessage,
                whoCanViewMembership: updated.whoCanViewMembership,
                whoCanJoin: updated.whoCanJoin,
                allowExternalMembers: updated.allowExternalMembers,
                messageModerationLevel: updated.messageModerationLevel,
                spamModerationLevel: updated.spamModerationLevel,
              },
            },
            null,
            2
          ),
        },
      ];
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code: number }).code === 403
      ) {
        throw new Error(
          'This operation requires a Google Workspace admin account or appropriate group permissions.'
        );
      }
      throw error;
    }
  }
}
