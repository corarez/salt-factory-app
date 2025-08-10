const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken'); // Removed jsonwebtoken
const http = require('http');
const { Server } = require('socket.io');

// Removed require('dotenv').config() from server.js
// It's now handled explicitly in main.js to ensure proper loading order in Electron.

const app = express();
// Rely on process.env.HOST being set by main.js via dotenv
const HOST = process.env.HOST;
const PORT = process.env.PORT || 5000; // Use env PORT or default to 5000
// const JWT_SECRET = process.env.JWT_SECRET; // Removed JWT_SECRET

// Removed JWT_SECRET check
// if (!JWT_SECRET) {
//   console.error('Error: JWT_SECRET is not defined. Please set it in your .env file or as an environment variable.');
//   process.exit(1); // Exit the process if the secret is not set
// }

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

app.use(cors());
app.use(bodyParser.json());

const db = new sqlite3.Database('./salt_db.db', (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
  } else {
    // Log the database file path
    console.log(`Connected to the SQLite database at: ${db.filename}`);
    console.log('This file will persist unless manually deleted.');
    db.serialize(() => {
      db.run(`CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fullName TEXT NOT NULL,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'Viewer'
      )`, (err) => {
        if (err) {
          console.error("Error creating admins table:", err.message);
        } else {
          db.get("SELECT COUNT(*) AS count FROM admins WHERE username = ?", ["admin"], (err, row) => {
            if (err) {
              console.error("Error checking default admin:", err.message);
            } else if (row.count === 0) {
              const defaultPassword = 'Saman8819';
              bcrypt.hash(defaultPassword, 10, (hashErr, hash) => {
                if (hashErr) {
                  console.error("Error hashing default password:", hashErr.message);
                } else {
                  db.run(`INSERT INTO admins (fullName, username, password, role) VALUES (?, ?, ?, ?)`,
                    ['Saman Mamand', 'saman', hash, 'Super Admin'],
                    (insertErr) => {
                      if (insertErr) {
                        console.error("Error inserting default admin:", insertErr.message);
                      } else {
                        console.log("Default admin 'admin' created with password '123'");
                      }
                    }
                  );
                }
              });
            }
          });
        }
      });

      db.run(`CREATE TABLE IF NOT EXISTS arrived (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        quantity REAL,
        arrivedDate TEXT,
        pricePerTon REAL,
        placeArrived TEXT,
        truckDriver TEXT,
        invoiceId TEXT UNIQUE,
        invoiceDate TEXT,
        senderName TEXT,
        feePerTon REAL,
        totalFee REAL,
        totalTonPrice REAL,
        totalPrice REAL,
        status TEXT,
        addedBy TEXT
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS produced (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        saltType TEXT,
        quantity REAL,
        date TEXT,
        note TEXT
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS sold (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        buyerName TEXT,
        invoiceId TEXT UNIQUE,
        date TEXT,
        items TEXT,
        truckDriverName TEXT,
        truckNumber TEXT,
        truckDriverPhone TEXT,
        receiverName TEXT,
        oldDebt REAL,
        total REAL
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT,
        title TEXT,
        price REAL,
        note TEXT,
        date TEXT
      )`);

      console.log('All necessary tables checked/created.');
    });
  }
});

const handleDbError = (res, err, message) => {
  console.error(message, err.message);
  res.status(500).json({ error: message, details: err.message });
};

// Removed authenticateToken middleware
// const authenticateToken = (req, res, next) => {
//   const authHeader = req.headers['authorization'];
//   const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

//   if (token == null) {
//     return res.status(401).json({ message: 'Authentication token required.' });
//   }

//   jwt.verify(token, JWT_SECRET, (err, user) => {
//     if (err) {
//       console.error("JWT verification error:", err.message);
//       return res.status(403).json({ message: 'Invalid or expired token.' });
//     }
//     // Check if the user has an admin role
//     if (!user.role || (user.role !== 'Admin' && user.role !== 'Super Admin')) {
//       return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
//     }
//     req.user = user; // Attach user info to the request
//     next();
//   });
// };

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  db.get("SELECT * FROM admins WHERE username = ?", [username], (err, admin) => {
    if (err) {
      return handleDbError(res, err, "Error during login.");
    }
    if (!admin) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    bcrypt.compare(password, admin.password, (compareErr, isMatch) => {
      if (compareErr) {
        return handleDbError(res, compareErr, "Error comparing passwords.");
      }
      if (isMatch) {
        // No JWT generation here
        res.json({ message: 'Login successful', user: { id: admin.id, username: admin.username, fullName: admin.fullName, role: admin.role } });
      } else {
        res.status(401).json({ message: 'Invalid username or password.' });
      }
    });
  });
});

