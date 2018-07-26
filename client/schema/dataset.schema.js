/** @jsx builder */
import builder from 'canner-script';

export default () => (
  <array keyName="dataset" title="Dataset" ui="tableRoute"
    uiParams={{
      columns: [{
        title: 'Name',
        dataIndex: 'name'
      }, {
        title: 'Description',
        dataIndex: 'description'
      }]
    }}
  >
    <string keyName="name" title="Name" />
    <string keyName="description" title="Description" />
    <string keyName="access" title="Access" ui="select"
      uiParams={{
        options: [{
          text: 'group',
          value: 'group'
        }, {
          text: 'everyone',
          value: 'everyone'
        }, {
          text: 'admin',
          value: 'admin'
        }]
      }}
    />
    <string keyName="type" title="Type"
      ui="select"
      uiParams={{
        options: [{
          text: 'git',
          value: 'git'
        }]
      }}
    />
    <string keyName="url" title="Url" ui="link"/>
    <relation keyName="groups" title="Groups"
      packageName='../src/cms-components/customize-relation-table'
      relation={{
        to: 'group',
        type: 'toMany'
      }}
      hideTitle
      uiParams={{
        isHidden: record => record.access !== 'group',
        textCol: 'displayName',
        columns: [{
          title: 'Display Name',
          dataIndex: 'displayName'
        }, {
          title: 'Can Use GPU',
          dataIndex: 'canUseGpu'
        }, {
          title: 'GPU Quota',
          dataIndex: 'gpuQuota'
        }, {
          title: 'Disk Quota',
          dataIndex: 'diskQuota'
        }]
      }}
    >
      <toolbar>
        {/* <filter
          fields={[{
            type: 'text',
            label: 'Display Name',
            key: 'displayName'
          }]}
        /> */}
        <pagination />
      </toolbar>
    </relation>
  </array>
)