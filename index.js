const mongoose = require("mongoose"),
  Models = require("./models.js"),
  express = require("express"),
  morgan = require("morgan"),
  path = require("path"),
  bodyParser = require("body-parser");

(app = express()), ({ check, validationResult } = require("express-validator"));

const cors = require("cors");

app.options("*", cors());

let allowedOrigins = [
  "http://localhost:8080",
  "https://cinemapp-backend.herokuapp.com/",
  "http://localhost:1234",
  "http://localhost:4200",
  "https://mihocsaszilard-cinemapp.netlify.app",
  "https://mihocsaszilard.github.io/cinemApp-Angular-client/",
  "https://mihocsaszilard.github.io/cinemApp-Angular-client",
  "https://mihocsaszilard.github.io",
  "https://mihocsaszilard.github.io/",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        //If a specific origin isn’t found on the list
        let message =
          "The CORS policy for this application doesn`t allow accsess from origin " +
          origin;
        return callback(new Error(message), false);
      }
      return callback(null, true);
    },
  })
);

const Movies = Models.Movie;
const Users = Models.User;
const Genres = Models.Genre;
const Directors = Models.Director;
const Actors = Models.Actor;

app.use(morgan("common"));
app.use(express.static("public"));
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

const passport = require("passport");
require("./passport");

// mongoose.connect('mongodb://localhost:27017/cinemAppDB', {
//   useNewUrlParser: true,
//   useUnifiedTopology: true
// });

mongoose.connect(process.env.CONNECTION_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const auth = require("./auth")(app);

/**
 * Get the welcome page
 * @method GET
 * @param {string} endpoint - endpoint to load the welcome page. "url/"
 * @returns {object} - returns the welcome page
 */
app.get("/", (req, res) => {
  const responseText =
    '<body style="background-color: black"><div style= "height: 90vh; width: 94vw; background: black; background: url(/img/CinemApp5.png) center center no-repeat; padding: 2%;"><h1 style= "color: white; font-weight: 100; font-family: sans-serif; text-align: center; padding-top: 15%;"> Welcome to cinemApp backend!</h1><h2 style= "color: white; font-weight: 100; font-family: sans-serif; text-align: center; padding-top: 20%;"> Please visit the client side made with <br><a href="https://mihocsaszilard-cinemapp.netlify.app/">React </a>or <a href="https://mihocsaszilard.github.io/cinemApp-Angular-client/">Angular</a><br><p style="font-size: 16px; color: silver">It may take a few seconds to load the page because Heroku puts the app to sleep after 30 minutes of inactivity. <br>This is what makes your app is slow to load. When the app\'s dyno is asleep, waking it up may take some time. But after the first load, it starts loading pretty fast because the dyno is active. </p></h2></div></body>';
  res.send(responseText);
});

//------------------movie requests---------------
/**
 * Get all movies
 * @method GET
 * @param {string} endpoint - endpoint to fetch movies. "url/movies"
 * @returns {object} - returns the movie object
 */
app.get(
  "/movies",
  passport.authenticate("jwt", {
    session: false,
  }),
  (req, res) => {
    Movies.find()
      .populate("Genre Director Actors", "Name")
      .then((movies) => {
        res.status(200).json(movies);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).sned("Error: " + err);
      });
  }
);

/**
 * Get movies by title
 * @method GET
 * @param {string} endpoint - endpoint - fetch movies by title
 * @param {string} Title - is used to get specific movie "url/movies/:Title"
 * @returns {object} - returns the movie with specific title
 */
