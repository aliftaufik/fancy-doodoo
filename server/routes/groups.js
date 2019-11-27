const groups = require('express').Router()
const { GroupController, TodoController } = require('../controllers')
const { authorizeGroup } = require('../middlewares/auth')

groups.post('/', GroupController.createGroup)

groups.use('/:id', authorizeGroup)
groups.get('/:id', GroupController.getOneGroup)
groups.post('/:id/todos', TodoController.createTodo)
groups.get('/:id/todos', TodoController.getAllGroupTodos)


groups.patch('/:id', GroupController.editGroupName)
groups.delete('/:id', GroupController.deleteGroup)
groups.patch('/:id/members', GroupController.inviteMember)
groups.delete('/:id/members/:member_id', GroupController.kickMember)
module.exports = groups
