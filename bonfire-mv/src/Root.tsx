import { Composition, Still } from "remotion";
import { BonfireMV } from "./mv/BonfireMV";
import { Cover } from "./mv/Cover";
import { FPS, SONG_FRAMES } from "./mv/timing";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="BonfireMV"
        component={BonfireMV}
        durationInFrames={SONG_FRAMES}
        fps={FPS}
        width={1920}
        height={1080}
      />
      {/* 成片：60fps，渲染時加 --scale=2 得到 3840×2160 */}
      <Composition
        id="BonfireMV-60fps"
        component={BonfireMV}
        durationInFrames={SONG_FRAMES * 2}
        fps={60}
        width={1920}
        height={1080}
      />
      {/* 影片封面：橫式 3:2 與 4:3，輸出時加 --scale=2 */}
      <Still id="Cover-3x2" component={Cover} width={1500} height={1000} />
      <Still id="Cover-4x3" component={Cover} width={1440} height={1080} />
    </>
  );
};