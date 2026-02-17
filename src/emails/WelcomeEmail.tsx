import * as React from 'react';
import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Link,
    Preview,
    Text,
    Section,
    Button
} from '@react-email/components';

interface WelcomeEmailProps {
    name: string;
    loginUrl: string;
}

export const WelcomeEmail = ({
    name,
    loginUrl,
}: WelcomeEmailProps) => (
    <Html>
        <Head />
        <Preview>Welcome to Spikad!</Preview>
        <Body style={main}>
            <Container style={container}>
                <Heading style={h1}>Welcome, {name}! 🚀</Heading>
                <Text style={text}>
                    Thanks for starting your journey with Spikad. We're excited to help you build your business.
                </Text>
                <Section style={btnContainer}>
                    <Button style={button} href={loginUrl}>
                        Go to Dashboard
                    </Button>
                </Section>
                <Text style={text}>
                    If you have any questions, just reply to this email.
                </Text>
            </Container>
        </Body>
    </Html>
);

export default WelcomeEmail;

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

const btnContainer = {
    textAlign: 'center' as const,
    marginBottom: '24px',
};

const button = {
    backgroundColor: '#000000',
    borderRadius: '5px',
    color: '#fff',
    fontSize: '16px',
    fontWeight: 'bold',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'block',
    padding: '12px 24px',
};
