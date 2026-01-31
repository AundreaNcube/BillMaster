// Currency symbols mapping
const currencySymbols = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
    'ZAR': 'R',
    'NGN': '₦',
    'KES': 'KSh',
    'GHS': '₵',
    'INR': '₹',
    'AUD': 'A$',
    'CAD': 'C$'
};

// Get current currency symbol
function getCurrencySymbol() {
    const currency = document.getElementById('currency').value;
    return currencySymbols[currency] || '$';
}

// Format amount with currency
function formatCurrency(amount) {
    const symbol = getCurrencySymbol();
    const currency = document.getElementById('currency').value;

    // Japanese Yen doesn't use decimals
    if (currency === 'JPY') {
        return `${symbol}${Math.round(amount).toLocaleString()}`;
    }

    return `${symbol}${amount.toFixed(2)}`;
}

document.querySelectorAll('.tab-btn').forEach(button => {
    button.addEventListener('click', () => {
        const tabName = button.getAttribute('data-tab');

        // Update active tab button
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        // Update active tab content
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(`${tabName}-tab`).classList.add('active');

        // Load invoices when switching to view tab
        if (tabName === 'view') {
            loadInvoices();
        }
    });
});

// Add new item row
function addItem() {
    const container = document.getElementById('items-container');
    const itemRow = document.createElement('div');
    itemRow.className = 'item-row';
    itemRow.innerHTML = `
        <div class="form-group">
            <label>Item Name *</label>
            <input type="text" class="item-name" required>
        </div>
        <div class="form-group">
            <label>Quantity *</label>
            <input type="number" class="item-quantity" min="1" value="1" required>
        </div>
        <div class="form-group">
            <label>Unit Price *</label>
            <input type="number" class="item-price" min="0" step="0.01" required>
        </div>
        <div class="form-group">
            <label>Total</label>
            <input type="text" class="item-total" readonly>
        </div>
        <button type="button" class="btn-remove" onclick="removeItem(this)">✕</button>
    `;
    container.appendChild(itemRow);
    attachItemCalculators();
}

// Remove item row
function removeItem(button) {
    const itemRows = document.querySelectorAll('.item-row');
    if (itemRows.length > 1) {
        button.closest('.item-row').remove();
        calculateTotals();
    } else {
        showMessage('At least one item is required', 'error');
    }
}

// Calculate item total and invoice totals
function attachItemCalculators() {
    document.querySelectorAll('.item-quantity, .item-price').forEach(input => {
        input.removeEventListener('input', calculateItemTotal);
        input.addEventListener('input', calculateItemTotal);
    });

    document.getElementById('tax_rate').removeEventListener('input', calculateTotals);
    document.getElementById('tax_rate').addEventListener('input', calculateTotals);

    // Add currency change listener
    document.getElementById('currency').removeEventListener('change', calculateTotals);
    document.getElementById('currency').addEventListener('change', calculateTotals);
}

function calculateItemTotal(e) {
    const row = e.target.closest('.item-row');
    const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
    const price = parseFloat(row.querySelector('.item-price').value) || 0;
    const total = quantity * price;
    row.querySelector('.item-total').value = formatCurrency(total);
    calculateTotals();
}

function calculateTotals() {
    let subtotal = 0;

    document.querySelectorAll('.item-row').forEach(row => {
        const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
        const price = parseFloat(row.querySelector('.item-price').value) || 0;
        subtotal += quantity * price;
    });

    const taxRate = parseFloat(document.getElementById('tax_rate').value) || 0;
    const tax = subtotal * (taxRate / 100);
    const grandTotal = subtotal + tax;

    document.getElementById('subtotal').textContent = formatCurrency(subtotal);
    document.getElementById('tax').textContent = formatCurrency(tax);
    document.getElementById('grand-total').textContent = formatCurrency(grandTotal);
}

// Initialize calculators
attachItemCalculators();

