import Animated, { Easing } from 'react-native-reanimated'
const {
  proc,
  timing,
  Value,
} = Animated

const betterTiming = proc(
  (
    finished: Animated.Value<number>,
    frameTime: Animated.Value<number>,
    position: Animated.Value<number>,
    time: Animated.Value<number>,
    prevPosition: Animated.Value<number>,
    toValue: Animated.Value<number>,
    duration: Animated.Value<number>,
    clock: Animated.Clock
  ) =>
    timing(
      clock,
      {
        finished,
        frameTime,
        position,
        time,
        // @ts-ignore -- https://github.com/software-mansion/react-native-reanimated/blob/master/src/animations/spring.js#L177
        prevPosition
      },
      {
        toValue,
        easing: Easing.inOut(Easing.ease),
        duration,
      }
    )
);

export default function timingFill(
  clock: Animated.Clock,
  state: Animated.TimingState,
  config: Animated.TimingConfig
) {
  return betterTiming(
    state.finished,
    state.frameTime,
    state.position,
    state.time,
    new Value(0),
    config.toValue,
    config.duration,
    clock
  );
}
