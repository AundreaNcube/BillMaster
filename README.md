# BillMaster - Invoice Management System
Full-stack invoice system transforming retail billing from manual to automated. Generates professional PDF invoices, emails receipts, calculates taxes. 

## Features

- **Automated Invoice Generation**: Create professional PDF invoices with a single click.
- **Email Receipts**: Automatically send email receipts to customers.
- **Tax Calculation**: Automatically calculate applicable taxes based on location.
- **User-Friendly Interface**: Intuitive design for easy navigation and operation.
- **Real-time Calculations**: Instant updates on totals and taxes as items are added.

## Technologies Used
- Frontend: HTML5, CSS3, Vanilla JavaScript
- Backend: Node.js, Express.js
- Database: SQLite3
- PDF Generation: pdfkit

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/AundreaNcube/BillMaster.git

2. Navigate to the project directory:
   ```bash
   cd BillMaster
   ```

3. Install dependencies:
   ```bash
   npm install

   npm run dev # to run with in development mode
   ```

4. Start the application:
   ```bash
    npm start
    ```
5. Open your browser and go to `http://localhost:3000`

## Usage

### Creating an Invoice

1. Switch to the **"Create Invoice"** tab
2. Fill in customer information:
   - Customer Name (required)
   - Email (optional)
   - Phone (optional)
3. Add items:
   - Enter item name, quantity, and unit price
   - Click **"+ Add Item"** to add more items
   - Click **"✕"** to remove an item
4. Review the calculated totals (subtotal, tax, grand total)
5. Click **"Generate Invoice"** to save

### Viewing Invoices
1. Switch to the **"View Invoices"** tab
2. Click on any invoice card to view full details
3. Use the **"🔄 Refresh"** button to refresh the list

### Invoice Details

When viewing an invoice, you can:
- See all customer and item information
- View the complete breakdown of costs
- Print the invoice using the **"🖨️ Print Invoice"** button
- Delete the invoice using the **"🗑️ Delete Invoice"** button

## Project Structure

```
invoice-system/
├── server.js           # Express server and API routes
├── package.json        # Project dependencies
├── invoices.db        # SQLite database (created automatically)
├── public/
│   ├── index.html     # Main HTML file
│   ├── css/
│   │   └── style.css  # All styling
│   └── js/
│       └── app.js     # Frontend JavaScript logic
└── README.md          # This file
```
## API endpoints

### Create Invoice
```
POST /api/invoices
Body: {
  customer_name: string,
  customer_email: string (optional),
  customer_phone: string (optional),
  items: [{ item_name, quantity, unit_price }],
  total_amount: number,
  tax_amount: number,
  grand_total: number
}
```

### Get All Invoices
```
GET /api/invoices
```

### Get Single Invoice
```
GET /api/invoices/:id
```

### Delete Invoice
```
DELETE /api/invoices/:id
```

## Author
- Aundrea Ncube
[GitHub](https://github.com/AundreaNcube) and 
   [LinkedIn](https://www.linkedin.com/in/aundrea-ncube/)