// Handle form submission
document.getElementById('invoice-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    // Collect customer data
    const customerName = document.getElementById('customer_name').value;
    const customerEmail = document.getElementById('customer_email').value;
    const customerPhone = document.getElementById('customer_phone').value;

    // Collect items
    const items = [];
    document.querySelectorAll('.item-row').forEach(row => {
        const itemName = row.querySelector('.item-name').value;
        const quantity = parseInt(row.querySelector('.item-quantity').value);
        const unitPrice = parseFloat(row.querySelector('.item-price').value);

        if (itemName && quantity && unitPrice) {
            items.push({
                item_name: itemName,
                quantity: quantity,
                unit_price: unitPrice
            });
        }
    });

    if (items.length === 0) {
        showMessage('Please add at least one item', 'error');
        return;
    }

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const taxRate = parseFloat(document.getElementById('tax_rate').value) || 0;
    const taxAmount = subtotal * (taxRate / 100);
    const grandTotal = subtotal + taxAmount;

    // Create invoice
    try {
        const response = await fetch('/api/invoices', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                customer_name: customerName,
                customer_email: customerEmail,
                customer_phone: customerPhone,
                items: items,
                total_amount: subtotal,
                tax_amount: taxAmount,
                grand_total: grandTotal,
                currency: document.getElementById('currency').value
            })
        });

        const data = await response.json();

        if (data.success) {
            showMessage(`Invoice #${data.invoice_id} created successfully!`, 'success');
            document.getElementById('invoice-form').reset();
            calculateTotals();

            // Reset items container to one row
            const container = document.getElementById('items-container');
            container.innerHTML = `
                <div class="item-row">
                    <div class="form-group">
                        <label>Item Name *</label>
                        <input type="text" class="item-name" required>
                    </div>
                    <div class="form-group">
                        <label>Quantity *</label>
                        <input type="number" class="item-quantity" min="1" value="1" required>
                    </div>
                    <div class="form-group">
                        <label>Unit Price *</label>
                        <input type="number" class="item-price" min="0" step="0.01" required>
                    </div>
                    <div class="form-group">
                        <label>Total</label>
                        <input type="text" class="item-total" readonly>
                    </div>
                    <button type="button" class="btn-remove" onclick="removeItem(this)">✕</button>
                </div>
            `;
            attachItemCalculators();

            // Show the invoice
            setTimeout(() => {
                viewInvoice(data.invoice_id);
            }, 1000);
        } else {
            showMessage('Error creating invoice: ' + data.error, 'error');
        }
    } catch (error) {
        showMessage('Error: ' + error.message, 'error');
    }
});

