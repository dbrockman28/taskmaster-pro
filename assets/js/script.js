var tasks = {};

var createTask = function(taskText, taskDate, taskList) {
  // create elements that make up a task item
  var taskLi = $("<li>").addClass("list-group-item");
  var taskSpan = $("<span>")
    .addClass("badge badge-primary badge-pill")
    .text(taskDate);
  var taskP = $("<p>")
    .addClass("m-1")
    .text(taskText);
  // append span and p element to parent li
  taskLi.append(taskSpan, taskP);
  // Check due date
  auditTask(taskLi);
  // append to ul list on the page
  $("#list-" + taskList).append(taskLi);
};

var loadTasks = function() {
  tasks = JSON.parse(localStorage.getItem("tasks"));

  // if nothing in localStorage, create a new object to track all task status arrays
  if (!tasks) {
    tasks = {
      toDo: [],
      inProgress: [],
      inReview: [],
      done: []
    };
  }

  // loop over object properties
  $.each(tasks, function(list, arr) {
    // then loop over sub-array
    arr.forEach(function(task) {
      createTask(task.text, task.date, list);
    });
  });
};

var saveTasks = function() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
};

$(".list-group").on("click", "p", function() {
  let text = $(this)
    .text()
    .trim();
  let textInput = $("<textarea>")
    .addClass("form-control")
    .val(text);
  $(this).replaceWith(textInput);
  textInput.trigger("focus");
});

$(".list-group").on("blur", "textarea", function() {
  let text = $(this)
    .val()
    .trim();
  let status = $(this)
    .closest(".list-group")
    .attr("id")
    .replace("list-", "");
  let index = $(this)
    .closest(".list-group-item")
    .index();
  tasks[status][index].text = text;
  saveTasks();
  let taskP = $("<p>")
    .addClass("m-1")
    .text(text);
  $(this).replaceWith(taskP);
});

$(".list-group").on("click", "span", function() {
  let date = $(this)
    .text()
    .trim();
  let dateInput = $("<input>")
    .attr("type", "text",)
    .addClass("form-control")
    .val(date);
  $(this).replaceWith(dateInput);
  // Enable jquery ui datepicker
  dateInput.datepicker({
    minDate: 1,
    onClose: function() {
      $(this).trigger("change");
    }
  });
  dateInput.trigger("focus");
});

$(".list-group").on("change", "input[type='text']", function() {
  let date = $(this)
    .val()
    .trim();
  let status = $(this)
    .closest(".list-group")
    .attr("id")
    .replace("list-", "");
  let index = $(this)
    .closest(".list-group-item")
    .index();
  tasks[status][index].date = date;
  saveTasks();
  let taskSpan = $("<span>")
    .addClass("badge badge-primary badge-pill")
    .text(date);
  $(this).replaceWith(taskSpan);
  auditTask($(taskSpan).closest(".list-group-item"));
});

$(".card .list-group").sortable({
  connectWith: $(".card .list-group"),
  scroll: false,
  tolerance: "pointer",
  helper: "clone",
  // Add and remove classes for dropover effects
  activate: function(event) {
    $(this).addClass("dropover");
    $(".bottom-trash").addClass("bottom-trash-drag");
  },
  deactivate: function(event) {
    $(this).removeClass("dropover");
    $(".bottom-trash").removeClass("bottom-trash-drag");
  },
  over: function(event) {
    $(event.target).addClass("dropover-active")
  },
  out: function(event) {
    $(event.target).removeClass("dropover-active")
  },

  update: function(event) {
    // Store task data in array
    let tempArr = [];
    // Loop over children
    $(this).children().each(function() {
      let text = $(this)
        .find("p")
        .text()
        .trim();

      let date = $(this)
        .find("span")
        .text()
        .trim();
        // Add task data to the tempArray
        tempArr.push({
          text: text,
          date: date
        });
    });
    // Trim down list's id to match object property
    let arrName = $(this)
      .attr("id")
      .replace("list-", "");
    // Update array on tasks object and save
    tasks[arrName] = tempArr;
    saveTasks();
  }
});

let auditTask = function(taskEl) {
  // Get date from task element
  let date = $(taskEl)
    .find("span")
    .text()
    .trim();
  // Convert to moment object at 5:00pm
  let time = moment(date, "L").set("hour", 17);
  // Remove old classes from element
  $(taskEl).removeClass("list-group-item-warning list-group-item-danger");
  // Apply new classes if task is near or overdue
  if (moment().isAfter(time)) {
    $(taskEl).addClass("list-group-item-danger");
  } else if (Math.abs(moment().diff(time, "days")) <= 2) {
    $(taskEl).addClass("list-group-item-warning");
  }
};

setInterval(function() {
  $(".card .list-group-item").each(function(index, el) {
    auditTask(el);
  });
}, (1000 * 60) * 30);

$("#trash").droppable({
  accept: ".card .list-group-item",
  tolerance: "touch",
  over: function(event) {
    $("bottom-trash").addClass("bottom-trash-drag");
  },
  out: function(event) {
    $("bottom-trash").removeClass("bottom-trash-drag");
  },
  drop: function(event, ui) {
    ui.draggable.remove();
    $("bottom-trash").removeClass("bottom-trash-drag");
  },
});

// modal was triggered
$("#task-form-modal").on("show.bs.modal", function() {
  // clear values
  $("#modalTaskDescription, #modalDueDate").val("");
});

$("#modalDueDate").datepicker({
  minDate: 1
});

// modal is fully visible
$("#task-form-modal").on("shown.bs.modal", function() {
  // highlight textarea
  $("#modalTaskDescription").trigger("focus");
});

// save button in modal was clicked
$("#task-form-modal .btn-save").click(function() {
  // get form values
  var taskText = $("#modalTaskDescription").val();
  var taskDate = $("#modalDueDate").val();

  if (taskText && taskDate) {
    createTask(taskText, taskDate, "toDo");

    // close modal
    $("#task-form-modal").modal("hide");

    // save in tasks array
    tasks.toDo.push({
      text: taskText,
      date: taskDate
    });

    saveTasks();
  }
});

// remove all tasks
$("#remove-tasks").on("click", function() {
  for (var key in tasks) {
    tasks[key].length = 0;
    $("#list-" + key).empty();
  }
  saveTasks();
});

// load tasks for the first time
loadTasks();


