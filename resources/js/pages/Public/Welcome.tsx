import type { SharedData } from '@/types';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  DashboardOutlined,
  GlobalOutlined,
  PlayCircleOutlined,
  StarFilled,
  TeamOutlined,
  TrophyOutlined,
  UsergroupAddOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { useGSAP } from '@gsap/react';
import { router, usePage } from '@inertiajs/react';
import { Avatar, Button, Card, Col, Row, Space, Steps, Typography } from 'antd';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import React, { memo, useRef } from 'react';
import { createSessionImage, matchEventImage, matchQueueImage, teamAssignmentImage, turfDashImage } from '../../assets/images/landing';
import { useTheme } from '../../hooks/useTheme';

const { Title, Paragraph, Text } = Typography;

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

// Hero Section Component
const HeroSection: React.FC = memo(() => {
  const { reducedMotion } = useTheme();
  const { name } = usePage<SharedData>().props;
  const heroRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const subheadingRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (reducedMotion) return;

    const tl = gsap.timeline({ delay: 0.2 });

    // Hero entrance animations
    tl.fromTo(headlineRef.current, { y: 100, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power3.out' })
      .fromTo(subheadingRef.current, { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'power2.out' }, '-=0.5')
      .fromTo(ctaRef.current, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'back.out(1.7)' }, '-=0.3');
  }, [reducedMotion]);

  const handleTryApp = () => {
    router.visit(route('register'));
  };

  const handleJoinTurf = () => {
    router.visit(route('login'));
  };

  return (
    <div ref={heroRef} className="hero-gradient relative min-h-screen overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,${encodeURIComponent('<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd"><g fill="#ffffff" fill-opacity="0.4"><circle cx="30" cy="30" r="1"/></g></g></svg>')}")`,
          }}
        />
      </div>

      <div className="relative z-10 flex min-h-screen items-center">
        <div className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 lg:px-8">
          {/* Hero Content */}
          <div ref={headlineRef} className="mb-8">
            <Title level={1} className="hero-title mb-0 text-5xl font-bold text-white sm:text-6xl lg:text-7xl" style={{ lineHeight: '1.1' }}>
              Queue. Play. Win. <span className="bg-gradient-to-r from-yellow-400 to-yellow-300 bg-clip-text text-transparent">Repeat.</span>
            </Title>
          </div>

          <div ref={subheadingRef} className="mb-12">
            <Paragraph className="hero-subtitle mx-auto max-w-3xl text-xl text-white/90 sm:text-2xl">
              {name} makes organizing and playing mini football matches effortless. Join teams, manage sessions, and experience the future of turf
              sports.
            </Paragraph>
          </div>

          {/* CTA Buttons */}
          <div ref={ctaRef} className="hero-cta">
            <Space size="large" className="flex flex-col items-center justify-center gap-4 sm:flex-row" wrap>
              <Button
                type="primary"
                size="large"
                icon={<PlayCircleOutlined />}
                onClick={handleTryApp}
                className="h-14 border-none bg-white px-8 text-lg font-semibold text-green-600 shadow-xl transition-all duration-300 hover:scale-105 hover:bg-white/90 hover:shadow-2xl"
              >
                Try {name}
              </Button>
              <Button
                ghost
                size="large"
                icon={<TeamOutlined />}
                onClick={handleJoinTurf}
                className="h-14 border-2 border-white/30 px-8 text-lg font-medium text-white backdrop-blur-sm transition-all duration-300 hover:border-white/50 hover:bg-white/10"
              >
                Join a Turf
              </Button>
            </Space>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="scroll-indicator absolute bottom-8 left-1/2 -translate-x-1/2">
        <div className="h-8 w-5 rounded-full border-2 border-white/30">
          <div className="mx-auto mt-2 h-2 w-1 animate-pulse rounded-full bg-white/60" />
        </div>
      </div>
    </div>
  );
});