// Removed app.use(authenticateToken) for all protected routes
// app.use('/api/arrived', authenticateToken);
// app.use('/api/produced', authenticateToken);
// app.use('/api/sold', authenticateToken);
// app.use('/api/transactions', authenticateToken);
// app.use('/api/admins', authenticateToken);

// GET endpoint for arrived data, now with optional monthly filtering
app.get('/api/arrived', (req, res) => {
  const { month, year } = req.query; // Get month and year from query parameters
  let sql = "SELECT * FROM arrived";
  const params = [];

  if (month && year) {
    // Ensure month is two digits (e.g., '01' for January)
    const formattedMonth = String(month).padStart(2, '0');
    // Filter by year and month using SQLite's strftime function
    sql += " WHERE strftime('%Y-%m', arrivedDate) = ?";
    params.push(`${year}-${formattedMonth}`);
  }

  db.all(sql, params, (err, rows) => {
    if (err) {
      handleDbError(res, err, "Error retrieving arrived data.");
    } else {
      res.json(rows);
    }
  });
});

app.post('/api/arrived', (req, res) => {
  const { quantity, arrivedDate, pricePerTon, placeArrived, truckDriver, invoiceId, invoiceDate, senderName, feePerTon, totalFee, totalTonPrice, totalPrice, status, addedBy } = req.body;
  db.run(`INSERT INTO arrived (quantity, arrivedDate, pricePerTon, placeArrived, truckDriver, invoiceId, invoiceDate, senderName, feePerTon, totalFee, totalTonPrice, totalPrice, status, addedBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [quantity, arrivedDate, pricePerTon, placeArrived, truckDriver, invoiceId, invoiceDate, senderName, feePerTon, totalFee, totalTonPrice, totalPrice, status, addedBy],
    function(err) {
      if (err) {
        handleDbError(res, err, "Error adding arrived entry.");
      } else {
        const newEntry = { id: this.lastID, ...req.body };
        io.emit('arrived:added', newEntry);
        res.status(201).json(newEntry);
      }
    }
  );
});

app.put('/api/arrived/:id', (req, res) => {
  const { id } = req.params;
  const { quantity, arrivedDate, pricePerTon, placeArrived, truckDriver, invoiceId, invoiceDate, senderName, feePerTon, totalFee, totalTonPrice, totalPrice, status, addedBy } = req.body;
  db.run(`UPDATE arrived SET quantity = ?, arrivedDate = ?, pricePerTon = ?, placeArrived = ?, truckDriver = ?, invoiceId = ?, invoiceDate = ?, senderName = ?, feePerTon = ?, totalFee = ?, totalTonPrice = ?, totalPrice = ?, status = ?, addedBy = ? WHERE id = ?`,
    [quantity, arrivedDate, pricePerTon, placeArrived, truckDriver, invoiceId, invoiceDate, senderName, feePerTon, totalFee, totalTonPrice, totalPrice, status, addedBy, id],
    function(err) {
      if (err) {
        handleDbError(res, err, "Error updating arrived entry.");
      } else if (this.changes === 0) {
        res.status(404).json({ message: 'Arrived entry not found' });
      } else {
        const updatedEntry = { id: parseInt(id), ...req.body };
        io.emit('arrived:updated', updatedEntry);
        res.json(updatedEntry);
      }
    }
  );
});

app.delete('/api/arrived/:id', (req, res) => {
  const { id } = req.params;
  db.run(`DELETE FROM arrived WHERE id = ?`, id, function(err) {
    if (err) {
      handleDbError(res, err, "Error deleting arrived entry.");
    } else if (this.changes === 0) {
      res.status(404).json({ message: 'Arrived entry not found' });
    } else {
      io.emit('arrived:deleted', parseInt(id));
      res.status(204).send();
    }
  });
});

// GET endpoint for produced data, now with optional monthly filtering
app.get('/api/produced', (req, res) => {
  const { month, year } = req.query; // Get month and year from query parameters
  let sql = "SELECT * FROM produced";
  const params = [];

  if (month && year) {
    // Ensure month is two digits (e.g., '01' for January)
    const formattedMonth = String(month).padStart(2, '0');
    // Filter by year and month using SQLite's strftime function
    sql += " WHERE strftime('%Y-%m', date) = ?";
    params.push(`${year}-${formattedMonth}`);
  }

  db.all(sql, params, (err, rows) => {
    if (err) {
      handleDbError(res, err, "Error retrieving produced data.");
    } else {
      res.json(rows);
    }
  });
});

app.post('/api/produced', (req, res) => {
  const { saltType, quantity, date, note } = req.body;
  db.run(`INSERT INTO produced (saltType, quantity, date, note) VALUES (?, ?, ?, ?)`,
    [saltType, quantity, date, note],
    function(err) {
      if (err) {
        handleDbError(res, err, "Error adding produced entry.");
      } else {
        const newEntry = { id: this.lastID, ...req.body };
        io.emit('produced:added', newEntry);
        res.status(201).json(newEntry);
      }
    }
  );
});

app.put('/api/produced/:id', (req, res) => {
  const { id } = req.params;
  const { saltType, quantity, date, note } = req.body;
  db.run(`UPDATE produced SET saltType = ?, quantity = ?, date = ?, note = ? WHERE id = ?`,
    [saltType, quantity, date, note, id],
    function(err) {
      if (err) {
        handleDbError(res, err, "Error updating produced entry.");
      } else if (this.changes === 0) {
        res.status(404).json({ message: 'Produced entry not found' });
      } else {
        const updatedEntry = { id: parseInt(id), ...req.body };
        io.emit('produced:updated', updatedEntry);
        res.json(updatedEntry);
      }
    }
  );
});

app.delete('/api/produced/:id', (req, res) => {
  const { id } = req.params;
  db.run(`DELETE FROM produced WHERE id = ?`, id, function(err) {
    if (err) {
      handleDbError(res, err, "Error deleting produced entry.");
    } else if (this.changes === 0) {
      res.status(404).json({ message: 'Produced entry not found' });
    } else {
      io.emit('produced:deleted', parseInt(id));
      res.status(204).send();
    }
  });
});

app.get('/api/sold', (req, res) => {
  db.all("SELECT * FROM sold", [], (err, rows) => {
    if (err) {
      handleDbError(res, err, "Error retrieving sold data.");
    } else {
      const parsedRows = rows.map(row => ({
        ...row,
        items: JSON.parse(row.items)
      }));
      res.json(parsedRows);
    }
  });
});

app.get('/api/sold/invoice-ids', (req, res) => {
  db.all("SELECT invoiceId FROM sold", [], (err, rows) => {
    if (err) {
      handleDbError(res, err, "Error retrieving invoice IDs.");
    } else {
      const invoiceIds = rows.map(row => row.invoiceId);
      res.json(invoiceIds);
    }
  });
});

app.post('/api/sold', (req, res) => {
  const { buyerName, invoiceId, date, items, truckDriverName, truckNumber, truckDriverPhone, receiverName, oldDebt, total } = req.body;
  const itemsString = JSON.stringify(items);
  db.run(`INSERT INTO sold (buyerName, invoiceId, date, items, truckDriverName, truckNumber, truckDriverPhone, receiverName, oldDebt, total) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [buyerName, invoiceId, date, itemsString, truckDriverName, truckNumber, truckDriverPhone, receiverName, oldDebt, total],
    function(err) {
      if (err) {
        handleDbError(res, err, "Error adding sold entry.");
      } else {
        const newEntry = { id: this.lastID, ...req.body };
        io.emit('sold-updated'); // Emit generic update event
        res.status(201).json(newEntry);
      }
    }
  );
});

