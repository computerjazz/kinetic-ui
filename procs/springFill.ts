import Animated from 'react-native-reanimated'
const {
  proc,
  spring,
  Value,
} = Animated

const betterSpring = proc(
  (
    finished: Animated.Value<number>,
    velocity: Animated.Value<number>,
    position: Animated.Value<number>,
    time: Animated.Value<number>,
    prevPosition: Animated.Value<number>,
    toValue: Animated.Value<number>,
    damping: Animated.Value<number>,
    mass: Animated.Value<number>,
    stiffness: Animated.Value<number>,
    overshootClamping: Animated.SpringConfig["overshootClamping"],
    restSpeedThreshold: Animated.Value<number>,
    restDisplacementThreshold: Animated.Value<number>,
    clock: Animated.Clock
  ) =>
    spring(
      clock,
      {
        finished,
        velocity,
        position,
        time,
        // @ts-ignore -- https://github.com/software-mansion/react-native-reanimated/blob/master/src/animations/spring.js#L177
        prevPosition
      },
      {
        toValue,
        damping,
        mass,
        stiffness,
        overshootClamping,
        restDisplacementThreshold,
        restSpeedThreshold
      }
    )
);

export default function springFill(
  clock: Animated.Clock,
  state: Animated.SpringState,
  config: Animated.SpringConfig
) {
  return betterSpring(
    state.finished,
    state.velocity,
    state.position,
    state.time,
    new Value(0),
    config.toValue,
    config.damping,
    config.mass,
    config.stiffness,
    //@ts-ignore
    config.overshootClamping,
    config.restSpeedThreshold,
    config.restDisplacementThreshold,
    clock
  );
}