// Load all invoices
async function loadInvoices() {
    const container = document.getElementById('invoices-container');
    container.innerHTML = '<p class="loading">Loading invoices...</p>';

    try {
        const response = await fetch('/api/invoices');
        const data = await response.json();

        if (!data.invoices || data.invoices.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No invoices yet</h3>
                    <p>Create your first invoice to get started!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = '';
        data.invoices.forEach(invoice => {
            const invoiceCard = document.createElement('div');
            invoiceCard.className = 'invoice-card';
            invoiceCard.onclick = () => viewInvoice(invoice.id);

            const date = new Date(invoice.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            invoiceCard.innerHTML = `
    <div class="invoice-card-header">
        <span class="invoice-number">Invoice #${invoice.id}</span>
        <span class="invoice-date">${date}</span>
    </div>
    <div class="invoice-customer">${invoice.customer_name}</div>
    ${invoice.customer_email ? `<div style="color: #666; font-size: 0.9rem;">${invoice.customer_email}</div>` : ''}
    <div class="invoice-amount">${currencySymbols[invoice.currency] || '$'}${invoice.grand_total.toFixed(2)}</div>
`;

            container.appendChild(invoiceCard);
        });
    } catch (error) {
        container.innerHTML = `<p class="error">Error loading invoices: ${error.message}</p>`;
    }
}

// View invoice details
async function viewInvoice(invoiceId) {
    try {
        const response = await fetch(`/api/invoices/${invoiceId}`);
        const data = await response.json();

        if (data.invoice) {
            displayInvoiceDetail(data.invoice);
        } else {
            showMessage('Invoice not found', 'error');
        }
    } catch (error) {
        showMessage('Error loading invoice: ' + error.message, 'error');
    }
}

// Display invoice details in modal
function displayInvoiceDetail(invoice) {
    const modal = document.getElementById('invoice-modal');
    const detailContainer = document.getElementById('invoice-detail');

    const date = new Date(invoice.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    // Get currency symbol
    const currencySymbol = currencySymbols[invoice.currency] || '$';
    const isJPY = invoice.currency === 'JPY';

    let itemsHtml = '';
    invoice.items.forEach(item => {
        itemsHtml += `
            <tr>
                <td>${item.item_name}</td>
                <td>${item.quantity}</td>
                <td>${currencySymbol}${isJPY ? Math.round(item.unit_price).toLocaleString() : item.unit_price.toFixed(2)}</td>
                <td>${currencySymbol}${isJPY ? Math.round(item.total_price).toLocaleString() : item.total_price.toFixed(2)}</td>
            </tr>
        `;
    });

    detailContainer.innerHTML = `
        <div class="invoice-detail-header">
            <h2>Invoice #${invoice.id}</h2>
            <p>${date}</p>
        </div>
        
        <div class="detail-section">
            <h3>Customer Information</h3>
            <p><strong>Name:</strong> ${invoice.customer_name}</p>
            ${invoice.customer_email ? `<p><strong>Email:</strong> ${invoice.customer_email}</p>` : ''}
            ${invoice.customer_phone ? `<p><strong>Phone:</strong> ${invoice.customer_phone}</p>` : ''}
            <p><strong>Currency:</strong> ${invoice.currency}</p>
        </div>
        
        <div class="detail-section">
            <h3>Items</h3>
            <table class="items-table">
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Quantity</th>
                        <th>Unit Price</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>
        </div>
        
        <div class="detail-section">
            <div class="invoice-summary">
                <div class="summary-row">
                    <span>Subtotal:</span>
                    <span>${currencySymbol}${isJPY ? Math.round(invoice.total_amount).toLocaleString() : invoice.total_amount.toFixed(2)}</span>
                </div>
                <div class="summary-row">
                    <span>Tax:</span>
                    <span>${currencySymbol}${isJPY ? Math.round(invoice.tax_amount).toLocaleString() : invoice.tax_amount.toFixed(2)}</span>
                </div>
                <div class="summary-row total">
                    <span>Grand Total:</span>
                    <span>${currencySymbol}${isJPY ? Math.round(invoice.grand_total).toLocaleString() : invoice.grand_total.toFixed(2)}</span>
                </div>
            </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
            <button class="btn-primary" onclick="window.print()">Print Invoice</button>
            <button class="delete-btn" onclick="deleteInvoice(${invoice.id})">Delete Invoice</button>
        </div>
    `;

    modal.style.display = 'block';
}

// Close modal
function closeModal() {
    document.getElementById('invoice-modal').style.display = 'none';
}

// Close modal when clicking outside
window.onclick = function (event) {
    const modal = document.getElementById('invoice-modal');
    if (event.target === modal) {
        closeModal();
    }
}

// Delete invoice
async function deleteInvoice(invoiceId) {
    if (!confirm('Are you sure you want to delete this invoice?')) {
        return;
    }

    try {
        const response = await fetch(`/api/invoices/${invoiceId}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
            showMessage('Invoice deleted successfully', 'success');
            closeModal();
            loadInvoices();
        } else {
            showMessage('Error deleting invoice: ' + data.error, 'error');
        }
    } catch (error) {
        showMessage('Error: ' + error.message, 'error');
    }
}

// Show message notification
function showMessage(message, type = 'success') {
    const container = document.getElementById('message-container');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;

    container.appendChild(messageDiv);

    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}

// Form reset handler
document.getElementById('invoice-form').addEventListener('reset', () => {
    setTimeout(() => {
        // Keep only one item row
        const itemsContainer = document.getElementById('items-container');
        const itemRows = itemsContainer.querySelectorAll('.item-row');
        for (let i = 1; i < itemRows.length; i++) {
            itemRows[i].remove();
        }
        calculateTotals();
    }, 0);
});