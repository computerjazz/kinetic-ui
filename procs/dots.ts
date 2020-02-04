import Animated from 'react-native-reanimated'
import { State } from 'react-native-gesture-handler'

const {
  proc,
  block,
  set,
  cond,
  eq,
  onChange,
  and,
  greaterThan,
  lessThan,
  divide,
  add,
  neq,
  multiply,
  or,
} = Animated

const reset4 = proc((v1, v2, v3, v4) => block([
  set(v1, 0),
  set(v2, 0),
  set(v3, 0),
  set(v4, 0),
]))

const onPanStateChange = proc((
  panGestureState,
  newState,
  onDotActive,
  onDotInactive,
) => block([
  // Dot becoming inactive
  cond(
    and(
      eq(panGestureState, State.ACTIVE),
      neq(newState, State.ACTIVE),
    ), onDotInactive),
  set(panGestureState, newState),
  onChange(panGestureState, [
    cond(eq(panGestureState, State.ACTIVE), onDotActive),
  ]),
]))

const onTapStateChange = proc((
  currentState,
  newState,
  dragX,
  dragY,
  translationX,
  translationY,
  onDotActive,
  onDotInactive,
) => block([
  set(currentState, newState),
  onChange(currentState, [
    cond(eq(currentState, State.BEGAN), [
      set(dragX, translationX),
      set(dragY, translationY),
      onDotActive
    ]),
    cond(eq(currentState, State.END), onDotInactive),
  ])
]))

const intersects = proc((
  centerX,
  centerY,
  xl,
  xr,
  yt,
  yb,
) => cond(
  and(
    greaterThan(centerX, xl),
    lessThan(centerX, xr),
    greaterThan(centerY, yt),
    lessThan(centerY, yb),
  ), 1, 0))

const getCenter = proc((
  translate,
  radius,
) => add(translate, divide(radius, 2)))

const setActiveDotVals = proc((
  ringR,
  ringG,
  ringB,
  ringA,
  rgbR,
  rgbG,
  rgbB,
  placeholderR,
  placeholderG,
  placeholderB,
  placeholderA,
  zIndex,
  toValue,
) => block([
  set(ringR, rgbR),
  set(ringG, rgbG),
  set(ringB, rgbB),
  set(ringA, 0), // Hide ring spring back to center
  set(placeholderR, rgbR),
  set(placeholderG, rgbG),
  set(placeholderB, rgbB),
  set(placeholderA, 0),
  set(zIndex, 9999),
  set(toValue, 1),
]))


const resetRing = proc((
  position,
  disabled,
  finished,
  velocity,
  time,
) => block([
  set(position, disabled),
  set(finished, 0),
  set(velocity, 0),
  set(time, 0),
]))

const getScale = proc((
  clockRunning,
  endPos,
  endDisabled,
  dotPos,
  additionalScale,
) => cond(clockRunning,
  endPos, [
  cond(neq(endPos, endDisabled), set(endPos, endDisabled)),
  add(multiply(dotPos, additionalScale), 1)
]
))

const getTranslate = proc((start, pos, drag, prev) => add(start, multiply(pos, add(drag, prev))))


const onDotActive = proc((
  ringR,
  ringG,
  ringB,
  ringA,
  rgbR,
  rgbG,
  rgbB,
  placeholderR,
  placeholderG,
  placeholderB,
  placeholderA,
  zIndex,
  toValue,
  ringClockRunning,
  stopRingClock,
  startScaleClock,
  ringPos,
  ringFin,
  ringVel,
  ringTime,
  ringScaleDisabled,
) => block([
  setActiveDotVals(
    ringR,
    ringG,
    ringB,
    ringA,
    rgbR,
    rgbG,
    rgbB,
    placeholderR,
    placeholderG,
    placeholderB,
    placeholderA,
    zIndex,
    toValue,
  ),
  startScaleClock,
  cond(
    or(
      ringClockRunning,
      neq(ringPos, ringScaleDisabled),
    ), [
    stopRingClock,
    resetRing(
      ringPos,
      ringScaleDisabled,
      ringFin,
      ringVel,
      ringTime,
    ),
  ])
]))

const onPanGestureEvent = proc((
  panGestureState,
  dragX,
  dragY,
  translationX,
  translationY,
  intersects,
  placeholderX,
  placeholderY,
  translateX,
  translateY,
) => block([
  cond(eq(panGestureState, State.ACTIVE), [
    set(dragX, translationX),
    set(dragY, translationY),
    cond(intersects, [
      set(placeholderX, translateX),
      set(placeholderY, translateY),
    ]),
  ])
]))

export default {
  reset4,
  onTapStateChange,
  onPanStateChange,
  intersects,
  getCenter,
  setActiveDotVals,
  resetRing,
  getScale,
  onDotActive,
  getTranslate,
  onPanGestureEvent,
}