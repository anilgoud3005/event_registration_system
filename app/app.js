// Import express.js
const express = require("express");
const { User } = require("./models/user");
const { Admin } = require("./models/admin");

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



// Protect all /admin/* routes
function requireAdmin(req, res, next) {
    if (!req.session.adminId) {
      return res.redirect("/admin_login");
    }
    next();
  }
  
// ─── ADMIN AUTH & DASHBOARD ────────────────────────────────────────────────────

// Admin login form
app.get("/admin_login", (req, res) => {
    if (req.session.adminId) {
      return res.redirect("/admin_dashboard");
    }
    res.render("admin_login");
  });
  
  // Handle admin login submission
  app.post("/admin_authenticate", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.render("admin_login", { errorMessage: "Email and password are required." });
      }
  
      const admin = new Admin(email);
      const aId   = await admin.getIdFromEmail();
      if (!aId) {
        return res.render("admin_login", { errorMessage: "Invalid email or password." });
      }
  
      admin.id = aId;
      const match = await admin.authenticate(password);
      if (!match) {
        return res.render("admin_login", { errorMessage: "Invalid email or password." });
      }
  
      req.session.adminId = aId;
      console.log("Admin session ID:", req.session.id);
      res.redirect("/admin_dashboard");
    } catch (err) {
      console.error("Error during admin authentication:", err);
      res.status(500).send("Internal Server Error");
    }
  });
  
  // Middleware to protect admin routes
  function requireAdmin(req, res, next) {
    if (!req.session.adminId) {
      return res.redirect("/admin_login");
    }
    next();
  }
  
  // Admin dashboard (list of events)
  app.get("/admin_dashboard", requireAdmin, async (req, res) => {
    try {
      const events = await db.query("SELECT * FROM events ORDER BY event_date, event_time");
      res.render("admin_dashboard", { events });
    } catch (err) {
      console.error("Error loading admin dashboard:", err);
      res.status(500).send("Database error");
    }
  });
  
  // Handle admin logout
  app.get("/admin_logout", (req, res) => {
    req.session.destroy(err => {
      if (err) {
        console.error("Error destroying admin session:", err);
        return res.status(500).send("Could not log out. Please try again.");
      }
      res.clearCookie("connect.sid");
      res.redirect("/admin_login");
    });
  });
  

// Show the login form (if not logged in) or redirect
app.get("/login", function (req, res) {
    try {
        if (req.session.userId) {
            res.redirect('/events');
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

// handle Contact Us submissions
app.post("/send-message", async (req, res) => {
    const { name, email, message } = req.body;
  
    // basic validation
    if (!name || !email || !message) {
      return res.render("contact", { 
        errorMessage: "All fields are required.", 
        name, email, message 
      });
    }
  
    try {
      const sql = "INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)";
      await db.query(sql, [name, email, message]);
      res.render("contact", { successMessage: "Thanks for your message! We’ll be in touch shortly." });
    } catch (err) {
      console.error("Error saving contact message:", err);
      res.render("contact", { errorMessage: "Sorry, something went wrong. Please try again later." });
    }
  });

// ─── EVENT CRUD UNDER /admin ──────────────────────────────────────────────────

// List all events (Read)
app.get("/admin/events", requireAdmin, async (req, res) => {
    try {
      const events = await db.query(
        "SELECT * FROM events ORDER BY event_date, event_time"
      );
      res.render("admin_events_list", { events });
    } catch (err) {
      console.error(err);
      res.status(500).send("Database error");
    }
  });
  
  // Show “New Event” form (Create)
  app.get("/admin/events/new", requireAdmin, (req, res) => {
    res.render("admin_event_form", {
      event: {},
      formAction: "/admin/events/new",
      submitLabel: "Create Event"
    });
  });
  
  // Handle “Create” submission
  app.post("/admin/events/new", requireAdmin, async (req, res) => {
    try {
      const { title, description, event_date, event_time, capacity } = req.body;
      await db.query(
        `INSERT INTO events (title, description, event_date, event_time, capacity)
           VALUES (?, ?, ?, ?, ?)`,
        [title, description, event_date, event_time, capacity]
      );
      res.redirect("/admin/events");
    } catch (err) {
      console.error(err);
      res.status(500).send("Database error");
    }
  });
  
  // Show “Edit Event” form (Update)
  app.get("/admin/events/edit/:id", requireAdmin, async (req, res) => {
    try {
      const [event] = await db.query(
        "SELECT * FROM events WHERE event_id = ?",
        [req.params.id]
      );
      if (!event) return res.status(404).send("Event not found");
      res.render("admin_event_form", {
        event,
        formAction: `/admin/events/edit/${event.event_id}`,
        submitLabel: "Update Event"
      });
    } catch (err) {
      console.error(err);
      res.status(500).send("Database error");
    }
  });
  
  // Handle “Update” submission
  app.post("/admin/events/edit/:id", requireAdmin, async (req, res) => {
    try {
      const { title, description, event_date, event_time, capacity } = req.body;
      await db.query(
        `UPDATE events
           SET title = ?, description = ?, event_date = ?, event_time = ?, capacity = ?
         WHERE event_id = ?`,
        [title, description, event_date, event_time, capacity, req.params.id]
      );
      res.redirect("/admin/events");
    } catch (err) {
      console.error(err);
      res.status(500).send("Database error");
    }
  });
  
  // Handle “Delete” (Delete)
  app.get("/admin/events/delete/:id", requireAdmin, async (req, res) => {
    try {
      await db.query("DELETE FROM events WHERE event_id = ?", [req.params.id]);
      res.redirect("/admin/events");
    } catch (err) {
      console.error(err);
      res.status(500).send("Database error");
    }
  });
  

  // handle user logout
app.get("/logout", (req, res) => {
    req.session.destroy(err => {
      if (err) {
        console.error("Error destroying session:", err);
        return res.status(500).send("Could not log out. Please try again.");
      }
      res.clearCookie("connect.sid"); // optional, but ensures the cookie is removed
      res.redirect("/login");
    });
  });
// Admin logout
app.get("/admin_logout", (req, res) => {
    req.session.destroy(err => {
      if (err) {
        console.error("Error destroying admin session:", err);
        return res.status(500).send("Could not log out. Please try again.");
      }
      res.clearCookie("connect.sid");
      res.redirect("/admin_login");
    });
  });
// Show all registrations
app.get("/admin_registrations", requireAdmin, async (req, res) => {
    try {
      const sql = `
        SELECT
          r.registration_id,
          u.email           AS user_email,
          e.title           AS event_title,
          r.registration_date
        FROM registrations r
        JOIN Users u        ON r.user_id  = u.id
        JOIN events e       ON r.event_id = e.event_id
        ORDER BY r.registration_date DESC
      `;
      const regs = await db.query(sql);
      res.render("admin_registrations", { registrations: regs });
    } catch (err) {
      console.error("Error loading registrations:", err);
      res.status(500).send("Database error");
    }
  });
  

// Start server on port 3000
app.listen(3000, function() {
    console.log(`Server running at http://127.0.0.1:3000/`);
});
