// Import express.js
const express = require("express");

// Create express app
var app = express();
// Use the Pug templating engine
app.set('view engine', 'pug');
app.set('views', './app/views');
// Add static files location
app.use(express.static("static"));

// Get the functions in the db.js file to use
const db = require('./services/db');

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
app.get("/", function(req, res) {
    res.render("home");
});

// Create a route for /goodbye
// Responds to a 'GET' request
app.get("/goodbye", function(req, res) {
    res.send("Goodbye world!");
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

// Start server on port 3000
app.listen(3000,function(){
    console.log(`Server running at http://127.0.0.1:3000/`);
});