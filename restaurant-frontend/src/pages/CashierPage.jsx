import { useEffect, useState } from "react";

const API_BASE = "http://localhost:8080";

export default function CashierPage() {

    const [orders, setOrders] = useState([]);

    async function loadPayments() {

        const response = await fetch(
            `${API_BASE}/orders/payments/pending`
        );

        const data = await response.json();

        setOrders(data);
    }

    useEffect(() => {

        loadPayments();

        const interval = setInterval(loadPayments, 3000);

        return () => clearInterval(interval);

    }, []);

    async function confirmPayment(id) {

        await fetch(
            `${API_BASE}/orders/${id}/status`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    status: "PAID"
                })
            }
        );

        loadPayments();
    }

    return (

        <div style={{ padding:40 }}>

            <h1>Cashier Dashboard</h1>

            <h2>Pending Payments</h2>

            {orders.length === 0 && (
                <p>No pending payments.</p>
            )}

            {orders.map(order => (

                <div
                    key={order.id}
                    style={{
                        border:"1px solid #ddd",
                        borderRadius:12,
                        padding:20,
                        marginBottom:20
                    }}
                >

                    <h3>
                        Table {order.tableNumber}
                    </h3>

                    <p>
                        Customer:
                        {" "}
                        {order.customerName}
                    </p>

                    <p>
                        Payment:
                        {" "}
                        {order.paymentMethod}
                    </p>

                    <p>
                        Total:
                        {" "}
                        ₹{order.totalAmount}
                    </p>

                    <button
                        onClick={() =>
                            confirmPayment(order.id)
                        }
                    >
                        Confirm Payment
                    </button>

                </div>

            ))}

        </div>

    );

}