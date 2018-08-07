// tslint:disable:no-unused-expression
import chai from 'chai';
import chaiHttp = require('chai-http');
import faker from 'faker';
import KeycloakAdminClient from 'keycloak-admin';

chai.use(chaiHttp);

const expect = chai.expect;

// utils
const userFields = `
  id
  username
  email
  firstName
  lastName
  totp
  isAdmin
  enabled
  createdTimestamp
  personalDiskQuota
  groups {
    id
    name
    displayName
    canUseGpu
    cpuQuota
    gpuQuota
    diskQuota
  }`;

// interface

declare module 'mocha' {
  // tslint:disable-next-line:interface-name
  interface ISuiteCallbackContext {
    graphqlRequest?: (query: string, variables?: any) => Promise<any>;
    kcAdminClient: KeycloakAdminClient;
    currentUser?: any;
  }
}

describe('user graphql', function() {
  this.timeout(5000);
  before(() => {
    this.graphqlRequest = (global as any).graphqlRequest;
    this.kcAdminClient = (global as any).kcAdminClient;
  });

  it('should expect users when query users', async () => {
    const data = await this.graphqlRequest(`{
      users {${userFields}}
    }`);

    expect(data.users.length).to.be.least(1);
  });

  it('should add an user', async () => {
    const userData = {
      username: faker.internet.userName().toLowerCase(),
      firstName: faker.name.firstName(),
      email: faker.internet.email().toLowerCase()
    };
    const data = await this.graphqlRequest(`
    mutation($data: UserCreateInput!){
      createUser (data: $data) { ${userFields} }
    }`, {
      data: userData
    });

    expect(data.createUser).to.deep.include({
      ...userData,
      lastName: null,
      totp: false,
      isAdmin: false,
      enabled: true,
      personalDiskQuota: 20,
      groups: []
    });
    this.currentUser = data.createUser;
  });

  it('should add an user with personalDiskQuota', async () => {
    const userData = {
      username: faker.internet.userName().toLowerCase(),
      firstName: faker.name.firstName(),
      email: faker.internet.email().toLowerCase(),
      personalDiskQuota: 50
    };
    const data = await this.graphqlRequest(`
    mutation($data: UserCreateInput!){
      createUser (data: $data) { ${userFields} }
    }`, {
      data: userData
    });

    expect(data.createUser).to.deep.include({
      ...userData,
      lastName: null,
      totp: false,
      isAdmin: false,
      enabled: true,
      personalDiskQuota: 50,
      groups: []
    });

    // query
    const query = await this.graphqlRequest(`
    query ($where: UserWhereUniqueInput!){
      user(where: $where) { ${userFields} }
    }`, {
      where: {
        id: data.createUser.id
      }
    });

    expect(query.user).to.deep.include(userData);

    // check in keycloak
    const user = await this.kcAdminClient.users.findOne({realm: process.env.KC_REALM, id: data.createUser.id});
    expect(user.attributes.personalDiskQuota[0]).to.be.equals(`${userData.personalDiskQuota}G`);
  });

  it('should add an user with isAdmin = true', async () => {
    const userData = {
      username: faker.internet.userName().toLowerCase(),
      firstName: faker.name.firstName(),
      email: faker.internet.email().toLowerCase(),
      isAdmin: true
    };
    const data = await this.graphqlRequest(`
    mutation($data: UserCreateInput!){
      createUser (data: $data) { ${userFields} }
    }`, {
      data: userData
    });

    expect(data.createUser).to.deep.include({
      ...userData,
      lastName: null,
      totp: false,
      enabled: true,
      groups: []
    });

    // query
    const query = await this.graphqlRequest(`
    query ($where: UserWhereUniqueInput!){
      user(where: $where) { ${userFields} }
    }`, {
      where: {
        id: data.createUser.id
      }
    });

    expect(query.user).to.deep.include(userData);
  });

  it('should get an user', async () => {
    const user = this.currentUser;
    const data = await this.graphqlRequest(`
    query ($where: UserWhereUniqueInput!){
      user(where: $where) { ${userFields} }
    }`, {
      where: {
        id: user.id
      }
    });

    expect(data.user).to.deep.include(user);
  });

  it('should query users with where', async () => {
    const user = this.currentUser;
    const data = await this.graphqlRequest(`
    query ($where: UserWhereInput!){
      users(where: $where) { ${userFields} }
    }`, {
      where: {
        id: user.id
      }
    });

    expect(data.users[0]).to.deep.include(user);
  });

  it('should update an user', async () => {
    const user = this.currentUser;
    const updateData = {
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName(),
      personalDiskQuota: 100
    };
    await this.graphqlRequest(`
    mutation ($where: UserWhereUniqueInput!, $data: UserUpdateInput!){
      updateUser(where: $where, data: $data) { ${userFields} }
    }`, {
      where: {
        id: user.id
      },
      data: updateData
    });

    // currently, I didn't pass the updated data in update mutatoin
    // todo: return udpated data if necessary
    // expect(data.updateUser).to.deep.include(updateData);

    // query
    const query = await this.graphqlRequest(`
    query ($where: UserWhereUniqueInput!){
      user(where: $where) { ${userFields} }
    }`, {
      where: {
        id: user.id
      }
    });

    expect(query.user).to.deep.include(updateData);

    // check in keycloak
    const kcUser = await this.kcAdminClient.users.findOne({realm: process.env.KC_REALM, id: user.id});
    expect(kcUser.attributes.personalDiskQuota[0]).to.be.equals(`${updateData.personalDiskQuota}G`);
  });

  it('should update an user with isAdmin', async () => {
    const user = this.currentUser;
    await this.graphqlRequest(`
    mutation ($where: UserWhereUniqueInput!, $data: UserUpdateInput!){
      updateUser(where: $where, data: $data) { ${userFields} }
    }`, {
      where: {
        id: user.id
      },
      data: {isAdmin: true}
    });
    // query
    const query = await this.graphqlRequest(`
    query ($where: UserWhereUniqueInput!){
      user(where: $where) { ${userFields} }
    }`, {
      where: {
        id: user.id
      }
    });

    expect(query.user.isAdmin).to.be.equals(true);

    // update back to false
    await this.graphqlRequest(`
    mutation ($where: UserWhereUniqueInput!, $data: UserUpdateInput!){
      updateUser(where: $where, data: $data) { ${userFields} }
    }`, {
      where: {
        id: user.id
      },
      data: {isAdmin: false}
    });
    const backQuery = await this.graphqlRequest(`
    query ($where: UserWhereUniqueInput!){
      user(where: $where) { ${userFields} }
    }`, {
      where: {
        id: user.id
      }
    });

    expect(backQuery.user.isAdmin).to.be.equals(false);
  });

  it('should update an user with personalDiskQuota', async () => {
    const user = this.currentUser;
    await this.graphqlRequest(`
    mutation ($where: UserWhereUniqueInput!, $data: UserUpdateInput!){
      updateUser(where: $where, data: $data) { ${userFields} }
    }`, {
      where: {
        id: user.id
      },
      data: {personalDiskQuota: 30}
    });
    // query
    const query = await this.graphqlRequest(`
    query ($where: UserWhereUniqueInput!){
      user(where: $where) { ${userFields} }
    }`, {
      where: {
        id: user.id
      }
    });

    expect(query.user.personalDiskQuota).to.be.equals(30);

    // update back to false
    await this.graphqlRequest(`
    mutation ($where: UserWhereUniqueInput!, $data: UserUpdateInput!){
      updateUser(where: $where, data: $data) { ${userFields} }
    }`, {
      where: {
        id: user.id
      },
      data: {personalDiskQuota: 50}
    });
    const backQuery = await this.graphqlRequest(`
    query ($where: UserWhereUniqueInput!){
      user(where: $where) { ${userFields} }
    }`, {
      where: {
        id: user.id
      }
    });

    expect(backQuery.user.personalDiskQuota).to.be.equals(50);

    // check in keycloak
    const kcUser = await this.kcAdminClient.users.findOne({realm: process.env.KC_REALM, id: user.id});
    expect(kcUser.attributes.personalDiskQuota[0]).to.be.equals('50G');
  });

  /**
   * mutation
   */
  it('should send email', async () => {
    const user = this.currentUser;
    await this.graphqlRequest(`
    mutation ($id: String, $resetActions: [String], $expiresIn: Int) {
      sendEmail(id: $id, resetActions: $resetActions, expiresIn: $expiresIn) {
        id
      }
    }`, {
      id: user.id,
      expiresIn: 19260,
      resetActions: ['VERIFY_EMAIL']
    });
  });

  it('should reset password', async () => {
    const user = this.currentUser;
    await this.graphqlRequest(`
    mutation ($id: String, $password: String, $temporary: Boolean) {
      resetPassword(id: $id, password: $password, temporary: $temporary) {
        id
        __typename
      }
    }`, {
      id: user.id,
      password: 'password',
      temporary: false
    });
  });

  it('should delete an user', async () => {
    const user = this.currentUser;
    await this.graphqlRequest(`
    mutation ($where: UserWhereUniqueInput!){
      deleteUser(where: $where) { id }
    }`, {
      where: {
        id: user.id
      }
    });

    // query
    const query = await this.graphqlRequest(`
    query ($where: UserWhereUniqueInput!){
      user(where: $where) { ${userFields} }
    }`, {
      where: {
        id: user.id
      }
    });

    expect(query.user).to.be.null;
  });
});
