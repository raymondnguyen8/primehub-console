import * as React from 'react';
import {Skeleton, Button, Table, Row, Col, Tag, Modal,Icon} from 'antd';
import Field from 'components/share/field';
import {graphql} from 'react-apollo';
import {compose} from 'recompose';
import {Link, withRouter} from 'react-router-dom';
import {RouteComponentProps} from 'react-router';
import PageTitle from 'components/pageTitle';
import PageBody from 'components/pageBody';
import { GroupContextComponentProps, withGroupContext } from 'context/group';
import Breadcrumbs from 'components/share/breadcrumb';
import {QueryModel, QueryModelVersionDeploy} from 'queries/Model.graphql';
import {formatTimestamp, compareTimestamp, openMLflowUI, buildModelURI} from 'ee/components/modelMngt/common';
import {DeployDialog} from 'ee/components/modelMngt/deployDialog';
import { ApolloClient } from 'apollo-client';
import { withApollo } from 'react-apollo';
import { errorHandler } from "utils/errorHandler";

const PAGE_SIZE = 200;

type Props = {
  getModel: {
    error?: any;
    loading: boolean;
    variables: {
      where?;
    };
    refetch: Function;
    mlflow?: any;
    model?: any;
    modelVersions?: any;
  };
  client: ApolloClient<any>;
} & RouteComponentProps & GroupContextComponentProps;

type State = {
  deploy: {
    modelVersion: Object;
    deploymentRefs: Array<any>;
  },
}

class ModelDetailContainer extends React.Component<Props, State> {
  state: State = {
    deploy: null,
  };

  private renderVersion = model => version => (
    <Link to={`${model}/versions/${version}`}>
      {`Version ${version}`}
    </Link>
  );

  private renderDeployedBy = deployedBy => {
    const tags = [];
    for (const element of deployedBy) {
      tags.push(<Link to={`../deployments/${element.id}`}><Tag>{element.name}</Tag></Link>);
    }
    return (
      <div>
        {tags}
      </div>
    )
  };

  private handleDeploy = (modelVersion) => {
    const {client, groupContext} = this.props;

    if (!groupContext.enabledDeployment) {
      Modal.warn({
        title: "Feature not available",
        content: "Model Deployment is not enabled for this group. Please contact your administrator to enable it.",
      });
      return;
    }

    client.query<any>({
      query: QueryModelVersionDeploy,
      variables: {
        groupId: groupContext.id
      },
      fetchPolicy: 'no-cache',
    })
    .then((result) => {
      const deploy = {
        modelVersion,
        deploymentRefs: result.data.phDeployments
      };
      this.setState({deploy});
    })
    .catch(errorHandler);
  }

  private handleDeployNew = (modelVersion) => {
    const {history} = this.props;
    const defaultValue = {modelURI: buildModelURI(modelVersion.name, modelVersion.version)};
    history.push(`../deployments/create?defaultValue=${encodeURIComponent(JSON.stringify(defaultValue))}`);
  }

  private handleDeployExisting = (modelVersion, deploymentRef) => {
    const {history} = this.props;
    const defaultValue = {modelURI: buildModelURI(modelVersion.name, modelVersion.version)};
    history.push(`../deployments/${deploymentRef.id}/edit?defaultValue=${encodeURIComponent(JSON.stringify(defaultValue))}`);

  }

  private handleDeployCancel = () => {
    this.setState({
      deploy: null
    });
  }


  render() {
    const { groupContext, getModel, match} = this.props;
    const { deploy } = this.state;
    let {modelName} = match.params as any;
    modelName = decodeURIComponent(modelName)

    const {
      mlflow,
      model,
      modelVersions,
    } = getModel;

    const breadcrumbs = [
      {
        key: 'list',
        matcher: /\/models/,
        title: 'Models',
        link: '/models?page=1'
      },
      {
        key: 'model',
        matcher: /\/models/,
        title: `Model: ${modelName}`,
        tips: 'View the model information and versioned model list.',
        tipsLink: 'https://docs.primehub.io/docs/model-management#versioned-model-list',
        onClick: () => {getModel.refetch()}
      }
    ];

    let pageBody;
    if (getModel.error) {
      pageBody = 'Cannot load model';
    } else if (!model || !modelVersions) {
      pageBody = <Skeleton />;
    } else {
      pageBody = this.renderModel(modelName, modelVersions, model, mlflow, getModel);
    }

    return (
      <>
        <PageTitle
          breadcrumb={<Breadcrumbs pathList={breadcrumbs} />}
          title={"Model Management"}
        />
        <PageBody>{pageBody}</PageBody>
        {this.state.deploy ?
          <DeployDialog
            modelVersion={deploy.modelVersion}
            deploymentRefs={deploy.deploymentRefs}
            onDeployNew={this.handleDeployNew}
            onDeployExisting={this.handleDeployExisting}
            onCancel={this.handleDeployCancel}
          /> : <></>
        }
      </>
    );
  }

  private renderModel(modelName: any, modelVersions: any, model: any, mlflow: any, getModel: { error?: any; loading: boolean; variables: { where?: any; }; refetch: Function; mlflow?: any; model?: any; modelVersions?: any; }) {
    const columns: any = [{
      title: 'Version',
      dataIndex: 'version',
      render: this.renderVersion(modelName),
    }, {
      title: 'Registered At',
      dataIndex: 'creationTimestamp',
      render: formatTimestamp,
      sorter: (a, b) => compareTimestamp(a.creationTimestamp, b.creationTimestamp),
      defaultSortOrder: 'descend',
    }, {
      title: 'Deployed By',
      dataIndex: 'deployedBy',
      render: this.renderDeployedBy,
    }, {
      title: 'Action',
      render: (text, modelVersion) => <Button onClick={() => {this.handleDeploy(modelVersion)}}>Deploy</Button>,
    }];
    const data = modelVersions;

    let pageBody = <>
      <Row>
        <Col span={19}>
          <Field labelCol={4} valueCol={8} label='Created Time' value={formatTimestamp(model.creationTimestamp)} />
          <Field labelCol={4} valueCol={8} label='Last Modified' value={formatTimestamp(model.lastUpdatedTimestamp)} />
          <Field labelCol={4} valueCol={8} label='Description' value={model.description} />
        </Col>
        <Col span={5}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button>
              <Icon type="setting" />
              Columns
            </Button>
            <Button onClick={() => {
              openMLflowUI(mlflow, `/#/models/${encodeURIComponent(modelName)}`);
            } }>
                         MLflow UI
            </Button>
          </div>
        </Col>
      </Row>
      <Table
        style={{ paddingTop: 8 }}
        dataSource={data}
        columns={columns}
        rowKey="name"
        loading={getModel.loading} />
    </>;
    return pageBody;
  }
}

export default compose(
  withRouter,
  withGroupContext,
  withApollo,
  graphql(QueryModel, {
    options: (props: Props) => {
      const {groupContext, match} = props;
      let {modelName} = match.params as any;
      modelName = decodeURIComponent(modelName)
      const group = groupContext ? groupContext.name : undefined;

      return {
        variables: {
          group,
          name: modelName
        },
        fetchPolicy: 'cache-and-network'
      }
    },
    name: 'getModel',
    alias: 'withGetModel',
  }),
)(ModelDetailContainer)
