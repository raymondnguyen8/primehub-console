import { Context } from './interface';
import { Item } from '../crdClient/customResource';
import { ImageSpec, ImageType } from '../crdClient/crdClientImpl';
import { QueryImageMode, toRelay, extractPagination, mutateRelation, isGroupAdmin, isAdmin } from './utils';
import { ApolloError } from 'apollo-server';
import { Crd } from './crd';
import { isEmpty, isUndefined, isNil, isNull, get, omit, unionBy } from 'lodash';
import { ResourceNamePrefix } from './resourceRole';
import { createConfig } from '../config';
import * as logger from '../logger';
import { ErrorCodes } from '../errorCodes';

const {EXCEED_QUOTA_ERROR, NOT_AUTH_ERROR} = ErrorCodes;

import RoleRepresentation from 'keycloak-admin/lib/defs/roleRepresentation';

const config = createConfig();

const adminAuthorization = async ({data, context}: {data: any, context: any}): Promise<void> => {
  const username = context.username;
  if (data && data.groupName) {
    if (!(await isGroupAdmin(username, data.groupName, context))) {
      throw new ApolloError('Not authorise', NOT_AUTH_ERROR);
    }
  } else {
    if (!isAdmin(context)) {
      throw new ApolloError('Not authorise', NOT_AUTH_ERROR);
    }
  }
};

const beforeDelete = async ({data, context}: {data: any, context: any}): Promise<any> => {
  const {spec} = data;
  await adminAuthorization({data: spec, context});
};

export const mapping = (item: Item<ImageSpec>) => {
  return {
    id: item.metadata.name,
    name: item.metadata.name,
    displayName: item.spec.displayName || item.metadata.name,
    description: item.spec.description,
    type: item.spec.type,
    url: item.spec.url,
    urlForGpu: item.spec.urlForGpu,
    useImagePullSecret: item.spec.pullSecret,
    groupName: item.spec.groupName,
    spec: item.spec,
  };
};

export const resolveType = {
  async global(parent, args, context: Context) {
    const {kcAdminClient} = context;
    const everyoneGroupId = context.everyoneGroupId;
    // find in everyOne group
    return this.findInGroup(everyoneGroupId, parent.id, kcAdminClient);
  }
};

export const onCreate = async (
  {role, resource, data, context}:
  {role: RoleRepresentation, resource: any, data: any, context: Context}) => {
    const everyoneGroupId = context.everyoneGroupId;
    // auth isGroupAdmin if data has groupName for group image
    if (data && data.global) {
      // assign role to everyone
      await context.kcAdminClient.groups.addRealmRoleMappings({
        id: everyoneGroupId,
        roles: [{
          id: role.id,
          name: role.name
        }]
      });
    }

    if (data && data.groups) {
      // add to group
      await mutateRelation({
        resource: data.groups,
        connect: async where => {
          await context.kcAdminClient.groups.addRealmRoleMappings({
            id: where.id,
            roles: [{
              id: role.id,
              name: role.name
            }]
          });
        }
      });
    }
};

export const onUpdate = async (
  {role, resource, data, context}:
  {role: RoleRepresentation, resource: any, data: any, context: Context}) => {
  const everyoneGroupId = context.everyoneGroupId;
  if (data && !isUndefined(data.global)) {
    if (data.global) {
      // assign role to everyone
      await context.kcAdminClient.groups.addRealmRoleMappings({
        id: everyoneGroupId,
        roles: [{
          id: role.id,
          name: role.name
        }]
      });
    } else {
      await context.kcAdminClient.groups.delRealmRoleMappings({
        id: everyoneGroupId,
        roles: [{
          id: role.id,
          name: role.name
        }]
      });
    }
  }

  if (data && data.groups) {
    // add to group
    await mutateRelation({
      resource: data.groups,
      connect: async where => {
        await context.kcAdminClient.groups.addRealmRoleMappings({
          id: where.id,
          roles: [{
            id: role.id,
            name: role.name
          }]
        });
      },
      disconnect: async where => {
        await context.kcAdminClient.groups.delRealmRoleMappings({
          id: where.id,
          roles: [{
            id: role.id,
            name: role.name
          }]
        });
      }
    });
  }
};

const defineUrlAndUrlForGpu = (urlInRequest: string, urlForGpuInRequest: string, imageType: ImageType) => {
  const url = urlInRequest;

  // if `type` is `gpu` or `cpu`, use `url` value
  // if type is both , User can add specific image url for gpu instance,
  // if it's not present, use default url value
  const urlForGpu = (imageType === ImageType.both) ?
    urlForGpuInRequest || url
    : url;

  return {url, urlForGpu};
};

