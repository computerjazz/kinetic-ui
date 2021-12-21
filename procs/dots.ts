import Animated from 'react-native-reanimated'
import { State } from 'react-native-gesture-handler'

const {
  proc,
  block,
  set,
  cond,
  eq,
  and,
  greaterThan,
  lessThan,
  divide,
  add,
  neq,
  multiply,
  or,
  sin,
  sub,
  not,
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
  dotActive,
) => block([
  cond(
    and(
      eq(panGestureState, State.ACTIVE),
      neq(newState, State.ACTIVE),
      dotActive,
    ), onDotInactive),
  cond(
    and(
      eq(newState, State.ACTIVE),
      neq(panGestureState, State.ACTIVE),
      not(dotActive),
    ), onDotActive,
  ),
  set(panGestureState, newState)
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
  dotActive,
) => block([
  cond(
    and(
      neq(currentState, State.BEGAN),
      eq(newState, State.BEGAN),
    ), [
    set(dragX, translationX),
    set(dragY, translationY),
    cond(not(dotActive), onDotActive)
  ]
  ),
  cond(
    and(
      neq(currentState, State.END),
      eq(newState, State.END),
      dotActive,
    ), onDotInactive,
  ),
  set(currentState, newState),
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

const getTranslate = proc((start, pos, drag) => add(start, multiply(pos, drag)))

const onDotActive = proc((
  dotActive,
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
) => cond(not(dotActive), [
  set(dotActive, 1),
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
  placeholderX,
  placeholderY,
  translateX,
  translateY,
) => block([
  cond(eq(panGestureState, State.ACTIVE), [
    set(dragX, translationX),
    set(dragY, translationY),
    set(placeholderX, translateX),
    set(placeholderY, translateY),
  ])
]))

const getDropZoneScale = proc((pos) => add(1, multiply(0.05, sin(pos))))
const getRingOpacity = proc((pos, disabled, out) => cond(
  and(
    greaterThan(pos, add(disabled, .05)),
    lessThan(pos, sub(out, .05)),
  ), 0.85, 0)
)

const onDotInactive = proc((
  dotActive,
  intersects,
  placeholderA,
  endPos,
  endDisabled,
  scaleToValue,
  ringToValue,
  ringOut,
  ringDisabled,
  zIndex,
  startEndClock,
  startScaleClock,
  startRingClock,
) => cond(dotActive, [
  cond(intersects,
    block([
      set(placeholderA, 1),
      set(endPos, endDisabled),
      startEndClock,
    ]),
    set(placeholderA, 0)
  ),
  set(scaleToValue, 0),
  startScaleClock,
  set(ringToValue, cond(intersects, ringOut, ringDisabled)),
  startRingClock,
  set(zIndex, 999),
  set(dotActive, 0),
]))

const reset3 = proc((v1, v2, v3) => block([
  set(v1, 0),
  set(v2, 0),
  set(v3, 0),
]))

export default {
  reset3,
  reset4,
  onTapStateChange,
  onPanStateChange,
  intersects,
  getCenter,
  setActiveDotVals,
  resetRing,
  getScale,
  onDotActive,
  onDotInactive,
  getTranslate,
  onPanGestureEvent,
  getDropZoneScale,
  getRingOpacity,
}