import Animated from 'react-native-reanimated'

const {
  proc,
  block,
  set,
} = Animated

const resetSpring = proc((time, position, finished, velocity, toValue, prevTrans) => block([
  set(time, 0),
  set(position, toValue),
  set(finished, 0),
  set(velocity, 0),
  set(prevTrans, toValue),  
]))

export default {
  resetSpring,
}