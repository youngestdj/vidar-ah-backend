import { Comment } from '../models';

/**
 * @class CommentController
 *  @override
 * @export
 *
 */
export default class CommentController {
  /**
   * @description - Creates an article comment
   * @static
   *
   * @param {object} req - HTTP Request
   * @param {object} res - HTTP Response
   *
   * @memberof CommentController
   *
   * @returns {object} Article comment
   */
  static async createComment(req, res) {
    const { id } = req.user;
    const { id: articleId } = req.params;
    const { comment } = req.body;
    try {
      const newComment = await Comment.create({
        userId: id, articleId, comment
      });
      return res.status(205).json({
        success: true,
        message: 'New article comment created successfully',
        comment: newComment,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        errors: [error.message]
      });
    }
  }

  /**
 * @description - Edit an article comment
 * @static
 *
 * @param {object} req - HTTP Request
 * @param {object} res - HTTP Response
 *
 * @memberof CommentController
 *
 * @returns {object} Updated article comment
 */
  static async editComment(req, res) {
    const { id } = req.params;
    const { comment } = req.body;
    try {
      const updatedComment = await Comment.update({
        comment
      }, {
        returning: true,
        raw: true,
        where: {
          id
        }
      });
      const newComment = updatedComment[1][0];

      return res.status(205).json({
        success: true,
        message: 'Article updated successfully',
        body: newComment
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        errors: [error.message]
      });
    }
  }

  /**
* @description - Delete an article comment
* @static
*
* @param {object} req - HTTP Request
* @param {object} res - HTTP Response
*
* @memberof CommentController
*
* @returns {string} Comment delete status
*/
  static async deleteComment(req, res) {
    const { id } = req.params;
    try {
      const rowsDeleted = await Comment.destroy({
        where: {
          id
        }
      });
      if (rowsDeleted === 1) {
        return res.status(205).json({
          success: true,
          message: 'Article deleted successfully',
        });
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        errors: [error.message]
      });
    }
  }
}
