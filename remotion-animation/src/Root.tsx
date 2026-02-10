import {Composition} from 'remotion';
import {AmgelJodiShowcase} from './AmgelJodiShowcase';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="AmgelJodiShowcase"
        component={AmgelJodiShowcase}
        durationInFrames={570}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
