let groups = []
let groupTodos = []
let groupMembers = []

// Group List Page
function fetchGroup(access_token) {
  toast('Loading')
  $.ajax(`${baseUrl}/user/groups`, {
    method: 'GET',
    headers: {
      access_token
    }
  })
    .done(({ data }) => {
      groups = data
      enlistGroups()
      Swal.close()
    })
    .fail(({ responseJSON }) => {
      toast(responseJSON, 5000)
    })
}

function enlistGroups() {
  $('#group-list').empty()
  for (const group of groups) {
    $('#group-list').append(`
      <tr onclick="toGroupPage('${group._id}', '${group.name}')">
        <td>${group.name}</td>
        <td>${group.leader.username}</td>
        <td>${group.members.length}</td>
      </tr>
    `)
  }
}

function onCreateGroup(e) {
  if (e) e.preventDefault()
  $('#btn-group-create').empty().append(`
    <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
    Creating...
  `)
  const groupName = $('#group-list-page #group-name')
  if (!groupName.val()) {
    groupName
      .addClass('is-invalid')
      .focusin(() => groupName.removeClass('is-invalid'))
    $('#btn-group-create')
      .empty()
      .append('Create New Group')
    return false
  }
  const access_token = localStorage.getItem('access_token')
  $.ajax(`${baseUrl}/groups`, {
    method: 'POST',
    headers: { access_token },
    data: {
      name: groupName.val()
    }
  })
    .done(({ data }) => {
      toast('New group created', 3000)
      $('#btn-group-create')
        .empty()
        .append('Create New Group')
      groups.push(data)
      enlistGroups()
    })
    .fail(({ responseJSON }) => {
      toast(responseJSON, 5000)
      $('#btn-group-create')
        .empty()
        .append('Create New Group')
    })
    .always(() => {
      groupName.val('')
    })
  return false
}

// Group Page
function fetchGroupDetails(access_token) {
  toast('Loading')
  const groupId = localStorage.getItem('group_id')
  $.ajax(`${baseUrl}/groups/${groupId}/todos`, {
    method: 'GET',
    headers: {
      access_token
    }
  })
    .done(({ data }) => {
      groupTodos = data
      arrangeGroupCards()
      Swal.close()
    })
    .fail(({ responseJSON }) => {
      toast(responseJSON, 5000)
    })

  $.ajax(`${baseUrl}/groups/${groupId}`, {
    method: 'GET',
    headers: {
      access_token
    }
  })
    .done(({ data }) => {
      groupMembers = data.members || []
      enlistGroupMembers()
      Swal.close()
    })
    .fail(({ responseJSON }) => {
      toast(responseJSON, 5000)
    })
}

function arrangeGroupCards() {
  $('#group-todo-cards').empty()
  for (const todo of groupTodos) {
    $('#group-todo-cards').append(`
        <div class="col-12 col-md-6 col-lg-4 col-xl-3" id="${todo._id}">
          <div
            class="card mb-4"
            style="min-width: 15rem; min-height: 18rem;"
          >
            <div class="card-body d-flex flex-column position-relative">
              <div class="card-title">
                <h5 class="mb-0">${todo.name}</h5>
                <small class="d-block todo-status ${
                  todo.status == 'missed'
                    ? 'text-danger'
                    : todo.status == 'done'
                    ? 'text-success'
                    : 'text-muted'
                }">Status: ${todo.status}</small>
                <small class ="mt-0 text-muted">Due: ${moment(
                  todo.dueDate
                ).format('ddd, MMM Do YYYY')}</small>
                <div
                  class="position-absolute"
                  style="font-size: large; top: 1rem; right: 1rem;"
                  id="edit-todo-${todo._id}"
                >
                  <a href=""><i class="fas fa-edit text-muted"></i></a>
                </div>
              </div>
              <p class="card-text">
                ${todo.description || 'No description'}
              </p>
              <div class="mt-auto">
                <p class="card-text">
                  <small class="todo-last-update text-muted">${moment(
                    todo.updatedAt
                  ).fromNow()}</small>
                </p>
              </div>
            </div>
            <div class="card-footer">
              <button class="btn btn-danger" id="delete-todo-${todo._id}">
                <i class="fas fa-trash-alt"></i>
              </button>
              <button class="btn btn-success" id="toggle-mark-${todo._id}">
                ${
                  todo.status == 'pending'
                    ? 'Mark Done'
                    : todo.status == 'done'
                    ? 'Mark Undone'
                    : ''
                }
              </button>
            </div>
          </div>
        </div>
      `)

    $(`#edit-todo-${todo._id}`).click(function(e) {
      e.preventDefault()
      onGroupOpenEditModal(todo)
      return false
    })

    $(`#delete-todo-${todo._id}`).click(todo, onGroupDeleteTodo)

    if (todo.status == 'missed') {
      $(`#toggle-mark-${todo._id}`).remove()
    } else {
      $(`#toggle-mark-${todo._id}`).click(todo, onGroupToggleMark)
    }
  }
}

