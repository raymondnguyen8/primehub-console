import { rule, shield, and, or, not } from 'graphql-shield';
import { isAdmin, isClient, isUser, isGroupAdmin } from '../utils/roles';

export const permissions = shield({
  Query: {
    '*': isAdmin,
    'system': or(isAdmin, isClient),
    'me': or(isAdmin, isUser),
    'user': or(isAdmin, isClient),
    'group': or(isAdmin, isClient),
    'groups': or(isAdmin, isClient),
    'instanceType': or(isAdmin, isClient),
    'image': or(isAdmin, isGroupAdmin, isUser, isClient),
    'images': or(isAdmin, isGroupAdmin, isUser, isClient),
    'imagesConnection': or(isAdmin, isGroupAdmin, isUser, isClient),
  },
  Mutation: {
    '*': isAdmin,
    'revokeApiToken': or(isAdmin, isUser),
    // will check isAdmin or isGroupAdmin in image resolver
    'createImage': or(isAdmin, isUser),
    'updateImage': or(isAdmin, isUser),
    'deleteImage': or(isAdmin, isUser),
  },
}, {
  allowExternalErrors: true
});