app.put('/api/sold/:id', (req, res) => {
  const { id } = req.params;
  const { buyerName, invoiceId, date, items, truckDriverName, truckNumber, truckDriverPhone, receiverName, oldDebt, total } = req.body;
  const itemsString = JSON.stringify(items);
  db.run(`UPDATE sold SET buyerName = ?, invoiceId = ?, date = ?, items = ?, truckDriverName = ?, truckNumber = ?, truckDriverPhone = ?, receiverName = ?, oldDebt = ?, total = ? WHERE id = ?`,
    [buyerName, invoiceId, date, itemsString, truckDriverName, truckNumber, truckDriverPhone, receiverName, oldDebt, total, id],
    function(err) {
      if (err) {
        handleDbError(res, err, "Error updating sold entry.");
      } else if (this.changes === 0) {
        res.status(404).json({ message: 'Sold entry not found' });
      } else {
        const updatedEntry = { id: parseInt(id), ...req.body };
        io.emit('sold-updated'); // Emit generic update event
        res.json(updatedEntry);
      }
    }
  );
});

app.delete('/api/sold/:id', (req, res) => {
  const { id } = req.params;
  db.run(`DELETE FROM sold WHERE id = ?`, id, function(err) {
    if (err) {
      handleDbError(res, err, "Error deleting sold entry.");
    } else if (this.changes === 0) {
      res.status(404).json({ message: 'Sold entry not found' });
    } else {
      io.emit('sold-updated'); // Emit generic update event
      res.status(204).send();
    }
  });
});