function enlistGroupMembers() {
  $('#group-member-list').empty()
  for (const member of groupMembers) {
    $('#group-member-list').append(`
      <tr>
        <td>${member.username}</td>
        <td>${member.email}</td>
        <td><button class="btn btn-danger">Kick</button></td>
      </tr>
    `)
  }
}

function toTodoCardsSection(e) {
  if (e) e.preventDefault()
  $('#group-page #member-list-section').hide()
  $('#group-page #todo-cards-section').show()
  $('#group-page .nav-link').removeClass('active')
  $('#group-page #group-nav-todos').addClass('active')
}

function toMemberListSection(e) {
  if (e) e.preventDefault()
  $('#group-page #todo-cards-section').hide()
  $('#group-page #member-list-section').show()
  $('#group-page .nav-link').removeClass('active')
  $('#group-page #group-nav-members').addClass('active')
}

function onGroupOpenCreateModal(e) {
  if (e) e.preventDefault()
  $('#todo-modal form').off('submit')
  $('#todo-modal form').on('submit', onCreateGroupTodo)
  $('#todo-modal').on('hidden.bs.modal', function(e) {
    $('#todo-modal #todo-name').val('')
    $('#todo-modal #todo-desc').val('')
    $('#todo-modal #todo-due').val('')
    $('#btn-todo-submit')
      .empty()
      .append('Create')
  })
  $('#todo-modal #todo-name').val('')
  $('#todo-modal #todo-desc').val('')
  $('#todo-modal #todo-due').val('')
  $('#btn-todo-submit')
    .empty()
    .append('Create')
    .off('click')
    .click(onCreateGroupTodo)
  onOpenTodoModal()
}

function onCreateGroupTodo(e) {
  if (e) e.preventDefault()
  $('#btn-todo-submit').empty().append(`
    <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
    Creating...
  `)
  validateTodoName()
  if ($('#todo-modal .is-invalid').length > 0) {
    $('#btn-todo-submit')
      .empty()
      .append('Create')
    return false
  }
  const name = $('#todo-modal #todo-name')
  const description = $('#todo-modal #todo-desc')
  const dueDate = $('#todo-modal #todo-due')
  const access_token = localStorage.getItem('access_token')
  const groupId = localStorage.getItem('group_id')
  $.ajax(`${baseUrl}/groups/${groupId}/todos`, {
    method: 'POST',
    headers: {
      access_token
    },
    data: {
      name: name.val(),
      description: description.val() || undefined,
      dueDate: dueDate.val() || undefined
    }
  })
    .done(({ data }) => {
      groupTodos.push(data)
      arrangeGroupCards()
      $('#todo-modal').modal('hide')
      toast('New todo created', 3000)
    })
    .fail(({ responseJSON }) => {
      toast(responseJSON.join(', '), 5000)
    })
    .always(() => {
      $('#btn-todo-submit')
        .empty()
        .append('Create')
    })
  return false
}

