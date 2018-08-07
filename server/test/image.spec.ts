// tslint:disable:no-unused-expression
import chai from 'chai';
import chaiHttp = require('chai-http');
import faker from 'faker';
import { cleanupImages } from './sandbox';

chai.use(chaiHttp);

const expect = chai.expect;

// utils
const fields = `
  id
  name
  displayName
  description
  url
  global
  groups {
    id
    name
    displayName
    canUseGpu
    cpuQuota
    gpuQuota
    diskQuota
  }`;

declare module 'mocha' {
  // tslint:disable-next-line:interface-name
  interface ISuiteCallbackContext {
    graphqlRequest?: (query: string, variables?: any) => Promise<any>;
    currentImage?: any;
  }
}

describe('image graphql', function() {
  before(() => {
    this.graphqlRequest = (global as any).graphqlRequest;
  });

  after(async () => {
    await cleanupImages();
  });

  it('query images', async () => {
    const data = await this.graphqlRequest(`{
      images {${fields}}
    }`);
    expect(data.images).to.be.eql([]);
  });

  it('create a image with only name', async () => {
    const data = {
      name: faker.internet.userName().toLowerCase().replace(/_/g, '-')
    };
    const mutation = await this.graphqlRequest(`
    mutation($data: ImageCreateInput!){
      createImage (data: $data) { ${fields} }
    }`, {
      data
    });

    expect(mutation.createImage).to.be.eql({
      id: data.name,
      name: data.name,
      displayName: data.name,
      description: null,
      url: null,
      global: false,
      groups: []
    });

    // get one
    const queryOne = await this.graphqlRequest(`
    query($where: ImageWhereUniqueInput!){
      image (where: $where) { ${fields} }
    }`, {
      where: {id: data.name}
    });

    expect(queryOne.image).to.be.eql({
      id: data.name,
      name: data.name,
      displayName: data.name,
      description: null,
      url: null,
      global: false,
      groups: []
    });
    this.currentImage = queryOne.image;
  });

  it('create a image with props and global = false', async () => {
    const data = {
      name: faker.internet.userName().toLowerCase().replace(/_/g, '-'),
      displayName: faker.internet.userName(),
      description: faker.lorem.sentence(),
      url: faker.internet.url(),
      global: false
    };
    const mutation = await this.graphqlRequest(`
    mutation($data: ImageCreateInput!){
      createImage (data: $data) { ${fields} }
    }`, {
      data
    });

    expect(mutation.createImage).to.be.eql({
      id: data.name,
      groups: [],
      ...data
    });

    // get one
    const queryOne = await this.graphqlRequest(`
    query($where: ImageWhereUniqueInput!){
      image (where: $where) { ${fields} }
    }`, {
      where: {id: data.name}
    });

    expect(queryOne.image).to.be.eql({
      id: data.name,
      groups: [],
      ...data
    });
  });

  it('create a image with props and global = true', async () => {
    const data = {
      name: faker.internet.userName().toLowerCase().replace(/_/g, '-'),
      displayName: faker.internet.userName(),
      description: faker.lorem.sentence(),
      url: faker.internet.url(),
      global: true
    };
    const mutation = await this.graphqlRequest(`
    mutation($data: ImageCreateInput!){
      createImage (data: $data) { ${fields} }
    }`, {
      data
    });

    expect(mutation.createImage).to.be.eql({
      id: data.name,
      groups: [],
      ...data
    });

    // get one
    const queryOne = await this.graphqlRequest(`
    query($where: ImageWhereUniqueInput!){
      image (where: $where) { ${fields} }
    }`, {
      where: {id: data.name}
    });

    expect(queryOne.image).to.be.eql({
      id: data.name,
      groups: [],
      ...data
    });
  });

  it('should query with where', async () => {
    const queryOne = await this.graphqlRequest(`
    query($where: ImageWhereUniqueInput!){
      image (where: $where) { ${fields} }
    }`, {
      where: {id: this.currentImage.id}
    });

    expect(queryOne.image).to.be.eql(this.currentImage);
  });

  it('should create with name-only and update', async () => {
    const createMutation = await this.graphqlRequest(`
    mutation($data: ImageCreateInput!){
      createImage (data: $data) { ${fields} }
    }`, {
      data: {
        name: faker.internet.userName().toLowerCase().replace(/_/g, '-')
      }
    });

    // update
    const image = createMutation.createImage;
    const data = {
      displayName: faker.internet.userName(),
      description: faker.lorem.sentence(),
      url: faker.internet.url()
    };
    const mutation = await this.graphqlRequest(`
    mutation($where: ImageWhereUniqueInput!, $data: ImageUpdateInput!){
      updateImage (where: $where, data: $data) { ${fields} }
    }`, {
      where: {id: image.id},
      data
    });

    expect(mutation.updateImage).to.deep.include(data);

    // query one
    const queryOne = await this.graphqlRequest(`
    query($where: ImageWhereUniqueInput!){
      image (where: $where) { ${fields} }
    }`, {
      where: {id: image.id}
    });

    expect(queryOne.image).to.deep.include(data);
  });

  it('should create with props and update', async () => {
    const createMutation = await this.graphqlRequest(`
    mutation($data: ImageCreateInput!){
      createImage (data: $data) { ${fields} }
    }`, {
      data: {
        name: faker.internet.userName().toLowerCase().replace(/_/g, '-'),
        displayName: faker.internet.userName(),
        description: faker.lorem.sentence(),
        url: faker.internet.url()
      }
    });

    // update
    const image = createMutation.createImage;
    const data = {
      displayName: faker.internet.userName(),
      description: faker.lorem.sentence(),
      url: faker.internet.url()
    };
    const mutation = await this.graphqlRequest(`
    mutation($where: ImageWhereUniqueInput!, $data: ImageUpdateInput!){
      updateImage (where: $where, data: $data) { ${fields} }
    }`, {
      where: {id: image.id},
      data
    });

    expect(mutation.updateImage).to.deep.include(data);

    // query one
    const queryOne = await this.graphqlRequest(`
    query($where: ImageWhereUniqueInput!){
      image (where: $where) { ${fields} }
    }`, {
      where: {id: image.id}
    });

    expect(queryOne.image).to.deep.include(data);
  });

  it('should create with name-only and update global twice', async () => {
    const createMutation = await this.graphqlRequest(`
    mutation($data: ImageCreateInput!){
      createImage (data: $data) { ${fields} }
    }`, {
      data: {
        name: faker.internet.userName().toLowerCase().replace(/_/g, '-')
      }
    });

    // update
    const image = createMutation.createImage;
    const mutation = await this.graphqlRequest(`
    mutation($where: ImageWhereUniqueInput!, $data: ImageUpdateInput!){
      updateImage (where: $where, data: $data) { ${fields} }
    }`, {
      where: {id: image.id},
      data: {global: true}
    });

    expect(mutation.updateImage.global).to.be.equals(true);

    // true again
    await this.graphqlRequest(`
    mutation($where: ImageWhereUniqueInput!, $data: ImageUpdateInput!){
      updateImage (where: $where, data: $data) { ${fields} }
    }`, {
      where: {id: image.id},
      data: {global: true}
    });

    // update again
    const backMutation = await this.graphqlRequest(`
    mutation($where: ImageWhereUniqueInput!, $data: ImageUpdateInput!){
      updateImage (where: $where, data: $data) { ${fields} }
    }`, {
      where: {id: image.id},
      data: {global: false}
    });

    expect(backMutation.updateImage.global).to.be.equals(false);

    // false again
    await this.graphqlRequest(`
    mutation($where: ImageWhereUniqueInput!, $data: ImageUpdateInput!){
      updateImage (where: $where, data: $data) { ${fields} }
    }`, {
      where: {id: image.id},
      data: {global: false}
    });

    // query one
    const queryOne = await this.graphqlRequest(`
    query($where: ImageWhereUniqueInput!){
      image (where: $where) { ${fields} }
    }`, {
      where: {id: image.id}
    });

    expect(queryOne.image.global).to.be.equals(false);
  });

  it('should delete image', async () => {
    const mutation = await this.graphqlRequest(`
    mutation($where: ImageWhereUniqueInput!){
      deleteImage (where: $where) { id }
    }`, {
      where: {id: this.currentImage.id}
    });

    // query
    const data = await this.graphqlRequest(`
    query ($where: ImageWhereUniqueInput!) {
      image (where: $where) { ${fields} }
    }`, {
      where: {id: this.currentImage.id}
    });

    expect(data.image).to.be.null;
  });
});
