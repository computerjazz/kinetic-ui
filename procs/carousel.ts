import Animated, {
  block,
  set,
  proc,
  cond,
  or,
  abs,
  lessThan,
  eq,
  diff,
  interpolateNode as interpolate,
  multiply,
  sub,
  add,
  modulo,
  min,
  sin,
  divide,
} from 'react-native-reanimated'
import { State } from 'react-native-gesture-handler'

const reset4 = proc((v1, v2, v3, v4) => block([
  set(v1, 0),
  set(v2, 0),
  set(v3, 0),
  set(v4, 0),
]))

const getDiffSmoothed = proc((
  tapGestureState,
  prevDiff,
  diffAmt,
) => cond(
  or(
    lessThan(abs(diff(diffAmt)), 1),
    eq(tapGestureState, State.BEGAN),
  )
  , [
    set(prevDiff, diffAmt),
    diffAmt,
  ], prevDiff))

const getTransToIndex = proc((cumulativeTrans, tickWidth, index, len) => modulo(interpolate(cumulativeTrans, {
  inputRange: [multiply(tickWidth, -1), 0, tickWidth],
  outputRange: [sub(index, 1), index, add(index, 1)],
}), len))

const getRotateX = proc((leanAmt, pos) => multiply(min(0.2, abs(add(leanAmt, pos))), -1))

const getRotateY = proc((transToIndex, numCards) => interpolate(transToIndex, {
  inputRange: [0, numCards],
  outputRange: [0, multiply(Math.PI, 2)],
}))

const getScaleXY = proc((rotateY) => add(1,
  multiply(0.15, sin(add(divide(Math.PI,2), rotateY))),
))

const getTranslateX = proc((rotateY, size) => multiply(size, sin(rotateY)))

const getZIndex = proc((transToIndex, len) => interpolate(transToIndex, {
  inputRange: [0, divide(len, 2),len],
  outputRange: [200, 0, 200],
  extrapolate: Animated.Extrapolate.CLAMP,
}))

export default {
  reset4,
  getDiffSmoothed,
  getTransToIndex,
  getRotateX,
  getRotateY,
  getScaleXY,
  getTranslateX,
  getZIndex,
}