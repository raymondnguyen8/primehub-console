import * as React from 'react';
import {Row, Col, Button, Skeleton, Input, message, Spin, Divider, Alert} from 'antd';
import gql from 'graphql-tag';
import {graphql} from 'react-apollo';
import {compose} from 'recompose';
import {get} from 'lodash';
import {withRouter, Link} from 'react-router-dom';
import queryString from 'querystring';
import {RouteComponentProps} from 'react-router';
import Pagination from 'components/share/pagination';
import PageTitle from 'components/pageTitle';
import PageBody from 'components/pageBody';
import Filter from 'ee/components/shared/filter';
import {Group} from 'ee/components/shared/groupFilter';
import {errorHandler} from 'utils/errorHandler';
import AppCard from 'components/apps/card';
import { PhDeploymentFragment, DeploymentConnection } from 'ee/components/modelDeployment/common';
import InfuseButton from 'components/infuseButton';
import { GroupContextComponentProps } from 'context/group';
import Breadcrumbs from 'components/share/breadcrumb';

const breadcrumbs = [
  {
    key: 'list',
    matcher: /\/apps/,
    title: 'Apps',
    link: '/apps?page=1'
  }
];

const PAGE_SIZE = 12;
const Search = Input.Search

export const GET_PH_DEPLOYMENT_CONNECTION = gql`
  query phDeploymentsConnection($where: PhDeploymentWhereInput, $first: Int, $after: String, $last: Int, $before: String) {
    phDeploymentsConnection(where: $where, first: $first, after: $after, last: $last, before: $before) {
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      edges {
        cursor
        node {
          ...PhDeploymentInfo
        }
      }
    }
  }
  ${PhDeploymentFragment}
`;

type Props = {
  groups: Array<{
    id: string;
    name: string;
    displayName: string;
    enabledDeployment: boolean;
  }>;
  getPhDeploymentConnection: {
    error?: any;
    loading: boolean;
    variables: {
      where?;
      after?: string,
      first?: number,
      last?: number,
      before?: string
    };
    refetch: Function;
    phDeploymentsConnection: DeploymentConnection
  };
} & RouteComponentProps & GroupContextComponentProps;

type State = {
  value: string;
}

class AppListContainer extends React.Component<Props, State> {
  textArea: React.RefObject<any> = React.createRef();

  copyClipBoard = value => {
    if (this.textArea && this.textArea.current) {
      this.textArea.current.input.value = value;
      this.textArea.current.select();
      document.execCommand('copy');
      message.success('copied');
    }
  }

  nextPage = () => {
    const {getPhDeploymentConnection} = this.props;
    const {phDeploymentsConnection, refetch} = getPhDeploymentConnection;
    const after = phDeploymentsConnection.pageInfo.endCursor;
    const newVariables = {
      after,
      first: PAGE_SIZE,
      last: undefined,
      before: undefined
    };
    refetch(newVariables);
  }

  previousPage = () => {
    const {getPhDeploymentConnection} = this.props;
    const {phDeploymentsConnection, refetch} = getPhDeploymentConnection;
    const before = phDeploymentsConnection.pageInfo.startCursor;
    const newVariables = {
      before,
      last: PAGE_SIZE,
      first: undefined,
      after: undefined,
    };
    refetch(newVariables);
  }

  searchHandler = (queryString) => {
    const {getPhDeploymentConnection} = this.props;
    const {phDeploymentsConnection, refetch, variables} = getPhDeploymentConnection;
    const newVariables = {
      ...variables,
      where: {
        ...variables.where,
        name_contains: queryString
      }
    }
    refetch(newVariables);
  }

  changeFilter = ({
    selectedGroups,
    submittedByMe
  }: {
    selectedGroups: Array<string>;
    submittedByMe: boolean;
  }) => {
    const {groupContext, getPhDeploymentConnection} = this.props;
    const {variables, refetch} = getPhDeploymentConnection;
    const newVariables = {
      ...variables,
      where: {
        ...variables.where,
        mine: submittedByMe,
      }
    };

    if (!groupContext) {
      newVariables.where.groupId_in = selectedGroups;
    }

    refetch(newVariables);
  }

  render() {
    const { groupContext, getPhDeploymentConnection, groups, history } = this.props;
    const {
      error,
      loading,
      phDeploymentsConnection,
      variables,
      refetch
    } = getPhDeploymentConnection;

    if (error) {
      console.log(getPhDeploymentConnection.error);
      return 'Error';
    }

    if (!phDeploymentsConnection) {
      return <Skeleton />
    }

    let showContent = true;

    let pageBody = <>
      <div style={{textAlign: 'right'}}>
        <InfuseButton
          icon="plus"
          type="primary"
          onClick={() => history.push(`model-deployment/create`)}
          style={{marginRight: 16, width: 'auto'}}
        >
          Create Apps
        </InfuseButton>
        <InfuseButton onClick={() => refetch()}>Refresh</InfuseButton>
      </div>
    </>;

    if ( groupContext ) {
      const group = groups.find(group => group.id === groupContext.id);
      if ( !group ) {
        pageBody = <Alert
          message="Group not found"
          description={`Group ${groupContext.name} is not found or not authorized.`}
          type="error"
          showIcon/>;
          showContent = false;
      } else if ( group.enabledDeployment !== true ) {
        pageBody = <Alert
          message="Feature not available"
          description="Model Deployment is not enabled for this group. Please contact your administrator to enable it."
          type="warning"
          showIcon/>;
        showContent = false;
      }
    }

    const content = <div style={{margin: '16px 16px'}}>
        <Spin spinning={loading}>
          <Row gutter={24} type="flex">
            {phDeploymentsConnection.edges.map(edge => {
              return (
                <Col xs={24} md={12} xl={8} xxl={6} key={edge.cursor} style={{marginBottom: 16}}>
                  <AppCard
                    deployment={edge.node}
                    copyClipBoard={this.copyClipBoard}
                  />
                </Col>
              );
            })}
          </Row>
        </Spin>
        <Input
          ref={this.textArea}
          style={{position: 'absolute', left: '-1000px', top: '-1000px'}}
        />
        <Pagination
          hasNextPage={phDeploymentsConnection.pageInfo.hasNextPage}
          hasPreviousPage={phDeploymentsConnection.pageInfo.hasPreviousPage}
          nextPage={this.nextPage}
          previousPage={this.previousPage}
        />
      </div>

    return (
      <>
        <PageTitle
          breadcrumb={<Breadcrumbs pathList={breadcrumbs} />}
          title={'Apps'}
        />
        <PageBody>{pageBody}</PageBody>
        { showContent ? content : <></> }
      </>
    );
  }
}

export default compose(
  withRouter,
  graphql(GET_PH_DEPLOYMENT_CONNECTION, {
    options: (props: Props) => {
      const params = queryString.parse(props.location.search.replace(/^\?/, ''));
      const {groupContext} = props;
      const where = JSON.parse(params.where as string || '{}');
      if (groupContext) {
        where.groupId_in = [groupContext.id];
      }

      return {
        variables: {
          first: PAGE_SIZE,
          where,
        },
        fetchPolicy: 'cache-and-network'
      };
    },
    name: 'getPhDeploymentConnection'
  }),
)(AppListContainer)
