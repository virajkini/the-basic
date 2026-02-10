import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Img,
  Sequence,
  staticFile,
} from 'remotion';

export const SkillsAddCommand: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  const command = 'npx skills add remotion-dev/remotion';

  // Typewriter effect - types the entire command over the duration
  const typewriterProgress = interpolate(
    frame,
    [0, durationInFrames],
    [0, command.length],
    {
      extrapolateRight: 'clamp',
    }
  );

  const displayedText = command.substring(0, Math.floor(typewriterProgress));

  // Y-axis rotation from 20 to -20 degrees over the entire duration
  const rotateY = interpolate(
    frame,
    [0, durationInFrames],
    [20, -20],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  // Subtle scale animation for entrance
  const scale = spring({
    frame,
    fps,
    from: 0.95,
    to: 1,
    durationInFrames: 30,
  });

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Subtle background pattern */}
      <AbsoluteFill
        style={{
          opacity: 0.03,
          background: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.02) 10px, rgba(255,255,255,0.02) 20px)',
        }}
      />

      {/* Command text with rotation and typewriter effect */}
      <div
        style={{
          transform: `rotateY(${rotateY}deg) scale(${scale})`,
          transformStyle: 'preserve-3d',
          perspective: '1000px',
          padding: '80px 120px',
        }}
      >
        <div
          style={{
            fontFamily: "'SF Mono', 'Monaco', 'Cascadia Code', 'Courier New', monospace",
            fontSize: '120px',
            fontWeight: 700,
            color: '#f1f5f9',
            textShadow: '0 4px 30px rgba(16, 185, 129, 0.3), 0 0 80px rgba(16, 185, 129, 0.15)',
            letterSpacing: '-2px',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
          }}
        >
          {/* Terminal prompt symbol */}
          <span style={{color: '#10b981', opacity: 1, textShadow: '0 0 20px rgba(16, 185, 129, 0.5)'}}>$</span>

          {/* Typewriter text */}
          <span>
            {displayedText}
            {/* Blinking cursor */}
            <span
              style={{
                opacity: Math.floor(frame / 15) % 2 === 0 ? 1 : 0,
                marginLeft: '8px',
                color: '#10b981',
                textShadow: '0 0 20px rgba(16, 185, 129, 0.8)',
              }}
            >
              |
            </span>
          </span>
        </div>
      </div>

      {/* Logo at bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: '80px',
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          opacity: interpolate(frame, [0, 30], [0, 0.8]),
        }}
      >
        <Img
          src={staticFile('screenshots/logo.png')}
          style={{
            height: '100px',
            width: 'auto',
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
