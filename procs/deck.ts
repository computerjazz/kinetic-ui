import  {
  proc,
  block,
  set,
  multiply,
  add,
  cos,
  abs,
  cond,
  greaterThan,
  divide,
  and,
  eq,
  neq,
  lessThan
}  from 'react-native-reanimated'
import { State } from 'react-native-gesture-handler'

const resetSpring = proc((time, position, finished, velocity, toValue, prevTrans) => block([
  set(time, 0),
  set(position, toValue),
  set(finished, 0),
  set(velocity, 0),
  set(prevTrans, toValue),  
]))

const getXInput = proc((ry, ratio, xOffset) => multiply(
  abs(add(multiply(ry, cos(ratio), multiply(-1, xOffset)), multiply(ry, xOffset))),
  -1))

const reset4 = proc((v1, v2, v3, v4) => block([
  set(v1, 0),
  set(v2, 0),
  set(v3, 0),
  set(v4, 0),
]))

const onPanEnd = proc((
  prevTrans,
  translationY,
  position,
  toValue,
  height,
) => block([
  set(position, add(prevTrans, translationY)),
  set(translationY, 0),
  set(prevTrans, 0),
  cond(
    greaterThan(abs(position), divide(height, 4)),
    set(toValue, 
      cond(
        greaterThan(position, 0), 
        divide(height,2), 
        multiply(-1, divide(height, 2))
        )
      ),
    set(toValue, 0),
  ),
]))

const onPanActive = proc((
  state,
  gestureState,
  cumulativeTrans,
  width,
  x,
  left,
) => cond(
  and(
    eq(state, State.ACTIVE),
    neq(gestureState, State.ACTIVE),
    lessThan(abs(cumulativeTrans), 50),
  ),
  set(left, cond(lessThan(x, divide(width, 2)), 1, 0)),
),)

const getDirectionalVal = proc((
  left,
  val,
) => cond(left, multiply(val, -1), val))

export default {
  resetSpring,
  getXInput,
  reset4,
  onPanActive,
  onPanEnd,
  getDirectionalVal,
}