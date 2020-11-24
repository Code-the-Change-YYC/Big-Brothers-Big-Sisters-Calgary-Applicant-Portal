const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const bodyParser = require("body-parser");
const port = 3080;
const userRepository = require('./repositories/userRepository');
const taskFactory = require('./tasks/taskFactory');
const userValidator = require('./validations/userValidator');

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../my-app/build')));
app.use(cors());

app.listen(port, () => {
  console.log(`Server listening on the port::${port}`);
});

//below are the API methods, matched with apiServices in the Front End
//NOTE: requires firebase integration, uses "users" variable for testing

// Get all users for searching. Client will filter the array that is returned
// sends list of users up to the client
app.get('/api/users', async (req, res) => {
  console.log("get all users")
  let users = await userRepository.getAllUsers();
  res.json(users);
});

// Gets a user by id - id is "path parameter"
// sends a single user up to the client
app.get("/api/users/:id", async (req,res) => {
  let id = req.params.id;
  console.log("Get user by ID: /users/:" + id);
  let found = await userRepository.getUserById(id);
  console.log(found);
  res.json(found);
});

// Create a user by id
// receives a json from the client
app.post("/api/users", async (req, res) => {
  let toCreate = req.body;

  try {
    userValidator.validateUser(toCreate);

    toCreate.tasks =  taskFactory.getDefaultTasks();
    // password: newUser.password, // TODO: Salt and hash the password or make this work with firebase authentication
    toCreate.notifications = [
      {
        message: "Congratulations on making your account!",
        date: new Date().toLocaleDateString("en-CA", { timeZone: "America/Edmonton" })
      }
    ];
    toCreate.isAdmin = false;
    toCreate.isCommunityMentor = false;
    toCreate.requiresHomeAssessment =  false;
      
    await userRepository.createUser(toCreate); 
    res.json(toCreate.id)
  }
  catch(error) {
    console.log('error' + error);
    res.status(400);
    res.json(error);
  }
});

// Delete user by id
// receives a user ID to delete from client
app.delete("/api/users/:id", async (req,res) => {
  let id = req.params.id;
  console.log("Delete User by ID: /users/:" + id);
  try {
    userValidator.validateDelete(id);
    await userRepository.deleteUser(id);
    res.json(id + " was deleted");
  }
  catch(error) {
    console.log('error' + error);
    res.status(400);
    res.json(error);
  }
});

// Update user - this can be called by the admin OR user
// receives a json from the client
app.put("/api/users", async (req,res) => {
  let toUpdate = req.body;
  try {
    userValidator.validateUser(toUpdate);

    console.log("Updating user");
    console.log(toUpdate);
    await userRepository.updateUser(toUpdate);
    res.json(toUpdate);
  }
  catch(error) {
    console.log('error' + error);
    res.status(400);
    res.json(error);
  }
}); 