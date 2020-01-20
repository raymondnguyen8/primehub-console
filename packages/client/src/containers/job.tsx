import * as React from 'react';
import gql from 'graphql-tag';
import {graphql} from 'react-apollo';
import {compose} from 'recompose';
import {get} from 'lodash';
import JobListContainer from 'containers/jobList';

export const GroupFragment = gql`
  fragment GroupInfo on Group {
    id
    displayName
    name
  }
`;

export const GET_MY_GROUPS = gql`
  query me {
    me {
      id
      groups {
        ...GroupInfo
      }
    }
  }
  ${GroupFragment}
`

type Props = {
  getMyGroups: any;
}
class JobContainer extends React.Component<Props> {
  render() {
    const {getMyGroups} = this.props;
    const everyoneGroupId = (window as any).EVERYONE_GROUP_ID;
    if (getMyGroups.loading) return null;
    if (getMyGroups.error) return 'Error';

    const groups = get(getMyGroups, 'me.groups', [])
      .filter(group => group.id !== everyoneGroupId);

    return (
      <JobListContainer
        groups={groups}
      />
    );
  }
}

export default compose(
  graphql(GET_MY_GROUPS, {
    name: 'getMyGroups'
  })
)(JobContainer)