import { Dimensions } from 'react-native'
import Animated from 'react-native-reanimated'
const { width } = Dimensions.get('window')

let { interpolate, proc, multiply, add, sub, block, set, modulo, debug } = Animated

if (!proc) {
  proc = fn => fn
}

const resetSpring = proc((
  time,
  position,
  finished,
  velocity,
  prevTrans,
  tempOffset
) => block([
  set(time, 0),
  set(position, 0),
  set(finished, 0),
  set(velocity, 0),
  set(prevTrans, add(prevTrans, tempOffset))
]))

const transToIndex = proc((
  cumulativeTrans,
  tickHeight,
  index,
  numCards
) => modulo(
  interpolate(cumulativeTrans, {
    inputRange: [multiply(-1, tickHeight), 0, tickHeight],
    outputRange: [sub(index, 1), index, add(index, 1)]
  }), numCards))

export const indexToTrans = proc((
  cumulativeTrans,
  tickHeight,
  index,
  numCards,
  size,
) => sub(
  interpolate(
    transToIndex(
      cumulativeTrans,
      tickHeight,
      index,
      numCards,
    ), {
    inputRange: [0, 0.5, 0.75, 1, numCards],
    outputRange: [0, size, multiply(size, 1.9), multiply(size, 1.25), 0],
  }),
  60,
))

export default {
  indexToTrans,
  resetSpring,
}