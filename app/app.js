// Import express.js
const express = require("express");
const { User } = require("./models/user");

// Create express app
var app = express();
// Use the Pug templating engine
app.set('view engine', 'pug');
app.set('views', './app/views');
// Add static files location
app.use(express.static("static"));

// Get the functions in the db.js file to use
const db = require('./services/db');


const bodyParser = require('body-parser');

const cookieParser = require("cookie-parser");
const session = require('express-session');
// Add static files location

const bcrypt = require('bcryptjs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static(__dirname));
const oneDay = 1000 * 60 * 60 * 24;
const sessionMiddleware = session({
    secret: "thisismysecrctekeyfhrgfgrfrty84fwir767",
    saveUninitialized: true,
    cookie: { maxAge: oneDay },
    resave: false
});
app.use(sessionMiddleware);

app.use((req, res, next) => {
    // make a boolean available in every Pug template
    res.locals.loggedIn = !!req.session.uid;
    next();
  });

app.use(express.static("static"));

// // Create a route for root - /
// app.get("/", function(req, res) {
//     res.render("index");
// });

// Create a route for testing the db
app.get("/db_test", function(req, res) {
    // Assumes a table called test_table exists in your database
    sql = 'select * from test_table';
    db.query(sql).then(results => {
        console.log(results);
        res.send(results)
    });
});

// Route to fetch events and render the events page
app.get("/events", function(req, res) {
    let searchQuery = req.query.search || "";
    let sql = "SELECT * FROM events WHERE title LIKE ? OR description LIKE ?";

    db.query(sql, [`%${searchQuery}%`, `%${searchQuery}%`]).then(results => {
        console.log(results);
        res.render("events", { events: results, search: searchQuery });
    }).catch(error => {
        console.error("Error fetching events:", error);
        res.status(500).send("Database error");
    });
});


app.get("/event/:id", function(req, res) {
    let eventId = req.params.id;
    let sql = "SELECT * FROM events WHERE event_id = ?";

    db.query(sql, [eventId]).then(results => {
        if (results.length > 0) {
            res.render("event_detail", { event: results[0] });
        } else {
            res.status(404).send("Event not found");
        }
    }).catch(error => {
        console.error("Error fetching event details:", error);
        res.status(500).send("Database error");
    });
});

// Create a route for root - /
app.get("/about", function(req, res) {
    res.render("about");
});
// Create a route for root - /
app.get("/contact", function(req, res) {
    res.render("contact");
});



// Create a route for root - /
app.get("/", function(req, res) {
    res.render("home");
});

// Create a route for /goodbye
// Responds to a 'GET' request
app.get("/goodbye", function(req, res) {
    res.send("Goodbye world!");
});

app.get("/login", function(req, res) {
    res.render("login");
});

app.get("/register", function(req, res) {
    res.render("register");
});

// Create a dynamic route for /hello/<name>, where name is any value provided by user
// At the end of the URL
// Responds to a 'GET' request
app.get("/hello/:name", function(req, res) {
    // req.params contains any parameters in the request
    // We can examine it in the console for debugging purposes
    console.log(req.params);
    //  Retrieve the 'name' parameter and use it in a dynamically generated page
    res.send("Hello " + req.params.name);
});

// create User api
app.post('/signup', async (req, res) => {
    const { email, password} = req.body;

    try {
        // Hash the password using bcrypt
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Prepare SQL query
        const sql = 'INSERT INTO Users(email, password) VALUES (?, ?)';
        const values = [email, hashedPassword];
        // Execute SQL query
        await db.query(sql, values);

        res.render('register', { successMessage: 'User created successfully' });
    } catch (error) {
        console.log(error)
        res.render('register', { errorMessage: 'Error inserting data into the database' });
    }
});

app.get("/login", function (req, res) {
    try {
        if (req.session.uid) {
            res.redirect('/dashboard');
        } else {
            res.render('login');
        }
        res.end();
    } catch (err) {
        console.error("Error accessing root route:", err);
        res.status(500).send('Internal Server Error');
    }
});

// Check submitted email and password pair
app.post('/authenticate', async function (req, res) {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).send('Email and password are required.');
        }

        var user = new User(email);
        const uId = await user.getIdFromEmail();
        if (!uId) {
            return res.render('login',{ errorMessage: 'Invalid Email' });
        }

        const match = await user.authenticate(password);
        if (!match) {
            return res.render('login',{ errorMessage: 'Invalid Email' })
        }

        req.session.uid = uId;
        req.session.loggedIn = true;
        console.log(req.session.id);
        res.redirect('/events');
    } catch (err) {
        console.error(`Error while authenticating user:`, err.message);
        res.status(500).send('Internal Server Error');
    }
});

// Start server on port 3000
app.listen(3000,function(){
    console.log(`Server running at http://127.0.0.1:3000/`);
});