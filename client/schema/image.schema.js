/** @jsx builder */
import builder, {Condition} from 'canner-script';
import Filter from '../src/cms-toolbar/filter';
import {Tag} from 'antd';
import {GroupRelation, CustomizedStringImagePullSecret} from './utils.schema';

export default () => (
  <array keyName="image"
    title="${images}"
    cannerDataType="array"
    controlDeployAndResetButtons={true}
    cacheActions={true}
    packageName="../src/cms-components/customize-array-table_route"
    uiParams={{
      columns: [{
        title: '${name}',
        dataIndex: 'name'
      }, {
        title: '${displayName}',
        dataIndex: 'displayName'
      }, {
        title: '${description}',
        dataIndex: 'description'
      }]
    }}
    graphql={
      `query($imageAfter: String, $imageBefore: String, $imageLast: Int, $imageFirst: Int,$imageWhere: ImageWhereInput) {
        image: imagesConnection(after: $imageAfter, before: $imageBefore, last: $imageLast, first: $imageFirst,where: $imageWhere) {
          edges {
            cursor
            node {
              id name displayName description
            }
          }
          pageInfo {
            hasNextPage
            hasPreviousPage
          }
        }
      }`
    }
  >
    <toolbar async>
      <filter
        component={Filter}
        fields={[{
          type: 'text',
          label: '${name}',
          key: 'name'
        }, {
          type: 'text',
          label: '${displayName}',
          key: 'displayName'
        }]}
      />
      <pagination />
    </toolbar>
    <Condition match={(data, operator) => operator === 'create'} defaultMode="disabled">
      <string keyName="name" title="${name}"
        validation={{
          validator: (value, cb) => {
            if (!value.match(/^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$/)) {
              return cb(`lower case alphanumeric characters, '-' or '.', and must start and end with an alphanumeric character.`);
            }
          }
        }}
        required
      />
    </Condition>
    <string keyName="displayName" title="${displayName}" />
    <string keyName="description" title="${description}" />
    <string keyName="url" title="${imageUrl}"/>
    <CustomizedStringImagePullSecret keyName="useImagePullSecret" title="${images.useImagePullSecret}" />
    <boolean keyName="global" title="${global}" />
    <Condition match={data => !data.global}>
      <GroupRelation />
    </Condition>
  </array>
)
