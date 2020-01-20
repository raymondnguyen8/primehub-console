import { Context } from './interface';
import { Item } from '../crdClient/customResource';
import { ImageSpec, ImageType } from '../crdClient/crdClientImpl';
import { mutateRelation } from './utils';
import { Crd } from './crd';
import { isUndefined, isNil, isNull, get, omit } from 'lodash';
import RoleRepresentation from 'keycloak-admin/lib/defs/roleRepresentation';
import CurrentWorkspace from '../workspace/currentWorkspace';
import { ResourceNamePrefix } from './resourceRole';

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
    spec: item.spec,
  };
};

export const resolveType = {
  async global(parent, args, context: Context) {
    const {kcAdminClient} = context;
    const currentWorkspace: CurrentWorkspace = parent.currentWorkspace;
    const everyoneGroupId = await currentWorkspace.getEveryoneGroupId();
    // find in everyOne group
    return this.findInGroup(everyoneGroupId, parent.id, kcAdminClient, currentWorkspace);
  }
};

export const onCreate = async (
  {role, resource, data, context, currentWorkspace}:
  {role: RoleRepresentation, resource: any, data: any, context: Context, currentWorkspace: CurrentWorkspace}) => {
  const everyoneGroupId = await currentWorkspace.getEveryoneGroupId();
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
  {role, resource, data, context, currentWorkspace}:
  {role: RoleRepresentation, resource: any, data: any, context: Context, currentWorkspace: CurrentWorkspace}) => {
  const everyoneGroupId = await currentWorkspace.getEveryoneGroupId();
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
      pullSecret: isNil(data.useImagePullSecret) ? null : data.useImagePullSecret
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
    url = isUndefined(spec.url) ? row.spec.url : spec.url;
    // if not `both` type, override urlForGpu with url
    urlForGpu = (row.spec.type !== ImageType.both) ?
      url
      : isUndefined(spec.urlForGpu) ? row.spec.urlForGpu : spec.urlForGpu;
  }

  spec.url = url;
  spec.urlForGpu = urlForGpu;

  return customResource.patch(name, {
    metadata: omit(metadata, 'name'),
    spec
  });
};

export const updateMapping = (data: any) => {
  return {
    metadata: {
      name: data.name
    },
    spec: {
      displayName: data.displayName,
      description: data.description,
      type: data.type,
      url: data.url,
      urlForGpu: data.urlForGpu,
      pullSecret: isNull(data.useImagePullSecret) ? null : data.useImagePullSecret
    }
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
  onCreate,
  onUpdate
});