app.get(
  "/movies/:Title",
  passport.authenticate("jwt", {
    session: false,
  }),
  (req, res) => {
    Movies.findOne({
      Title: req.params.Title,
    })
      .then((movie) => {
        res.json(movie);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

/**
 * Add movie to favorites
 * @method POST
 * @param {string} endpoint - endpoint to add movies to favorites
 * @param {string} Title, Username - both are required
 * @returns {string} - returns success/error message
 */
app.post(
  "/users/:Username/movies/:MovieID",
  passport.authenticate("jwt", {
    session: false,
  }),
  (req, res) => {
    Users.findOneAndUpdate(
      {
        Username: req.params.Username,
      },
      {
        $push: {
          FavoriteMovies: req.params.MovieID,
        },
      },
      {
        new: true,
      }, //this line makes sure that updated document is returned
      (err, updatedUser) => {
        if (err) {
          console.error(err);
          res.status(500).send("Error: " + err);
        } else {
          res.json(updatedUser);
        }
      }
    );
  }
);

/**
 * Delete movie from favorites
 * @method DELETE
 * @param {string} endpoint - endpoint to remove movies from favorites
 * @param {string} Title Username - both are required
 * @returns {string} - returns success/error message
 */
app.delete(
  "/users/:Username/removeFromFav/:MovieID",
  passport.authenticate("jwt", {
    session: false,
  }),
  (req, res) => {
    Users.findOneAndUpdate(
      {
        Username: req.params.Username,
      },
      {
        $pull: {
          FavoriteMovies: req.params.MovieID,
        },
      },
      {
        new: true, //This line makes sure that the updated Document is returned
      },
      (err, updatedUser) => {
        if (err) {
          console.error(err);
          res.status(500).send("Error: " + err);
        } else {
          res.json(updatedUser);
        }
      }
    );
  }
);

//----------------genre requests--------------------
/**
 * Get all genres
 * @method GET
 * @param {string} endpoint - endpoint to fetch genres. "url/genres"
 * @returns {object} - returns the genre object
 */
app.get(
  "/genres",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    Genres.find()
      .then((genre) => {
        res.status(200).json(genre);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).sned("Error: " + err);
      });
  }
);

/**
 * Get genre by name
 * @method GET
 * @param {string} endpoint - endpoint - fetch genre by name
 * @param {string} Name - is used to get specific genre "url/genres/:Name"
 * @returns {object} - returns a specific genre
 */
app.get(
  "/genres/:Name",
  passport.authenticate("jwt", {
    session: false,
  }),
  (req, res) => {
    Genres.findOne({
      Name: req.params.Name,
    })
      .then((genre) => {
        res.json(genre);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

//----------------director requests--------------------
/**
 * Get all directors
 * @method GET
 * @param {string} endpoint - endpoint to fetch directors. "url/directors"
 * @returns {object} - returns the directors object
 */
app.get(
  "/directors",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    Directors.find()
      .then((director) => {
        res.status(200).json(director);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).sned("Error: " + err);
      });
  }
);

/**
 * Get director by name
 * @method GET
 * @param {string} endpoint - endpoint - fetch director by name
 * @param {string} Name - is used to get specific director "url/directors/:Name"
 * @returns {object} - returns a specific director
 */
app.get(
  "/directors/:Name",
  passport.authenticate("jwt", {
    session: false,
  }),
  (req, res) => {
    Directors.findOne({
      Name: req.params.Name,
    })
      .then((director) => {
        res.json(director);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

//------------------user requests---------------
/**
 * Get all users
 * @method GET
 * @param {string} endpoint - endpoint to fetch users. "url/users"
 * @returns {object} - returns the users object
 */
app.get(
  "/users",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    Users.find()
      .then((users) => {
        res.status(201).json(users);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

/**
 * Get user by username
 * @method GET
 * @param {string} endpoint - endpoint - fetch user by username
 * @param {string} Username - is used to get specific user "url/users/:Username"
 * @returns {object} - returns a specific user
 */
app.get(
  "/users/:Username",
  passport.authenticate("jwt", {
    session: false,
  }),
  (req, res) => {
    Users.findOne({
      Username: req.params.Username,
    })
      .then((user) => {
        res.json(user);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

/**
 * Add user
 * @method POST
 * @param {string} endpoint - endpoint to add user. "url/users"
 * @param {string} Username - choosen by user
 * @param {string} FirstName - user's firstname
 * @param {string} LastName - user's lastname
 * @param {string} Password - user's password
 * @param {string} Email - user's e-mail adress
 * @param {string} Birth - user's birthday
 * @returns {object} - new user
 */
app.post(
  "/users",
  // Validation logic here for request
  //you can either use a chain of methods like .not().isEmpty()
  //which means "opposite of isEmpty" in plain english "is not empty"
  //or use .isLength({min: 5}) which means
  //minimum value of 5 characters are only allowed
  [
    check("Username", "Username is required!").isLength({
      min: 5,
    }),
    check(
      "Username",
      "Username contains non alphanumerical characters!"
    ).isAlphanumeric(),
    check("Password", "Password is required!").not().isEmpty(),
    check("Email", "Email adress is not valid!").isEmail(),
  ],
  (req, res) => {
    // check the validation object for errors
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        errors: errors.array(),
      });
    }
    let hashedPasswod = Users.hashPassword(req.body.Password);
    Users.findOne({
      Username: req.body.Username, //search user by username
    })
      .then((user) => {
        if (user) {
          //if user is found, send a response that is already exists
          return res.status(400).send(req.body.Username + " already exists!");
        } else {
          Users.create({
            FirstName: req.body.FirstName,
            LastName: req.body.LastName,
            Username: req.body.Username,
            Password: hashedPasswod,
            Email: req.body.Email,
            Birth: req.body.Birth,
          })
            .then((user) => {
              res.status(201).json(user);
            })
            .catch((error) => {
              console.error(error);
              res.status(500).send("Error: " + error);
            });
        }
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send("Error: " + error);
      });
  }
);

/**
 * Update user by username
 * @method PUT
 * @param {string} endpoint - endpoint to add user. "url/users/:Usename"
 * @param {string} Username - required
 * @param {string} FirstName - user's new firstname
 * @param {string} LastName - user's new lastname
 * @param {string} Password - user's new password
 * @param {string} Email - user's new e-mail adress
 * @param {string} Birth - user's new birthday
 * @returns {string} - returns success/error message
 */
//?? how to update a single field without turning the other fields to null???
app.put(
  "/users/:Username",
  [
    check("Username", "Username is required!").isLength({
      min: 5,
    }),
    check(
      "Username",
      "Username contains non alphanumerical characters!"
    ).isAlphanumeric(),
    check("Password", "Password is required!").not().isEmpty(),
    check("Email", "Email adress is not valid!").isEmail(),
  ],
  passport.authenticate("jwt", {
    session: false,
  }),
  (req, res) => {
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        errors: errors.array(),
      });
    }
    const hashedPassword = users.hashPassword(req.body.password);
    Users.findOneAndUpdate(
      {
        Username: req.params.Username,
      },
      {
        $set: {
          Username: req.body.Username,
          FirstName: req.body.FirstName,
          LastName: req.body.LastName,
          Password: hashedPassword,
          Email: req.body.Email,
          Birth: req.body.Birth,
        },
      },

      {
        new: true,
      }, //this line makes sure that updated document is returned
      (err, updatedUser) => {
        if (err) {
          console.error(err);
          res.status(500).send("Error: " + err);
        } else {
          res.json(updatedUser);
        }
      }
    );
  }
);

/**
 * Delete user by username
 * @method DELETE
 * @param {string} endpoint - endpoint - delete user by username
 * @param {string} Username - is used to delete specific user "url/users/:Username"
 * @returns {string} success/error message
 */
app.delete(
  "/users/:Username",
  passport.authenticate("jwt", {
    session: false,
  }),
  (req, res) => {
    Users.findOneAndDelete({
      Username: req.params.Username,
    })
      .then((user) => {
        if (!user) {
          res.status(400).send(req.params.Username + " was not found!");
        } else {
          res.status(200).send(req.params.Username + " was removed!");
        }
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

//--------------------Actor queries----------------
/**
 * Get all actors
 * @method GET
 * @param {string} endpoint - endpoint to fetch actors. "url/actors"
 * @returns {object} - returns the actors object
 */
app.get(
  "/actors",
  passport.authenticate("jwt", {
    session: false,
  }),
  (req, res) => {
    Actors.find()
      .then((actors) => {
        res.status(200).json(actors);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).sned("Error: " + err);
      });
  }
);

/**
 * Get actors by name
 * @method GET
 * @param {string} endpoint - endpoint - fetch actors by name
 * @param {string} Name - is used to get specific movie "url/actors/:Name"
 * @returns {object} - returns the movie with specific name
 */
app.get(
  "/actors/:Name",
  passport.authenticate("jwt", {
    session: false,
  }),
  (req, res) => {
    Actors.findOne({
      Name: req.params.Name,
    })
      .then((actor) => {
        res.json(actor);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

//get movies by actor -----gives null
app.get(
  "/movies/:ActorID",
  passport.authenticate("jwt", {
    session: false,
  }),
  (req, res) => {
    Movies.find({
      Actors: req.params.ActorID,
    })
      .then((movie) => {
        res.json(movie);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

//get actors by movieID -----gives []
app.get(
  "/actors/movies/:MovieID",
  passport.authenticate("jwt", {
    session: false,
  }),
  (req, res) => {
    Actors.find({
      Movies: req.params.MovieID,
    })
      .then((actor) => {
        res.json(actor);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

//-------------------documentation--------------
app.get("/documentation", (req, res) => {
  res.sendFile(path.join(__dirname, "public/documentation.html"));
});

//---------------------error handling------------
app.use((err, req, res, next) => {
  console.log(err.stack);
  res.status(500).send("Something went wrong!");
});

const port = process.env.PORT || 8080;
app.listen(port, "0.0.0.0", () => {
  console.log("Your server is live and listening on Port " + port);
});
