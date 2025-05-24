const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const cakeRoutes = require('./routes/cakes');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 8080; // Always default to 8080 for cloud

// Config
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'quyncake123';

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(session({
  secret: 'quyncake-secret-key',
  resave: false,
  saveUninitialized: true,
}));

app.use(express.static(path.join(__dirname, 'public')));

// Login route
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    req.session.authenticated = true;
    res.redirect('/admin.html');
  } else {
    res.send('<script>alert("Incorrect credentials."); window.location.href="/login.html";</script>');
  }
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login.html');
  });
});

// Protect admin.html
app.get('/admin.html', (req, res, next) => {
  if (req.session.authenticated) {
    return res.sendFile(path.join(__dirname, 'public', 'admin.html'));
  } else {
    return res.redirect('/login.html');
  }
});

// Public route to get cakes for shop
const publicCakeRoutes = require('./routes/cakes');
app.get('/api/cakes', publicCakeRoutes); // only allow GET access here for unauthenticated users

// Protect admin-only cake operations
app.use('/api/cakes', (req, res, next) => {
  if (req.method === 'GET') {
    return next(); // already handled above
  }
  if (req.session.authenticated) {
    next();
  } else {
    res.status(403).send('Forbidden: Login required.');
  }
}, publicCakeRoutes);

// Fallback for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack || err);
  res.status(500).json({ error: 'Internal server error.' });
});

// // ORDER route (send order via email)
// app.post('/api/order', async (req, res) => {
//     const { cart, phone } = req.body;
//     if (!cart || !phone) return res.status(400).send("Missing cart or phone");

//     // Format order details
//     let orderText = `New Cake Order\nPhone: ${phone}\n\nCakes:\n`;
//     Object.entries(cart).forEach(([name, item]) => {
//         orderText += `- ${name} x${item.quantity} (${item.price.toLocaleString()}đ each)\n`;
//     });
//     orderText += `\nTotal: ${Object.values(cart).reduce((sum, item) => sum + item.price * item.quantity, 0).toLocaleString()}đ`;

//     // Set up nodemailer (Gmail example; use your store's email + app password)
//     let transporter = nodemailer.createTransport({
//         service: 'gmail',
//         auth: {
//             user: 'chanhung041103@gmail.com',      // <== replace!
//             pass: 'chanhung2003',              // <== replace with Gmail App Password!
//         }
//     });

//     try {
//         await transporter.sendMail({
//             from: 'chanhung041103@gmail.com',
//             to: 'chanhung041103@gmail.com', // send to store email
//             subject: 'New Cake Order',
//             text: orderText
//         });
//         res.status(200).send("Order sent");
//     } catch (err) {
//         console.error("Failed to send email:", err.message);
//         res.status(500).send("Email send failed");
//     }
// });

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
