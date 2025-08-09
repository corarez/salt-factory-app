const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const PORT = 5000;

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
    console.log('Connected to the SQLite database.');
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
              const defaultPassword = '123';
              bcrypt.hash(defaultPassword, 10, (hashErr, hash) => {
                if (hashErr) {
                  console.error("Error hashing default password:", hashErr.message);
                } else {
                  db.run(`INSERT INTO admins (fullName, username, password, role) VALUES (?, ?, ?, ?)`,
                    ['Default Admin', 'admin', hash, 'Super Admin'],
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
        res.json({ message: 'Login successful', user: { id: admin.id, username: admin.username, fullName: admin.fullName, role: admin.role } });
      } else {
        res.status(401).json({ message: 'Invalid username or password.' });
      }
    });
  });
});

app.get('/api/arrived', (req, res) => {
  db.all("SELECT * FROM arrived", [], (err, rows) => {
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

app.get('/api/produced', (req, res) => {
  db.all("SELECT * FROM produced", [], (err, rows) => {
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

app.get('/api/next-invoice-id', (req, res) => {
  const invoiceIdPrefix = 'INV-';
  db.get("SELECT invoiceId FROM sold ORDER BY id DESC LIMIT 1", [], (err, row) => {
    if (err) {
      return handleDbError(res, err, "Error retrieving last invoice ID.");
    }

    let nextInvoiceNumber = 1;
    if (row && row.invoiceId) {
      const lastInvoiceNumber = parseInt(row.invoiceId.replace(invoiceIdPrefix, ''));
      if (!isNaN(lastInvoiceNumber)) {
        nextInvoiceNumber = lastInvoiceNumber + 1;
      }
    }
    const nextInvoiceId = `${invoiceIdPrefix}${String(nextInvoiceNumber).padStart(4, '0')}`;
    res.json({ nextInvoiceId });
  });
});

app.get('/api/transactions', (req, res) => {
  db.all("SELECT * FROM transactions", [], (err, rows) => {
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

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