// Modified endpoint to generate next invoice ID, resetting annually
app.get('/api/next-invoice-id', (req, res) => {
  const invoiceIdPrefix = 'INV-';
  db.get("SELECT invoiceId, date FROM sold ORDER BY id DESC LIMIT 1", [], (err, row) => {
    if (err) {
      return handleDbError(res, err, "Error retrieving last invoice ID.");
    }

    let nextInvoiceNumber = 1;
    const currentYear = new Date().getFullYear();

    if (row && row.invoiceId && row.date) {
      const lastInvoiceYear = new Date(row.date).getFullYear(); // Get year from the last invoice date
      if (lastInvoiceYear === currentYear) {
        // If it's the same year, increment the last invoice number
        const lastInvoiceNumber = parseInt(row.invoiceId.replace(invoiceIdPrefix, ''));
        if (!isNaN(lastInvoiceNumber)) {
          nextInvoiceNumber = lastInvoiceNumber + 1;
        }
      }
      // If lastInvoiceYear is different from currentYear, nextInvoiceNumber remains 1 (reset)
    }
    const nextInvoiceId = `${invoiceIdPrefix}${String(nextInvoiceNumber).padStart(4, '0')}`;
    res.json({ nextInvoiceId });
  });
});

// GET endpoint for transactions data, now with optional monthly filtering
app.get('/api/transactions', (req, res) => {
  const { month, year } = req.query; // Get month and year from query parameters
  let sql = "SELECT * FROM transactions";
  const params = [];

  if (month && year) {
    // Ensure month is two digits (e.g., '01' for January)
    const formattedMonth = String(month).padStart(2, '0');
    // Filter by year and month using SQLite's strftime function
    sql += " WHERE strftime('%Y-%m', date) = ?";
    params.push(`${year}-${formattedMonth}`);
  }

  db.all(sql, params, (err, rows) => {
    if (err) {
      handleDbError(res, err, "Error retrieving transactions data.");
    } else {
      res.json(rows);
    }
  });
});

app.post('/api/transactions', (req, res) => {
  const { type, title, price, note, date } = req.body;
  db.run(`INSERT INTO transactions (type, title, price, note, date) VALUES (?, ?, ?, ?, ?)`,
    [type, title, price, note, date],
    function(err) {
      if (err) {
        handleDbError(res, err, "Error adding transaction entry.");
      } else {
        const newEntry = { id: this.lastID, ...req.body };
        io.emit('transactions:added', newEntry);
        res.status(201).json(newEntry);
      }
    }
  );
});

app.put('/api/transactions/:id', (req, res) => {
  const { id } = req.params;
  const { type, title, price, note, date } = req.body;
  db.run(`UPDATE transactions SET type = ?, title = ?, price = ?, note = ?, date = ? WHERE id = ?`,
    [type, title, price, note, date, id],
    function(err) {
      if (err) {
        handleDbError(res, err, "Error updating transaction entry.");
      } else if (this.changes === 0) {
        res.status(404).json({ message: 'Transaction entry not found' });
      } else {
        const updatedEntry = { id: parseInt(id), ...req.body };
        io.emit('transactions:updated', updatedEntry);
        res.json(updatedEntry);
      }
    }
  );
});

