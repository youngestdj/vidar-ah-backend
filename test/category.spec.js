import chai from 'chai';
import chaiHttp from 'chai-http';
import updateVerifiedStatus from './helpers/updateVerifiedStatus';
import assignRole from './helpers/assignRole';
import app from '../index';
import {
  user,
  validCategory,
  validCategoryBySuperAdmin,
  invalidCategoryTooShort,
  invalidCategoryDuplicate,
  validCategoryEdit
} from './helpers/categoryDummyData';

import { User, Category } from '../models';

const categoryToBeDeleted = {
  category: 'To be Deleted'
};


chai.use(chaiHttp);
const { expect } = chai;
let userToken;
let categoryId;

describe('Testing the category feature', () => {
  before(async () => {
    const res = await chai
      .request(app)
      .post('/api/v1/user/signup')
      .send(user);
    userToken = res.body.token;
  });

  after(async () => {
    await User.truncate({ cascade: false });
    await Category.truncate({ cascade: false });
  });

  describe('Creating a category', () => {
    describe('Make a request without a token', () => {
      it('It should return a 401 unauthorized error', async () => {
        const response = await chai
          .request(app)
          .post('/api/v1/category')
          .send(validCategory);
        const { status, body: { success, errors } } = response;
        expect(status).to.be.eqls(401);
        expect(success).to.be.eqls(false);
        expect(errors[0]).to.be.eqls('Unauthorized! You are required to be logged in to perform this operation.');
      });
    });

    describe('Make a request without verifying your account', () => {
      it('should return an error status 403', async () => {
        const response = await chai
          .request(app)
          .post('/api/v1/category')
          .set('authorization', userToken)
          .send(validCategory);
        expect(response.status).to.be.equal(403);
        expect(response.body.success).to.be.equal(false);
        expect(response.body.errors[0]).to.be.equal('User has not been verified.');
      });
    });

    describe('Make a request as regular user without admin authorization', () => {
      before(async () => {
        await updateVerifiedStatus(user.email);
        await assignRole(user.email, 'user');
      });
      it('It should return a 401 unauthorized error', async () => {
        const res = await chai
          .request(app)
          .post('/api/v1/category')
          .set('authorization', userToken)
          .send(validCategory);
        const { status, body: { success, errors } } = res;
        expect(status).to.be.equal(401);
        expect(success).to.be.equal(false);
        expect(errors[0]).to.be.equal('Unauthorized! This operation is reserved for Admin or higher.');
      });
    });

    describe('Make a request to create category as a super admin', () => {
      before(async () => {
        await updateVerifiedStatus(user.email);
        await assignRole(user.email, 'superadmin');
      });
      it('should return a success message with status 201', async () => {
        const response = await chai
          .request(app)
          .post('/api/v1/category')
          .set('x-access-token', userToken)
          .send(validCategoryBySuperAdmin);
        const {
          status, body: {
            success, message, id, categoryName
          }
        } = response;
        categoryId = id;
        expect(status).to.be.equal(201);
        expect(success).to.be.equal(true);
        expect(message).to.be.equal('Category successfully added.');
        expect(categoryName).to.be.equal(validCategoryBySuperAdmin.category.toLowerCase());
      });
    });
    describe('Make a request with admin credentials', () => {
      before(async () => {
        await updateVerifiedStatus(user.email);
        await assignRole(user.email, 'admin');
      });
      it('should return a success message with status 201', async () => {
        const response = await chai
          .request(app)
          .post('/api/v1/category')
          .set('x-access-token', userToken)
          .send(validCategory);
        const {
          status, body: {
            success, message, id, categoryName
          }
        } = response;
        categoryId = id;
        expect(status).to.be.equal(201);
        expect(success).to.be.equal(true);
        expect(message).to.be.equal('Category successfully added.');
        expect(categoryName).to.be.equal(validCategory.category.toLowerCase());
      });
    });

    describe('Make a request with duplicate category', () => {
      it('should return a 409 error message', async () => {
        const res = await chai
          .request(app)
          .post('/api/v1/category')
          .set('authorization', userToken)
          .send(invalidCategoryDuplicate);
        const {
          status,
          body: { success, errors }
        } = res;
        expect(status).to.be.equal(409);
        expect(success).to.be.equal(false);
        expect(errors[0]).to.be.equal('The specified category already exists');
      });
    });

    describe('Make a request with category name less than 3 letters', () => {
      it('should return a 422 error message', async () => {
        const res = await chai
          .request(app)
          .post('/api/v1/category')
          .set('authorization', userToken)
          .send(invalidCategoryTooShort);
        const {
          status,
          body: { success, errors }
        } = res;
        expect(status).to.be.equal(422);
        expect(success).to.be.equal(false);
        expect(errors[0]).to.be.equal('Category must be at least 3 characters long and no more than 30.');
      });
    });

    describe('Make a request with category not specified', () => {
      it('should return a 422 error message', async () => {
        const res = await chai
          .request(app)
          .post('/api/v1/category')
          .set('authorization', userToken);
        const {
          status,
          body: { success, errors }
        } = res;
        expect(status).to.be.equal(422);
        expect(success).to.be.equal(false);
        expect(errors[0]).to.be.equal('No category provided. Please provide a category.');
      });
    });

    describe('Make a request with invalid/expired token', () => {
      let badToken;
      before(async () => {
        badToken = await userToken.concat('a');
      });
      it('should return a 401 error message', async () => {
        const res = await chai
          .request(app)
          .post('/api/v1/category')
          .set('authorization', badToken)
          .send(validCategory);
        const {
          status,
          body: { success, errors }
        } = res;
        expect(status).to.be.equal(401);
        expect(success).to.be.equal(false);
        expect(errors[0]).to.be.equal('Your session has expired, please login again to continue');
      });
    });
  });

  describe('Edit category', () => {
    describe('Make a request with valid admin credentials', () => {
      before(async () => {
        await updateVerifiedStatus(user.email);
        await assignRole(user.email, 'admin');
      });
      it('it should return a 200 success message', async () => {
        const res = await chai
          .request(app)
          .patch('/api/v1/category/'.concat(categoryId))
          .set('authorization', userToken)
          .send(validCategoryEdit);
        const {
          status,
          body: { success, message }
        } = res;
        expect(status).to.be.equal(200);
        expect(success).to.be.equal(true);
        expect(message).to.be.equal('Category successfully updated');
      });
    });

    describe('Make a request with invalid id', () => {
      it('it should return a 400 error', async () => {
        const res = await chai
          .request(app)
          .patch('/api/v1/category/y'.concat(categoryId))
          .set('authorization', userToken)
          .send(validCategory);
        const {
          status,
          body: { success, errors }
        } = res;
        expect(status).to.be.equal(400);
        expect(success).to.be.equal(false);
        expect(errors[0]).to.be.equal('Invalid category id.');
      });
    });

    describe('Make a request with non existing id', () => {
      it('it should return a 404 error', async () => {
        const res = await chai
          .request(app)
          .patch('/api/v1/category/100000')
          .set('authorization', userToken)
          .send(validCategory);
        const {
          status,
          body: { success, errors }
        } = res;
        expect(status).to.be.equal(404);
        expect(success).to.be.equal(false);
        expect(errors[0]).to.be.equal('No category matches the specified id. Please confirm the category Id and try again.');
      });
    });
  });

  describe('Delete category', () => {
    let theID = 0;
    before(async () => {
      await updateVerifiedStatus(user.email);
      await assignRole(user.email, 'admin');
      const res = await chai
        .request(app)
        .post('/api/v1/category')
        .set('authorization', userToken)
        .send(categoryToBeDeleted);
      theID = res.body.id;
    });
    describe('Make a request with valid admin credentials', () => {
      it('it should return a 200 success message', async () => {
        const res = await chai
          .request(app)
          .delete('/api/v1/category/'.concat(theID))
          .set('authorization', userToken);
        const {
          status,
          body: { success, message }
        } = res;
        expect(status).to.be.equal(200);
        expect(success).to.be.equal(true);
        expect(message).to.be.equal('Category deleted.');
      });
    });
  });
});
