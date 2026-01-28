const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3000;

//middlewaree
app.use(express.json());
app.use(express.static('public'));

//initialize sqlite db
const db = new sqlite3.Database('./invoices.db', (err) => {
    if (err) {
        console.error("Error opening database: " + err.message);
    }
    else {
        console.log("Connected to the SQLite database.");
        initializeDatabase();
    }
});

function initializeDatabase() {
    db.run(`
        CREATE TABLE IF NOT EXISTS invoices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_name TEXT NOT NULL,
            customer_email TEXT,
            customer_phone TEXT,
            total_amount REAL NOT NULL,
            tax_amount REAL NOT NULL,
            grand_total REAL NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
            `);

    db.run(`
        CREATE TABLE IF NOT EXISTS invoice_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            invoice_id INTEGER NOT NULL,
            item_name TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            unit_price REAL NOT NULL,
            total_price REAL NOT NULL,
            FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
        )
        `);
}

//api routes

//create new invoice
app.post('/api/invoices', (req, res) => {
    const { customer_name, customer_email, customer_phone, items, total_amount, tax_amount, grand_total } = req.body;

    //validation check
    if (!customer_name || !items || items.length === 0) {
        res.status(400).json({ error: "Customer name and items are required" });
        return;
    }

    db.run
        (
            `INSERT INTO invoices (customer_name, customer_email, customer_phone, total_amount, tax_amount, grand_total) VALUES (?, ?, ?, ?, ?, ?)`,
            [customer_name, customer_email, customer_phone, total_amount, tax_amount, grand_total],
            function (err) {
                if (err) {
                    res.status(500).json({ error: "Failed to create invoice - " + err.message });
                    return;
                }

                const invoice_id = this.lastID;
                const stmt = db.prepare(`INSERT INTO invoice_items (invoice_id, item_name, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)`);

                items.forEach(item => {
                    const total_price = item.quantity * item.unit_price;
                    stmt.run(invoice_id, item.item_name, item.quantity, item.unit_price, total_price);
                });

                stmt.finalize((err) => {
                    if (err) {
                        res.status(500).json({ error: "Failed to add invoice items - " + err.message });
                        return;
                    }

                    res.status(201).json({
                        message: "Invoice created successfully",
                        sucesss: true,
                        invoice_id,
                        total_amount,
                        tax_amount,
                        grand_total
                    });
                });
            }
        );
});


//get sincle invoice with items
app.get('/api/invoices/:id', (req, res) => {
    const { id } = req.params;
    db.get(`SELECT * FROM invoices WHERE id = ?`, [id], (err, invoice) => {
        if (err) {
            res.status(500).json({ error: "Failed to retrieve invoice - " + err.message });
            return;
        }

        if (!invoice) {
            res.status(404).json({ error: "Invoice not found" });
            return;
        }

        db.all(`SELECT * FROM invoice_items WHERE invoice_id = ?`, [id], (err, items) => {
            if (err) {
                res.status(500).json({ error: "Failed to retrieve invoice items - " + err.message });
                return;
            }

            res.json({ ...invoice, items });
        });
    });
});

//get all invoices
app.get('/api/invoices', (req, res) => {
    db.all(`SELECT * FROM invoices ORDER BY created_at DESC`, [], (err, invoices) => {
        if (err) {
            res.status(500).json({ error: "Failed to retrieve invoices - " + err.message });
            return;
        }

        res.json(invoices);
    });
});

//delete invoice
app.delete('/api/invoices/:id', (req, res) => {
    const { id } = req.params;
    db.run(`DELETE FROM invoices WHERE invoice_id = ?`, [id], function (err) {
        if (err) {
            res.status(500).json({ error: "Failed to delete invoice - " + err.message });
            return;
        }

        db.run(`DELETE FROM invoices WHERE id = ?`, [id], function (err) {
            if (err) {
                res.status(500).json({ error: "Failed to delete invoice - " + err.message });
                return;
            }

            if (this.changes === 0) {
                res.status(404).json({ error: "Invoice not found" });
                return;
            }

            res.json({ message: "Invoice deleted successfully" });
        });
    });
});

//start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

//shutdoen
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error("Error closing database: " + err.message);
        }
        else {
            console.log("Closed the database connection.");
        }
        process.exit(0);
    });
});