app.delete('/api/transactions/:id', (req, res) => {
  const { id } = req.params;
  db.run(`DELETE FROM transactions WHERE id = ?`, id, function(err) {
    if (err) {
      handleDbError(res, err, "Error deleting transaction entry.");
    } else if (this.changes === 0) {
      res.status(404).json({ message: 'Transaction entry not found' });
    } else {
      io.emit('transactions:deleted', parseInt(id));
      res.status(204).send();
    }
  });
});

app.get('/api/admins', (req, res) => {
  db.all("SELECT id, fullName, username, role FROM admins", [], (err, rows) => {
    if (err) {
      handleDbError(res, err, "Error retrieving admins data.");
    } else {
      res.json(rows);
    }
  });
});

app.post('/api/admins', (req, res) => {
  const { fullName, username, password, role } = req.body;
  bcrypt.hash(password, 10, (hashErr, hash) => {
    if (hashErr) {
      return handleDbError(res, hashErr, "Error hashing password for new admin.");
    }
    db.run(`INSERT INTO admins (fullName, username, password, role) VALUES (?, ?, ?, ?)`,
      [fullName, username, hash, role],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ message: 'Username already exists.' });
          }
          handleDbError(res, err, "Error adding admin entry.");
        } else {
          const newAdmin = { id: this.lastID, fullName, username, role };
          io.emit('admins:added', newAdmin);
          res.status(201).json(newAdmin);
        }
      }
    );
  });
});

app.put('/api/admins/:id', (req, res) => {
  const { id } = req.params;
  const { fullName, username, role } = req.body;
  db.run(`UPDATE admins SET fullName = ?, username = ?, role = ? WHERE id = ?`,
    [fullName, username, role, id],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(409).json({ message: 'Username already exists.' });
        }
        handleDbError(res, err, "Error updating admin entry.");
      } else if (this.changes === 0) {
        res.status(404).json({ message: 'Admin entry not found' });
      } else {
        const updatedAdmin = { id: parseInt(id), fullName, username, role };
        io.emit('admins:updated', updatedAdmin);
        res.json(updatedAdmin);
      }
    }
  );
});

app.put('/api/admins/:id/password', (req, res) => {
  const { id } = req.params;
  const { currentPassword, newPassword } = req.body;

  db.get("SELECT password FROM admins WHERE id = ?", [id], (err, admin) => {
    if (err) {
      return handleDbError(res, err, "Error retrieving admin for password change.");
    }
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found.' });
    }

    bcrypt.compare(currentPassword, admin.password, (compareErr, isMatch) => {
      if (compareErr) {
        return handleDbError(res, compareErr, "Error comparing current password.");
      }
      if (!isMatch) {
        return res.status(401).json({ message: 'Current password is incorrect.' });
      }

      bcrypt.hash(newPassword, 10, (hashErr, hash) => {
        if (hashErr) {
          return handleDbError(res, hashErr, "Error hashing new password.");
        }
        db.run(`UPDATE admins SET password = ? WHERE id = ?`,
          [hash, id],
          function(updateErr) {
            if (updateErr) {
              handleDbError(res, updateErr, "Error updating new password.");
            } else if (this.changes === 0) {
              res.status(404).json({ message: 'Admin not found for password update.' });
            } else {
              io.emit('admins:passwordUpdated', { id: parseInt(id) });
              res.json({ message: 'Password updated successfully.' });
            }
          }
        );
      });
    });
  });
});

app.delete('/api/admins/:id', (req, res) => {
  const { id } = req.params;
  db.run(`DELETE FROM admins WHERE id = ?`, id, function(err) {
    if (err) {
      handleDbError(res, err, "Error deleting admin entry.");
    } else if (this.changes === 0) {
      res.status(404).json({ message: 'Admin entry not found' });
    } else {
      io.emit('admins:deleted', parseInt(id));
      res.status(204).send();
    }
  });
});

// Listen on the specified host and port
server.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});
