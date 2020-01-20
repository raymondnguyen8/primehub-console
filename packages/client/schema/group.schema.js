/** @jsx builder */
import builder, {Condition, Block, Row, Col, Default} from 'canner-script';
import {Tag} from 'antd';
import Filter from '../src/cms-toolbar/filter';
import {renderRelationField, parseToStepDot5} from './utils';
export default () => (
  <array keyName="group" title="${group}"
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
        title: "${group.sharedVolumeCapacity}",
        dataIndex: 'sharedVolumeCapacity',
        render: (value) => {
          if (value) {
            return `${value}G`
          }
          return '-'
        }
      }, {
        title: '${cpuQuotaListTitle}',
        dataIndex: 'quotaCpu',
        render: text => {
          return text === null ? '∞' : text;
        }
      }, {
        title: '${gpuQuotaListTitle}',
        dataIndex: 'quotaGpu',
        render: text => {
          return text === null ? '∞' : text;
        }
      }, {
        title: '${projectCpuQuota}',
        dataIndex: 'projectQuotaCpu',
        render: text => {
          return text === null ? '∞' : text;
        }
      }, {
        title: '${projectGpuQuota}',
        dataIndex: 'projectQuotaGpu',
        render: text => {
          return text === null ? '∞' : text;
        }
      },
      // {
      //   title: '${users}',
      //   dataIndex: 'users',
      //   render: renderRelationField
      // }
    ]
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
              projectQuotaCpu
              projectQuotaGpu
              sharedVolumeCapacity
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
          placeholder: '{name}',
          key: 'name'
        }]}
      />
      <pagination />
    </toolbar>
    <Condition match={(data, operator) => operator === 'create'} defaultMode="disabled">
      <string keyName="name" title="${name}"
        validation={{
          validator: (value, cb) => {
            if (!value.match(/^[A-Za-z0-9]([-A-Za-z0-9_]*[A-Za-z0-9])?(\.[A-Za-z0-9]([-A-Za-z0-9_]*[A-Za-z0-9])?)*$/)) {
              return cb(`alphanumeric characters, '-', '_' or '.', and must start and end with an alphanumeric character.`);
            }
          }
        }}
        required
      />
    </Condition>

    <string keyName="displayName" title="${displayName}" />
    <ShareVolumn />
    <Block title="User Quota">
      <Row type="flex">
        <Col sm={8} xs={24}>
          <number keyName="quotaCpu"
            uiParams={{min: 0.5, step: 0.5, precision: 1, parser: parseToStepDot5}}
            defaultValue={0.5}
            title="${cpuQuota}"
            packageName="../src/cms-components/customize-number-checkbox"
            nullable
          />
        </Col>
        <Col sm={8} xs={24}>
          <number keyName="quotaGpu" title="${gpuQuota}"  uiParams={{min: 0, step: 1, precision: 0}}
            defaultValue={() => 0}
            packageName="../src/cms-components/customize-number-checkbox"
            nullable
          />
        </Col>
        <Col sm={8} xs={24}>
          <number keyName="quotaMemory" title="${quotaMemory}"  uiParams={{min: 0, step: 1, precision: 1, unit: ' GB'}}
            defaultValue={() => null}
            packageName="../src/cms-components/customize-number-checkbox"
            nullable
          />
        </Col>
        <Col sm={8} xs={24}>
          <number keyName="userVolumeCapacity" title="${userVolumeCapacity}"
            uiParams={{min: 1, step: 1, precision: 0, unit: ' GB', disableText: 'use default value'}}
            defaultValue={() => null}
            description="${quotaForNewly}"
            packageName="../src/cms-components/customize-number-checkbox"
            nullable
          />
        </Col>
      </Row>
    </Block>
    <Block title="${groupQuota}">
      <Row type="flex">
        <Col sm={8} xs={24}>
          <number keyName="projectQuotaCpu"
            uiParams={{min: 0.5, step: 0.5, precision: 1, parser: parseToStepDot5}}
            title="${cpuQuota}"
            packageName="../src/cms-components/customize-number-checkbox"
            nullable
            defaultValue={() => null}
          />
        </Col>
        <Col sm={8} xs={24}>
          <number keyName="projectQuotaGpu" title="${gpuQuota}"  uiParams={{min: 0, step: 1, precision: 0}}
            packageName="../src/cms-components/customize-number-checkbox"
            nullable
            defaultValue={() => null}
          />
        </Col>
        <Col sm={8} xs={24}>
          <number keyName="projectQuotaMemory" title="${quotaMemory}"  uiParams={{min: 0, step: 1, precision: 1, unit: ' GB'}}
            packageName="../src/cms-components/customize-number-checkbox"
            nullable
            defaultValue={() => null}
          />
        </Col>
      </Row>
    </Block>
    <Block title="${users}">
      <relation keyName="users"
        packageName='../src/cms-components/customize-relation-table'
        relation={{
          to: 'user',
          type: 'toMany'
        }}
        uiParams={{
          textCol: 'username',
          columns: [{
            title: '${username}',
            dataIndex: 'username'
          }]
        }}
      >
        <toolbar async>
          <filter
            component={Filter}
            fields={[{
              type: 'text',
              label: '${username}',
              key: 'username'
            }]}
          />
          <pagination />
        </toolbar>
      </relation>
    </Block>
    {/* writable is only used to check in dataset.groups table, no need to show */}
    <boolean keyName="writable" hidden />
  </array>
)


function ShareVolumn() {
  return (
    <Default>
      <boolean keyName="enabledSharedVolume" title="${group.enabledSharedVolume}" 
        packageName="../src/cms-components/customize-boolean-enable_shared_volume"
      />
      <Condition match={data => data.enabledSharedVolume} defaultMode="hidden">
        <Block title="Shared Volume">
          <Row type="flex">
            <Col sm={8} xs={24}>
              <number keyName="sharedVolumeCapacity"
                title="${group.sharedVolumeCapacity}"
                uiParams={{min: 1, step: 1, precision: 0, unit: ' GB'}}
                packageName="../src/cms-components/customize-number-shared_volume_capacity"
                // description="This volume size will not resize on update. It only work for newly created volume."
              />
            </Col>
            <Col sm={8} xs={24}>
              <boolean keyName="launchGroupOnly" title="${group.launchGroupOnly}" defaultValue={() => true} />
            </Col>
          </Row>
        </Block>
      </Condition>
    </Default>
  )
}