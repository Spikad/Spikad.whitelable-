import * as React from 'react';
import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Preview,
    Text,
    Section,
    Hr,
    Row,
    Column,
} from '@react-email/components';

interface OrderConfirmationEmailProps {
    orderId: string;
    totalAmount: number;
    items: Array<{ title: string; quantity: number; price: number }>;
    customerName: string;
}

export const OrderConfirmationEmail = ({
    orderId,
    totalAmount,
    items,
    customerName,
}: OrderConfirmationEmailProps) => (
    <Html>
        <Head />
        <Preview>Order Confirmation #{orderId}</Preview>
        <Body style={main}>
            <Container style={container}>
                <Heading style={h1}>Order Confirmed! 🎉</Heading>
                <Text style={text}>
                    Hi {customerName},
                </Text>
                <Text style={text}>
                    Your order #{orderId} has been successfully placed. We'll notify you when it ships.
                </Text>

                <Section style={orderContainer}>
                    {items.map((item, i) => (
                        <Row key={i} style={{ marginBottom: '10px' }}>
                            <Column>
                                <Text style={itemTitle}>{item.title} x {item.quantity}</Text>
                            </Column>
                            <Column style={{ textAlign: 'right' }}>
                                <Text style={itemPrice}>${(item.price * item.quantity).toFixed(2)}</Text>
                            </Column>
                        </Row>
                    ))}
                    <Hr style={hr} />
                    <Row>
                        <Column>
                            <Text style={{ fontWeight: 'bold' }}>Total</Text>
                        </Column>
                        <Column style={{ textAlign: 'right' }}>
                            <Text style={{ fontWeight: 'bold' }}>${totalAmount.toFixed(2)}</Text>
                        </Column>
                    </Row>
                </Section>

                <Text style={footer}>
                    Thanks for shopping with us!
                </Text>
            </Container>
        </Body>
    </Html>
);

export default OrderConfirmationEmail;

const main = {
    backgroundColor: '#ffffff',
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
    margin: '0 auto',
    padding: '20px 0 48px',
    maxWidth: '560px',
};

const h1 = {
    fontSize: '24px',
    fontWeight: '600',
    lineHeight: '1.1',
    marginBottom: '24px',
};

const text = {
    fontSize: '16px',
    lineHeight: '1.4',
    color: '#484848',
    marginBottom: '24px',
};

const orderContainer = {
    padding: '20px',
    backgroundColor: '#f9f9f9',
    borderRadius: '5px',
    marginBottom: '24px',
};

const itemTitle = {
    fontSize: '14px',
    margin: 0,
};
const itemPrice = {
    fontSize: '14px',
    margin: 0,
    fontWeight: '600',
};

const hr = {
    borderColor: '#e6ebf1',
    margin: '20px 0',
};

const footer = {
    color: '#8898aa',
    fontSize: '12px',
};
