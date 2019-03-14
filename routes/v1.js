import express from 'express';
import UserController from '../controllers/user';
import passport from '../auth/passport';
import ProfileController from '../controllers/profile';
import isUserVerified from '../middleware/verifyUser';
import Auth from '../middleware/auth';
import addImages from '../middleware/addImage';
import generateSlug from '../middleware/generateSlug';
import ArticleController from '../controllers/articles';

import {
  validateSignup,
  validateLogin,
  validateProfileChange,
  validateEmail,
  validatePassword,
  validateArticle,
  returnValidationErrors,
  validateCreateComment,
  validateEditComment,
  validateCommentUser,
  validateArticleExist,
} from '../middleware/validation';
import CommentController from '../controllers/comment';


const { createArticle } = ArticleController;

const apiRoutes = express.Router();

apiRoutes.route('/user')
  .post(validateSignup, returnValidationErrors, UserController.registerUser);

apiRoutes.route('/userprofile')
  .get(Auth.verifyUser, isUserVerified, ProfileController.viewProfile)
  .patch(Auth.verifyUser, isUserVerified, validateProfileChange,
    returnValidationErrors, ProfileController.editProfile);

apiRoutes.route('/verify/:verificationId')
  .get(UserController.verifyAccount);

apiRoutes.route('/articles')
  .post(Auth.verifyUser, isUserVerified,
    addImages,
    validateArticle,
    returnValidationErrors,
    generateSlug,
    createArticle);

apiRoutes.get('/auth/google',
  passport.authenticate(
    'google', {
      scope: ['email', 'profile']
    }
  ));

apiRoutes.get('/auth/google/callback',
  passport.authenticate(
    'google', { failureRedirect: '/login' }
  ),
  (req, res) => {
    res.redirect('/');
  });

apiRoutes.get('/auth/facebook',
  passport.authenticate(
    'facebook', {
      scope: ['email']
    }
  ));

apiRoutes.get('/auth/facebook/callback',
  passport.authenticate(
    'facebook', { failureRedirect: '/login' }
  ),
  (req, res) => {
    res.redirect('/');
  });

apiRoutes.post(
  '/user/login',
  validateLogin,
  returnValidationErrors,
  isUserVerified,
  UserController.loginUser
);

apiRoutes.post(
  '/requestpasswordreset',
  validateEmail,
  returnValidationErrors,
  isUserVerified,
  UserController.requestPasswordReset,
);

apiRoutes.post(
  '/resetpassword/:passwordResetToken',
  validatePassword,
  returnValidationErrors,
  UserController.resetPassword
);
apiRoutes.route('/comment/:id')
  .post(Auth.verifyUser,
    isUserVerified,
    validateArticleExist,
    validateCreateComment,
    returnValidationErrors,
    CommentController.createComment)
  .patch(Auth.verifyUser,
    isUserVerified,
    validateCommentUser,
    validateEditComment,
    returnValidationErrors,
    CommentController.editComment)
  .delete(Auth.verifyUser,
    isUserVerified,
    validateCommentUser,
    returnValidationErrors,
    CommentController.deleteComment);


export default apiRoutes;
