import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Img,
  Sequence,
  staticFile,
  Audio,
} from 'remotion';
import {Lottie, LottieAnimationData} from '@remotion/lottie';
import {loadFont} from '@remotion/google-fonts/Poppins';
import {loadFont as loadInter} from '@remotion/google-fonts/Inter';

const {fontFamily: poppinsFontFamily} = loadFont();
const {fontFamily: interFontFamily} = loadInter();

const confettiAnimation = require('../public/confetti.json') as LottieAnimationData;

// App theme colors
const colors = {
  bg: '#f6effe', // myColor-50
  bgGradientStart: '#ede0fc', // myColor-100
  bgGradientEnd: '#f6effe', // myColor-50
  primary: '#a763f1', // myColor-500
  primaryDark: '#864fc1', // myColor-600
  text: '#211430', // myColor-900
  textLight: '#643b91', // myColor-700
};

export const AmgelJodiShowcase: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${colors.bgGradientStart} 0%, ${colors.bg} 50%, ${colors.bgGradientEnd} 100%)`,
      }}
    >
      {/* Background celebration music - "On Repeat" by Marcus P. (starts from 5s mark) */}
      <Audio
        src={staticFile('celebration-music.mp3')}
        volume={0.8}
        startFrom={0}
      />

      {/* Subtle background pattern */}
      <AbsoluteFill
        style={{
          opacity: 0.05,
          backgroundImage: `radial-gradient(circle at 25% 25%, ${colors.primary} 2%, transparent 2%), radial-gradient(circle at 75% 75%, ${colors.primaryDark} 2%, transparent 2%)`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Scene 1: Logo Reveal with Tagline (0-90 frames / 0-3s) */}
      <Sequence from={0} durationInFrames={90}>
        <LogoReveal />
      </Sequence>

      {/* Scene 2: Screenshot 1 (90-150 frames / 3-5s) */}
      <Sequence from={90} durationInFrames={60}>
        <ScreenshotReveal screenshot="1.png" />
      </Sequence>

      {/* Scene 3: Screenshot 2 (150-210 frames / 5-7s) */}
      <Sequence from={150} durationInFrames={60}>
        <ScreenshotReveal screenshot="2.png" />
      </Sequence>

      {/* Scene 4: Screenshot 3 (210-270 frames / 7-9s) */}
      <Sequence from={210} durationInFrames={60}>
        <ScreenshotReveal screenshot="3.png" />
      </Sequence>

      {/* Scene 5: Screenshot 4 (270-330 frames / 9-11s) */}
      <Sequence from={270} durationInFrames={60}>
        <ScreenshotReveal screenshot="5.png" />
      </Sequence>

      {/* Scene 6: Screenshot 5 (330-390 frames / 11-13s) */}
      <Sequence from={330} durationInFrames={60}>
        <ScreenshotReveal screenshot="7.png" />
      </Sequence>

      {/* Scene 7: Features with Celebration (390-480 frames / 13-16s) */}
      <Sequence from={390} durationInFrames={90}>
        <FeaturesAndCelebration />
      </Sequence>

      {/* Scene 8: Final CTA (480-570 frames / 16-19s) */}
      <Sequence from={480} durationInFrames={90}>
        <FinalCTA />
      </Sequence>
    </AbsoluteFill>
  );
};

const LogoReveal: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const logoScale = spring({
    frame,
    fps,
    from: 0.5,
    to: 1,
    durationInFrames: 35,
    config: {
      damping: 12,
    },
  });

  const logoOpacity = interpolate(frame, [0, 20], [0, 1]);

  // Logo rotation with spring for settling effect
  const logoRotate = spring({
    frame,
    fps,
    from: 180,
    to: 0,
    durationInFrames: 45,
    config: {
      damping: 15,
      stiffness: 80,
    },
  });

  const taglineOpacity = interpolate(frame, [40, 60], [0, 1]);
  const taglineY = interpolate(frame, [40, 60], [30, 0]);

  return (
    <AbsoluteFill>
      {/* Background image */}
      <Img
        src={staticFile('d-ng-h-u-CCjgYjUudxE-unsplash.jpg')}
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
        }}
      />

      {/* Semi-transparent gradient overlay for text readability */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(135deg, ${colors.bgGradientStart}CC 0%, ${colors.bg}DD 50%, ${colors.bgGradientEnd}CC 100%)`,
        }}
      />

      {/* Animated background with hearts pattern */}
      <AbsoluteFill
        style={{
          opacity: 0.04,
          background: `
            radial-gradient(circle at 20% 30%, ${colors.primary} 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, ${colors.primaryDark} 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, ${colors.primary} 0%, transparent 60%)
          `,
        }}
      />

      {/* Decorative elements */}
      <AbsoluteFill>
        {[...Array(8)].map((_, i) => {
          const angle = (i * 360) / 8;
          const distance = 400;
          const x = Math.cos((angle * Math.PI) / 180) * distance;
          const y = Math.sin((angle * Math.PI) / 180) * distance;
          const delay = i * 5;

          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: '80px',
                height: '80px',
                marginLeft: x,
                marginTop: y,
                fontSize: '50px',
                opacity: interpolate(frame + delay, [0, 30, 60], [0, 0.15, 0.1], {
                  extrapolateRight: 'clamp',
                }),
                transform: `scale(${interpolate(frame + delay, [0, 30], [0.5, 1], {
                  extrapolateRight: 'clamp',
                })})`,
              }}
            >
              {['❤️', '💕', '💝', '💖', '💗', '💓', '💞', '💘'][i]}
            </div>
          );
        })}
      </AbsoluteFill>

      {/* Content */}
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '60px',
        }}
      >
      {/* Logo with 3D effect */}
      <div
        style={{
          transform: `scale(${logoScale}) rotateY(${logoRotate}deg)`,
          opacity: logoOpacity,
          filter: 'drop-shadow(0 25px 50px rgba(167, 99, 241, 0.3))',
          transformStyle: 'preserve-3d',
        }}
      >
        <Img
          src={staticFile('logo.svg')}
          style={{
            height: '300px',
            width: 'auto',
          }}
        />
      </div>

      {/* App Name */}
      <div
        style={{
          opacity: taglineOpacity,
          transform: `translateY(${taglineY}px)`,
          textAlign: 'center',
          padding: '0 30px',
        }}
      >
        <h1
          style={{
            fontSize: '150px',
            fontWeight: 900,
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 50%, #6d28a8 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            margin: 0,
            marginBottom: '45px',
            fontFamily: poppinsFontFamily,
            letterSpacing: '12px',
            textShadow: '0 8px 32px rgba(167, 99, 241, 0.5)',
            filter: 'drop-shadow(0 6px 25px rgba(167, 99, 241, 0.4))',
            textTransform: 'uppercase',
            lineHeight: 1.1,
          }}
        >
          Amgel<br />Jodi
        </h1>
        <p
          style={{
            fontSize: '42px',
            color: colors.textLight,
            margin: 0,
            fontWeight: 500,
            fontFamily: interFontFamily,
            lineHeight: 1.5,
            maxWidth: '900px',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          Matrimony platform for the<br />
          <span style={{color: colors.primary, fontWeight: 700, fontSize: '48px'}}>GSB Konkani Community</span>
        </p>
      </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const ScreenshotReveal: React.FC<{screenshot: string}> = ({screenshot}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const phoneScale = spring({
    frame,
    fps,
    from: 0.8,
    to: 1,
    durationInFrames: 30,
    config: {
      damping: 10,
    },
  });

  const phoneOpacity = interpolate(frame, [0, 20], [0, 1]);
  const phoneRotateY = interpolate(frame, [0, 30], [35, 0]);

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* 3D Phone mockup - Much larger for mobile view */}
      <div
        style={{
          transform: `scale(${phoneScale}) rotateY(${phoneRotateY}deg)`,
          opacity: phoneOpacity,
          transformStyle: 'preserve-3d',
          perspective: '1500px',
        }}
      >
        <div
          style={{
            position: 'relative',
            filter: 'drop-shadow(0 40px 80px rgba(167, 99, 241, 0.4))',
          }}
        >
          {/* Phone frame - depth effect */}
          <div
            style={{
              position: 'absolute',
              inset: '-25px',
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`,
              borderRadius: '60px',
              opacity: 0.08,
              transform: 'translateZ(-40px)',
            }}
          />

          {/* Screenshot - Extra large for mobile */}
          <Img
            src={staticFile(`screenshots/${screenshot}`)}
            style={{
              height: '1500px',
              width: 'auto',
              borderRadius: '50px',
              border: `15px solid ${colors.primary}`,
              boxShadow: `0 0 0 6px ${colors.bg}, 0 30px 80px rgba(0,0,0,0.25)`,
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};

const FeaturesAndCelebration: React.FC = () => {
  const frame = useCurrentFrame();

  const features = [
    {
      icon: (
        <svg style={{width: '50px', height: '50px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
      title: 'Smart Matching',
      gradient: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
      delay: 0,
    },
    {
      icon: (
        <svg style={{width: '50px', height: '50px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      title: 'Secure & Private',
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      delay: 15,
    },
    {
      icon: (
        <svg style={{width: '50px', height: '50px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      title: 'Verified Profiles',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      delay: 30,
    },
  ];

  return (
    <AbsoluteFill>
      {/* Confetti celebration */}
      <AbsoluteFill style={{opacity: 0.7}}>
        <Lottie animationData={confettiAnimation} />
      </AbsoluteFill>

      {/* Features - Card-based layout like homepage stats */}
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '50px',
          padding: '80px 60px',
        }}
      >
        {features.map((feature, i) => {
          const progress = Math.max(0, frame - feature.delay);
          const opacity = interpolate(progress, [0, 20], [0, 1], {extrapolateRight: 'clamp'});
          const scale = interpolate(progress, [0, 25], [0.85, 1], {extrapolateRight: 'clamp'});
          const translateY = interpolate(progress, [0, 25], [30, 0], {extrapolateRight: 'clamp'});

          return (
            <div
              key={i}
              style={{
                transform: `scale(${scale}) translateY(${translateY}px)`,
                opacity,
                width: '900px',
                background: 'white',
                borderRadius: '40px',
                padding: '50px',
                boxShadow: `0 25px 50px rgba(167, 99, 241, 0.1), 0 0 0 1px ${colors.bgGradientStart}`,
                display: 'flex',
                alignItems: 'center',
                gap: '40px',
              }}
            >
              {/* Icon container */}
              <div
                style={{
                  width: '120px',
                  height: '120px',
                  background: feature.gradient,
                  borderRadius: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 15px 40px rgba(167, 99, 241, 0.3)',
                  flexShrink: 0,
                  color: 'white',
                }}
              >
                {feature.icon}
              </div>

              {/* Text content */}
              <div style={{flex: 1}}>
                <h3
                  style={{
                    fontSize: '60px',
                    fontWeight: 700,
                    color: colors.text,
                    margin: 0,
                    fontFamily: poppinsFontFamily,
                  }}
                >
                  {feature.title}
                </h3>
              </div>
            </div>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const FinalCTA: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const scale = spring({
    frame,
    fps,
    from: 0.85,
    to: 1,
    durationInFrames: 25,
  });

  const opacity = interpolate(frame, [0, 20], [0, 1]);
  const badgeOpacity = interpolate(frame, [10, 30], [0, 1]);
  const titleOpacity = interpolate(frame, [15, 35], [0, 1]);
  const websiteOpacity = interpolate(frame, [25, 45], [0, 1]);
  const playstoreOpacity = interpolate(frame, [35, 55], [0, 1]);
  const logoOpacity = interpolate(frame, [45, 65], [0, 1]);

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 60px',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '45px',
          textAlign: 'center',
        }}
      >
        {/* Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '15px',
            padding: '15px 35px',
            background: `linear-gradient(135deg, ${colors.primary}15, ${colors.primaryDark}10)`,
            borderRadius: '100px',
            border: `2px solid ${colors.primary}30`,
            opacity: badgeOpacity,
            transform: `scale(${interpolate(badgeOpacity, [0, 1], [0.9, 1])})`,
          }}
        >
          <div
            style={{
              width: '12px',
              height: '12px',
              background: '#10b981',
              borderRadius: '50%',
              boxShadow: '0 0 20px #10b98180',
            }}
          />
          <span
            style={{
              fontSize: '26px',
              fontWeight: 600,
              color: colors.textLight,
              fontFamily: interFontFamily,
            }}
          >
            Exclusively for GSB Konkani Community
          </span>
        </div>

        {/* Main CTA with decorative card */}
        <div
          style={{
            opacity: titleOpacity,
            transform: `scale(${interpolate(titleOpacity, [0, 1], [0.9, 1])})`,
            background: 'white',
            borderRadius: '45px',
            padding: '55px 80px',
            boxShadow: `0 30px 80px rgba(167, 99, 241, 0.15), 0 0 0 1px ${colors.bgGradientStart}`,
          }}
        >
          <h2
            style={{
              fontSize: '90px',
              fontWeight: 800,
              background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              margin: 0,
              fontFamily: poppinsFontFamily,
              letterSpacing: '-2px',
              lineHeight: 1.15,
            }}
          >
            Find Your<br />Perfect Match
          </h2>
        </div>

        {/* Website Button */}
        <div
          style={{
            opacity: websiteOpacity,
            transform: `translateY(${interpolate(websiteOpacity, [0, 1], [20, 0])}px)`,
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '25px',
              padding: '35px 70px',
              background: 'white',
              borderRadius: '100px',
              boxShadow: `0 20px 50px rgba(167, 99, 241, 0.2), 0 0 0 2px ${colors.bgGradientStart}`,
            }}
          >
            <div
              style={{
                width: '65px',
                height: '65px',
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`,
                borderRadius: '22px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '34px',
              }}
            >
              🌐
            </div>
            <span
              style={{
                fontSize: '50px',
                color: colors.primary,
                fontWeight: 700,
                fontFamily: interFontFamily,
              }}
            >
              amgeljodi.com
            </span>
          </div>
        </div>

        {/* Playstore Button */}
        <div
          style={{
            opacity: playstoreOpacity,
            transform: `translateY(${interpolate(playstoreOpacity, [0, 1], [20, 0])}px)`,
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '25px',
              padding: '35px 70px',
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`,
              borderRadius: '100px',
              boxShadow: '0 20px 50px rgba(167, 99, 241, 0.4)',
            }}
          >
            <div
              style={{
                width: '65px',
                height: '65px',
                background: 'white',
                borderRadius: '22px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '34px',
              }}
            >
              📱
            </div>
            <div style={{textAlign: 'left'}}>
              <div
                style={{
                  fontSize: '24px',
                  color: 'rgba(255,255,255,0.85)',
                  fontWeight: 500,
                  fontFamily: interFontFamily,
                  marginBottom: '5px',
                }}
              >
                Download from
              </div>
              <div
                style={{
                  fontSize: '42px',
                  color: 'white',
                  fontWeight: 700,
                  fontFamily: interFontFamily,
                  lineHeight: 1,
                }}
              >
                Android Play Store
              </div>
            </div>
          </div>
        </div>

        {/* Logo */}
        <div
          style={{
            opacity: logoOpacity,
            transform: `translateY(${interpolate(logoOpacity, [0, 1], [20, 0])}px)`,
            marginTop: '20px',
          }}
        >
          <Img
            src={staticFile('logo.svg')}
            style={{
              height: '110px',
              width: 'auto',
              filter: 'drop-shadow(0 10px 30px rgba(167, 99, 241, 0.3))',
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
