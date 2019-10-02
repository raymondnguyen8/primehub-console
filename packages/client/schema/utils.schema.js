/** @jsx builder */

import builder from 'canner-script';
import Filter from '../src/cms-toolbar/filter';

export const groupColumns = [{
  title: '${name}',
  dataIndex: 'name'
}, {
  title: '${displayName}',
  dataIndex: 'displayName'
}, , {
  title: '${cpuQuota}',
  dataIndex: 'quotaCpu',
  render: text => {
    return text === null ? '∞' : text;
  }
}, {
  title: '${gpuQuota}',
  dataIndex: 'quotaGpu',
  render: text => {
    return text === null ? '∞' : text;
  }
}, {
  title: '${userVolumeCapacity}',
  dataIndex: 'userVolumeCapacity',
  render: text => {
    return text === null ? '-' : text;
  }
}];

exports.GroupRelation = () => (
  <relation keyName="groups" title="${groups}"
    packageName='../src/cms-components/customize-relation-table'
    relation={{
      to: 'group',
      type: 'toMany',
      fields: ['name', 'displayName', 'quotaCpu', 'quotaGpu', 'userVolumeCapacity']
    }}
    uiParams={{
      columns: groupColumns 
    }}
    graphql={`
    query($groupAfter: String, $groupBefore: String, $groupLast: Int, $groupFirst: Int,$groupWhere: GroupWhereInput) {
      group: groupsConnection(after: $groupAfter, before: $groupBefore, last: $groupLast, first: $groupFirst,where: $groupWhere) {
        edges {
          cursor
          node {
            id
            name
            displayName
            quotaCpu
            quotaGpu
            userVolumeCapacity
          }
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
        }
      }
    }
    `}
  >
    <toolbar async>
      <filter
        component={Filter}
        fields={[{
          type: 'text',
          label: '${name}',
          key: 'name'
        }]}
      />
      <pagination />
    </toolbar>
  </relation>
);

exports.CustomizedStringImagePullSecret = ({attributes}) => (
  <string keyName={attributes.keyName}
    title={attributes.title}
    packageName="../src/cms-components/customize-string-use_image_pull_secret"
  />
)

exports.CustomizedStringSelectWithCheckbox = ({attributes}) => (
  <string
    keyName={attributes.keyName}
    title={attributes.title}
    defaultValue={attributes.defaultValue}
    // hide title since we render title in customize component
    hideTitle
    // when it's unchecked the value is null
    nullable
    packageName="../src/cms-components/customize-string-input_with_checkbox"
  />
)