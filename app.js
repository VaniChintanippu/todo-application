const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const priorityArray = ['HIGH', 'MEDIUM', 'LOW'];
const statusArray = ['TO DO', 'IN PROGRESS', 'DONE'];
const categoryArray = ['WORK', 'HOME', 'LEARNING'];

const databasePath = path.join(__dirname, "todoApplication.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasCategoryAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};
const hasCategoryProperties = (requestQuery) => {
  return requestQuery.category !== undefined;
};
const hasPriorityAndCategoryProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status } = request.query;
  if (hasPriorityAndStatusProperties(request.query)) {
      if (priorityArray.includes(`${priority}`) && statusArray.includes(`${status}`)) {
         getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}'
        AND priority = '${priority}';`;
        data = await database.all(getTodosQuery);
        response.send(data);
      } else {
          response.status(400);
          if !(priorityArray.includes(`${priority}`)) {
              response.send('Invalid Todo Priority');
          } else {
              response.send('Invalid Todo Status');
          }
      }
  } else if (hasPriorityProperty(request.query)) {
      if (priorityArray.includes(`${priority}`)) {
         getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND priority = '${priority}';`;
        data = await database.all(getTodosQuery);
        response.send(data);
      } else {
           response.status(400);
           response.send('Invalid Todo Priority');
      }
  } else if (hasStatusProperty(request.query)) {
       if (statusArray.includes(`${status}`)) {
          getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}';`;
        data = await database.all(getTodosQuery);
        response.send(data);
       } else {
           response.status(400);
           response.send('Invalid Todo Status');
      }
  } else if (hasPriorityAndCategoryProperties(request.query)) {
      if (priorityArray.includes(`${priority}`) && categoryArray.includes(`${category}`)) {
          getTodosQuery = `SELECT * FROM todo WHERE todo LIKE '${search_q}'
            AND category = '${category}'
            AND priority = '${priority}';`;
            data = await database.all(getTodosQuery);
        response.send(data);
      } else {
          response.status(400);
          if !(priorityArray.includes(`${priority}`)) {
              response.send('Invalid Todo Priority');
          } else {
              response.send('Invalid Todo Category');
          }
      }
  } else if (hasCategoryProperties(request.query)) {
      if (categoryArray.includes(`${category}`)) {
          getTodosQuery = `SELECT * FROM todo WHERE todo LIKE '${search_q}'
            AND category = '${category}';`;
            data = await database.all(getTodosQuery);
        response.send(data);
      } else {
           response.status(400);
           response.send('Invalid Todo Category');
      }
  } else if (hasCategoryAndStatusProperties(request.query)) {
      if (statusArray.includes(`${status}`) && categoryArray.includes(`${category}`)) {
          getTodosQuery = `SELECT * FROM todo WHERE todo LIKE '${search_q}'
            AND category = '${category}'
            AND status = '${status}';`;
             data = await database.all(getTodosQuery);
        response.send(data);
      } else {
          response.status(400);
          if !(statusArray.includes(`${status}`)) {
              response.send('Invalid Todo Status');
          } else {
              response.send('Invalid Todo Category');
          }
      }
  } else {
        getTodosQuery = `SELECT * FROM todo WHERE todo LIKE '${search_q}'
            ;`;
        data = await database.all(getTodosQuery);
        response.send(data);
  }
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const getTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE
      id = ${todoId};`;
  const todo = await database.get(getTodoQuery);
  response.send(todo);
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category } = request.body;
  if (statusArray.includes(`${status}`) && categoryArray.includes(`${category}`) &&
  priorityArray.includes(`${priority}`)) {
      const postTodoQuery = `
      INSERT INTO
        todo (id, todo, priority, status, category)
       VALUES
       (${id}, '${todo}', '${priority}', '${status}', '${category});`;
       await database.run(postTodoQuery);
       response.send("Todo Successfully Added");
  } else {
      response.status(400);
        if !(statusArray.includes(`${status}`)) {
            response.send('Invalid Todo Status');
        } else if !(priorityArray.includes(`${priority}`)) {
            response.send('Invalid Todo Priotity');
        } else {
            response.send('Invalid Todo Category');
        }
  }
  
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
    case requestBody.category !== undefined:
        updateColumn = "Category"  
  }
  const previousTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE 
      id = ${todoId};`;
  const previousTodo = await database.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body;

  const updateTodoQuery = `
    UPDATE
      todo
    SET
      todo='${todo}',
      priority='${priority}',
      status='${status}'
    WHERE
      id = ${todoId};`;

  await database.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
  DELETE FROM
    todo
  WHERE
    id = ${todoId};`;

  await database.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
