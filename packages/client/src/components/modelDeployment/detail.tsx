import React from 'react';
import {Icon, Modal, Card, Divider, Row, Col, Tabs, Input, Table, Button, message} from 'antd';
import { DeploymentInfo, Status } from './common';
import PageTitle from './pageTitle';
import InfuseButton from 'components/infuseButton';
import { appPrefix } from 'utils/env';
import {Link} from 'react-router-dom';
import {Field} from 'components/modelDeployment/card';
import ModelDeploymentLogs from 'components/modelDeployment/logs';
import ModelDeploymentHistory from 'components/modelDeployment/history';
import Metadata from 'components/modelDeployment/metadata';
import Message from 'components/share/message';
import moment from 'moment';

const {confirm} = Modal;

type Props = {
  stopPhDeployment: Function;
  deletePhDeployment: Function;
  deployPhDeployment: Function;
  stopPhDeploymentResult: any;
  deletePhDeploymentResult: any;
  deployPhDeploymentResult: any;
  phDeployment: DeploymentInfo;
  history: any;
}

export default class Detail extends React.Component<Props> {
  textArea: React.RefObject<any> = React.createRef();

  copyClipBoard = () => {
    if (this.textArea && this.textArea.current) {
      this.textArea.current.textAreaRef.select();
      document.execCommand('copy');
      message.success('copied');
      this.textArea.current.textAreaRef.blur();
    }
  }

  handleDelete = () => {
    const {phDeployment, deletePhDeployment} = this.props;
    confirm({
      title: `Delete`,
      content: `Do you want to delete '${phDeployment.name}'?`,
      iconType: 'info-circle',
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk() {
        return deletePhDeployment({variables: {where: {id: phDeployment.id}}});
      },
    });
  }

  handleStop = () => {
    const {phDeployment, stopPhDeployment} = this.props;
    confirm({
      title: `Stop`,
      content: `Do you want to stop '${phDeployment.name}'?`,
      iconType: 'info-circle',
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk() {
        return stopPhDeployment({variables: {where: {id: phDeployment.id}}});
      },
    });
  }

  handleDeploy = () => {
    const {phDeployment, deployPhDeployment} = this.props;
    confirm({
      title: `Deploy`,
      content: `Do you want to deploy '${phDeployment.name}'?`,
      iconType: 'info-circle',
      okText: 'Yes',
      cancelText: 'No',
      onOk() {
        return deployPhDeployment({variables: {where: {id: phDeployment.id}}});
      },
    });
  }

  renderInformation = () => {
    const {phDeployment} = this.props;
    return (
      <div style={{padding: '16px 36px'}}>
        <Row gutter={36}>
          <Col span={24}>
            <Field labelCol={4} valueCol={20} label="Status" value={<strong>{phDeployment.status}</strong>} />
            <Field labelCol={4} valueCol={20} label="Message" value={getMessage(phDeployment)} />
          </Col>
        </Row>
        <Divider />
        <Row gutter={36}>
          <Col span={12}>
            <Field label="Endpoint" value={phDeployment.status === Status.Deployed ? phDeployment.endpoint : '-'} />
            <Field label="Model Image" value={phDeployment.status !== Status.Stopped ? phDeployment.modelImage : '-'} />
            <Field label="Replicas" value={`${(phDeployment.availableReplicas || 0)}/${phDeployment.replicas}`} />
            <Field label="Deployment Name" value={phDeployment.name} />
            <Field label="Group" value={phDeployment.groupName} />
            <Field label="Instance Type" value={phDeployment.status !== Status.Stopped ? renderInstanceType(phDeployment.instanceType || {}) : '-'} />
            <Field label="Creation Time" value={renderTime(phDeployment.creationTime)} />
            <Field label="Last Updated" value={renderTime(phDeployment.lastUpdatedTime)} />
            <Field label="Description" value={(
              <div style={{whiteSpace: 'pre-line'}}>
                {phDeployment.description || '-'}
              </div>
            )} />
          </Col>
          <Col span={12}>
            <Field type="vertical" label="Metadata" value={<Metadata metadata={phDeployment.metadata} />} />
            
          </Col>
        </Row>
        <Field style={{marginTop: 32}} type="vertical" label="Run an Example" value={(
          <>
            <Button icon="copy" onClick={() => this.copyClipBoard()}
              style={{
                float: 'right',
                top: 32,
                marginTop: -32,
                zIndex: 10,
                position: 'relative',
                color: '#ccc',
                borderColor: '#ccc'
              }}
              type="ghost"
            >
              Copy
            </Button>
            <Input.TextArea
              ref={this.textArea}
              style={{
                background: 'black',
                color: '#ddd',
                fontFamily: 'monospace',
              }}
              rows={5}
              value={`curl -X POST \\
    -d '{"data":{"names":["a","b"],"tensor":{"shape":[2,2],"values":[0,0,1,1]}}}' \\
    -H "Content-Type: application/json" \\
    ${phDeployment.endpoint || '<endpoint>'}
              `}
            />
          </>
        )} />
      </div>
    )
  }