// How It Works Section
const HowItWorksSection: React.FC = memo(() => {
  const { reducedMotion } = useTheme();
  const { name } = usePage<SharedData>().props;
  const sectionRef = useRef<HTMLDivElement>(null);

  const steps = [
    {
      title: 'Join or Create a Turf',
      description: 'Find local turfs or create your own football community',
      icon: <UsergroupAddOutlined className="text-3xl" />,
    },
    {
      title: 'Pay to Secure Your Slot',
      description: 'Quick and secure payment to guarantee your team position',
      icon: <WalletOutlined className="text-3xl" />,
    },
    {
      title: 'Play in Rotating Sessions',
      description: 'Enjoy organized matches with fair team rotation system',
      icon: <TeamOutlined className="text-3xl" />,
    },
    {
      title: 'View Results & History',
      description: 'Track your performance and match statistics over time',
      icon: <TrophyOutlined className="text-3xl" />,
    },
  ];

  useGSAP(() => {
    if (reducedMotion) return;

    gsap.fromTo(
      sectionRef.current,
      { y: 50, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 1,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
          end: 'bottom 20%',
        },
      },
    );
  }, [reducedMotion]);

  return (
    <div ref={sectionRef} className="bg-gray-50 py-20 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <Title level={2} className="mb-4 text-gray-900 dark:text-white">
            How It Works
          </Title>
          <Paragraph className="mx-auto mb-16 max-w-2xl text-lg text-gray-600 dark:text-gray-300">
            Get started with {name} in four simple steps and revolutionize your football experience
          </Paragraph>
        </div>

        {/* Desktop Steps */}
        <div className="hidden md:block">
          <Steps
            current={-1}
            className="mb-16"
            items={steps.map((step) => ({
              title: step.title,
              description: step.description,
              icon: step.icon,
            }))}
          />
        </div>

        {/* Mobile Cards */}
        <div className="grid gap-8 md:hidden">
          {steps.map((step, index) => (
            <Card key={index} className="landing-card border-none shadow-lg" bodyStyle={{ padding: '24px' }}>
              <div className="flex items-start space-x-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">{step.icon}</div>
                <div className="flex-1">
                  <Title level={4} className="mb-2">
                    {step.title}
                  </Title>
                  <Text className="text-gray-600">{step.description}</Text>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
});

// Features Section
const FeaturesSection: React.FC = memo(() => {
  const { reducedMotion } = useTheme();
  const sectionRef = useRef<HTMLDivElement>(null);

  const features = [
    {
      title: 'Real-time Team Rotation',
      description: 'Smart algorithm ensures fair play with automatic team balancing and rotation management.',
      icon: <TeamOutlined className="text-4xl text-green-600" />,
      imagePosition: 'right',
      image: matchQueueImage,
    },
    {
      title: 'Session Scheduling',
      description: 'Flexible morning and evening sessions that fit your schedule and lifestyle.',
      icon: <ClockCircleOutlined className="text-4xl text-blue-600" />,
      imagePosition: 'left',
      image: createSessionImage,
    },
    {
      title: 'Auto Team Assignment',
      description: 'No more awkward team picking. Our system creates balanced teams automatically.',
      icon: <UsergroupAddOutlined className="text-4xl text-purple-600" />,
      imagePosition: 'right',
      image: teamAssignmentImage,
    },
    {
      title: 'Match Event Tracking',
      description: 'Track goals, cards, substitutions, and player statistics in real-time.',
      icon: <TrophyOutlined className="text-4xl text-red-600" />,
      imagePosition: 'right',
      image: matchEventImage,
    },
  ];

  useGSAP(() => {
    if (reducedMotion) return;

    features.forEach((_, index) => {
      gsap.fromTo(
        `.feature-${index}`,
        { x: index % 2 === 0 ? -50 : 50, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: `.feature-${index}`,
            start: 'top 80%',
          },
        },
      );
    });
  }, [reducedMotion]);

  return (
    <div ref={sectionRef} className="bg-white py-20 dark:bg-gray-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <Title level={2} className="mb-4 text-gray-900 dark:text-white">
            Powerful Features
          </Title>
          <Paragraph className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-300">
            Everything you need to manage and enjoy football sessions like never before
          </Paragraph>
        </div>

        <div className="space-y-20">
          {features.map((feature, index) => (
            <div key={index} className={`feature-${index}`}>
              <Row gutter={[48, 24]} align="middle">
                <Col xs={24} lg={12} order={feature.imagePosition === 'left' ? 2 : 1}>
                  <div className="space-y-6">
                    <div className="flex items-center space-x-4">
                      {feature.icon}
                      <Title level={3} className="mb-0">
                        {feature.title}
                      </Title>
                    </div>
                    <Paragraph className="text-lg text-gray-600 dark:text-gray-300">{feature.description}</Paragraph>
                  </div>
                </Col>
                <Col xs={24} lg={12} order={feature.imagePosition === 'left' ? 1 : 2}>
                  <div className="feature-image-mock rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 shadow-lg dark:from-gray-700 dark:to-gray-800">
                    <img src={feature.image} alt={feature.title} />
                  </div>
                </Col>
              </Row>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

// For Turf Managers Section
const TurfManagersSection: React.FC = memo(() => {
  const { reducedMotion } = useTheme();
  const sectionRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (reducedMotion) return;

    gsap.fromTo(
      sectionRef.current,
      { y: 50, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 1,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
        },
      },
    );
  }, [reducedMotion]);

  return (
    <div ref={sectionRef} className="bg-gray-50 py-20 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Row gutter={[48, 24]} align="middle">
          <Col xs={24} lg={12}>
            <div className="space-y-6">
              <Title level={2} className="text-gray-900 dark:text-white">
                For Turf Managers
              </Title>
              <Paragraph className="text-lg text-gray-600 dark:text-gray-300">
                Streamline your turf operations with powerful management tools. Start sessions, assign teams, track scores, and manage payments all in
                one place.
              </Paragraph>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CheckCircleOutlined className="text-green-600" />
                  <Text>Automated session management</Text>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircleOutlined className="text-green-600" />
                  <Text>Real-time payment tracking</Text>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircleOutlined className="text-green-600" />
                  <Text>Player performance analytics</Text>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircleOutlined className="text-green-600" />
                  <Text>Revenue optimization tools</Text>
                </div>
              </div>
              <Button type="primary" size="large" icon={<DashboardOutlined />} className="bg-green-600 hover:bg-green-700">
                Start Managing
              </Button>
            </div>
          </Col>
          <Col xs={24} lg={12}>
            <div className="feature-image-mock rounded-lg bg-gradient-to-br from-white to-gray-50 shadow-xl dark:from-gray-800 dark:to-gray-900">
              <img src={turfDashImage} alt="Turf Manager Dashboard" className="h-auto w-full rounded-lg" />
            </div>
          </Col>
        </Row>
      </div>
    </div>
  );
});

// For Players Section
const PlayersSection: React.FC = memo(() => {
  const { reducedMotion } = useTheme();
  const sectionRef = useRef<HTMLDivElement>(null);

  const playerBenefits = [
    {
      title: 'Fair Play',
      description: 'Balanced teams and fair rotation system',
      icon: <TeamOutlined className="text-3xl text-blue-600" />,
    },
    {
      title: 'Easy Payments',
      description: 'Secure, quick, and transparent transactions',
      icon: <WalletOutlined className="text-3xl text-green-600" />,
    },
    {
      title: 'Auto Teams',
      description: 'No more awkward team selections',
      icon: <UsergroupAddOutlined className="text-3xl text-purple-600" />,
    },
    {
      title: 'Real-time Updates',
      description: 'Get notified when your team plays',
      icon: <GlobalOutlined className="text-3xl text-orange-600" />,
    },
  ];

  useGSAP(() => {
    if (reducedMotion) return;

    gsap.fromTo(
      sectionRef.current,
      { y: 50, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 1,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
        },
      },
    );
  }, [reducedMotion]);

  return (
    <div ref={sectionRef} className="bg-white py-20 dark:bg-gray-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <Title level={2} className="mb-4 text-gray-900 dark:text-white">
            For Players
          </Title>
          <Paragraph className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-300">
            Get notified when your team plays. Join easily. Play fair and fast.
          </Paragraph>
        </div>

        <Row gutter={[24, 24]}>
          {playerBenefits.map((benefit, index) => (
            <Col xs={24} sm={12} lg={6} key={index}>
              <Card
                className="landing-card h-full border-none text-center shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                bodyStyle={{ padding: '32px 24px' }}
              >
                <div className="mb-4">{benefit.icon}</div>
                <Title level={4} className="mb-2">
                  {benefit.title}
                </Title>
                <Text className="text-gray-600 dark:text-gray-300">{benefit.description}</Text>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
});

// Testimonials Section
const TestimonialsSection: React.FC = memo(() => {
  const { reducedMotion } = useTheme();
  const { name } = usePage<SharedData>().props;
  const sectionRef = useRef<HTMLDivElement>(null);

  const testimonials = [
    {
      name: 'Ahmed Hassan',
      role: 'Regular Player',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmed',
      content: `${name} changed how we play football. No more arguments about teams or payment!`,
      rating: 5,
    },
    {
      name: 'Fatima Adebayo',
      role: 'Turf Manager',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Fatima',
      content: `Managing sessions is now effortless. My revenue increased by 40% since using ${name}.`,
      rating: 5,
    },
    {
      name: 'Kemi Okafor',
      role: 'Weekend Player',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kemi',
      content: 'I love the automatic team creation. Everyone gets equal playing time now.',
      rating: 5,
    },
  ];

  useGSAP(() => {
    if (reducedMotion) return;

    gsap.fromTo(
      '.testimonial-card',
      { y: 50, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.8,
        ease: 'power2.out',
        stagger: 0.2,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
        },
      },
    );
  }, [reducedMotion]);

  return (
    <div ref={sectionRef} className="bg-gray-50 py-20 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <Title level={2} className="mb-4 text-gray-900 dark:text-white">
            What People Say
          </Title>
          <Paragraph className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-300">
            Join thousands of players and managers who have transformed their football experience
          </Paragraph>
        </div>

        <Row gutter={[24, 24]}>
          {testimonials.map((testimonial, index) => (
            <Col xs={24} lg={8} key={index}>
              <Card className="testimonial-card landing-card h-full border-none shadow-lg">
                <div className="mb-4 flex items-center space-x-1">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <StarFilled key={i} className="text-yellow-500" />
                  ))}
                </div>
                <Paragraph className="mb-6 text-gray-600 dark:text-gray-300">"{testimonial.content}"</Paragraph>
                <div className="flex items-center space-x-3">
                  <Avatar src={testimonial.avatar} size={48} />
                  <div>
                    <Text strong>{testimonial.name}</Text>
                    <br />
                    <Text className="text-gray-500">{testimonial.role}</Text>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
});

// Final CTA Section
const FinalCTASection: React.FC = memo(() => {
  const { reducedMotion } = useTheme();
  const sectionRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (reducedMotion) return;

    gsap.fromTo(
      sectionRef.current,
      { y: 50, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 1,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
        },
      },
    );
  }, [reducedMotion]);

  const handleGetStarted = () => {
    router.visit(route('register'));
  };

  const handleCreateTurf = () => {
    router.visit(route('login'));
  };

  return (
    <div
      ref={sectionRef}
      className="relative overflow-hidden py-20"
      style={{
        background: 'linear-gradient(135deg, var(--color-turf-green) 0%, #22c55e 50%, #16a34a 100%)',
      }}
    >
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,${encodeURIComponent('<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd"><g fill="#ffffff" fill-opacity="0.4"><circle cx="30" cy="30" r="1"/></g></g></svg>')}")`,
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <Title level={2} className="mb-6 text-white">
          Start Your First Session Today
        </Title>
        <Paragraph className="mx-auto mb-12 max-w-2xl text-xl text-white/90">
          Join the revolution in turf football. Experience fair play, smart management, and endless fun.
        </Paragraph>

        <Space size="large" className="flex flex-col items-center justify-center gap-4 sm:flex-row" wrap>
          <Button
            type="primary"
            size="large"
            icon={<PlayCircleOutlined />}
            onClick={handleGetStarted}
            className="h-14 border-none bg-white px-8 text-lg font-semibold text-green-600 shadow-xl transition-all duration-300 hover:scale-105 hover:bg-white/90 hover:shadow-2xl"
          >
            Get Started Now
          </Button>
          <Button
            ghost
            size="large"
            icon={<DashboardOutlined />}
            onClick={handleCreateTurf}
            className="h-14 border-2 border-white/30 px-8 text-lg font-medium text-white backdrop-blur-sm transition-all duration-300 hover:border-white/50 hover:bg-white/10"
          >
            Create a Turf
          </Button>
        </Space>

        <div className="mt-12">
          <Text className="text-white/70">Free to join • No setup fees • Start playing immediately</Text>
        </div>
      </div>
    </div>
  );
});

// Main Welcome Component
const Welcome: React.FC = () => {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <HowItWorksSection />
      <FeaturesSection />
      <TurfManagersSection />
      <PlayersSection />
      <TestimonialsSection />
      <FinalCTASection />
    </div>
  );
};

export default Welcome;