function onGroupOpenEditModal(todo) {
  $('#todo-modal form').off('submit')
  $('#todo-modal form').on('submit', todo, onEditGroupTodo)
  $('#todo-modal').on('hidden.bs.modal', function(e) {
    $('#todo-modal #todo-name').val('')
    $('#todo-modal #todo-desc').val('')
    $('#todo-modal #todo-due').val('')
    $('#btn-todo-submit')
      .empty()
      .append('Create')
  })
  $('#todo-modal #todo-name').val(todo.name)
  $('#todo-modal #todo-desc').val(todo.description)
  $('#todo-modal #todo-due').val(moment(todo.dueDate).format('YYYY-MM-DD'))
  $('#btn-todo-submit')
    .empty()
    .append('Edit')
    .off('click')
    .click(todo, onEditGroupTodo)
  onOpenTodoModal()
}

function onEditGroupTodo(e) {
  if (e) e.preventDefault()
  $('#btn-todo-submit').empty().append(`
    <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
    Updating...
  `)
  validateTodoName()
  if ($('#todo-modal .is-invalid').length > 0) {
    $('#btn-todo-submit')
      .empty()
      .append('Edit')
    return false
  }
  const name = $('#todo-modal #todo-name')
  const description = $('#todo-modal #todo-desc')
  const dueDate = $('#todo-modal #todo-due')
  const access_token = localStorage.getItem('access_token')
  $.ajax(`${baseUrl}/todos/${e.data._id}`, {
    method: 'PUT',
    headers: {
      access_token
    },
    data: {
      name: name.val(),
      description: description.val() || undefined,
      dueDate: dueDate.val() || undefined
    }
  })
    .done(({ data }) => {
      groupTodos = groupTodos.map(todo => {
        return todo._id == data._id ? data : todo
      })
      arrangeGroupCards()
      $('#todo-modal').modal('hide')
      toast('Todo updated!', 3000)
    })
    .fail(({ responseJSON }) => {
      toast(responseJSON, 5000)
    })
    .always(() => {
      $('#btn-todo-submit')
        .empty()
        .append('Edit')
    })
  return false
}

function onGroupDeleteTodo(e) {
  const todo = e.data
  Swal.fire({
    title: 'Are you sure?',
    showCancelButton: true,
    confirmButtonColor: '#dc3545',
    cancelButtonColor: '#007bff',
    reverseButtons: true,
    confirmButtonText: 'Delete',
    focusConfirm: false,
    focusCancel: true
  }).then(result => {
    if (result.value) {
      toast('Loading')
      $.ajax(`${baseUrl}/todos/${todo._id}`, {
        method: 'DELETE',
        headers: {
          access_token: localStorage.getItem('access_token')
        }
      })
        .done(() => {
          groupTodos.splice(
            groupTodos.findIndex(item => {
              return item._id == todo._id
            }),
            1
          )
          $(`#${todo._id}`).remove()
          toast('Todo deleted!', 5000)
        })
        .fail(({ responseJSON }) => {
          toast(responseJSON, 5000)
        })
    }
  })
}

function onGroupToggleMark(e) {
  const todo = e.data
  toast('Loading')
  $.ajax(`${baseUrl}/todos/${todo._id}/status`, {
    method: 'PATCH',
    headers: {
      access_token: localStorage.getItem('access_token')
    }
  })
    .done(({ data }) => {
      $(`#${data._id} .todo-status`)
        .removeClass()
        .addClass(
          `d-block todo-status ${
            data.status == 'missed'
              ? 'text-danger'
              : data.status == 'done'
              ? 'text-success'
              : 'text-muted'
          }`
        )
        .text(`Status: ${data.status}`)

      $(`#toggle-mark-${data._id}`).text(
        `${
          data.status == 'pending'
            ? 'Mark Done'
            : data.status == 'done'
            ? 'Mark Undone'
            : ''
        }`
      )
      $(`#${data._id} .todo-last-update`).text(moment(data.updatedAt).fromNow())
      toast(`Todo marked as ${data.status}`, 3000)
    })
    .fail(({ responseJSON }) => {
      toast(responseJSON, 5000)
    })
}