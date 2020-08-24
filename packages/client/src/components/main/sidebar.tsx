import React from 'react';
import {Layout, Menu} from 'antd';
import {Link} from 'react-router-dom';
import {appPrefix} from 'utils/env';
import { withRouter, RouteComponentProps } from 'react-router';
import styled from 'styled-components';
import iconHome from 'images/icon-home.svg'
import {get} from 'lodash'
import { MainPageSidebarItem } from 'containers/mainPage';

const Icon = styled.img`
  width: 25px;
  height: 25px;
`;

const Title = styled.span`
  margin-left: 16px;
`;

const Badge = styled.span`
  position: absolute;
  top: 12px;
  left: 140px;
  border-radius: 2px;
  padding: 0px 5px;
  line-height: 15px;
  background: none;
  border: 1px rgb(255,255,255, 0.5) solid;
  font-size: 10px;

  .ant-menu-item:hover &, .ant-menu-item-selected & {
    border-color: #fff;
  }
`;

type Props = RouteComponentProps & {
  sidebarItems: MainPageSidebarItem[]
};

class Sidebar extends React.Component<Props> {
  renderStageBadge(item: MainPageSidebarItem) {

    if (item.stage === 'beta' ) {
      return <Badge>beta</Badge>
    } else if (item.stage === 'alpha' ) {
      return <Badge>alpha</Badge>
    } else {
      return <></>
    }
  }

  render() {
    const {sidebarItems, history, match} = this.props;
    const pathKeyList = ['home', 'hub', 'job', 'schedule', 'model-deployment'];
    let key = '';
    pathKeyList.forEach((val) => {
      if (history.location.pathname.split('/').includes(val)) {
        key = val;
      }
    });
    const group = get(match, 'params.groupName', '');

    return (
      <Layout.Sider style={{paddingTop: 64}}>
        <Menu
          theme="dark"
          selectedKeys={[key]}
        >
          <Menu.Item key="home" style={{marginTop: 0, paddingLeft: 26}}>
            <Link to={`${appPrefix}g/${group}/home`}>
              <Icon src={iconHome} style={{width: 'auto', height: 16, marginTop: '-4px'}}/>
              <Title>Home</Title>
            </Link>
          </Menu.Item>

          {
            sidebarItems ? sidebarItems.map(item => (
              <Menu.Item key={item.subPath} style={{paddingLeft: 26}}>
                <Link to={`${appPrefix}g/${group}/${item.subPath}`}>
                  <Icon src={item.icon} style={item.style}/>
                  <Title>{item.title}</Title>
                  {this.renderStageBadge(item)}
                </Link>
              </Menu.Item>
            )) : []
          }
        </Menu>
      </Layout.Sider>
    );
  }
}

export default withRouter(Sidebar);