export const createMapping = (data: any) => {
  const imageType = data.type || ImageType.both;
  const {url, urlForGpu} = defineUrlAndUrlForGpu(data.url, data.urlForGpu, imageType);

  return {
    metadata: {
      name: data.name
    },
    spec: {
      displayName: data.displayName || data.name,
      description: data.description,
      type: imageType,
      url,
      urlForGpu,
      pullSecret: isNil(data.useImagePullSecret) ? '' : data.useImagePullSecret,
      groupName: isNil(data.groupName) ? null : data.groupName
    }
  };
};

const customUpdate = async ({
  name, metadata, spec, customResource
}: {
  name: string, metadata: any, spec: any, customResource: any
}) => {
  // find original value first
  const row = await customResource.get(name);
  let url;
  let urlForGpu;

  // if user change image type
  if (!isNil(spec.type)) {
    // construct new value accordingly
    const urls = defineUrlAndUrlForGpu(spec.url || row.spec.url, spec.urlForGpu || row.spec.urlForGpu, spec.type);
    url = urls.url;
    urlForGpu = urls.urlForGpu;
  } else {
    // just changing attribute
    // if not updated, use original values
    url = isEmpty(spec.url) ? row.spec.url : spec.url;
    // if not `both` type, override urlForGpu with url
    urlForGpu = (row.spec.type !== ImageType.both) ?
      url
      : isEmpty(spec.urlForGpu) ? row.spec.urlForGpu : spec.urlForGpu;
  }

  spec.url = url;
  spec.urlForGpu = urlForGpu;

  return customResource.patch(name, {
    metadata: omit(metadata, 'name'),
    spec
  });
};

export const updateMapping = (data: any) => {
  const imageType = data.type || ImageType.both;
  const {url, urlForGpu} = defineUrlAndUrlForGpu(data.url, data.urlForGpu, imageType);
  return {
    metadata: {
      name: data.name
    },
    spec: {
      displayName: data.displayName,
      description: data.description,
      type: data.type,
      url,
      urlForGpu,
      pullSecret: isNil(data.useImagePullSecret) ? null : data.useImagePullSecret,
      groupName: isNil(data.groupName) ? null : data.groupName
    }
  };
};

export const groupImages = async (parent, args, context: Context) => {
  // TODO group image (GROUP_ONLY)
  const groupId = parent.id;
  args.mode = QueryImageMode.GROUP_ONLY; // Force the query mode to GROUP_ONLY

  let resourceRoles = await this.crd.listGroupResourceRoles(context.kcAdminClient, groupId);
  if (!parent.effectiveGroup) {
    return this.crd.queryResourcesByRoles(resourceRoles, context, args);
  }

  // Effective Roles, we need to merge resource in this group and the everyone group.
  const resourceRolesEveryone = this.crd.transfromResourceRoles(parent.realmRolesEveryone);

  resourceRoles = unionBy(resourceRoles, resourceRolesEveryone, (resourceRole: any) => resourceRole.originalName);
  return this.crd.queryResourcesByRoles(resourceRoles, context, args);
};

export const groupImagesConnection = async (root, args, context: Context) => {
  const where = this.crd.parseWhere(args.where);
  if (where.groupName_contains) {
    await adminAuthorization({data: {groupName: where.groupName_contains}, context});
  } else {
    throw new ApolloError('Not authorise', NOT_AUTH_ERROR);
  }
  const customResource = context.crdClient[this.crd.customResourceMethod];
  const rows = await this.crd.listQuery(customResource, where, args && args.orderBy, QueryImageMode.GROUP_ONLY);
  return toRelay(rows, extractPagination(args));
};

export const customResolvers = () => {
  return {
    [`groupImagesConnection`]: groupImagesConnection,
  };
};

export const customResolversInGroup = () => {
  return {
    [`groupImages`]: groupImages,
  };
};

export const crd = new Crd<ImageSpec>({
  customResourceMethod: 'images',
  propMapping: mapping,
  resolveType,
  prefixName: ResourceNamePrefix.img,
  resourceName: 'image',
  createMapping,
  updateMapping,
  customUpdate,
  beforeCreate: adminAuthorization,
  beforeUpdate: adminAuthorization,
  beforeDelete,
  onCreate,
  onUpdate,
  customResolvers
});
