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
const bcrypt = require('bcryptjs');

// Body & cookie parsing
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

// Serve project root (if you need it)
app.use(express.static(__dirname));

const oneDay = 1000 * 60 * 60 * 24;
const sessionMiddleware = session({
    secret: "thisismysecrctekeyfhrgfgrfrty84fwir767",
    saveUninitialized: true,
    cookie: { maxAge: oneDay },
    resave: false
});
app.use(sessionMiddleware);

// make a boolean available in every Pug template
app.use((req, res, next) => {
    res.locals.loggedIn = !!req.session.userId;
    next();
});

// Create a route for testing the db
app.get("/db_test", function(req, res) {
    // Assumes a table called test_table exists in your database
    sql = 'select * from test_table';
    db.query(sql).then(results => {
        console.log(results);
        res.send(results);
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

// Static pages
app.get("/about", function(req, res) {
    res.render("about");
});
app.get("/contact", function(req, res) {
    res.render("contact");
});
app.get("/", function(req, res) {
    res.render("home");
});
app.get("/goodbye", function(req, res) {
    res.send("Goodbye world!");
});

// Show the login form (if not logged in) or redirect
app.get("/login", function (req, res) {
    try {
        if (req.session.userId) {
            res.redirect('/dashboard');
        } else {
            res.render('login');
        }
        res.end();
    } catch (err) {
        console.error("Error accessing login route:", err);
        res.status(500).send('Internal Server Error');
    }
});

app.get("/register", function(req, res) {
    res.render("register");
});

// Create a dynamic route for /hello/<name>
app.get("/hello/:name", function(req, res) {
    console.log(req.params);
    res.send("Hello " + req.params.name);
});

// create User api (signup)
app.post('/signup', async (req, res) => {
    const { email, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = 'INSERT INTO Users(email, password) VALUES (?, ?)';
        const values = [email, hashedPassword];
        await db.query(sql, values);
        res.render('register', { successMessage: 'User created successfully' });
    } catch (error) {
        console.log(error);
        res.render('register', { errorMessage: 'Error inserting data into the database' });
    }
});

// Check submitted email and password pair (authenticate)
app.post('/authenticate', async function (req, res) {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).send('Email and password are required.');
        }

        var user = new User(email);
        const uId = await user.getIdFromEmail();
        if (!uId) {
            return res.render('login', { errorMessage: 'Invalid Email' });
        }

        user.id = uId;
        const match = await user.authenticate(password);
        if (!match) {
            return res.render('login', { errorMessage: 'Invalid Email' });
        }

        req.session.userId = uId;
        console.log(req.session.id);
        res.redirect('/events');
    } catch (err) {
        console.error(`Error while authenticating user:`, err.message);
        res.status(500).send('Internal Server Error');
    }
});

// show the “reservation” form
app.get('/reservation/:eventId', async (req, res) => {
    const eventId = req.params.eventId;
    try {
        const [event] = await db.query(
            'SELECT * FROM events WHERE event_id = ?',
            [eventId]
        );
        if (!event) return res.status(404).send('Event not found');
        res.render('reservation', { event });
    } catch (err) {
        console.error(err);
        res.status(500).send('Database error');
    }
});

// handle the form submission
app.post('/reservation/:eventId', async (req, res) => {
    const eventId = req.params.eventId;
    const userId = req.session.userId;
    if (!userId) return res.redirect('/login');

    try {
        await db.query(
            'INSERT INTO registrations (user_id, event_id) VALUES (?, ?)',
            [userId, eventId]
        );
        res.render('reservation', {
            event: { event_id: eventId, title: '' },
            successMessage: 'Your spot is reserved!'
        });
    } catch (err) {
        console.error(err);
        if (err.code === 'ER_DUP_ENTRY') {
            res.render('reservation', {
                event: { event_id: eventId, title: '' },
                errorMessage: 'You have already reserved a spot for this event.'
            });
        } else {
            res.status(500).send('Database error');
        }
    }
});

// Start server on port 3000
app.listen(3000, function() {
    console.log(`Server running at http://127.0.0.1:3000/`);
});