  renderLogs = () => {
    const {phDeployment} = this.props;
    return <ModelDeploymentLogs pods={phDeployment.pods}/>;
  }

  renderHistory = () => {
    const {phDeployment} = this.props;
    return <ModelDeploymentHistory history={phDeployment.history} />;
  }
  
  render() {
    const {phDeployment, stopPhDeploymentResult, deletePhDeploymentResult, deployPhDeploymentResult, history} = this.props;
    return (
      <>
        <PageTitle
          title={(
            <div style={{ display: 'flex', alignItems: 'center'}}>
              <InfuseButton style={{marginRight: 16}} onClick={() => history.push(`${appPrefix}model-deployment`)}>
                <Icon type="arrow-left" />
                Back
              </InfuseButton>
              <div style={{
                maxWidth: 540,
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                msTextOverflow: 'ellipsis',
              }}>Deployment: {phDeployment.name}</div>
            </div>
          )}
          extra={<div>
            <InfuseButton onClick={this.handleDelete} style={{marginRight: 16}}>
              Delete
            </InfuseButton>
            {
              (phDeployment.status === Status.Stopped || phDeployment.status === Status.Stopping) ? (
                <InfuseButton onClick={this.handleDeploy} style={{marginRight: 16}}>
                  Start
                </InfuseButton>
              ):(
                <InfuseButton onClick={this.handleStop} style={{marginRight: 16}}>
                  Stop
                </InfuseButton>
              )
            }
            {
              <InfuseButton>
                <Link to={`${appPrefix}model-deployment/edit/${phDeployment.id}`}>
                  Update
                </Link>
              </InfuseButton>
            }
          </div>}
        />
        <Card loading={stopPhDeploymentResult.loading || deletePhDeploymentResult.loading || deployPhDeploymentResult.loading}>
          <Tabs defaultActiveKey="information">
            <Tabs.TabPane key="information" tab="Information">
              {this.renderInformation()}
            </Tabs.TabPane>
            <Tabs.TabPane key="logs" tab="Logs">
              {this.renderLogs()}
            </Tabs.TabPane>
            <Tabs.TabPane key="history" tab="History">
              {this.renderHistory()}
            </Tabs.TabPane>
          </Tabs>
        </Card>
      </>
    )
  }
}

function getMessage(deployment: DeploymentInfo) {
  switch (deployment.status) {
    case Status.Deployed:
      return 'Deployment completed';
    case Status.Failed:
    case Status.Stopping:
    case Status.Deploying:
    case Status.Stopped:
    default:
      return deployment.message ? <Message style={{marginTop: 0}} text={deployment.message} /> : '-';
  }
}
const dashOrNumber = value => value === null ? '-' : value;

export function renderInstanceType(instanceType) {
  return (
    <div>
      {instanceType.displayName || instanceType.name}
      <br />
      (CPU: {dashOrNumber(instanceType.cpuLimit)} / Memory: {dashOrNumber(instanceType.memoryLimit)} G / GPU: {dashOrNumber(instanceType.gpuLimit)})
    </div>
  )
}

export function renderTime(time: string) {
  return time ? moment(time).format('YYYY-MM-DD HH:mm:ss') : '-';
}