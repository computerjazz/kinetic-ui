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

export default {
  reset4,
  onTapStateChange,
  onPanStateChange,
  intersects,
  getCenter,
}