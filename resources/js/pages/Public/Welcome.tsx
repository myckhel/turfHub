import { ArrowRightOutlined, RocketOutlined, SafetyOutlined, StarOutlined } from '@ant-design/icons';
import { Link } from '@inertiajs/react';
import { Button, Card, Col, Row, Typography } from 'antd';
import React from 'react';
import { AnimatedCard, PageTransition } from '../../components/shared/GSAPAnimations';

const { Title, Paragraph } = Typography;

const Welcome: React.FC = () => {
  const features = [
    {
      icon: <RocketOutlined className="text-4xl text-emerald-500" />,
      title: 'Easy Booking',
      description: 'Book your favorite sports facilities in just a few clicks. Quick, simple, and hassle-free.',
    },
    {
      icon: <SafetyOutlined className="text-4xl text-emerald-500" />,
      title: 'Secure Payments',
      description: 'Your payments are safe with our secure payment system. Multiple payment options available.',
    },
    {
      icon: <StarOutlined className="text-4xl text-emerald-500" />,
      title: 'Premium Facilities',
      description: 'Access to top-quality sports facilities and equipment. Professional grade surfaces and amenities.',
    },
  ];

  return (
    <PageTransition>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-emerald-50 to-blue-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Title level={1} className="mb-6 text-5xl font-bold text-gray-900 md:text-6xl">
              Your Gateway to
              <span className="text-emerald-500"> Premium Sports</span> Facilities
            </Title>

            <Paragraph className="mx-auto mb-8 max-w-3xl text-xl text-gray-600">
              Discover, book and enjoy world-class sports facilities. From football pitches to basketball courts, find your perfect playing ground
              today.
            </Paragraph>

            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link href={route('register')}>
                <Button
                  type="primary"
                  size="large"
                  className="h-auto border-emerald-500 bg-emerald-500 px-8 py-6 text-lg hover:bg-emerald-600"
                  icon={<ArrowRightOutlined />}
                >
                  Get Started Free
                </Button>
              </Link>

              <Link href={route('welcome')}>
                <Button size="large" className="h-auto px-8 py-6 text-lg">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <Title level={2} className="mb-4 text-4xl font-bold text-gray-900">
              Why Choose TurfHub?
            </Title>
            <Paragraph className="mx-auto max-w-2xl text-xl text-gray-600">
              We make sports facility booking simple, secure, and accessible for everyone.
            </Paragraph>
          </div>

          <Row gutter={[32, 32]}>
            {features.map((feature, index) => (
              <Col xs={24} md={8} key={index}>
                <AnimatedCard className="h-full">
                  <Card className="h-full border-0 text-center shadow-sm" bodyStyle={{ padding: '2rem' }}>
                    <div className="mb-4">{feature.icon}</div>
                    <Title level={3} className="mb-3 text-xl font-semibold">
                      {feature.title}
                    </Title>
                    <Paragraph className="text-gray-600">{feature.description}</Paragraph>
                  </Card>
                </AnimatedCard>
              </Col>
            ))}
          </Row>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-emerald-500 py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <Title level={2} className="mb-4 text-4xl font-bold text-white">
            Ready to Get Started?
          </Title>
          <Paragraph className="mb-8 text-xl text-emerald-100">
            Join thousands of sports enthusiasts who trust TurfHub for their facility booking needs.
          </Paragraph>

          <Link href={route('register')}>
            <Button
              type="primary"
              size="large"
              className="h-auto border-white bg-white px-8 py-6 text-lg font-semibold text-emerald-500 hover:bg-gray-50"
            >
              Start Booking Today
            </Button>
          </Link>
        </div>
      </section>
    </PageTransition>
  );
};

export default Welcome;
